import { getUsuarios, createUsuario, updateUsuario, resetPassword } from './users.service.js'

export const listar = async (req, res, next) => {
  try {
    const { search, rol, page, limit } = req.query
    res.json(await getUsuarios({ search, rol, page: parseInt(page)||1, limit: parseInt(limit)||20 }))
  } catch(e){next(e)}
}

export const crear = async (req, res, next) => {
  try { res.status(201).json(await createUsuario(req.body)) } catch(e){next(e)}
}

export const actualizar = async (req, res, next) => {
  try { res.json(await updateUsuario(req.params.id, req.body)) } catch(e){next(e)}
}

export const cambiarPassword = async (req, res, next) => {
  try {
    const { password } = req.body
    res.json(await resetPassword(req.params.id, password))
  } catch(e){next(e)}
}
