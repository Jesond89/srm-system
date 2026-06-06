import { Router } from 'express'
import { authMiddleware }      from '../../middleware/auth.middleware.js'
import { todos, adminGerente } from '../../middleware/rbac.middleware.js'
import {
  listarReglas, crearRegla, actualizarRegla,
  listarAlertas, leer, atender, badge, crear, ejecutar
} from './alerts.controller.js'

const router = Router()
router.use(authMiddleware)

// Badge — conteo no leídas (navbar)
router.get('/badge',           todos,        badge)

// Reglas
router.get('/reglas',          todos,        listarReglas)
router.post('/reglas',         adminGerente, crearRegla)
router.patch('/reglas/:id',    adminGerente, actualizarRegla)

// Alertas
router.get('/',                todos,        listarAlertas)
router.post('/',               adminGerente, crear)
router.patch('/:id/leer',      todos,        leer)
router.patch('/:id/atender',   adminGerente, atender)

// Ejecutar motor de reglas manualmente (en producción, vía cron)
router.post('/ejecutar-motor', adminGerente, ejecutar)

export default router
