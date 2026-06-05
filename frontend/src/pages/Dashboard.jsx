import { useAuth } from '../context/AuthContext.jsx'
import {
  BuildingOffice2Icon,
  ShoppingCartIcon,
  ChartBarIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const rolColors = {
  admin:    'bg-red-100 text-red-700',
  gerente:  'bg-blue-100 text-blue-700',
  comprador:'bg-green-100 text-green-700',
  analista: 'bg-gray-100 text-gray-700',
}

const modulos = [
  { titulo: 'Proveedores',       desc: 'Registra y gestiona tu red de proveedores', icon: BuildingOffice2Icon,       color: 'text-blue-500',   border: 'border-blue-400'   },
  { titulo: 'Órdenes de compra', desc: 'Crea y da seguimiento a tus pedidos',       icon: ShoppingCartIcon,          color: 'text-purple-500', border: 'border-purple-400' },
  { titulo: 'Evaluaciones',      desc: 'Monitorea el desempeño de proveedores',     icon: ChartBarIcon,              color: 'text-green-500',  border: 'border-green-400'  },
  { titulo: 'Alertas',           desc: 'Revisa notificaciones y alertas activas',   icon: BellIcon,                  color: 'text-yellow-500', border: 'border-yellow-400' },
  { titulo: 'Chatbot IA',        desc: 'Consulta el asistente inteligente',         icon: ChatBubbleLeftRightIcon,   color: 'text-red-500',    border: 'border-red-400'    },
  { titulo: 'Configuración',     desc: 'Ajusta parámetros del sistema',             icon: Cog6ToothIcon,             color: 'text-gray-400',   border: 'border-gray-300'   },
]

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-gray-800">
          Bienvenido, {user?.nombre}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColors[user?.rol]}`}>
            {user?.rol}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulos.map(({ titulo, desc, icon: Icon, color, border }) => (
          <div key={titulo} className={`card border-l-4 ${border} cursor-pointer group`}>
            <Icon className={`w-6 h-6 ${color} mb-3`} />
            <h3 className="font-semibold text-gray-800 text-sm">{titulo}</h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{desc}</p>
            <span className="text-xs text-gray-300 mt-4 block">Próximamente</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
