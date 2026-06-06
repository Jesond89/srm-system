import express    from 'express'
import cors       from 'cors'
import { env }    from './config/env.js'
import { errorMiddleware } from './middleware/error.middleware.js'

// Rutas
import authRoutes      from './modules/auth/auth.routes.js'
import providerRoutes  from './modules/providers/providers.routes.js'
import orderRoutes       from './modules/orders/orders.routes.js'
import evaluationRoutes  from './modules/evaluations/evaluations.routes.js'
import alertRoutes       from './modules/alerts/alerts.routes.js'
import userRoutes        from './modules/users/users.routes.js'
import chatbotRoutes     from './modules/chatbot/chatbot.routes.js'
import { iniciarCronAlertas } from './jobs/alertas.cron.js'

const app = express()

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv, timestamp: new Date().toISOString() })
})

// ── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/proveedores', providerRoutes)
app.use('/api/ordenes',       orderRoutes)
app.use('/api/evaluaciones',  evaluationRoutes)
app.use('/api/alertas',       alertRoutes)
app.use('/api/usuarios',      userRoutes)
app.use('/api/chatbot',       chatbotRoutes)

// ── Manejo de rutas no encontradas ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
})

// ── Manejo global de errores ──────────────────────────────────────────────────
app.use(errorMiddleware)

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`🚀 SRM Backend corriendo en http://localhost:${env.port}`)
  console.log(`   Entorno: ${env.nodeEnv}`)
  iniciarCronAlertas()
})

export default app
