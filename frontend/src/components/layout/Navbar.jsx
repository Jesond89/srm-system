import { useAuth } from '../../context/AuthContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { alertsService } from '../../services/alerts.service.js'

const rolColors = {
  admin:    'bg-red-100 text-red-700',
  gerente:  'bg-blue-100 text-blue-700',
  comprador:'bg-green-100 text-green-700',
  analista: 'bg-gray-100 text-gray-600',
}

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [badge, setBadge] = useState(0)

  useEffect(() => {
    const fetchBadge = () => alertsService.badge().then(r => setBadge(r.count || 0)).catch(() => {})
    fetchBadge()
    const interval = setInterval(fetchBadge, 30_000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-dark border-b border-gray-700 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
          <span className="text-primary text-xs font-bold font-heading">SR</span>
        </div>
        <span className="text-white font-semibold font-heading text-sm tracking-wide">
          SRM System
        </span>
      </div>

      {/* Usuario + logout */}
      <div className="flex items-center gap-4">
        {/* Badge alertas */}
        <button onClick={() => navigate('/alertas')} className="relative text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColors[user?.rol]}`}>
          {user?.rol}
        </span>
        <button
          onClick={() => navigate("/perfil")}
          className="text-gray-300 text-sm hidden sm:block hover:text-white transition-colors"
          title="Ver perfil"
        >
          {user?.nombre}
        </button>
        <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm transition-colors">
          Salir
        </button>
      </div>
    </header>
  )
}

export default Navbar
