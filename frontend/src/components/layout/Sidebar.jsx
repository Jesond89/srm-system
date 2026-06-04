import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',       icon: '🏠', roles: ['admin','gerente','comprador','analista'] },
  { to: '/proveedores',  label: 'Proveedores',      icon: '🏢', roles: ['admin','gerente','comprador','analista'] },
  { to: '/ordenes',      label: 'Órdenes de compra',icon: '📦', roles: ['admin','gerente','comprador'] },
  { to: '/evaluaciones', label: 'Evaluaciones',     icon: '📊', roles: ['admin','gerente','analista'] },
  { to: '/alertas',      label: 'Alertas',          icon: '🔔', roles: ['admin','gerente','comprador','analista'] },
  { to: '/chatbot',      label: 'Chatbot IA',       icon: '🤖', roles: ['admin','gerente','comprador','analista'] },
  { to: '/usuarios',     label: 'Usuarios',         icon: '👥', roles: ['admin'] },
  { to: '/configuracion',label: 'Configuración',    icon: '⚙️', roles: ['admin','gerente'] },
]

const Sidebar = () => {
  const { user } = useAuth()

  const items = navItems.filter(i => i.roles.includes(user?.rol))

  return (
    <aside className="w-60 bg-dark border-r border-gray-700 fixed top-16 left-0 bottom-0 overflow-y-auto">
      <nav className="p-3 space-y-1">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
