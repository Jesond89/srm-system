import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { soloAdmin }      from '../../middleware/rbac.middleware.js'
import { listar, crear, actualizar, cambiarPassword } from './users.controller.js'

const router = Router()
router.use(authMiddleware, soloAdmin)   // Todo el módulo es solo admin

router.get('/',                listar)
router.post('/',               crear)
router.patch('/:id',           actualizar)
router.patch('/:id/password',  cambiarPassword)

export default router
