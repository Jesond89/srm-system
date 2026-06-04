import { useAuth } from '../context/AuthContext.jsx'

const rolColors = {
  admin:    'bg-red-100 text-red-700',
  gerente:  'bg-blue-100 text-blue-700',
  comprador:'bg-green-100 text-green-700',
  analista: 'bg-gray-100 text-gray-700',
}

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-gray-800">
          Bienvenido, {user?.nombre} 👋
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-500 text-sm">{user?.email}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColors[user?.rol]}`}>
            {user?.rol}
          </span>
        </div>
      </div>

      {/* Cards de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { titulo: 'Proveedores',    desc: 'Registra y gestiona tu red de proveedores', color: 'border-blue-400',  icon: '🏢' },
          { titulo: 'Órdenes de compra', desc: 'Crea y da seguimiento a tus pedidos',   color: 'border-purple-400', icon: '📦' },
          { titulo: 'Evaluaciones',   desc: 'Monitorea el desempeño de proveedores',    color: 'border-green-400',  icon: '📊' },
          { titulo: 'Alertas',        desc: 'Revisa notificaciones y alertas activas',  color: 'border-yellow-400', icon: '🔔' },
          { titulo: 'Chatbot IA',     desc: 'Consulta el asistente inteligente',        color: 'border-red-400',    icon: '🤖' },
          { titulo: 'Configuración',  desc: 'Ajusta parámetros del sistema',            color: 'border-gray-400',   icon: '⚙️' },
        ].map((m) => (
          <div key={m.titulo} className={`card border-l-4 ${m.color}`}>
            <div className="text-2xl mb-2">{m.icon}</div>
            <h3 className="font-semibold text-gray-800">{m.titulo}</h3>
            <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
            <span className="text-xs text-gray-400 mt-3 block">Próximamente</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
