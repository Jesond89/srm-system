import api from './api.js'

export const ordersService = {
  listar:        (params = {}) => api.get('/ordenes', { params }).then(r => r.data),
  obtener:       (id)          => api.get(`/ordenes/${id}`).then(r => r.data),
  crear:         (body)        => api.post('/ordenes', body).then(r => r.data),
  cambiarEstado: (id, estado, notas) =>
    api.patch(`/ordenes/${id}/estado`, { estado, notas }).then(r => r.data),
}
