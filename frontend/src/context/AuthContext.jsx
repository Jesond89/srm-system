import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/auth.service.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(authService.getStoredUser())
  const [loading, setLoading] = useState(true)

  // Valida el token al cargar la app
  useEffect(() => {
    const verify = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false)
        return
      }
      try {
        const freshUser = await authService.me()
        setUser(freshUser)
        localStorage.setItem('srm_user', JSON.stringify(freshUser))
      } catch {
        setUser(null)
        localStorage.removeItem('srm_token')
        localStorage.removeItem('srm_user')
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
