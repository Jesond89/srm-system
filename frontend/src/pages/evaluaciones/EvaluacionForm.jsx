import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { evaluationsService } from '../../services/evaluations.service.js'
import { providersService }   from '../../services/providers.service.js'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const EvaluacionForm = () => {
  const navigate = useNavigate()

  const [proveedores, setProveedores] = useState([])
  const [criterios,   setCriterios]   = useState([])
  const [proveedorId, setProveedorId] = useState('')
  const [periodo,     setPeriodo]     = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [scores,  setScores]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    providersService.listar({ activo: true, limit: 100 }).then(r => setProveedores(r.data || []))
    evaluationsService.criterios().then(list => {
      setCriterios(list.filter(c => c.activo))
      const init = {}
      list.filter(c => c.activo).forEach(c => { init[c.id] = 50 })
      setScores(init)
    })
  }, [])

  const scoreTotal = criterios.reduce((sum, c) => {
    return sum + ((parseFloat(scores[c.id]) || 0) * c.peso / 100)
  }, 0)

  const categoria = scoreTotal >= 80 ? 'A' : scoreTotal >= 60 ? 'B' : scoreTotal >= 40 ? 'C' : 'D'
  const catColors = { A: 'text-green-600', B: 'text-blue-600', C: 'text-yellow-600', D: 'text-red-600' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await evaluationsService.calcular({ proveedor_id: proveedorId, periodo, scores })
      navigate('/evaluaciones')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar evaluación')
    } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/evaluaciones')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Nueva evaluación</h1>
          <p className="text-sm text-gray-400">Score ponderado por criterios activos</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3 mb-5">{error}</div>
      )}

      {criterios.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-500 mb-3">No hay criterios de evaluación activos.</p>
          <button onClick={() => navigate('/evaluaciones/criterios')} className="btn-primary text-sm">
            Configurar criterios
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <select value={proveedorId} onChange={e => setProveedorId(e.target.value)}
                className="input-field" required>
                <option value="">Selecciona un proveedor</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre} — {p.rfc}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período <span className="text-red-500">*</span>
              </label>
              <input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)}
                className="input-field" required />
            </div>
          </div>

          {/* Criterios con sliders */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-700 text-sm mb-4">Calificación por criterio</h2>
            <div className="space-y-5">
              {criterios.map(c => (
                <div key={c.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{c.nombre}</span>
                      <span className="text-xs text-gray-400 ml-2">Peso: {c.peso}%</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800 w-10 text-right">
                      {scores[c.id] || 0}
                    </span>
                  </div>
                  <input type="range" min="0" max="100" step="1"
                    value={scores[c.id] || 0}
                    onChange={e => setScores(prev => ({ ...prev, [c.id]: parseInt(e.target.value) }))}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                    <span>0</span><span>50</span><span>100</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Score calculado */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Score calculado</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-800">{scoreTotal.toFixed(1)}%</span>
                <span className={`ml-2 text-lg font-bold ${catColors[categoria]}`}>
                  → {categoria}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving || !proveedorId} className="btn-primary">
              {saving ? 'Guardando...' : 'Registrar evaluación'}
            </button>
            <button type="button" onClick={() => navigate('/evaluaciones')} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default EvaluacionForm
