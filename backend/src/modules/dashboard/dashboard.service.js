import { supabaseAdmin } from '../../config/supabase.js'

// ── KPIs principales ──────────────────────────────────────────────────────────
export const getKpis = async () => {
  const [proveedores, ordenes, alertas, scoreData] = await Promise.all([
    supabaseAdmin.from('proveedores').select('activo', { count: 'exact' }),
    supabaseAdmin.from('ordenes_compra').select('estado', { count: 'exact' }),
    supabaseAdmin.from('alertas').select('id', { count: 'exact' }).eq('leida', false),
    supabaseAdmin.from('proveedores').select('score_actual').eq('activo', true),
  ])

  const totalProveedores   = proveedores.count || 0
  const activosProveedores = proveedores.data?.filter(p => p.activo).length || 0
  const totalOrdenes       = ordenes.count || 0
  // "pendientes" = borrador + enviado (esperando confirmación)
  const pendientes = ordenes.data?.filter(o => ['borrador', 'enviado'].includes(o.estado)).length || 0
  const alertasActivas     = alertas.count || 0

  const scores = scoreData.data?.map(p => p.score_actual).filter(Boolean) || []
  const scorePromedio = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : null

  return {
    proveedores:  { total: totalProveedores, activos: activosProveedores },
    ordenes:      { total: totalOrdenes, pendientes },
    alertas:      { activas: alertasActivas },
    scorePromedio: scorePromedio ? parseFloat(scorePromedio) : null,
  }
}

// ── Top 5 proveedores por score ───────────────────────────────────────────────
export const getTopProveedores = async () => {
  const { data, error } = await supabaseAdmin
    .from('proveedores')
    .select('id, nombre, categoria, score_actual, activo')
    .eq('activo', true)
    .not('score_actual', 'is', null)
    .order('score_actual', { ascending: false })
    .limit(5)

  if (error) throw { status: 500, message: error.message }
  return data || []
}

// ── Tendencia de scores por mes (últimos 6 meses) ─────────────────────────────
export const getTendenciaScores = async () => {
  const { data, error } = await supabaseAdmin
    .from('evaluaciones')
    .select('score, created_at, proveedores(nombre)')
    .order('created_at', { ascending: true })

  if (error) throw { status: 500, message: error.message }
  if (!data?.length) return []

  const porMes = {}
  data.forEach(e => {
    const fecha = new Date(e.created_at)
    const key   = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    const label = fecha.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
    if (!porMes[key]) porMes[key] = { label, scores: [] }
    if (e.score) porMes[key].scores.push(e.score)
  })

  return Object.values(porMes)
    .slice(-6)
    .map(m => ({
      mes:      m.label,
      promedio: m.scores.length
        ? parseFloat((m.scores.reduce((a, b) => a + b, 0) / m.scores.length).toFixed(1))
        : null,
    }))
    .filter(m => m.promedio !== null)
}

// ── Órdenes recientes ─────────────────────────────────────────────────────────
export const getOrdenesRecientes = async () => {
  const { data, error } = await supabaseAdmin
    .from('ordenes_compra')
    .select('folio, estado, created_at, proveedores(nombre)')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw { status: 500, message: error.message }
  return data || []
}

// ── Dashboard comprador: sus órdenes + resumen ────────────────────────────────
export const getStatsComprador = async (userId) => {
  const [misOrdenes, provs] = await Promise.all([
    supabaseAdmin
      .from('ordenes_compra')
      .select('folio, estado, created_at, proveedores(nombre)')
      .eq('creado_por', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('proveedores')
      .select('id', { count: 'exact' })
      .eq('activo', true),
  ])

  const todas       = misOrdenes.data || []
  const pendientesC = todas.filter(o => ['borrador', 'enviado'].includes(o.estado)).length
  const aprobadas   = todas.filter(o => ['confirmado', 'recibido'].includes(o.estado)).length

  return {
    resumen: {
      misOrdenes: todas.length,
      pendientes: pendientesC,
      aprobadas,
      proveedoresActivos: provs.count || 0,
    },
    ordenesRecientes: todas,
  }
}

// ── Dashboard analista: evaluaciones pendientes + scores ─────────────────────
export const getStatsAnalista = async () => {
  const ahora   = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()

  const [provsSinEval, ultimasEvals, countMes] = await Promise.all([
    supabaseAdmin
      .from('proveedores')
      .select('id, nombre, categoria, score_actual')
      .eq('activo', true)
      .is('score_actual', null)
      .limit(5),
    supabaseAdmin
      .from('evaluaciones')
      .select('id, score, created_at, proveedores(nombre)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabaseAdmin
      .from('evaluaciones')
      .select('id', { count: 'exact' })
      .gte('created_at', inicioMes),
  ])

  return {
    proveedoresSinEvaluar: provsSinEval.data || [],
    ultimasEvaluaciones:   ultimasEvals.data || [],
    evaluacionesMes:       countMes.count || 0,
  }
}
