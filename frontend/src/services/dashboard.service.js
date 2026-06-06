import api from './api.js'

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then(r => r.data),
}
