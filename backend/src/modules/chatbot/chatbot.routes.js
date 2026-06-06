import { Router }          from 'express'
import { authMiddleware }  from '../../middleware/auth.middleware.js'
import { todos }           from '../../middleware/rbac.middleware.js'
import { sendMessage }     from './chatbot.controller.js'
import { chatbotLimiter }  from '../../middleware/rateLimit.middleware.js'
import { validateBody, schemas } from '../../middleware/validate.middleware.js'

const router = Router()
router.use(authMiddleware)
router.post('/message', chatbotLimiter, validateBody(schemas.chatMessage), todos, sendMessage)

export default router
