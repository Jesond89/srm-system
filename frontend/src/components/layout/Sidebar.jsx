import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  Squares2X2Icon,
  BuildingOffice2Icon,
  ShoppingCartIcon,
  ChartBarIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',        icon: Squares2X2Icon,          roles: ['admin','gerente','comprador','analista'] },
  { to: '/proveedores',   label: 'Proveedores',       icon: BuildingOffice2Icon,      roles: ['admin','gerente','comprador','analista'] },
  { to: '/ordenes',       label: 'Órdenes de compra', icon: ShoppingCartIcon,         roles: ['admin','gerente','comprador'] },
  { to: '/evaluaciones',  label: 'Evaluaciones',      icon: ChartBarIcon,             roles: ['admin','gerente','analista'] },
  { to: '/alertas',       label: 'Alertas',           icon: BellIcon,                 roles: ['admin','gerente','comprador','analista'] },
  { to: '/chatbot',       label: 'Chatbot IA',        icon: ChatBubbleLeftRightIcon,  roles: ['admin','gerente','comprador','analista'] },
  { to: '/usuarios',      label: 'Usuarios',          icon: UsersIcon,                roles: ['admin'] },
  { to: '/configuracion', label: 'Configuración',     icon: Cog6ToothIcon,            roles: ['admin','gerente'] },
]

const Sidebar = () => {
  const { user } = useAuth()
  const items = navItems.filter(i => i.roles.includes(user?.rol))

  return (
    <aside className="w-60 bg-dark border-r border-gray-700 fixed top-16 left-0 bottom-0 overflow-y-auto">
      <nav className="p-3 space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
