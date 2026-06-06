import { Router }         from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { todos }          from '../../middleware/rbac.middleware.js'
import { stats }          from './dashboard.controller.js'

const router = Router()
router.use(authMiddleware)
router.get('/stats', todos, stats)

export default router
