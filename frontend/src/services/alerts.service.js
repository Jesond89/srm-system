import api from './api.js'

export const alertsService = {
  badge:          ()           => api.get('/alertas/badge').then(r => r.data),
  reglas:         ()           => api.get('/alertas/reglas').then(r => r.data),
  crearRegla:     (body)       => api.post('/alertas/reglas', body).then(r => r.data),
  toggleRegla:    (id, activa) => api.patch(`/alertas/reglas/${id}`, { activa }).then(r => r.data),
  listar:         (params={})  => api.get('/alertas', { params }).then(r => r.data),
  marcarLeida:    (id)         => api.patch(`/alertas/${id}/leer`).then(r => r.data),
  marcarAtendida: (id)         => api.patch(`/alertas/${id}/atender`).then(r => r.data),
  ejecutarMotor:  ()           => api.post('/alertas/ejecutar-motor').then(r => r.data),
}
