import express    from 'express'
import cors       from 'cors'
import helmet     from 'helmet'
import { env }    from './config/env.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import { apiLimiter }     from './middleware/rateLimit.middleware.js'

// Rutas
import authRoutes      from './modules/auth/auth.routes.js'
import providerRoutes  from './modules/providers/providers.routes.js'
import orderRoutes       from './modules/orders/orders.routes.js'
import evaluationRoutes  from './modules/evaluations/evaluations.routes.js'
import alertRoutes       from './modules/alerts/alerts.routes.js'
import userRoutes        from './modules/users/users.routes.js'
import chatbotRoutes     from './modules/chatbot/chatbot.routes.js'
import dashboardRoutes   from './modules/dashboard/dashboard.routes.js'
import { iniciarCronAlertas } from './jobs/alertas.cron.js'

const app = express()

// ── Seguridad — headers HTTP (A05) ────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // manejado por Vite en el frontend
}))

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:         env.frontendUrl,
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Body parsing con límite de tamaño (A04) ───────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── Rate limit global para toda la API (A04) ──────────────────────────────────
app.use('/api', apiLimiter)

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
app.use('/api/dashboard',    dashboardRoutes)

// ── Rutas no encontradas ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
})

// ── Error handler global ──────────────────────────────────────────────────────
app.use(errorMiddleware)

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`🚀 SRM Backend corriendo en http://localhost:${env.port}`)
  console.log(`   Entorno: ${env.nodeEnv}`)
  iniciarCronAlertas()
})

export default app
