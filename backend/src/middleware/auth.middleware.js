import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { supabaseAdmin } from '../config/supabase.js'

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.jwtSecret)

    // Verificar que el usuario sigue activo en BD
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, email, rol, activo')
      .eq('id', decoded.id)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }
    if (!user.activo) {
      return res.status(401).json({ error: 'Usuario inactivo' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}
