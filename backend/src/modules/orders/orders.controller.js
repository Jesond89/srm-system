import { getOrdenes, getOrdenById, createOrden, cambiarEstado } from './orders.service.js'

export const listar = async (req, res, next) => {
  try {
    const { estado, proveedor_id, page, limit } = req.query
    const result = await getOrdenes({
      estado, proveedor_id,
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 15,
      userId: req.user.id,
      rol:    req.user.rol,
    })
    res.json(result)
  } catch (err) { next(err) }
}

export const obtener = async (req, res, next) => {
  try {
    const data = await getOrdenById(req.params.id)
    res.json(data)
  } catch (err) { next(err) }
}

export const crear = async (req, res, next) => {
  try {
    const data = await createOrden(req.body, req.user.id)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

export const actualizarEstado = async (req, res, next) => {
  try {
    const { estado, notas } = req.body
    if (!estado) return res.status(400).json({ error: 'El campo estado es requerido' })
    const data = await cambiarEstado(req.params.id, estado, req.user.id, notas)
    res.json(data)
  } catch (err) { next(err) }
}
