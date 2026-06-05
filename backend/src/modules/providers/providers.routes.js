import { Router } from 'express'
import { authMiddleware }        from '../../middleware/auth.middleware.js'
import { todos, noAnalista }     from '../../middleware/rbac.middleware.js'
import { listar, obtener, crear, actualizar, historial } from './providers.controller.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET  /api/proveedores         — listar con búsqueda y filtros (todos los roles)
router.get('/',          todos,       listar)

// GET  /api/proveedores/:id     — perfil completo del proveedor
router.get('/:id',       todos,       obtener)

// GET  /api/proveedores/:id/historial — historial de OCs del proveedor
router.get('/:id/historial', todos,   historial)

// POST /api/proveedores         — registrar (admin, gerente, comprador)
router.post('/',         noAnalista,  crear)

// PUT  /api/proveedores/:id     — editar (admin, gerente, comprador)
router.put('/:id',       noAnalista,  actualizar)

export default router
