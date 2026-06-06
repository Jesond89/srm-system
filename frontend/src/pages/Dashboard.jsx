import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  BuildingOffice2Icon,
  ShoppingCartIcon,
  BellIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardService } from '../services/dashboard.service.js'

// ── Helpers ───────────────────────────────────────────────────────────────────
const estadoColors = {
  pendiente:  'bg-yellow-100 text-yellow-700',
  aprobada:   'bg-blue-100   text-blue-700',
  en_proceso: 'bg-purple-100 text-purple-700',
  entregada:  'bg-green-100  text-green-700',
  cancelada:  'bg-red-100    text-red-700',
}

const rolColors = {
  admin:    'bg-red-100 text-red-700',
  gerente:  'bg-blue-100 text-blue-700',
  comprador:'bg-green-100 text-green-700',
  analista: 'bg-gray-100 text-gray-700',
}

const scoreColor = (s) => {
  if (!s) return 'bg-gray-200'
  if (s >= 80) return 'bg-green-500'
  if (s >= 60) return 'bg-yellow-400'
  return 'bg-red-500'
}

const scoreText = (s) => {
  if (!s) return 'text-gray-400'
  if (s >= 80) return 'text-green-600'
  if (s >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

// ── Sub-componentes comunes ───────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      {value === null || value === undefined ? (
        <p className="text-xl font-bold text-gray-300 mt-0.5">—</p>
      ) : (
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      )}
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
)

const Header = ({ user }) => (
  <div>
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
)

