import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { evaluationsService } from '../../services/evaluations.service.js'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'

const CriteriosConfig = () => {
  const navigate = useNavigate()
  const [criterios, setCriterios] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [form,      setForm]      = useState({ nombre: '', descripcion: '', peso: '' })
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const cargar = () => {
    setLoading(true)
    evaluationsService.criterios().then(setCriterios).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const sumaActivos = criterios.filter(c => c.activo).reduce((s, c) => s + parseFloat(c.peso), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await evaluationsService.crearCriterio(form)
      setForm({ nombre: '', descripcion: '', peso: '' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear criterio')
    } finally { setSaving(false) }
  }

  const toggleActivo = async (c) => {
    try {
      await evaluationsService.editarCriterio(c.id, { activo: !c.activo })
      cargar()
    } catch (err) {
      alert(err.response?.data?.error || 'Error')
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/evaluaciones')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Criterios de evaluación</h1>
          <p className="text-sm text-gray-400">
            Suma actual de pesos activos:
            <span className={`ml-1 font-bold ${sumaActivos === 100 ? 'text-green-600' : sumaActivos > 100 ? 'text-red-600' : 'text-yellow-600'}`}>
              {sumaActivos.toFixed(1)}%
            </span>
            {sumaActivos === 100 && ' ✓'}
          </p>
        </div>
      </div>

      {/* Lista de criterios */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark text-white text-left">
              <th className="px-4 py-3 font-medium">Criterio</th>
              <th className="px-4 py-3 font-medium text-center">Peso</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : criterios.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sin criterios aún</td></tr>
            ) : criterios.map((c, i) => (
              <tr key={c.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{c.nombre}</p>
                  {c.descripcion && <p className="text-xs text-gray-400">{c.descripcion}</p>}
                </td>
                <td className="px-4 py-3 text-center font-bold text-gray-700">{c.peso}%</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActivo(c)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      c.activo
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario nuevo criterio */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Agregar criterio
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="input-field" placeholder="Nombre del criterio" required />
            </div>
            <div>
              <input type="number" min="1" max="100" step="0.5"
                value={form.peso} onChange={e => setForm(p => ({ ...p, peso: e.target.value }))}
                className="input-field" placeholder="Peso %" required />
            </div>
          </div>
          <input value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            className="input-field" placeholder="Descripción (opcional)" />
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Guardando...' : 'Agregar criterio'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CriteriosConfig
