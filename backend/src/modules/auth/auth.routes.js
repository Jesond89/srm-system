import { Router } from 'express'
import { login, me, logout } from './auth.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { loginLimiter }   from '../../middleware/rateLimit.middleware.js'
import { validateBody, schemas } from '../../middleware/validate.middleware.js'

const router = Router()

// POST /api/auth/login  — iniciar sesión (rate limited + validación)
router.post('/login', loginLimiter, validateBody(schemas.login), login)

// GET  /api/auth/me     — obtener usuario autenticado
router.get('/me', authMiddleware, me)

// POST /api/auth/logout — cerrar sesión (client-side, invalida refresh si aplica)
router.post('/logout', authMiddleware, logout)

export default router
