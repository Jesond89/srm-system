import express    from 'express'
import cors       from 'cors'
import { env }    from './config/env.js'
import { errorMiddleware } from './middleware/error.middleware.js'

// Rutas (se irán agregando por módulo)
import authRoutes from './modules/auth/auth.routes.js'

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
})

export default app
