import { env } from '../config/env.js'

// ── Logging estructurado (A09 - Security Logging) ────────────────────────────
export const logSecurityEvent = (type, req, detail = '') => {
  const entry = {
    ts:     new Date().toISOString(),
    type,
    ip:     req.ip || req.connection?.remoteAddress,
    method: req.method,
    path:   req.path,
    user:   req.user?.id || 'anonymous',
    detail,
  }
  console.warn('[SECURITY]', JSON.stringify(entry))
}

// ── Error handler global (A05 - no exponer stack en producción) ───────────────
export const errorMiddleware = (err, req, res, next) => {
  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  // Log completo siempre en servidor
  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err)
  } else {
    console.warn(`[WARN] ${req.method} ${req.path}: ${message}`)
  }

  // Log de eventos de seguridad
  if (status === 401 || status === 403) {
    logSecurityEvent(status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN', req, message)
  }

  // Respuesta: stack solo en desarrollo
  res.status(status).json({
    error: message,
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  })
}
