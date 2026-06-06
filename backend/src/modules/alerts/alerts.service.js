import { supabaseAdmin } from '../../config/supabase.js'

// ══════════════════════════════════════════════════════════
//  REGLAS DE ALERTA
// ══════════════════════════════════════════════════════════

export const getReglas = async () => {
  const { data, error } = await supabaseAdmin
    .from('reglas_alerta')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw { status: 500, message: error.message }
  return data
}

export const createRegla = async ({ nombre, tipo, condicion, severidad }) => {
  if (!nombre || !tipo || !condicion) throw { status: 400, message: 'Nombre, tipo y condición son requeridos' }

  const { data, error } = await supabaseAdmin
    .from('reglas_alerta')
    .insert([{ nombre, tipo, condicion, severidad: severidad || 'media' }])
    .select()
    .single()

  if (error) throw { status: 500, message: error.message }
  return data
}

export const updateRegla = async (id, { nombre, severidad, condicion, activa }) => {
  const updates = {}
  if (nombre    !== undefined) updates.nombre    = nombre
  if (severidad !== undefined) updates.severidad = severidad
  if (condicion !== undefined) updates.condicion = condicion
  if (activa    !== undefined) updates.activa    = activa

  const { data, error } = await supabaseAdmin
    .from('reglas_alerta')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw { status: 500, message: error.message }
  if (!data) throw { status: 404, message: 'Regla no encontrada' }
  return data
}

// ══════════════════════════════════════════════════════════
//  ALERTAS
// ══════════════════════════════════════════════════════════

export const getAlertas = async ({ leida, atendida, severidad, page = 1, limit = 20 }) => {
  let query = supabaseAdmin
    .from('alertas')
    .select(`
      id, severidad, mensaje, leida, atendida, created_at,
      reglas_alerta(nombre, tipo),
      proveedores(id, nombre),
      ordenes_compra(id, folio)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (leida    !== undefined) query = query.eq('leida',    leida)
  if (atendida !== undefined) query = query.eq('atendida', atendida)
  if (severidad)              query = query.eq('severidad', severidad)

  const { data, error, count } = await query
  if (error) throw { status: 500, message: error.message }
  return { data, total: count, page, limit }
}

export const marcarLeida = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('alertas')
    .update({ leida: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw { status: 500, message: error.message }
  return data
}

export const marcarAtendida = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('alertas')
    .update({ leida: true, atendida: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw { status: 500, message: error.message }
  return data
}

export const contarNoLeidas = async () => {
  const { count, error } = await supabaseAdmin
    .from('alertas')
    .select('*', { count: 'exact', head: true })
    .eq('leida', false)
  if (error) throw { status: 500, message: error.message }
  return { count }
}

// Crear alerta manualmente (también usado por el motor de reglas)
export const createAlerta = async ({ regla_id, proveedor_id, orden_id, severidad, mensaje }) => {
  if (!mensaje) throw { status: 400, message: 'Mensaje requerido' }
  if (!proveedor_id && !orden_id) throw { status: 400, message: 'Se requiere proveedor_id u orden_id' }

  const { data, error } = await supabaseAdmin
    .from('alertas')
    .insert([{ regla_id: regla_id || null, proveedor_id: proveedor_id || null,
               orden_id: orden_id || null, severidad: severidad || 'media', mensaje }])
    .select()
    .single()
  if (error) throw { status: 500, message: error.message }
  return data
}

// ══════════════════════════════════════════════════════════
//  MOTOR DE REGLAS (ejecutado por cron)
// ══════════════════════════════════════════════════════════

export const ejecutarMotorReglas = async () => {
  const { data: reglas } = await supabaseAdmin
    .from('reglas_alerta')
    .select('*')
    .eq('activa', true)

  const alertasCreadas = []

  for (const regla of reglas || []) {
    try {
      switch (regla.tipo) {
        case 'score_bajo': {
          const umbral = regla.condicion?.valor || 60
          const { data: provs } = await supabaseAdmin
            .from('proveedores')
            .select('id, nombre, score_actual')
            .eq('activo', true)
            .lt('score_actual', umbral)
            .gt('score_actual', 0)

          for (const p of provs || []) {
            // Evitar duplicados recientes (últimas 24h)
            const { count } = await supabaseAdmin
              .from('alertas')
              .select('*', { count: 'exact', head: true })
              .eq('proveedor_id', p.id)
              .eq('regla_id', regla.id)
              .gte('created_at', new Date(Date.now() - 86400000).toISOString())

            if (!count) {
              const alerta = await createAlerta({
                regla_id: regla.id, proveedor_id: p.id,
                severidad: regla.severidad,
                mensaje: `${p.nombre} tiene un score bajo: ${parseFloat(p.score_actual).toFixed(1)}% (umbral: ${umbral}%)`
              })
              alertasCreadas.push(alerta)
            }
          }
          break
        }
        case 'score_critico': {
          const umbral = regla.condicion?.valor || 40
          const { data: provs } = await supabaseAdmin
            .from('proveedores')
            .select('id, nombre, score_actual')
            .eq('activo', true)
            .lt('score_actual', umbral)
            .gt('score_actual', 0)

          for (const p of provs || []) {
            const { count } = await supabaseAdmin
              .from('alertas').select('*', { count: 'exact', head: true })
              .eq('proveedor_id', p.id).eq('regla_id', regla.id)
              .gte('created_at', new Date(Date.now() - 86400000).toISOString())

            if (!count) {
              alertasCreadas.push(await createAlerta({
                regla_id: regla.id, proveedor_id: p.id, severidad: 'critica',
                mensaje: `CRÍTICO: ${p.nombre} tiene score de ${parseFloat(p.score_actual).toFixed(1)}%`
              }))
            }
          }
          break
        }
        case 'oc_pendiente': {
          const horas = regla.condicion?.horas || 48
          const { data: ordenes } = await supabaseAdmin
            .from('ordenes_compra')
            .select('id, folio, proveedores(nombre)')
            .eq('estado', 'enviado')
            .lte('created_at', new Date(Date.now() - horas * 3600000).toISOString())

          for (const o of ordenes || []) {
            const { count } = await supabaseAdmin
              .from('alertas').select('*', { count: 'exact', head: true })
              .eq('orden_id', o.id).eq('regla_id', regla.id)
              .gte('created_at', new Date(Date.now() - 86400000).toISOString())

            if (!count) {
              alertasCreadas.push(await createAlerta({
                regla_id: regla.id,
                proveedor_id: null,
                orden_id: o.id,
                severidad: regla.severidad,
                mensaje: `OC ${o.folio} lleva más de ${horas}h sin confirmación`
              }))
            }
          }
          break
        }
      }
    } catch (err) {
      console.error(`[Regla ${regla.nombre}] Error:`, err.message)
    }
  }

  return { alertasCreadas: alertasCreadas.length }
}
