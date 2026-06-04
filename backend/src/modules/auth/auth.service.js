import bcrypt   from 'bcryptjs'
import jwt       from 'jsonwebtoken'
import { env }   from '../../config/env.js'
import { supabaseAdmin } from '../../config/supabase.js'

/**
 * Verifica credenciales y devuelve un JWT si son correctas.
 */
export const loginService = async (email, password) => {
  // 1. Buscar usuario por email
  const { data: user, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, nombre, email, password_hash, rol, activo')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !user) {
    throw { status: 401, message: 'Credenciales incorrectas' }
  }

  if (!user.activo) {
    throw { status: 401, message: 'Usuario inactivo. Contacta al administrador.' }
  }

  // 2. Verificar contraseña
  const passwordValida = await bcrypt.compare(password, user.password_hash)
  if (!passwordValida) {
    throw { status: 401, message: 'Credenciales incorrectas' }
  }

  // 3. Generar JWT
  const payload = { id: user.id, email: user.email, rol: user.rol }
  const token   = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })

  // 4. Retornar token y datos públicos del usuario
  return {
    token,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
  }
}

/**
 * Crea la contraseña hasheada para un nuevo usuario (usado desde seed o admin).
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 12)
}
