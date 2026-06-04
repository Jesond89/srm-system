-- ============================================================
-- SRM System — Schema PostgreSQL (Supabase)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tipos ENUM
CREATE TYPE rol_usuario AS ENUM ('admin', 'gerente', 'comprador', 'analista');
CREATE TYPE estado_oc   AS ENUM ('borrador', 'enviado', 'confirmado', 'en_transito', 'recibido', 'cancelado');
CREATE TYPE severidad   AS ENUM ('baja', 'media', 'alta', 'critica');

-- ── Usuarios ─────────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol           rol_usuario NOT NULL DEFAULT 'comprador',
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Proveedores ───────────────────────────────────────────────────────────────
CREATE TABLE proveedores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  rfc           TEXT UNIQUE NOT NULL,
  email         TEXT,
  telefono      TEXT,
  direccion     TEXT,
  categoria     TEXT,         -- Asignada automáticamente por evaluación
  score_actual  NUMERIC(5,2) DEFAULT 0,
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES usuarios(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Criterios de evaluación ──────────────────────────────────────────────────
CREATE TABLE criterios_evaluacion (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  peso        NUMERIC(5,2) NOT NULL CHECK (peso > 0 AND peso <= 100),
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Evaluaciones ─────────────────────────────────────────────────────────────
CREATE TABLE evaluaciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id   UUID NOT NULL REFERENCES proveedores(id),
  score          NUMERIC(5,2) NOT NULL,
  categoria      TEXT,           -- 'A', 'B', 'C', 'D'
  detalle        JSONB,          -- {criterio_id: score_parcial, ...}
  periodo        TEXT NOT NULL,  -- '2026-06' (año-mes)
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Órdenes de compra ─────────────────────────────────────────────────────────
CREATE TABLE ordenes_compra (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio          TEXT UNIQUE NOT NULL,
  proveedor_id   UUID NOT NULL REFERENCES proveedores(id),
  estado         estado_oc NOT NULL DEFAULT 'borrador',
  productos      JSONB NOT NULL DEFAULT '[]',  -- [{nombre, cantidad, precio_unitario}]
  total          NUMERIC(12,2),
  notas          TEXT,
  created_by     UUID REFERENCES usuarios(id),
  aprobado_by    UUID REFERENCES usuarios(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Historial de estados de OC ────────────────────────────────────────────────
CREATE TABLE historial_estados_oc (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id       UUID NOT NULL REFERENCES ordenes_compra(id),
  estado_anterior estado_oc,
  estado_nuevo   estado_oc NOT NULL,
  notas          TEXT,
  changed_by     UUID REFERENCES usuarios(id),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── Reglas de alerta ──────────────────────────────────────────────────────────
CREATE TABLE reglas_alerta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL,     -- 'score_bajo', 'oc_pendiente', 'proveedor_inactivo', etc.
  condicion   JSONB NOT NULL,    -- {campo, operador, valor}
  severidad   severidad NOT NULL DEFAULT 'media',
  activa      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Alertas generadas ─────────────────────────────────────────────────────────
CREATE TABLE alertas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regla_id     UUID REFERENCES reglas_alerta(id),
  proveedor_id UUID REFERENCES proveedores(id),
  orden_id     UUID REFERENCES ordenes_compra(id),
  severidad    severidad NOT NULL,
  mensaje      TEXT NOT NULL,
  leida        BOOLEAN NOT NULL DEFAULT false,
  atendida     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Historial del chatbot ─────────────────────────────────────────────────────
CREATE TABLE chat_historial (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id),
  rol         TEXT NOT NULL CHECK (rol IN ('user', 'assistant')),
  mensaje     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Índices útiles ────────────────────────────────────────────────────────────
CREATE INDEX idx_proveedores_rfc       ON proveedores(rfc);
CREATE INDEX idx_evaluaciones_proveedor ON evaluaciones(proveedor_id);
CREATE INDEX idx_ordenes_proveedor     ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_estado        ON ordenes_compra(estado);
CREATE INDEX idx_alertas_leida         ON alertas(leida);
CREATE INDEX idx_chat_usuario          ON chat_historial(usuario_id);
