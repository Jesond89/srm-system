import { Router }           from 'express'
import multer               from 'multer'
import { authMiddleware }   from '../../middleware/auth.middleware.js'
import { todos, noAnalista } from '../../middleware/rbac.middleware.js'
import { listar, obtener, crear, actualizar, historial } from './providers.controller.js'
import { listar as listarDocs, upload, descargar, eliminar } from './documents.controller.js'

const router = Router()
const storage = multer.memoryStorage()
const uploader = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf','image/jpeg','image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Tipo de archivo no permitido'))
  }
})

router.use(authMiddleware)

// Proveedores
router.get('/',               todos,      listar)
router.get('/:id',            todos,      obtener)
router.get('/:id/historial',  todos,      historial)
router.post('/',              noAnalista, crear)
router.put('/:id',            noAnalista, actualizar)

// Documentos
router.get('/:id/documentos',               todos,      listarDocs)
router.post('/:id/documentos',              noAnalista, uploader.single('archivo'), upload)
router.get('/:id/documentos/:docId/url',    todos,      descargar)
router.delete('/:id/documentos/:docId',     noAnalista, eliminar)

export default router
