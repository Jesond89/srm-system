import { listarDocumentos, uploadDocumento, getDocumentoUrl, deleteDocumento } from './documents.service.js'

export const listar = async (req, res, next) => {
  try {
    res.json(await listarDocumentos(req.params.id))
  } catch(e) { next(e) }
}

export const upload = async (req, res, next) => {
  try {
    const { tipo } = req.body
    const data = await uploadDocumento(req.params.id, req.file, tipo, req.user.id)
    res.status(201).json(data)
  } catch(e) { next(e) }
}

export const descargar = async (req, res, next) => {
  try {
    const data = await getDocumentoUrl(req.params.docId)
    res.json(data)
  } catch(e) { next(e) }
}

export const eliminar = async (req, res, next) => {
  try {
    res.json(await deleteDocumento(req.params.docId))
  } catch(e) { next(e) }
}
