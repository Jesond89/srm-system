import { Router } from 'express'
import { authMiddleware }    from '../../middleware/auth.middleware.js'
import { todos, noAnalista, adminGerente } from '../../middleware/rbac.middleware.js'
import { listar, obtener, crear, actualizarEstado } from './orders.controller.js'

const router = Router()
router.use(authMiddleware)

// GET  /api/ordenes          — listar (todos ven, comprador solo las suyas)
router.get('/',       todos,        listar)

// GET  /api/ordenes/:id      — detalle completo
router.get('/:id',    todos,        obtener)

// POST /api/ordenes          — crear OC (no analista)
router.post('/',      noAnalista,   crear)

// PATCH /api/ordenes/:id/estado — cambiar estado
// Comprador: puede enviar. Gerente/Admin: confirmar, marcar recibido, cancelar
router.patch('/:id/estado', todos,  actualizarEstado)

export default router
