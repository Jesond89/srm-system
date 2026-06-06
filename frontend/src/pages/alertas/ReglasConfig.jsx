import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertsService } from '../../services/alerts.service.js'
import { ArrowLeftIcon, PlusIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const tiposRegla = [
  { value: 'score_bajo',         label: 'Score bajo',         desc: 'Score menor al umbral (%)' },
  { value: 'score_critico',      label: 'Score crítico',      desc: 'Score en zona crítica (%)' },
  { value: 'oc_pendiente',       label: 'OC pendiente',       desc: 'OC sin confirmar en X horas' },
  { value: 'proveedor_inactivo', label: 'Proveedor inactivo', desc: 'Proveedor marcado inactivo' },
]

const sevColors = {
  baja: 'bg-gray-100 text-gray-600', media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700', critica: 'bg-red-100 text-red-700'
}

const ReglasConfig = () => {
  const navigate = useNavigate()
  const [reglas,    setReglas]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [editId,    setEditId]    = useState(null)
  const [editForm,  setEditForm]  = useState({})
  const [form,      setForm]      = useState({ nombre: '', tipo: 'score_bajo', severidad: 'media', valor: 60 })
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const cargar = () => {
    setLoading(true)
    alertsService.reglas().then(setReglas).finally(() => setLoading(false))
  }
  useEffect(() => { cargar() }, [])

  // Iniciar edición de una regla
  const startEdit = (r) => {
    setEditId(r.id)
    setEditForm({
      nombre:    r.nombre,
      severidad: r.severidad,
      valor:     r.condicion?.valor || r.condicion?.horas || 60,
    })
  }

  const saveEdit = async (r) => {
    try {
      let condicion = {}
      if (r.tipo === 'oc_pendiente') condicion = { horas: parseFloat(editForm.valor) }
      else condicion = { valor: parseFloat(editForm.valor) }
      await alertsService.updateRegla(r.id, { nombre: editForm.nombre, severidad: editForm.severidad, condicion })
      setEditId(null)
      cargar()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  const toggleActiva = async (r) => {
    await alertsService.updateRegla(r.id, { activa: !r.activa })
    cargar()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      let condicion = {}
      if (form.tipo === 'oc_pendiente') condicion = { horas: parseFloat(form.valor) }
      else condicion = { valor: parseFloat(form.valor) }
      await alertsService.crearRegla({ nombre: form.nombre, tipo: form.tipo, severidad: form.severidad, condicion })
      setForm({ nombre: '', tipo: 'score_bajo', severidad: 'media', valor: 60 })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear regla')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/alertas')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold font-heading text-gray-800">Reglas de alerta</h1>
      </div>

      {/* Tabla de reglas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark text-white text-left">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium text-center">Umbral</th>
              <th className="px-4 py-3 font-medium text-center">Severidad</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
              <th className="px-4 py-3 font-medium text-center">Editar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Cargando...</td></tr>
            ) : reglas.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sin reglas configuradas</td></tr>
            ) : reglas.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                {editId === r.id ? (
                  // Fila en modo edición
                  <>
                    <td className="px-3 py-2">
                      <input value={editForm.nombre} onChange={e => setEditForm(p=>({...p, nombre: e.target.value}))}
                        className="input-field text-xs py-1" />
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-xs">
                      {tiposRegla.find(t=>t.value===r.tipo)?.label}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="number" value={editForm.valor}
                        onChange={e => setEditForm(p=>({...p, valor: e.target.value}))}
                        className="input-field text-xs py-1 w-16 text-center" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select value={editForm.severidad}
                        onChange={e => setEditForm(p=>({...p, severidad: e.target.value}))}
                        className="input-field text-xs py-1">
                        {['baja','media','alta','critica'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-400 text-xs">—</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => saveEdit(r)} className="text-green-600 hover:text-green-800">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Fila normal
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{tiposRegla.find(t=>t.value===r.tipo)?.label || r.tipo}</td>
                    <td className="px-4 py-3 text-center text-gray-600 font-mono text-xs">
                      {r.condicion?.valor || r.condicion?.horas || '—'}
                      {r.tipo === 'oc_pendiente' ? 'h' : '%'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sevColors[r.severidad]}`}>
                        {r.severidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActiva(r)}
                        className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                          r.activa ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {r.activa ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-primary">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </>
                )}
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
          <div className="grid grid-cols-3 gap-3">
            <select value={form.tipo} onChange={e => setForm(p=>({...p, tipo: e.target.value}))}
              className="input-field col-span-1">
              {tiposRegla.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={form.severidad} onChange={e => setForm(p=>({...p, severidad: e.target.value}))}
              className="input-field">
              {['baja','media','alta','critica'].map(s => <option key={s}>{s}</option>)}
            </select>
            <div>
              <input type="number" min="1" max="100" value={form.valor}
                onChange={e => setForm(p=>({...p, valor: e.target.value}))}
                className="input-field" placeholder={form.tipo === 'oc_pendiente' ? 'Horas' : 'Umbral %'} required />
            </div>
          </div>
          <p className="text-xs text-gray-400">{tiposRegla.find(t=>t.value===form.tipo)?.desc}</p>
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Guardando...' : 'Crear regla'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ReglasConfig
