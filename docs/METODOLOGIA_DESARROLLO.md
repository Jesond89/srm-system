# Metodología de desarrollo — Contexto reutilizable para nuevos proyectos

Este documento resume cómo trabajamos en el sistema SRM, para usarse como contexto/punto de partida en otro sistema con el mismo stack (Node/Express + Supabase + React/Vite + TailwindCSS).

## 1. Stack y estructura general

- **Backend**: Node.js + Express, módulos ESM (`import/export`), organizado por dominio:
  ```
  backend/src/
    config/        # supabase.js, schema.sql, seed.js
    middleware/     # auth, rbac, validate, rateLimit
    modules/<dominio>/
      <dominio>.routes.js
      <dominio>.controller.js
      <dominio>.service.js
    jobs/           # cron jobs (ej. motor de alertas)
  ```
- **Base de datos**: PostgreSQL vía Supabase (`@supabase/supabase-js`, cliente `supabaseAdmin`).
  - ENUMs para estados controlados (evitar strings libres).
  - Triggers para campos derivados (`updated_at`, sincronización de scores).
  - Columnas `GENERATED ALWAYS AS` para valores calculados (ej. categoría por score).
  - Vistas (`CREATE VIEW`) para totales agregados en lugar de columnas desnormalizadas.
  - Normalización 1NF: evitar JSONB para listas con estructura fija (usar tablas detalle).
- **Frontend**: React + Vite + TailwindCSS + Heroicons.
  - Páginas por dominio en `frontend/src/pages/<dominio>/`.
  - Servicios API en `frontend/src/services/<dominio>.service.js` (wrapper sobre axios).
  - Componentes compartidos en `components/layout/`, `components/ui/`.
  - Gráficas con Recharts.
  - PDFs con jsPDF + jspdf-autotable.

## 2. Autenticación y RBAC

- JWT + middleware `authMiddleware` para proteger rutas.
- `rbac.middleware.js` define helpers reutilizables por combinación de roles:
  ```js
  export const adminGerente = rbac('admin', 'gerente')
  export const noComprador  = rbac('admin', 'gerente', 'analista')
  export const noAnalista   = rbac('admin', 'gerente', 'comprador')
  export const todos        = rbac('admin', 'gerente', 'comprador', 'analista')
  ```
- **Regla clave**: al definir permisos de un endpoint, pensar primero "¿qué rol *necesita* hacer esto como parte de su función principal?" — no asumir que solo admin/gerente. Ej: analistas deben poder crear evaluaciones, no solo verlas.
- Password hashing con bcryptjs (12 rounds).
- Endpoint propio para cambio de contraseña: `PATCH /api/auth/me/password` (requiere password actual, valida longitud mínima).

## 3. Dashboard diferenciado por rol

Patrón: un solo endpoint `GET /api/dashboard/stats`, el controller decide qué payload devolver según `req.user.rol`:

```js
export const stats = async (req, res, next) => {
  try {
    const { rol, id } = req.user
    if (rol === 'comprador') return res.json({ rol, ...await getStatsComprador(id) })
    if (rol === 'analista')  return res.json({ rol, ...await getStatsAnalista() })
    // admin/gerente: vista completa
    const [kpis, topProveedores, tendencia, ordenesRecientes] = await Promise.all([...])
    res.json({ rol, kpis, topProveedores, tendencia, ordenesRecientes })
  } catch (err) { next(err) }
}
```

En el frontend, un solo `Dashboard.jsx` que renderiza un sub-componente distinto según `data.rol` (`DashboardAdmin`, `DashboardComprador`, `DashboardAnalista`). Cada rol ve solo lo relevante a su función:
- **Admin/gerente**: KPIs globales, tendencias, ranking, todas las órdenes recientes.
- **Comprador**: sus propias órdenes, resumen de pendientes/aprobadas, accesos rápidos.
- **Analista**: proveedores sin evaluar, últimas evaluaciones, conteo del mes.

## 4. Reportes PDF

