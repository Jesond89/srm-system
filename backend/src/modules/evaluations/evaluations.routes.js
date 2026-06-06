import { Router } from 'express'
import { authMiddleware }          from '../../middleware/auth.middleware.js'
import { todos, adminGerente, noComprador } from '../../middleware/rbac.middleware.js'
import {
  listarCriterios, crearCriterio, editarCriterio,
  listarEvaluaciones, calcular, dashboard
} from './evaluations.controller.js'

const router = Router()
router.use(authMiddleware)

// Dashboard
router.get('/dashboard',    todos,        dashboard)

// Criterios
router.get('/criterios',    todos,        listarCriterios)
router.post('/criterios',   adminGerente, crearCriterio)
router.put('/criterios/:id',adminGerente, editarCriterio)

// Evaluaciones
router.get('/',             todos,        listarEvaluaciones)
router.post('/',            noComprador,  calcular)   // analista puede crear evaluaciones

export default router
