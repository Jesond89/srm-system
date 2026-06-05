import { supabaseAdmin } from '../../config/supabase.js'

// ── Listar proveedores con búsqueda y filtros ─────────────────────────────────
export const getProveedores = async ({ search = '', categoria = '', activo, page = 1, limit = 20 }) => {
  let query = supabaseAdmin
    .from('proveedores')
    .select('id, nombre, rfc, email, telefono, categoria, score_actual, activo, created_at', { count: 'exact' })
    .order('nombre', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,rfc.ilike.%${search}%`)
  }
  if (categoria) {
    query = query.eq('categoria', categoria)
  }
  if (activo !== undefined) {
    query = query.eq('activo', activo)
  }

  const { data, error, count } = await query
  if (error) throw { status: 500, message: error.message }

  return { data, total: count, page, limit }
}

// ── Obtener un proveedor por ID ───────────────────────────────────────────────
export const getProveedorById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('proveedores')
    .select(`
      *,
      documentos_proveedor(id, nombre, tipo, url_storage, created_at),
      evaluaciones(id, score, categoria, periodo, created_at)
    `)
    .eq('id', id)
    .single()

  if (error || !data) throw { status: 404, message: 'Proveedor no encontrado' }
  return data
}

// ── Crear proveedor ───────────────────────────────────────────────────────────
export const createProveedor = async (body, userId) => {
  const { nombre, rfc, email, telefono, direccion } = body

  if (!nombre || !rfc) throw { status: 400, message: 'Nombre y RFC son requeridos' }

  // Verificar RFC duplicado
  const { data: existe } = await supabaseAdmin
    .from('proveedores')
    .select('id')
    .eq('rfc', rfc.toUpperCase())
    .single()

  if (existe) throw { status: 409, message: `Ya existe un proveedor con RFC ${rfc}` }

  const { data, error } = await supabaseAdmin
    .from('proveedores')
    .insert([{
      nombre:     nombre.trim(),
      rfc:        rfc.toUpperCase().trim(),
      email:      email?.toLowerCase().trim() || null,
      telefono:   telefono?.trim() || null,
      direccion:  direccion?.trim() || null,
      created_by: userId,
    }])
    .select()
    .single()

  if (error) {
    if (error.message.includes('violates check constraint')) {
      throw { status: 400, message: 'El formato del RFC no es válido' }
    }
    throw { status: 500, message: error.message }
  }

  return data
}

// ── Actualizar proveedor ──────────────────────────────────────────────────────
export const updateProveedor = async (id, body) => {
  const { nombre, email, telefono, direccion, activo } = body

  const updates = {}
  if (nombre    !== undefined) updates.nombre   = nombre.trim()
  if (email     !== undefined) updates.email    = email?.toLowerCase().trim() || null
  if (telefono  !== undefined) updates.telefono = telefono?.trim() || null
  if (direccion !== undefined) updates.direccion= direccion?.trim() || null
  if (activo    !== undefined) updates.activo   = activo

  if (Object.keys(updates).length === 0) {
    throw { status: 400, message: 'No se proporcionaron campos para actualizar' }
  }

  const { data, error } = await supabaseAdmin
    .from('proveedores')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw { status: 500, message: error.message }
  if (!data) throw { status: 404, message: 'Proveedor no encontrado' }

  return data
}

// ── Historial de transacciones (órdenes de compra del proveedor) ──────────────
export const getHistorialProveedor = async (id, { page = 1, limit = 20, estado = '' }) => {
  let query = supabaseAdmin
    .from('ordenes_compra')
    .select('id, folio, estado, notas, created_at, updated_at', { count: 'exact' })
    .eq('proveedor_id', id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (estado) query = query.eq('estado', estado)

  const { data, error, count } = await query
  if (error) throw { status: 500, message: error.message }

  return { data, total: count, page, limit }
}