- Servicio único `reportes.service.js` con una función por tipo de reporte (`generarReporteProveedores`, `generarReporteEvaluaciones`, `generarReporteOrdenes`).
- Estructura común: header con marca/color corporativo, tabla con `jspdf-autotable`, footer con número de página.
- Codificación visual de estado (ej. score ≥80 verde, ≥60 amarillo, <60 rojo).
- Botón "Exportar PDF" en las páginas de listado, usando los datos ya cargados (o un fetch completo si se necesita el dataset entero).

## 5. Seed de datos demo

- Script único `backend/src/config/seed.js`, ejecutable con `node --env-file=.env src/config/seed.js`.
- **Idempotencia selectiva**: usar `upsert`/`on conflict` para entidades "catálogo" (usuarios, proveedores, criterios, catálogo de productos) que no deben duplicarse; pero para entidades transaccionales (órdenes, alertas) NO poner guardas de "si ya existe algo, no insertes nada" — eso bloquea el seed completo si ya hay 1 registro previo.
- Si hay triggers que actualizan campos derivados de forma asíncrona, dar un pequeño delay (~1.5s) y re-leer de la BD antes de usar esos valores para generar datos dependientes (ej. alertas basadas en score actualizado por trigger).
- Usar datos realistas y coherentes con los ENUMs/constraints del schema (revisar `schema.sql` antes de escribir el seed — un valor de ENUM inválido falla en silencio o tira error poco claro).

## 6. Convenciones de código y nomenclatura

- Nombres de variables, comentarios y mensajes de UI en **español** (consistente con el dominio del negocio).
- Comentarios de sección con separador visual: `// ── Sección ────────────────────`.
- Validación de body con esquemas (`validate.middleware.js` + `schemas`).
- Rate limiting en endpoints sensibles (ej. login).
- Manejo de errores: `throw { status, message }` capturado por middleware de error central; controllers usan `try/catch` + `next(err)`.

## 7. Páginas de utilidad estándar

Todo sistema debería incluir desde el inicio:
- **Página de perfil** (`/perfil`): datos del usuario + formulario de cambio de contraseña propia.
- **Página 404 personalizada**: nunca redirigir silenciosamente; mostrar mensaje + botón de regreso al dashboard.
- **Toast de notificaciones/alertas en tiempo real**: componente con polling (cada ~30s) a un endpoint de alertas no leídas, con estilos por severidad y auto-dismiss.
- Acceso al perfil desde la Navbar (nombre del usuario clickeable).

## 8. Gestión de tickets (Jira)

- Para vincular historias a épicas en proyectos next-gen, usar el campo `parent: { key: "SCRUM-XX" }` al editar el issue — **no** `customfield_10014` (falla con "Field cannot be set. Not on screen.").

## 9. Flujo de trabajo / Git (Windows + Git Bash)

- Si `git commit` falla por locks (`HEAD.lock`, `index.lock`), limpiar antes de reintentar:
  ```bash
  rm -f .git/HEAD.lock .git/index.lock
  git add -A && git commit -m "mensaje"
  ```

## 10. Gotchas de herramientas de archivo

- El tool `Write` puede truncar archivos largos al escribirlos de una sola vez. Para archivos extensos o reescrituras completas, usar `cat > archivo << 'EOF' ... EOF` vía bash, y verificar después con `wc -l`.
- Antes de editar, siempre leer el archivo completo (vía bash si el Read tool lo trunca) para detectar corrupción previa.

## 11. Checklist al iniciar un nuevo sistema con este stack

1. Definir schema.sql con ENUMs, triggers de `updated_at`, normalización 1NF desde el inicio.
2. Definir roles y matriz de permisos por endpoint **antes** de codear (evita bugs de RBAC tipo "analista no puede evaluar").
3. Diseñar el dashboard por rol desde el principio (un endpoint, payload condicional).
4. Crear seed script realista temprano — facilita pruebas de UI con datos creíbles.
5. Incluir perfil, 404 y alertas/toasts en el primer sprint de "pulido", no al final.
6. Reportes PDF como servicio reutilizable, no hardcodeado por página.
