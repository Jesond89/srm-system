import { supabaseAdmin } from '../../config/supabase.js'
import bcrypt from 'bcryptjs'

export const getUsuarios = async ({ search = '', rol = '', page = 1, limit = 20 }) => {
  let query = supabaseAdmin
    .from('usuarios')
    .select('id, nombre, email, rol, activo, created_at', { count: 'exact' })
    .order('nombre')
    .range((page - 1) * limit, page * limit - 1)

  if (search) query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`)
  if (rol)    query = query.eq('rol', rol)

  const { data, error, count } = await query
  if (error) throw { status: 500, message: error.message }
  return { data, total: count, page, limit }
}

export const createUsuario = async ({ nombre, email, password, rol }) => {
  if (!nombre || !email || !password || !rol) {
    throw { status: 400, message: 'Nombre, email, contraseña y rol son requeridos' }
  }

  const { data: existe } = await supabaseAdmin
    .from('usuarios').select('id').eq('email', email.toLowerCase()).single()
  if (existe) throw { status: 409, message: 'Ya existe un usuario con ese email' }

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .insert([{ nombre: nombre.trim(), email: email.toLowerCase().trim(), password_hash, rol, activo: true }])
    .select('id, nombre, email, rol, activo, created_at')
    .single()

  if (error) throw { status: 500, message: error.message }
  return data
}

export const updateUsuario = async (id, { nombre, rol, activo }) => {
  const updates = {}
  if (nombre !== undefined) updates.nombre = nombre.trim()
  if (rol    !== undefined) updates.rol    = rol
  if (activo !== undefined) updates.activo = activo

  if (!Object.keys(updates).length) throw { status: 400, message: 'Sin campos para actualizar' }

  const { data, error } = await supabaseAdmin
    .from('usuarios').update(updates).eq('id', id)
    .select('id, nombre, email, rol, activo').single()

  if (error) throw { status: 500, message: error.message }
  if (!data) throw { status: 404, message: 'Usuario no encontrado' }
  return data
}

export const resetPassword = async (id, newPassword) => {
  if (!newPassword || newPassword.length < 8) {
    throw { status: 400, message: 'La contraseña debe tener al menos 8 caracteres' }
  }
  const password_hash = await bcrypt.hash(newPassword, 12)
  const { error } = await supabaseAdmin
    .from('usuarios').update({ password_hash }).eq('id', id)
  if (error) throw { status: 500, message: error.message }
  return { message: 'Contraseña actualizada correctamente' }
}
