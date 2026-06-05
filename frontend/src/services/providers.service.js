import api from './api.js'

export const providersService = {
  listar:   (params = {}) => api.get('/proveedores', { params }).then(r => r.data),
  obtener:  (id)          => api.get(`/proveedores/${id}`).then(r => r.data),
  crear:    (body)        => api.post('/proveedores', body).then(r => r.data),
  actualizar:(id, body)   => api.put(`/proveedores/${id}`, body).then(r => r.data),
  historial: (id, params) => api.get(`/proveedores/${id}/historial`, { params }).then(r => r.data),
}
