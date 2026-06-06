import rateLimit from 'express-rate-limit'

// ── Rate limiter para login — previene brute force (A07) ────────────────────
export const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutos
  max:              10,              // 10 intentos por ventana
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { error: 'Demasiados intentos de login. Espera 15 minutos.' },
  skipSuccessfulRequests: true,      // solo cuenta fallos
})

// ── Rate limiter para chatbot — previene spam/DDoS (A04) ───────────────────
export const chatbotLimiter = rateLimit({
  windowMs:        60 * 1000, // 1 minuto
  max:             20,        // 20 mensajes por minuto
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes al chatbot. Espera un momento.' },
})

// ── Rate limiter general para API ───────────────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutos
  max:             500,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
})
