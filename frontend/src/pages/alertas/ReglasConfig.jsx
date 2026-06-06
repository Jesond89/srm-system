import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertsService } from '../../services/alerts.service.js'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'

const tiposRegla = [
  { value: 'score_bajo',         label: 'Score bajo',          desc: 'Score menor al umbral definido' },
  { value: 'score_critico',      label: 'Score crítico',       desc: 'Score en zona de riesgo (muy bajo)' },
  { value: 'oc_pendiente',       label: 'OC pendiente',        desc: 'Orden enviada sin confirmar en X horas' },
  { value: 'proveedor_inactivo', label: 'Proveedor inactivo',  desc: 'Proveedor marcado como inactivo' },
]

const sevColors = {
  baja: 'bg-gray-100 text-gray-600', media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700', critica: 'bg-red-100 text-red-700'
}

const ReglasConfig = () => {
  const navigate = useNavigate()
  const [reglas,  setReglas]  = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState({ nombre: '', tipo: 'score_bajo', severidad: 'media', valor: 60 })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const cargar = () => {
    setLoading(true)
    alertsService.reglas().then(setReglas).finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      let condicion = {}
      if (form.tipo === 'score_bajo' || form.tipo === 'score_critico') condicion = { valor: parseFloat(form.valor) }
      if (form.tipo === 'oc_pendiente') condicion = { horas: parseFloat(form.valor) }

      await alertsService.crearRegla({ nombre: form.nombre, tipo: form.tipo, severidad: form.severidad, condicion })
      setForm({ nombre: '', tipo: 'score_bajo', severidad: 'media', valor: 60 })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear regla')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/alertas')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold font-heading text-gray-800">Reglas de alerta</h1>
      </div>

      {/* Lista reglas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark text-white text-left">
              <th className="px-4 py-3 font-medium">Regla</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium text-center">Severidad</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : reglas.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Sin reglas configuradas</td></tr>
            ) : reglas.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                <td className="px-4 py-3 font-medium text-gray-800">{r.nombre}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{tiposRegla.find(t=>t.value===r.tipo)?.label || r.tipo}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sevColors[r.severidad]}`}>
                    {r.severidad}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => alertsService.toggleRegla(r.id, !r.activa).then(cargar)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      r.activa ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>
                    {r.activa ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nueva regla */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Nueva regla
        </h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.nombre} onChange={e => setForm(p=>({...p, nombre: e.target.value}))}
            className="input-field" placeholder="Nombre de la regla" required />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.tipo} onChange={e => setForm(p=>({...p, tipo: e.target.value}))}
              className="input-field">
              {tiposRegla.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={form.severidad} onChange={e => setForm(p=>({...p, severidad: e.target.value}))}
              className="input-field">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              {form.tipo === 'oc_pendiente' ? 'Horas sin confirmación' : 'Umbral de score (%)'}
            </label>
            <input type="number" min="1" max="100"
              value={form.valor} onChange={e => setForm(p=>({...p, valor: e.target.value}))}
              className="input-field w-32" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Guardando...' : 'Crear regla'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ReglasConfig