// ── Vista Admin / Gerente ─────────────────────────────────────────────────────
const DashboardAdmin = ({ data, navigate }) => {
  const { kpis, topProveedores, tendencia, ordenesRecientes } = data
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={BuildingOffice2Icon} label="Proveedores activos"
          value={kpis.proveedores.activos} sub={`de ${kpis.proveedores.total} en total`} color="bg-blue-500" />
        <KpiCard icon={ShoppingCartIcon} label="Órdenes pendientes"
          value={kpis.ordenes.pendientes} sub={`de ${kpis.ordenes.total} órdenes`} color="bg-purple-500" />
        <KpiCard icon={BellIcon} label="Alertas activas"
          value={kpis.alertas.activas} sub="sin atender" color="bg-yellow-500" />
        <KpiCard icon={StarIcon} label="Score promedio"
          value={kpis.scorePromedio ?? '—'} sub={kpis.scorePromedio ? 'de 100 pts' : 'sin evaluaciones'} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ArrowTrendingUpIcon className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-gray-700 text-sm">Tendencia de scores</h2>
          </div>
          {tendencia.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sin evaluaciones registradas</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={tendencia} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [`${v} pts`, 'Promedio']} />
                <Line type="monotone" dataKey="promedio"
                  stroke="var(--color-primary, #6366f1)" strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-primary, #6366f1)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-700 text-sm">Top proveedores</h2>
            </div>
            <button onClick={() => navigate('/proveedores')} className="text-xs text-primary hover:underline">Ver todos</button>
          </div>
          {topProveedores.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Sin proveedores con evaluación</div>
          ) : (
            <div className="space-y-3">
              {topProveedores.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -mx-1 transition-colors"
                  onClick={() => navigate(`/proveedores/${p.id}`)}>
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{p.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${scoreColor(p.score_actual)}`}
                          style={{ width: `${p.score_actual || 0}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-12 text-right">
                        {p.score_actual?.toFixed(1) ?? '—'} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-700 text-sm">Órdenes recientes</h2>
          </div>
          <button onClick={() => navigate('/ordenes')} className="text-xs text-primary hover:underline">Ver todas</button>
        </div>
        {ordenesRecientes.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-6">Sin órdenes registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Folio</th>
                  <th className="text-left pb-2 font-medium">Proveedor</th>
                  <th className="text-left pb-2 font-medium">Estado</th>
                  <th className="text-left pb-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ordenesRecientes.map(o => {
                  const proveedor = Array.isArray(o.proveedores) ? o.proveedores[0]?.nombre : o.proveedores?.nombre
                  return (
                    <tr key={o.folio} className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/ordenes')}>
                      <td className="py-2 font-mono text-xs text-gray-500">{o.folio}</td>
                      <td className="py-2 text-gray-700 truncate max-w-[180px]">{proveedor || '—'}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColors[o.estado] || 'bg-gray-100 text-gray-500'}`}>
                          {o.estado}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString('es-MX')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ── Vista Comprador ───────────────────────────────────────────────────────────
const DashboardComprador = ({ data, navigate }) => {
  const { resumen, ordenesRecientes } = data
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={ShoppingCartIcon} label="Mis órdenes" value={resumen.misOrdenes} sub="en total" color="bg-purple-500" />
        <KpiCard icon={ClockIcon} label="Pendientes" value={resumen.pendientes} sub="esperando aprobación" color="bg-yellow-500" />
        <KpiCard icon={CheckBadgeIcon} label="Aprobadas" value={resumen.aprobadas} sub="listas para proceso" color="bg-green-500" />
        <KpiCard icon={BuildingOffice2Icon} label="Proveedores activos" value={resumen.proveedoresActivos} sub="disponibles" color="bg-blue-500" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-700 text-sm">Mis órdenes recientes</h2>
          </div>
          <button onClick={() => navigate('/ordenes/nueva')} className="btn-primary text-xs px-3 py-1.5">
            + Nueva orden
          </button>
        </div>
        {ordenesRecientes.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCartIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aún no has creado órdenes de compra</p>
            <button onClick={() => navigate('/ordenes/nueva')} className="mt-3 btn-primary text-xs px-4 py-2">
              Crear primera orden
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Folio</th>
                  <th className="text-left pb-2 font-medium">Proveedor</th>
                  <th className="text-left pb-2 font-medium">Estado</th>
                  <th className="text-left pb-2 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ordenesRecientes.map(o => {
                  const proveedor = Array.isArray(o.proveedores) ? o.proveedores[0]?.nombre : o.proveedores?.nombre
                  return (
                    <tr key={o.folio} className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/ordenes')}>
                      <td className="py-2 font-mono text-xs text-gray-500">{o.folio}</td>
                      <td className="py-2 text-gray-700 truncate max-w-[160px]">{proveedor || '—'}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColors[o.estado] || 'bg-gray-100 text-gray-500'}`}>
                          {o.estado}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 text-xs">{new Date(o.created_at).toLocaleDateString('es-MX')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/proveedores')}
          className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left">
          <div className="p-2 bg-blue-50 rounded-lg"><BuildingOffice2Icon className="w-5 h-5 text-blue-500" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Directorio de proveedores</p>
            <p className="text-xs text-gray-400">Ver todos los proveedores activos</p>
          </div>
        </button>
        <button onClick={() => navigate('/alertas')}
          className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left">
          <div className="p-2 bg-yellow-50 rounded-lg"><BellIcon className="w-5 h-5 text-yellow-500" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Alertas del sistema</p>
            <p className="text-xs text-gray-400">Revisar notificaciones pendientes</p>
          </div>
        </button>
      </div>
    </>
  )
}

// ── Vista Analista ────────────────────────────────────────────────────────────
const DashboardAnalista = ({ data, navigate }) => {
  const { proveedoresSinEvaluar, ultimasEvaluaciones, evaluacionesMes } = data
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard icon={DocumentCheckIcon} label="Evaluaciones este mes" value={evaluacionesMes} sub="realizadas" color="bg-blue-500" />
        <KpiCard icon={ExclamationTriangleIcon} label="Sin evaluar" value={proveedoresSinEvaluar.length} sub="proveedores sin score" color="bg-yellow-500" />
        <KpiCard icon={CheckBadgeIcon} label="Últimas evaluadas" value={ultimasEvaluaciones.length} sub="registros recientes" color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-700 text-sm">Proveedores sin evaluar</h2>
            </div>
            <button onClick={() => navigate('/evaluaciones/nueva')} className="btn-primary text-xs px-3 py-1.5">
              + Nueva evaluación
            </button>
          </div>
          {proveedoresSinEvaluar.length === 0 ? (
            <div className="text-center py-8">
              <CheckBadgeIcon className="w-10 h-10 text-green-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">¡Todos los proveedores tienen evaluación!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {proveedoresSinEvaluar.map(p => (
                <div key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50 border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition-colors"
                  onClick={() => navigate(`/proveedores/${p.id}`)}>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{p.nombre}</p>
                    {p.categoria && <p className="text-xs text-gray-400">{p.categoria}</p>}
                  </div>
                  <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-2 py-0.5 rounded-full">Sin score</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DocumentCheckIcon className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-700 text-sm">Últimas evaluaciones</h2>
          </div>
          {ultimasEvaluaciones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Sin evaluaciones registradas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimasEvaluaciones.map(e => {
                const nombre = Array.isArray(e.proveedores) ? e.proveedores[0]?.nombre : e.proveedores?.nombre
                return (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{nombre || '—'}</p>
                      <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString('es-MX')}</p>
                    </div>
                    <span className={`text-sm font-bold ${scoreText(e.score)}`}>
                      {e.score?.toFixed(1) ?? '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate('/evaluaciones')}
          className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left">
          <div className="p-2 bg-blue-50 rounded-lg"><DocumentCheckIcon className="w-5 h-5 text-blue-500" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Historial de evaluaciones</p>
            <p className="text-xs text-gray-400">Ver todas las evaluaciones realizadas</p>
          </div>
        </button>
        <button onClick={() => navigate('/proveedores')}
          className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-left">
          <div className="p-2 bg-green-50 rounded-lg"><BuildingOffice2Icon className="w-5 h-5 text-green-500" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Directorio de proveedores</p>
            <p className="text-xs text-gray-400">Ver scores y perfiles</p>
          </div>
        </button>
      </div>
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
const Dashboard = () => {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    dashboardService.getStats()
      .then(setData)
      .catch(() => setError('No se pudieron cargar los datos del dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600 text-sm">{error}</div>
    </div>
  )

  return (
    <div className="p-8 space-y-6">
      <Header user={user} />
      {(data.rol === 'admin' || data.rol === 'gerente') && <DashboardAdmin data={data} navigate={navigate} />}
      {data.rol === 'comprador' && <DashboardComprador data={data} navigate={navigate} />}
      {data.rol === 'analista'  && <DashboardAnalista  data={data} navigate={navigate} />}
    </div>
  )
}

export default Dashboard
