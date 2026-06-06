import api from './api.js'

export const usersService = {
  listar:          (params={})      => api.get('/usuarios', { params }).then(r => r.data),
  crear:           (body)           => api.post('/usuarios', body).then(r => r.data),
  actualizar:      (id, body)       => api.patch(`/usuarios/${id}`, body).then(r => r.data),
  cambiarPassword: (id, password)   => api.patch(`/usuarios/${id}/password`, { password }).then(r => r.data),
}
