export const errorMiddleware = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  const status  = err.status  || err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
