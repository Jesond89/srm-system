import { useState, useEffect, useCallback, useRef } from 'react'
import { alertsService } from '../../services/alerts.service.js'

const SEVERIDAD_STYLES = {
  critica: { bg: 'bg-red-600',    border: 'border-red-700',    icon: '🚨', label: 'Crítica' },
  alta:    { bg: 'bg-orange-500', border: 'border-orange-600', icon: '⚠️', label: 'Alta' },
  media:   { bg: 'bg-yellow-500', border: 'border-yellow-600', icon: '🔔', label: 'Media' },
  baja:    { bg: 'bg-blue-500',   border: 'border-blue-600',   icon: 'ℹ️', label: 'Baja' },
}

const Toast = ({ alerta, onDismiss }) => {
  const style = SEVERIDAD_STYLES[alerta.severidad] || SEVERIDAD_STYLES.baja

  useEffect(() => {
    const t = setTimeout(() => onDismiss(alerta.id), alerta.severidad === 'critica' ? 8000 : 5000)
    return () => clearTimeout(t)
  }, [alerta.id, alerta.severidad, onDismiss])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-white w-80 border ${style.bg} ${style.border}`}>
      <span className="text-lg mt-0.5 flex-shrink-0">{style.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80 mb-0.5">{style.label}</p>
        <p className="text-sm leading-snug">{alerta.mensaje}</p>
      </div>
      <button
        onClick={() => onDismiss(alerta.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity mt-0.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const AlertToastContainer = () => {
  const [toasts, setToasts] = useState([])
  const seenIds             = useRef(new Set())
  const POLL_INTERVAL       = 30_000

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const fetchAlertas = useCallback(async () => {
    try {
      const data   = await alertsService.listar({ leida: false, limit: 5 })
      const lista  = data.data || []
      const nuevas = lista.filter(a => !seenIds.current.has(a.id))
      if (nuevas.length) {
        nuevas.forEach(a => seenIds.current.add(a.id))
        setToasts(prev => [...prev, ...nuevas].slice(-4))
      }
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    fetchAlertas()
    const interval = setInterval(fetchAlertas, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchAlertas])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
      {toasts.map(a => (
        <Toast key={a.id} alerta={a} onDismiss={dismiss} />
      ))}
    </div>
  )
}

export default AlertToastContainer
