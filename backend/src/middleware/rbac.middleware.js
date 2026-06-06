/**
 * Middleware RBAC — verifica que el usuario tenga el rol requerido.
 * Roles: admin > gerente > comprador > analista
 *
 * Uso: router.get('/ruta', authMiddleware, rbac('admin', 'gerente'), controller)
 */
export const rbac = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' })
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción',
        requerido: rolesPermitidos,
        actual: req.user.rol
      })
    }
    next()
  }
}

// Helpers de conveniencia
export const soloAdmin    = rbac('admin')
export const adminGerente = rbac('admin', 'gerente')
export const noAnalista   = rbac('admin', 'gerente', 'comprador')
export const noComprador  = rbac('admin', 'gerente', 'analista')   // analista puede evaluar
export const todos        = rbac('admin', 'gerente', 'comprador', 'analista')
