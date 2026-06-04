import api from './api.js'

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('srm_token', data.token)
    localStorage.setItem('srm_user',  JSON.stringify(data.user))
    return data
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('srm_token')
    localStorage.removeItem('srm_user')
  },

  me: async () => {
    const { data } = await api.get('/auth/me')
    return data.user
  },

  getStoredUser: () => {
    try {
      return JSON.parse(localStorage.getItem('srm_user'))
    } catch {
      return null
    }
  },

  getToken: () => localStorage.getItem('srm_token'),
  isAuthenticated: () => !!localStorage.getItem('srm_token'),
}
