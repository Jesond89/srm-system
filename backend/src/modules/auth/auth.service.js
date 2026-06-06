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

/**
 * Cambia la contraseña del usuario autenticado verificando la actual.
 */
export const cambiarPasswordService = async (userId, passwordActual, passwordNueva) => {
  const { data: user, error } = await supabaseAdmin
    .from('usuarios')
    .select('id, password_hash, activo')
    .eq('id', userId)
    .single()

  if (error || !user) throw { status: 404, message: 'Usuario no encontrado' }
  if (!user.activo)   throw { status: 401, message: 'Usuario inactivo' }

  const valida = await bcrypt.compare(passwordActual, user.password_hash)
  if (!valida) throw { status: 401, message: 'La contraseña actual es incorrecta' }

  const nuevo_hash = await bcrypt.hash(passwordNueva, 12)
  const { error: updateErr } = await supabaseAdmin
    .from('usuarios')
    .update({ password_hash: nuevo_hash })
    .eq('id', userId)

  if (updateErr) throw { status: 500, message: 'Error al actualizar contraseña' }
}
