import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { evaluationsService } from '../../services/evaluations.service.js'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { PlusIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext.jsx'

const catColors = { A: '#27ae60', B: '#2980b9', C: '#f39c12', D: '#c0392b' }

const StatCard = ({ label, value, sub }) => (
  <div className="card text-center">
    <p className="text-3xl font-bold text-gray-800">{value}</p>
    <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
)

const EvaluacionesDashboard = () => {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const canEdit   = ['admin','gerente'].includes(user?.rol)

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    evaluationsService.dashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-gray-400">Cargando dashboard...</div>
  if (!data)   return null

  const { stats, ranking, recientes } = data

  const distData = Object.entries(stats.distribuccion).map(([cat, count]) => ({
    cat, count, fill: catColors[cat]
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Evaluaciones</h1>
          <p className="text-sm text-gray-400 mt-0.5">Dashboard de desempeño de proveedores</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              <button onClick={() => navigate('/evaluaciones/criterios')}
                className="btn-secondary flex items-center gap-2 text-sm">
                <Cog6ToothIcon className="w-4 h-4" /> Criterios
              </button>
              <button onClick={() => navigate('/evaluaciones/nueva')}
                className="btn-primary flex items-center gap-2">
                <PlusIcon className="w-4 h-4" /> Nueva evaluación
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Proveedores activos"  value={stats.totalProveedores} />
        <StatCard label="Evaluaciones totales" value={stats.totalEvaluaciones} />
        <StatCard label="Score promedio"       value={`${stats.promedioScore}%`} />
        <StatCard label="Categoría A"          value={stats.distribuccion.A} sub="Proveedores excelentes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Distribución por categoría */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Distribución por categoría</h2>
          {distData.every(d => d.count === 0) ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin evaluaciones aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distData} barSize={36}>
                <XAxis dataKey="cat" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip formatter={(v) => [`${v} proveedores`, 'Cantidad']} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ranking top 5 */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Ranking de proveedores</h2>
          {!ranking?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos de score aún</p>
          ) : (
            <div className="space-y-2">
              {ranking.slice(0, 8).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3"
                  onClick={() => navigate(`/proveedores/${p.id}`)}
                  style={{ cursor: 'pointer' }}>
                  <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-800 truncate">{p.nombre}</span>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded`}
                          style={{ background: `${catColors[p.categoria]}20`, color: catColors[p.categoria] }}>
                          {p.categoria}
                        </span>
                        <span className="text-xs font-medium text-gray-600">{parseFloat(p.score_actual).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${p.score_actual}%`, background: catColors[p.categoria] }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimas evaluaciones */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">Evaluaciones recientes</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark text-white text-left">
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium text-center">Período</th>
              <th className="px-4 py-3 font-medium text-center">Score</th>
              <th className="px-4 py-3 font-medium text-center">Categoría</th>
            </tr>
          </thead>
          <tbody>
            {!recientes?.length ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin evaluaciones registradas</td></tr>
            ) : recientes.map((e, i) => (
              <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                <td className="px-4 py-3 font-medium text-gray-800">{e.proveedores?.nombre}</td>
                <td className="px-4 py-3 text-center font-mono text-gray-500">{e.periodo}</td>
                <td className="px-4 py-3 text-center font-bold text-gray-800">{parseFloat(e.score).toFixed(1)}%</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: `${catColors[e.categoria]}20`, color: catColors[e.categoria] }}>
                    {e.categoria}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EvaluacionesDashboard
