import { useAuth } from '../../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const rolColors = {
  admin:    'bg-red-100 text-red-700',
  gerente:  'bg-blue-100 text-blue-700',
  comprador:'bg-green-100 text-green-700',
  analista: 'bg-gray-100 text-gray-600',
}

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColors[user?.rol]}`}>
          {user?.rol}
        </span>
        <span className="text-gray-300 text-sm hidden sm:block">{user?.nombre}</span>
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  )
}

export default Navbar
