import api from './api.js'

export const evaluationsService = {
  dashboard:        ()            => api.get('/evaluaciones/dashboard').then(r => r.data),
  criterios:        ()            => api.get('/evaluaciones/criterios').then(r => r.data),
  crearCriterio:    (body)        => api.post('/evaluaciones/criterios', body).then(r => r.data),
  editarCriterio:   (id, body)    => api.put(`/evaluaciones/criterios/${id}`, body).then(r => r.data),
  listar:           (params = {}) => api.get('/evaluaciones', { params }).then(r => r.data),
  calcular:         (body)        => api.post('/evaluaciones', body).then(r => r.data),
}
