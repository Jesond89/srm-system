import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { providersService } from '../../services/providers.service.js'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const ProveedorForm = () => {
  const { id }     = useParams()   // si hay id → modo edición
  const navigate   = useNavigate()
  const isEdit     = Boolean(id)

  const [form, setForm] = useState({
    nombre: '', rfc: '', email: '', telefono: '', direccion: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  // Cargar datos si es edición
  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    providersService.obtener(id)
      .then(p => setForm({
        nombre:    p.nombre    || '',
        rfc:       p.rfc       || '',
        email:     p.email     || '',
        telefono:  p.telefono  || '',
        direccion: p.direccion || '',
      }))
      .catch(() => setError('No se pudo cargar el proveedor'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await providersService.actualizar(id, form)
      } else {
        await providersService.crear(form)
      }
      navigate('/proveedores')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el proveedor')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/proveedores')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h1>
          <p className="text-sm text-gray-400">{isEdit ? `RFC: ${form.rfc}` : 'Completa los datos del proveedor'}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la empresa <span className="text-red-500">*</span>
            </label>
            <input
              name="nombre" value={form.nombre} onChange={handleChange}
              className="input-field" placeholder="Ej. Comercializadora Ejemplo S.A. de C.V."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RFC <span className="text-red-500">*</span>
            </label>
            <input
              name="rfc" value={form.rfc} onChange={e => handleChange({ target: { name: 'rfc', value: e.target.value.toUpperCase() } })}
              className="input-field font-mono" placeholder="Ej. EJE900101ABC"
              disabled={isEdit}
              required
            />
            {isEdit && <p className="text-xs text-gray-400 mt-1">El RFC no se puede modificar</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              name="telefono" value={form.telefono} onChange={handleChange}
              className="input-field" placeholder="Ej. 744 123 4567"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              className="input-field" placeholder="contacto@proveedor.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <textarea
              name="direccion" value={form.direccion} onChange={handleChange}
              className="input-field resize-none" rows={3}
              placeholder="Calle, número, colonia, ciudad, estado"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar proveedor'}
          </button>
          <button type="button" onClick={() => navigate('/proveedores')} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProveedorForm
