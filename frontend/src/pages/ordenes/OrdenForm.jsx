import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersService } from '../../services/orders.service.js'
import { providersService } from '../../services/providers.service.js'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

const emptyProducto = { nombre: '', unidad: 'pieza', cantidad: 1, precio_unitario: '' }

const OrdenForm = () => {
  const navigate = useNavigate()

  const [proveedores,   setProveedores]   = useState([])
  const [proveedor_id,  setProveedorId]   = useState('')
  const [notas,         setNotas]         = useState('')
  const [productos,     setProductos]     = useState([{ ...emptyProducto }])
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')

  useEffect(() => {
    providersService.listar({ activo: true, limit: 100 })
      .then(r => setProveedores(r.data || []))
  }, [])

  const updateProducto = (i, field, value) =>
    setProductos(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))

  const addProducto = () => setProductos(prev => [...prev, { ...emptyProducto }])

  const removeProducto = (i) =>
    setProductos(prev => prev.filter((_, idx) => idx !== i))

  const total = productos.reduce((sum, p) => {
    const sub = (parseFloat(p.precio_unitario) || 0) * (parseInt(p.cantidad) || 0)
    return sum + sub
  }, 0)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const invalidos = productos.filter(p => !p.nombre.trim() || !p.precio_unitario || p.cantidad < 1)
    if (invalidos.length) return setError('Completa todos los campos de los productos')
    setSaving(true)
    try {
      await ordersService.crear({ proveedor_id, notas, productos })
      navigate('/ordenes')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la orden')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/ordenes')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Nueva orden de compra</h1>
          <p className="text-sm text-gray-400">El folio se genera automáticamente</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-5">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Proveedor y notas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Información general</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <select value={proveedor_id} onChange={e => setProveedorId(e.target.value)}
              className="input-field" required>
              <option value="">Selecciona un proveedor</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} — {p.rfc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas u observaciones</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)}
              className="input-field resize-none" rows={2}
              placeholder="Instrucciones especiales, términos de entrega, etc." />
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Productos</h2>
            <button type="button" onClick={addProducto}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium">
              <PlusIcon className="w-4 h-4" /> Agregar producto
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
              <span className="col-span-4">Nombre</span>
              <span className="col-span-2">Unidad</span>
              <span className="col-span-2 text-center">Cantidad</span>
              <span className="col-span-2 text-right">Precio unit.</span>
              <span className="col-span-2 text-right">Subtotal</span>
            </div>

            {productos.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input value={p.nombre} onChange={e => updateProducto(i, 'nombre', e.target.value)}
                  className="input-field col-span-4 text-sm" placeholder="Nombre del producto" required />
                <select value={p.unidad} onChange={e => updateProducto(i, 'unidad', e.target.value)}
                  className="input-field col-span-2 text-sm">
                  {['pieza','kg','litro','caja','metro','servicio'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="number" min="1" value={p.cantidad} onChange={e => updateProducto(i, 'cantidad', e.target.value)}
                  className="input-field col-span-2 text-sm text-center" required />
                <input type="number" min="0" step="0.01" value={p.precio_unitario}
                  onChange={e => updateProducto(i, 'precio_unitario', e.target.value)}
                  className="input-field col-span-2 text-sm text-right" placeholder="0.00" required />
                <div className="col-span-1 text-right text-sm font-medium text-gray-700">
                  ${((parseFloat(p.precio_unitario)||0)*(parseInt(p.cantidad)||0)).toFixed(2)}
                </div>
                <button type="button" onClick={() => removeProducto(i)}
                  disabled={productos.length === 1}
                  className="text-gray-300 hover:text-red-400 disabled:opacity-20 col-span-1 flex justify-center">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Total */}
            <div className="border-t border-gray-100 pt-3 flex justify-end gap-4 text-sm">
              <span className="text-gray-500">Total estimado:</span>
              <span className="font-bold text-gray-800">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Creando orden...' : 'Crear orden de compra'}
          </button>
          <button type="button" onClick={() => navigate('/ordenes')} className="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  )
}

export default OrdenForm
