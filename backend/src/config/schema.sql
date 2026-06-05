-- ============================================================
-- SRM System — Schema PostgreSQL (Supabase)
-- Versión 3.0 — Normalizado + tablas completas + constraints
-- ============================================================

-- ── ENUMs ─────────────────────────────────────────────────────────────────────
CREATE TYPE rol_usuario  AS ENUM ('admin', 'gerente', 'comprador', 'analista');
CREATE TYPE estado_oc    AS ENUM ('borrador', 'enviado', 'confirmado', 'en_transito', 'recibido', 'cancelado');
CREATE TYPE severidad    AS ENUM ('baja', 'media', 'alta', 'critica');
CREATE TYPE tipo_alerta  AS ENUM ('score_bajo', 'score_critico', 'oc_pendiente', 'oc_vencida', 'proveedor_inactivo');

-- ── Función trigger: actualizar updated_at automáticamente ────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
--  TABLAS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Usuarios ──────────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  rol           rol_usuario NOT NULL DEFAULT 'comprador',
  activo        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Proveedores ───────────────────────────────────────────────────────────────
-- score_actual y categoria son desnormalizaciones controladas:
-- se mantienen para consultas rápidas y se actualizan via trigger
-- cuando se inserta una nueva evaluación.
CREATE TABLE proveedores (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT    NOT NULL,
  rfc           TEXT    UNIQUE NOT NULL
                        CHECK (rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  email         TEXT,
  telefono      TEXT,
  direccion     TEXT,
  score_actual  NUMERIC(5,2) DEFAULT 0,
  categoria     TEXT,   -- 'A' | 'B' | 'C' | 'D' — actualizado por trigger
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID    REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_proveedores_updated_at
BEFORE UPDATE ON proveedores
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Criterios de evaluación ──────────────────────────────────────────────────
-- Constraint de negocio: la suma de pesos de criterios activos debe = 100.
-- Se valida en la aplicación (auth.service) al guardar.
CREATE TABLE criterios_evaluacion (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT         NOT NULL,
  descripcion TEXT,
  peso        NUMERIC(5,2) NOT NULL CHECK (peso > 0 AND peso <= 100),
  activo      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  DEFAULT now()
);

-- ── Evaluaciones ─────────────────────────────────────────────────────────────
-- categoria se calcula automáticamente con GENERATED ALWAYS (BCNF).
CREATE TABLE evaluaciones (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID         NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  score        NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  categoria    TEXT         GENERATED ALWAYS AS (
                 CASE
                   WHEN score >= 80 THEN 'A'
                   WHEN score >= 60 THEN 'B'
                   WHEN score >= 40 THEN 'C'
                   ELSE                   'D'
                 END
               ) STORED,
  periodo      TEXT         NOT NULL CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),  -- 'YYYY-MM'
  created_at   TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (proveedor_id, periodo)        -- un score por proveedor por mes
);

-- ── Detalle de evaluación (antes JSONB) ───────────────────────────────────────
-- Normalización 1NF: un criterio por fila, FK garantizada.
CREATE TABLE evaluacion_detalle (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id  UUID         NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  criterio_id    UUID         NOT NULL REFERENCES criterios_evaluacion(id),
  score_parcial  NUMERIC(5,2) NOT NULL CHECK (score_parcial >= 0 AND score_parcial <= 100),
  UNIQUE (evaluacion_id, criterio_id)
);

-- ── Trigger: actualizar score_actual y categoria en proveedores ───────────────
CREATE OR REPLACE FUNCTION fn_sync_proveedor_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proveedores
  SET
    score_actual = NEW.score,
    categoria    = CASE
                     WHEN NEW.score >= 80 THEN 'A'
                     WHEN NEW.score >= 60 THEN 'B'
                     WHEN NEW.score >= 40 THEN 'C'
                     ELSE                      'D'
                   END
  WHERE id = NEW.proveedor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_proveedor_score
AFTER INSERT OR UPDATE ON evaluaciones
FOR EACH ROW EXECUTE FUNCTION fn_sync_proveedor_score();

-- ── Catálogo de productos ─────────────────────────────────────────────────────
-- Estandariza los productos que se pueden incluir en una OC.
-- SCRUM-37: formulario multi-producto con búsqueda de catálogo.
CREATE TABLE catalogo_productos (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT         NOT NULL,
  descripcion      TEXT,
  unidad           TEXT         NOT NULL DEFAULT 'pieza',  -- pieza, kg, litro, etc.
  precio_referencia NUMERIC(12,2) CHECK (precio_referencia >= 0),
  activo           BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  DEFAULT now()
);

-- ── Órdenes de compra ─────────────────────────────────────────────────────────
-- Se eliminó: productos JSONB y total (datos derivados → tabla productos_oc)
-- folio generado por secuencia BD — evita colisiones entre sesiones.
CREATE SEQUENCE seq_folio_oc START 1000;

CREATE TABLE ordenes_compra (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  folio        TEXT      UNIQUE NOT NULL DEFAULT ('OC-' || LPAD(nextval('seq_folio_oc')::TEXT, 6, '0')),
  proveedor_id UUID      NOT NULL REFERENCES proveedores(id),
  estado       estado_oc NOT NULL DEFAULT 'borrador',
  notas        TEXT,
  created_by   UUID      REFERENCES usuarios(id) ON DELETE SET NULL,
  aprobado_by  UUID      REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_ordenes_updated_at
BEFORE UPDATE ON ordenes_compra
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Productos de OC (antes JSONB — normalización 1NF) ─────────────────────────
-- producto_id es opcional: puede venir del catálogo o ser ingresado manualmente.
CREATE TABLE productos_oc (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id         UUID         NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id      UUID         REFERENCES catalogo_productos(id) ON DELETE SET NULL,
  nombre           TEXT         NOT NULL,  -- copia del nombre (por si cambia en catálogo)
  unidad           TEXT         NOT NULL DEFAULT 'pieza',
  cantidad         INTEGER      NOT NULL CHECK (cantidad > 0),
  precio_unitario  NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal         NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

-- Vista de total por orden (sustituye la columna total eliminada)
CREATE VIEW v_ordenes_total AS
SELECT
  oc.id,
  oc.folio,
  oc.proveedor_id,
  oc.estado,
  oc.created_by,
  oc.aprobado_by,
  oc.created_at,
  oc.updated_at,
  COALESCE(SUM(p.subtotal), 0) AS total
FROM ordenes_compra oc
LEFT JOIN productos_oc p ON p.orden_id = oc.id
GROUP BY oc.id;

-- ── Historial de estados de OC ────────────────────────────────────────────────
CREATE TABLE historial_estados_oc (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id        UUID      NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  estado_anterior estado_oc,
  estado_nuevo    estado_oc NOT NULL,
  notas           TEXT,
  changed_by      UUID      REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Reglas de alerta ──────────────────────────────────────────────────────────
CREATE TABLE reglas_alerta (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT        NOT NULL,
  tipo       tipo_alerta NOT NULL,    -- ENUM garantiza valores válidos
  condicion  JSONB       NOT NULL,    -- {campo, operador, valor} — estructura del motor
  severidad  severidad   NOT NULL DEFAULT 'media',
  activa     BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Alertas generadas ─────────────────────────────────────────────────────────
-- CHECK: toda alerta debe referenciar al menos un proveedor u orden
CREATE TABLE alertas (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  regla_id     UUID      REFERENCES reglas_alerta(id) ON DELETE SET NULL,
  proveedor_id UUID      REFERENCES proveedores(id)   ON DELETE CASCADE,
  orden_id     UUID      REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  severidad    severidad NOT NULL,
  mensaje      TEXT      NOT NULL,
  leida        BOOLEAN   NOT NULL DEFAULT false,
  atendida     BOOLEAN   NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_alerta_referencia CHECK (proveedor_id IS NOT NULL OR orden_id IS NOT NULL)
);

-- ── Documentos de proveedor ──────────────────────────────────────────────────
-- SCRUM-15: subida y almacenamiento de documentos (contratos, certificaciones, etc.)
-- url_storage apunta a Supabase Storage bucket 'documentos-proveedores'
CREATE TABLE documentos_proveedor (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id UUID  NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  nombre       TEXT  NOT NULL,
  tipo         TEXT  NOT NULL,       -- 'contrato', 'certificacion', 'fiscal', 'otro'
  url_storage  TEXT  NOT NULL,       -- path en Supabase Storage
  created_by   UUID  REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Notificaciones in-app ─────────────────────────────────────────────────────
-- SCRUM-52: badge en navbar por usuario. Distinto de alertas (eventos del sistema).
-- Una alerta puede generar N notificaciones (una por usuario que debe verla).
CREATE TABLE notificaciones (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID    NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  alerta_id  UUID    REFERENCES alertas(id) ON DELETE CASCADE,
  titulo     TEXT    NOT NULL,
  mensaje    TEXT    NOT NULL,
  leida      BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Sesiones del chatbot ──────────────────────────────────────────────────────
CREATE TABLE sesiones_chat (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo     TEXT        DEFAULT 'Nueva conversación',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Historial del chatbot ─────────────────────────────────────────────────────
-- sesion_id permite agrupar mensajes por conversación para contexto de Gemini
CREATE TABLE chat_historial (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id  UUID  NOT NULL REFERENCES sesiones_chat(id) ON DELETE CASCADE,
  usuario_id UUID  NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol        TEXT  NOT NULL CHECK (rol IN ('user', 'assistant')),
  mensaje    TEXT  NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════════
--  ÍNDICES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_proveedores_rfc          ON proveedores(rfc);
CREATE INDEX idx_proveedores_categoria    ON proveedores(categoria);
CREATE INDEX idx_evaluaciones_proveedor   ON evaluaciones(proveedor_id);
CREATE INDEX idx_evaluaciones_periodo     ON evaluaciones(periodo);
CREATE INDEX idx_eval_detalle_evaluacion  ON evaluacion_detalle(evaluacion_id);
CREATE INDEX idx_productos_oc_orden       ON productos_oc(orden_id);
CREATE INDEX idx_ordenes_proveedor        ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_estado           ON ordenes_compra(estado);
CREATE INDEX idx_historial_orden          ON historial_estados_oc(orden_id);
CREATE INDEX idx_alertas_leida            ON alertas(leida);
CREATE INDEX idx_alertas_proveedor        ON alertas(proveedor_id);
CREATE INDEX idx_chat_sesion              ON chat_historial(sesion_id);
CREATE INDEX idx_chat_usuario             ON chat_historial(usuario_id);
CREATE INDEX idx_docs_proveedor           ON documentos_proveedor(proveedor_id);
CREATE INDEX idx_notificaciones_usuario   ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida     ON notificaciones(usuario_id, leida);
CREATE INDEX idx_catalogo_activo          ON catalogo_productos(activo);
CREATE INDEX idx_productos_oc_catalogo    ON productos_oc(producto_id);
