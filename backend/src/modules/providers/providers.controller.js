import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  getHistorialProveedor,
} from './providers.service.js'

export const listar = async (req, res, next) => {
  try {
    const { search, categoria, activo, page, limit } = req.query
    const result = await getProveedores({
      search,
      categoria,
      activo: activo !== undefined ? activo === 'true' : undefined,
      page:   parseInt(page)  || 1,
      limit:  parseInt(limit) || 20,
    })
    res.json(result)
  } catch (err) { next(err) }
}

export const obtener = async (req, res, next) => {
  try {
    const data = await getProveedorById(req.params.id)
    res.json(data)
  } catch (err) { next(err) }
}

export const crear = async (req, res, next) => {
  try {
    const data = await createProveedor(req.body, req.user.id)
    res.status(201).json(data)
  } catch (err) { next(err) }
}

export const actualizar = async (req, res, next) => {
  try {
    const data = await updateProveedor(req.params.id, req.body)
    res.json(data)
  } catch (err) { next(err) }
}

export const historial = async (req, res, next) => {
  try {
    const { page, limit, estado } = req.query
    const result = await getHistorialProveedor(req.params.id, {
      page:  parseInt(page)  || 1,
      limit: parseInt(limit) || 20,
      estado,
    })
    res.json(result)
  } catch (err) { next(err) }
}
