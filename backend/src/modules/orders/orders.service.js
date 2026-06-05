import { supabaseAdmin } from '../../config/supabase.js'

// Transiciones válidas de estado (máquina de estados)
const TRANSICIONES = {
  borrador:    ['enviado', 'cancelado'],
  enviado:     ['confirmado', 'cancelado'],
  confirmado:  ['en_transito', 'cancelado'],
  en_transito: ['recibido'],
  recibido:    [],
  cancelado:   [],
}

// ── Listar órdenes ────────────────────────────────────────────────────────────
export const getOrdenes = async ({ estado, proveedor_id, search, page = 1, limit = 15, userId, rol }) => {
  let query = supabaseAdmin
    .from('ordenes_compra')
    .select(`
      id, folio, estado, notas, created_at, updated_at,
      proveedores(id, nombre, rfc),
      usuarios!ordenes_compra_created_by_fkey(nombre)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (estado)       query = query.eq('estado', estado)
  if (proveedor_id) query = query.eq('proveedor_id', proveedor_id)

  // Comprador solo ve sus propias OCs
  if (rol === 'comprador') query = query.eq('created_by', userId)

  const { data, error, count } = await query
  if (error) throw { status: 500, message: error.message }
  return { data, total: count, page, limit }
}

// ── Obtener una orden con sus productos ───────────────────────────────────────
export const getOrdenById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('ordenes_compra')
    .select(`
      *,
      proveedores(id, nombre, rfc, email, telefono),
      productos_oc(id, nombre, unidad, cantidad, precio_unitario, subtotal),
      historial_estados_oc(id, estado_anterior, estado_nuevo, notas, created_at,
        usuarios!historial_estados_oc_changed_by_fkey(nombre)),
      usuarios!ordenes_compra_created_by_fkey(nombre),
      usuarios!ordenes_compra_aprobado_by_fkey(nombre)
    `)
    .eq('id', id)
    .single()

  if (error || !data) throw { status: 404, message: 'Orden no encontrada' }
  return data
}

// ── Crear orden de compra ─────────────────────────────────────────────────────
export const createOrden = async ({ proveedor_id, notas, productos }, userId) => {
  if (!proveedor_id) throw { status: 400, message: 'Proveedor requerido' }
  if (!productos?.length) throw { status: 400, message: 'Agrega al menos un producto' }

  // Verificar que el proveedor existe y está activo
  const { data: proveedor } = await supabaseAdmin
    .from('proveedores').select('id, activo').eq('id', proveedor_id).single()
  if (!proveedor) throw { status: 404, message: 'Proveedor no encontrado' }
  if (!proveedor.activo) throw { status: 400, message: 'El proveedor está inactivo' }

  // Crear la orden (folio generado por la secuencia en BD)
  const { data: orden, error } = await supabaseAdmin
    .from('ordenes_compra')
    .insert([{ proveedor_id, notas: notas || null, created_by: userId }])
    .select()
    .single()

  if (error) throw { status: 500, message: error.message }

  // Insertar productos
  const prods = productos.map(p => ({
    orden_id:        orden.id,
    nombre:          p.nombre.trim(),
    unidad:          p.unidad || 'pieza',
    cantidad:        parseInt(p.cantidad),
    precio_unitario: parseFloat(p.precio_unitario),
  }))

  const { error: prodErr } = await supabaseAdmin.from('productos_oc').insert(prods)
  if (prodErr) throw { status: 500, message: prodErr.message }

  return getOrdenById(orden.id)
}

// ── Cambiar estado de una orden ───────────────────────────────────────────────
export const cambiarEstado = async (id, nuevoEstado, userId, notas) => {
  const orden = await getOrdenById(id)
  const permitidos = TRANSICIONES[orden.estado]

  if (!permitidos.includes(nuevoEstado)) {
    throw {
      status: 400,
      message: `No se puede pasar de "${orden.estado}" a "${nuevoEstado}". Transiciones válidas: ${permitidos.join(', ') || 'ninguna'}`
    }
  }

  // Actualizar estado
  const updates = { estado: nuevoEstado }
  if (nuevoEstado === 'confirmado') updates.aprobado_by = userId

  const { error } = await supabaseAdmin
    .from('ordenes_compra').update(updates).eq('id', id)
  if (error) throw { status: 500, message: error.message }

  // Registrar en historial de auditoría
  await supabaseAdmin.from('historial_estados_oc').insert([{
    orden_id:        id,
    estado_anterior: orden.estado,
    estado_nuevo:    nuevoEstado,
    notas:           notas || null,
    changed_by:      userId,
  }])

  return getOrdenById(id)
}
