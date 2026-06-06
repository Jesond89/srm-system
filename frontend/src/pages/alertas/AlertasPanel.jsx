import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertsService } from '../../services/alerts.service.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Cog6ToothIcon, BoltIcon } from '@heroicons/react/24/outline'

const sevColors = {
  baja:    { bg: 'bg-gray-100',   text: 'text-gray-600',   bar: 'bg-gray-400'   },
  media:   { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-400' },
  alta:    { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-400' },
  critica: { bg: 'bg-red-100',    text: 'text-red-700',    bar: 'bg-red-500'    },
}

const AlertasPanel = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canManage = ['admin', 'gerente'].includes(user?.rol)

  const [alertas,   setAlertas]   = useState([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [filtro,    setFiltro]    = useState('no_atendidas')
  const [severidad, setSeveridad] = useState('')
  const [page,      setPage]      = useState(1)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, severidad: severidad || undefined }
      if (filtro === 'no_atendidas') params.atendida = false
      if (filtro === 'no_leidas')    params.leida    = false
      if (filtro === 'atendidas')    params.atendida = true

      const res = await alertsService.listar(params)
      setAlertas(res.data || [])
      setTotal(res.total || 0)
    } catch { setAlertas([]) }
    finally  { setLoading(false) }
  }, [filtro, severidad, page])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { setPage(1) }, [filtro, severidad])

  const handleLeer = async (id, e) => {
    e.stopPropagation()
    await alertsService.marcarLeida(id)
    cargar()
  }

  const handleAtender = async (id, e) => {
    e.stopPropagation()
    await alertsService.marcarAtendida(id)
    cargar()
  }

  const handleEjecutarMotor = async () => {
    const r = await alertsService.ejecutarMotor()
    alert(`Motor ejecutado: ${r.alertasCreadas} alerta(s) generada(s)`)
    cargar()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Alertas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} alerta{total !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={handleEjecutarMotor}
              className="btn-secondary flex items-center gap-2 text-sm">
              <BoltIcon className="w-4 h-4" /> Ejecutar motor
            </button>
            <button onClick={() => navigate('/alertas/reglas')}
              className="btn-secondary flex items-center gap-2 text-sm">
              <Cog6ToothIcon className="w-4 h-4" /> Reglas
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
          {[
            { k: 'no_atendidas', label: 'Pendientes' },
            { k: 'no_leidas',    label: 'No leídas' },
            { k: 'atendidas',    label: 'Atendidas' },
            { k: 'todas',        label: 'Todas' },
          ].map(f => (
            <button key={f.k} onClick={() => setFiltro(f.k)}
              className={`px-4 py-2 transition-colors ${filtro === f.k ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={severidad} onChange={e => setSeveridad(e.target.value)}
          className="input-field w-40 text-sm">
          <option value="">Severidad</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Cargando...</div>
        ) : alertas.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            No hay alertas con los filtros seleccionados
          </div>
        ) : alertas.map(a => {
          const sev = sevColors[a.severidad] || sevColors.media
          return (
            <div key={a.id}
              className={`bg-white rounded-xl border border-gray-200 p-4 flex gap-4 items-start ${!a.leida ? 'border-l-4 border-l-primary' : ''}`}>
              {/* Barra de severidad */}
              <div className={`w-1.5 rounded-full self-stretch min-h-[40px] ${sev.bar}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                      {a.severidad}
                    </span>
                    {a.reglas_alerta && (
                      <span className="text-xs text-gray-400 ml-2">{a.reglas_alerta.nombre}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(a.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                <p className="text-sm text-gray-800 mt-1.5 font-medium">{a.mensaje}</p>

                <div className="flex items-center gap-3 mt-2">
                  {a.proveedores && (
                    <span className="text-xs text-gray-400">📋 {a.proveedores.nombre}</span>
                  )}
                  {a.ordenes_compra && (
                    <span className="text-xs text-gray-400">🧾 {a.ordenes_compra.folio}</span>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {!a.leida && (
                      <button onClick={e => handleLeer(a.id, e)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Marcar leída
                      </button>
                    )}
                    {!a.atendida && canManage && (
                      <button onClick={e => handleAtender(a.id, e)}
                        className="text-xs text-green-600 hover:text-green-800 font-medium">
                        Marcar atendida
                      </button>
                    )}
                    {a.atendida && (
                      <span className="text-xs text-green-600 font-medium">✓ Atendida</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Paginación */}
      {total > 20 && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>Página {page} de {Math.ceil(total/20)}</span>
          <div className="flex gap-2">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Anterior</button>
            <button disabled={page>=Math.ceil(total/20)} onClick={() => setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlertasPanel
