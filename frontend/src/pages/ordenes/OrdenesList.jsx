import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersService } from '../../services/orders.service.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'

const estadoColors = {
  borrador:    'bg-gray-100   text-gray-600',
  enviado:     'bg-blue-100   text-blue-600',
  confirmado:  'bg-indigo-100 text-indigo-600',
  en_transito: 'bg-yellow-100 text-yellow-700',
  recibido:    'bg-green-100  text-green-700',
  cancelado:   'bg-red-100    text-red-600',
}

const estadoLabel = {
  borrador: 'Borrador', enviado: 'Enviado', confirmado: 'Confirmado',
  en_transito: 'En tránsito', recibido: 'Recibido', cancelado: 'Cancelado',
}

const OrdenesList = () => {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const canCreate = ['admin','gerente','comprador'].includes(user?.rol)

  const [ordenes,  setOrdenes]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [estado,   setEstado]   = useState('')
  const [page,     setPage]     = useState(1)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ordersService.listar({ estado, page, limit: 15 })
      setOrdenes(res.data || [])
      setTotal(res.total || 0)
    } catch { setOrdenes([]) }
    finally  { setLoading(false) }
  }, [estado, page])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { setPage(1) }, [estado])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Órdenes de compra</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} orden{total !== 1 ? 'es' : ''}</p>
        </div>
        {canCreate && (
          <button onClick={() => navigate('/ordenes/nueva')} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Nueva orden
          </button>
        )}
      </div>

      {/* Filtro estado */}
      <div className="flex gap-3 mb-5">
        <div className="relative">
          <FunnelIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <select value={estado} onChange={e => setEstado(e.target.value)}
            className="input-field pl-9 pr-8 w-48">
            <option value="">Todos los estados</option>
            {Object.entries(estadoLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark text-white text-left">
              <th className="px-4 py-3 font-medium">Folio</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Creada por</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : ordenes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                {estado ? 'Sin órdenes con ese estado.' : 'Aún no hay órdenes registradas.'}
              </td></tr>
            ) : ordenes.map((o, i) => (
              <tr key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <td className="px-4 py-3 font-mono font-medium text-gray-800">{o.folio}</td>
                <td className="px-4 py-3 text-gray-700">{o.proveedores?.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{o.usuarios?.nombre}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColors[o.estado]}`}>
                    {estadoLabel[o.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(o.created_at).toLocaleDateString('es-MX')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {page} de {Math.ceil(total/15)}</span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button disabled={page>=Math.ceil(total/15)} onClick={() => setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdenesList
