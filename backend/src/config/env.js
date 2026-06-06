import dotenv from 'dotenv'
dotenv.config()

// ── Variables requeridas en producción ───────────────────────────────────────
const REQUIRED_VARS = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_VARS.filter(v => !process.env[v])
  if (missing.length) {
    console.error(`[FATAL] Variables de entorno faltantes: ${missing.join(', ')}`)
    process.exit(1)
  }
}

export const env = {
  port:              process.env.PORT || 4000,
  nodeEnv:           process.env.NODE_ENV || 'development',
  jwtSecret:         process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn:      process.env.JWT_EXPIRES_IN || '8h',
  supabaseUrl:       process.env.SUPABASE_URL,
  supabaseAnonKey:   process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey:process.env.SUPABASE_SERVICE_KEY,
  geminiApiKey:      process.env.GEMINI_API_KEY,
  smtpHost:          process.env.SMTP_HOST,
  smtpPort:          process.env.SMTP_PORT || 587,
  smtpUser:          process.env.SMTP_USER,
  smtpPass:          process.env.SMTP_PASS,
  smtpFrom:          process.env.SMTP_FROM,
  frontendUrl:       process.env.FRONTEND_URL || 'http://localhost:5173',
}
