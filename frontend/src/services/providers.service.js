import api from './api.js'

export const providersService = {
  listar:   (params = {}) => api.get('/proveedores', { params }).then(r => r.data),
  obtener:  (id)          => api.get(`/proveedores/${id}`).then(r => r.data),
  crear:    (body)        => api.post('/proveedores', body).then(r => r.data),
  actualizar:(id, body)   => api.put(`/proveedores/${id}`, body).then(r => r.data),
  historial: (id, params) => api.get(`/proveedores/${id}/historial`, { params }).then(r => r.data),

  // Documentos
  listarDocumentos: (id) =>
    api.get(`/proveedores/${id}/documentos`).then(r => r.data),
  subirDocumento: (id, formData) =>
    api.post(`/proveedores/${id}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
  urlDocumento: (id, docId) =>
    api.get(`/proveedores/${id}/documentos/${docId}/url`).then(r => r.data),
  eliminarDocumento: (id, docId) =>
    api.delete(`/proveedores/${id}/documentos/${docId}`).then(r => r.data),
}
