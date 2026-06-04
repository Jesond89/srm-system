import { loginService } from './auth.service.js'

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' })
    }

    const result = await loginService(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/me
 */
export const me = (req, res) => {
  res.json({ user: req.user })
}

/**
 * POST /api/auth/logout
 * El token JWT es stateless — el cliente simplemente lo descarta.
 */
export const logout = (req, res) => {
  res.json({ message: 'Sesión cerrada correctamente' })
}
