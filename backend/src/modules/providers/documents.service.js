import { supabaseAdmin } from '../../config/supabase.js'

const BUCKET = 'documentos-proveedores'

// Listar documentos de un proveedor
export const listarDocumentos = async (proveedorId) => {
  const { data, error } = await supabaseAdmin
    .from('documentos_proveedor')
    .select('id, nombre, tipo, created_at')
    .eq('proveedor_id', proveedorId)
    .order('created_at', { ascending: false })

  if (error) throw { status: 500, message: error.message }
  return data
}

// Subir documento a Supabase Storage y guardar metadata en BD
export const uploadDocumento = async (proveedorId, file, tipo, userId) => {
  if (!file) throw { status: 400, message: 'Archivo requerido' }

  // Verificar que el proveedor existe
  const { data: prov } = await supabaseAdmin
    .from('proveedores').select('id').eq('id', proveedorId).single()
  if (!prov) throw { status: 404, message: 'Proveedor no encontrado' }

  // Ruta en el bucket: proveedorId/timestamp-nombre
  const ext      = file.originalname.split('.').pop()
  const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const path     = `${proveedorId}/${fileName}`

  // Subir a Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (uploadError) throw { status: 500, message: `Error al subir archivo: ${uploadError.message}` }

  // Guardar metadata en BD
  const { data, error } = await supabaseAdmin
    .from('documentos_proveedor')
    .insert([{
      proveedor_id: proveedorId,
      nombre:       file.originalname,
      tipo:         tipo || 'otro',
      url_storage:  path,
      created_by:   userId,
    }])
    .select()
    .single()

  if (error) {
    // Si falla la BD, eliminar el archivo subido
    await supabaseAdmin.storage.from(BUCKET).remove([path])
    throw { status: 500, message: error.message }
  }

  return data
}

// Obtener URL firmada para descargar un documento
export const getDocumentoUrl = async (docId) => {
  const { data: doc } = await supabaseAdmin
    .from('documentos_proveedor').select('*').eq('id', docId).single()

  if (!doc) throw { status: 404, message: 'Documento no encontrado' }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(doc.url_storage, 3600) // válida 1 hora

  if (error) throw { status: 500, message: error.message }

  return { url: data.signedUrl, nombre: doc.nombre }
}

// Eliminar documento
export const deleteDocumento = async (docId) => {
  const { data: doc } = await supabaseAdmin
    .from('documentos_proveedor').select('*').eq('id', docId).single()

  if (!doc) throw { status: 404, message: 'Documento no encontrado' }

  // Eliminar del storage
  await supabaseAdmin.storage.from(BUCKET).remove([doc.url_storage])

  // Eliminar de BD
  await supabaseAdmin.from('documentos_proveedor').delete().eq('id', docId)

  return { message: 'Documento eliminado' }
}
