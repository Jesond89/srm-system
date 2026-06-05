import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { providersService } from '../../services/providers.service.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

const categoriaColors = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100  text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100   text-red-700',
}

const estadoColors = {
  borrador:    'bg-gray-100   text-gray-600',
  enviado:     'bg-blue-100   text-blue-600',
  confirmado:  'bg-indigo-100 text-indigo-600',
  en_transito: 'bg-yellow-100 text-yellow-600',
  recibido:    'bg-green-100  text-green-600',
  cancelado:   'bg-red-100    text-red-600',
}

const ProveedorPerfil = () => {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const canEdit   = ['admin','gerente','comprador'].includes(user?.rol)

  const [proveedor, setProveedor] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('info')

  useEffect(() => {
    providersService.obtener(id)
      .then(setProveedor)
      .catch(() => navigate('/proveedores'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>
  if (!proveedor) return null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/proveedores')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-gray-800">{proveedor.nombre}</h1>
              {proveedor.categoria && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoriaColors[proveedor.categoria]}`}>
                  Categoría {proveedor.categoria}
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${proveedor.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {proveedor.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-0.5">{proveedor.rfc}</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => navigate(`/proveedores/${id}/editar`)} className="btn-secondary flex items-center gap-2">
            <PencilSquareIcon className="w-4 h-4" />
            Editar
          </button>
        )}
      </div>

      {/* Score card */}
      {proveedor.score_actual > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Score actual',  value: proveedor.score_actual?.toFixed(1) || '—' },
            { label: 'Categoría',     value: proveedor.categoria || '—' },
            { label: 'Evaluaciones',  value: proveedor.evaluaciones?.length || 0 },
            { label: 'Órdenes',       value: proveedor.ordenes_compra?.length || 0 },
          ].map(c => (
            <div key={c.label} className="card text-center">
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-5">
        {['info', 'historial', 'evaluaciones'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {t === 'info' ? 'Información' : t === 'historial' ? 'Historial OCs' : 'Evaluaciones'}
          </button>
        ))}
      </div>

      {/* Tab: Información */}
      {tab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: 'Nombre',    value: proveedor.nombre },
            { label: 'RFC',       value: proveedor.rfc, mono: true },
            { label: 'Email',     value: proveedor.email || '—' },
            { label: 'Teléfono',  value: proveedor.telefono || '—' },
            { label: 'Dirección', value: proveedor.direccion || '—', full: true },
          ].map(f => (
            <div key={f.label} className={f.full ? 'sm:col-span-2' : ''}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{f.label}</p>
              <p className={`text-sm text-gray-800 mt-0.5 ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Historial OCs */}
      {tab === 'historial' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark text-white text-left">
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {!proveedor.evaluaciones?.length ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sin órdenes de compra</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Evaluaciones */}
      {tab === 'evaluaciones' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark text-white text-left">
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium text-center">Score</th>
                <th className="px-4 py-3 font-medium text-center">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {proveedor.evaluaciones?.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sin evaluaciones registradas</td></tr>
              ) : proveedor.evaluaciones?.map((e, i) => (
                <tr key={e.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-mono text-gray-600">{e.periodo}</td>
                  <td className="px-4 py-3 text-center font-medium">{e.score.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoriaColors[e.categoria]}`}>
                      {e.categoria}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ProveedorPerfil
