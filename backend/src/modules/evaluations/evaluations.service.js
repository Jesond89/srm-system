import { supabaseAdmin } from '../../config/supabase.js'

// ══════════════════════════════════════════════════════════
//  CRITERIOS
// ══════════════════════════════════════════════════════════

export const getCriterios = async () => {
  const { data, error } = await supabaseAdmin
    .from('criterios_evaluacion')
    .select('*')
    .order('nombre')
  if (error) throw { status: 500, message: error.message }
  return data
}

export const createCriterio = async ({ nombre, descripcion, peso }) => {
  if (!nombre || !peso) throw { status: 400, message: 'Nombre y peso son requeridos' }
  if (peso <= 0 || peso > 100) throw { status: 400, message: 'El peso debe estar entre 1 y 100' }

  // Verificar que la suma de pesos activos no supere 100
  const { data: activos } = await supabaseAdmin
    .from('criterios_evaluacion')
    .select('peso')
    .eq('activo', true)

  const sumaActual = activos?.reduce((s, c) => s + parseFloat(c.peso), 0) || 0
  if (sumaActual + parseFloat(peso) > 100) {
    throw {
      status: 400,
      message: `La suma de pesos activos (${sumaActual.toFixed(1)}%) + ${peso}% supera 100%. Ajusta otros criterios primero.`
    }
  }

  const { data, error } = await supabaseAdmin
    .from('criterios_evaluacion')
    .insert([{ nombre, descripcion: descripcion || null, peso }])
    .select()
    .single()

  if (error) throw { status: 500, message: error.message }
  return data
}

export const updateCriterio = async (id, fields) => {
  const { data, error } = await supabaseAdmin
    .from('criterios_evaluacion')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw { status: 500, message: error.message }
  if (!data) throw { status: 404, message: 'Criterio no encontrado' }
  return data
}

// ══════════════════════════════════════════════════════════
//  EVALUACIONES
// ══════════════════════════════════════════════════════════

export const getEvaluaciones = async ({ proveedor_id, periodo, page = 1, limit = 20 }) => {
  let query = supabaseAdmin
    .from('evaluaciones')
    .select(`
      id, score, categoria, periodo, created_at,
      proveedores(id, nombre, rfc)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (proveedor_id) query = query.eq('proveedor_id', proveedor_id)
  if (periodo)      query = query.eq('periodo', periodo)

  const { data, error, count } = await query
  if (error) throw { status: 500, message: error.message }
  return { data, total: count, page, limit }
}

// Calcular y guardar score de un proveedor para un período
export const calcularEvaluacion = async (proveedor_id, periodo, scores) => {
  // scores = { criterio_id: valor, ... }
  if (!proveedor_id || !periodo) throw { status: 400, message: 'Proveedor y período requeridos' }

  // Verificar período formato YYYY-MM
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    throw { status: 400, message: 'El período debe tener formato YYYY-MM (ej. 2026-06)' }
  }

  // Obtener criterios activos con sus pesos
  const { data: criterios } = await supabaseAdmin
    .from('criterios_evaluacion')
    .select('id, nombre, peso')
    .eq('activo', true)

  if (!criterios?.length) throw { status: 400, message: 'No hay criterios de evaluación activos' }

  // Calcular score ponderado
  let scoreTotal = 0
  const detalle = []

  for (const criterio of criterios) {
    const valorCriterio = parseFloat(scores[criterio.id]) || 0
    if (valorCriterio < 0 || valorCriterio > 100) {
      throw { status: 400, message: `El score del criterio "${criterio.nombre}" debe estar entre 0 y 100` }
    }
    const aporte = (valorCriterio * criterio.peso) / 100
    scoreTotal += aporte
    detalle.push({ criterio_id: criterio.id, score_parcial: valorCriterio })
  }

  // Verificar si ya existe evaluación para ese período
  const { data: existe } = await supabaseAdmin
    .from('evaluaciones')
    .select('id')
    .eq('proveedor_id', proveedor_id)
    .eq('periodo', periodo)
    .single()

  if (existe) {
    throw { status: 409, message: `Ya existe una evaluación para este proveedor en el período ${periodo}` }
  }

  // Insertar evaluación (categoria se genera automáticamente por BD)
  const { data: evaluacion, error } = await supabaseAdmin
    .from('evaluaciones')
    .insert([{ proveedor_id, score: parseFloat(scoreTotal.toFixed(2)), periodo }])
    .select()
    .single()

  if (error) throw { status: 500, message: error.message }

  // Insertar detalle por criterio
  await supabaseAdmin.from('evaluacion_detalle').insert(
    detalle.map(d => ({ ...d, evaluacion_id: evaluacion.id }))
  )

  return evaluacion
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════

export const getDashboard = async () => {
  // Ranking de proveedores por score actual
  const { data: ranking } = await supabaseAdmin
    .from('proveedores')
    .select('id, nombre, rfc, score_actual, categoria, activo')
    .eq('activo', true)
    .order('score_actual', { ascending: false })
    .limit(10)

  // Conteo por categoría
  const { data: porCategoria } = await supabaseAdmin
    .from('proveedores')
    .select('categoria')
    .eq('activo', true)
    .not('categoria', 'is', null)

  const categorias = { A: 0, B: 0, C: 0, D: 0 }
  porCategoria?.forEach(p => { if (categorias[p.categoria] !== undefined) categorias[p.categoria]++ })

  // Últimas evaluaciones (para gráfica de tendencia)
  const { data: recientes } = await supabaseAdmin
    .from('evaluaciones')
    .select('score, categoria, periodo, proveedores(nombre)')
    .order('created_at', { ascending: false })
    .limit(20)

  // Stats generales
  const { count: totalProveedores } = await supabaseAdmin
    .from('proveedores').select('*', { count: 'exact', head: true }).eq('activo', true)

  const { count: totalEvaluaciones } = await supabaseAdmin
    .from('evaluaciones').select('*', { count: 'exact', head: true })

  const promedioScore = ranking?.length
    ? ranking.reduce((s, p) => s + parseFloat(p.score_actual || 0), 0) / ranking.length
    : 0

  return {
    stats: {
      totalProveedores,
      totalEvaluaciones,
      promedioScore: parseFloat(promedioScore.toFixed(2)),
      distribuccion: categorias,
    },
    ranking,
    recientes,
  }
}
