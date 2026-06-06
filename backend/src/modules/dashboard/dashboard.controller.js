import {
  getKpis, getTopProveedores, getTendenciaScores, getOrdenesRecientes,
  getStatsComprador, getStatsAnalista,
} from './dashboard.service.js'

export const stats = async (req, res, next) => {
  try {
    const { rol, id } = req.user

    if (rol === 'comprador') {
      const data = await getStatsComprador(id)
      return res.json({ rol, ...data })
    }

    if (rol === 'analista') {
      const data = await getStatsAnalista()
      return res.json({ rol, ...data })
    }

    const [kpis, topProveedores, tendencia, ordenesRecientes] = await Promise.all([
      getKpis(),
      getTopProveedores(),
      getTendenciaScores(),
      getOrdenesRecientes(),
    ])
    res.json({ rol, kpis, topProveedores, tendencia, ordenesRecientes })
  } catch (err) { next(err) }
}
