/**
 * Seed inicial — crea el usuario administrador por defecto.
 * Ejecutar una sola vez: node src/config/seed.js
 */
import { supabaseAdmin } from './supabase.js'
import { hashPassword }  from '../modules/auth/auth.service.js'

const seedAdmin = async () => {
  const passwordHash = await hashPassword('Admin1234!')

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .insert([{
      nombre:        'Administrador SRM',
      email:         'admin@srmsystem.com',
      password_hash: passwordHash,
      rol:           'admin',
      activo:        true
    }])
    .select()

  if (error) {
    console.error('Error creando admin:', error.message)
  } else {
    console.log('Admin creado:', data[0].email)
    console.log('Contraseña:   Admin1234!')
    console.log('Cambia la contraseña después del primer login.')
  }
}

seedAdmin()
