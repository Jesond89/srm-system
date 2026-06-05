import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersService } from '../../services/orders.service.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

const estadoColors = {
  borrador:'bg-gray-100 text-gray-600', enviado:'bg-blue-100 text-blue-600',
  confirmado:'bg-indigo-100 text-indigo-600', en_transito:'bg-yellow-100 text-yellow-700',
  recibido:'bg-green-100 text-green-700', cancelado:'bg-red-100 text-red-600',
}
const estadoLabel = {
  borrador:'Borrador', enviado:'Enviado', confirmado:'Confirmado',
  en_transito:'En tránsito', recibido:'Recibido', cancelado:'Cancelado',
}
const TRANSICIONES = {
  borrador:['enviado','cancelado'], enviado:['confirmado','cancelado'],
  confirmado:['en_transito','cancelado'], en_transito:['recibido'],
  recibido:[], cancelado:[],
}

const OrdenDetalle = () => {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [orden,    setOrden]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [changing, setChanging] = useState(false)
  const [notas,    setNotas]    = useState('')

  const cargar = () => {
    setLoading(true)
    ordersService.obtener(id)
      .then(setOrden)
      .catch(() => navigate('/ordenes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [id])

  const handleEstado = async (nuevoEstado) => {
    setChanging(true)
    try {
      const updated = await ordersService.cambiarEstado(id, nuevoEstado, notas)
      setOrden(updated)
      setNotas('')
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar estado')
    } finally { setChanging(false) }
  }

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>
  if (!orden)  return null

  const total = orden.productos_oc?.reduce((s, p) => s + parseFloat(p.subtotal || 0), 0) || 0
  const siguientes = TRANSICIONES[orden.estado] || []

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ordenes')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-gray-800">{orden.folio}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColors[orden.estado]}`}>
                {estadoLabel[orden.estado]}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {orden.proveedores?.nombre} · Creada por {orden.usuarios?.nombre} · {new Date(orden.created_at).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700 text-sm">Productos</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
                  <th className="px-5 py-2 font-medium">Producto</th>
                  <th className="px-5 py-2 font-medium text-center">Cant.</th>
                  <th className="px-5 py-2 font-medium text-right">P. Unit.</th>
                  <th className="px-5 py-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {orden.productos_oc?.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                    <td className="px-5 py-2.5">
                      <span className="font-medium text-gray-800">{p.nombre}</span>
                      <span className="text-gray-400 text-xs ml-1">/ {p.unidad}</span>
                    </td>
                    <td className="px-5 py-2.5 text-center text-gray-600">{p.cantidad}</td>
                    <td className="px-5 py-2.5 text-right text-gray-600">${parseFloat(p.precio_unitario).toFixed(2)}</td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-800">${parseFloat(p.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100">
                  <td colSpan={3} className="px-5 py-3 text-right font-semibold text-gray-600">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Historial de estados */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Historial de estados</h2>
            {orden.historial_estados_oc?.length === 0 ? (
              <p className="text-sm text-gray-400">Sin cambios de estado aún.</p>
            ) : (
              <div className="space-y-2">
                {orden.historial_estados_oc?.map(h => (
                  <div key={h.id} className="flex items-center gap-2 text-sm">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColors[h.estado_anterior] || 'bg-gray-100 text-gray-500'}`}>
                      {estadoLabel[h.estado_anterior] || '—'}
                    </span>
                    <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColors[h.estado_nuevo]}`}>
                      {estadoLabel[h.estado_nuevo]}
                    </span>
                    <span className="text-gray-400 text-xs">· {h.usuarios?.nombre} · {new Date(h.created_at).toLocaleDateString('es-MX')}</span>
                    {h.notas && <span className="text-gray-400 text-xs italic">"{h.notas}"</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral: cambiar estado */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Proveedor</h2>
            <p className="font-medium text-gray-800">{orden.proveedores?.nombre}</p>
            <p className="font-mono text-xs text-gray-400">{orden.proveedores?.rfc}</p>
            {orden.proveedores?.email && <p className="text-xs text-gray-500 mt-1">{orden.proveedores.email}</p>}
          </div>

          {siguientes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-700 text-sm mb-3">Cambiar estado</h2>
              <textarea value={notas} onChange={e => setNotas(e.target.value)}
                className="input-field text-sm resize-none mb-3" rows={2}
                placeholder="Notas del cambio (opcional)" />
              <div className="space-y-2">
                {siguientes.map(s => (
                  <button key={s} disabled={changing} onClick={() => handleEstado(s)}
                    className={`w-full text-sm font-medium py-2 rounded-lg transition-colors ${
                      s === 'cancelado'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'btn-primary'
                    }`}>
                    {changing ? '...' : `→ ${estadoLabel[s]}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {orden.notas && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-700 text-sm mb-1">Notas</h2>
              <p className="text-sm text-gray-600">{orden.notas}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrdenDetalle
