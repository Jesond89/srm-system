import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

// Adjunta JWT a cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('srm_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirige al login si el token expira
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('srm_token')
      localStorage.removeItem('srm_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
