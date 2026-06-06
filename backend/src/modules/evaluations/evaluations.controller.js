import {
  getCriterios, createCriterio, updateCriterio,
  getEvaluaciones, calcularEvaluacion, getDashboard
} from './evaluations.service.js'

export const listarCriterios  = async (req, res, next) => { try { res.json(await getCriterios()) } catch(e){next(e)} }

export const crearCriterio    = async (req, res, next) => {
  try { res.status(201).json(await createCriterio(req.body)) } catch(e){next(e)}
}

export const editarCriterio   = async (req, res, next) => {
  try { res.json(await updateCriterio(req.params.id, req.body)) } catch(e){next(e)}
}

export const listarEvaluaciones = async (req, res, next) => {
  try {
    const { proveedor_id, periodo, page, limit } = req.query
    res.json(await getEvaluaciones({
      proveedor_id, periodo,
      page: parseInt(page) || 1, limit: parseInt(limit) || 20
    }))
  } catch(e){next(e)}
}

export const calcular = async (req, res, next) => {
  try {
    const { proveedor_id, periodo, scores } = req.body
    res.status(201).json(await calcularEvaluacion(proveedor_id, periodo, scores))
  } catch(e){next(e)}
}

export const dashboard = async (req, res, next) => {
  try { res.json(await getDashboard()) } catch(e){next(e)}
}
