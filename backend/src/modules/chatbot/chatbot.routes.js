import { Router }          from 'express'
import { authMiddleware }  from '../../middleware/auth.middleware.js'
import { todos }           from '../../middleware/rbac.middleware.js'
import { sendMessage }     from './chatbot.controller.js'

const router = Router()
router.use(authMiddleware)
router.post('/message', todos, sendMessage)

export default router
