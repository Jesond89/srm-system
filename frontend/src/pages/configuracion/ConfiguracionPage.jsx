import { useState, useEffect } from 'react'
import {
  Cog6ToothIcon,
  BuildingOffice2Icon,
  TagIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import api from '../../services/api.js'

const STORAGE_KEY = 'srm_config'

const defaultConfig = {
  empresa:   { nombre: 'Mi Empresa S.A. de C.V.', industria: 'Manufactura', descripcion: '' },
  umbrales:  { scoreMinimo: 60, scoreExcelente: 85 },
}

const loadConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig
  } catch { return defaultConfig }
}

const saveConfig = (cfg) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'empresa',     label: 'Empresa',     icon: BuildingOffice2Icon },
  { id: 'categorias',  label: 'Categorías',  icon: TagIcon             },
  { id: 'seguridad',   label: 'Seguridad',   icon: ShieldCheckIcon     },
]

// ── Sección: Empresa ──────────────────────────────────────────────────────────
const TabEmpresa = ({ config, onChange }) => {
  const [saved, setSaved] = useState(false)
  const [form, setForm]   = useState(config.empresa)

  const handle = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = () => {
    onChange({ ...config, empresa: form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <label className="label-field">Nombre de la empresa</label>
        <input className="input-field" value={form.nombre} onChange={handle('nombre')} />
      </div>
      <div>
        <label className="label-field">Industria / Sector</label>
        <input className="input-field" value={form.industria} onChange={handle('industria')} />
      </div>
      <div>
        <label className="label-field">Descripción (opcional)</label>
        <textarea
          className="input-field resize-none"
          rows={3}
          value={form.descripcion}
          onChange={handle('descripcion')}
          placeholder="Breve descripción de la empresa…"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Umbrales de evaluación</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Score mínimo aceptable</label>
            <input
              type="number" min={0} max={100}
              className="input-field"
              value={config.umbrales.scoreMinimo}
              onChange={e => onChange({
                ...config,
                umbrales: { ...config.umbrales, scoreMinimo: Number(e.target.value) }
              })}
            />
            <p className="text-xs text-gray-400 mt-1">Proveedores bajo este valor generan alerta</p>
          </div>
          <div>
            <label className="label-field">Score excelente</label>
            <input
              type="number" min={0} max={100}
              className="input-field"
              value={config.umbrales.scoreExcelente}
              onChange={e => onChange({
                ...config,
                umbrales: { ...config.umbrales, scoreExcelente: Number(e.target.value) }
              })}
            />
            <p className="text-xs text-gray-400 mt-1">Referencia de desempeño óptimo</p>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary flex items-center gap-2">
        {saved
          ? <><CheckCircleIcon className="w-4 h-4" /> Guardado</>
          : 'Guardar cambios'
        }
      </button>
    </div>
  )
}

// ── Sección: Categorías ───────────────────────────────────────────────────────
const TabCategorias = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading]       = useState(true)
  const [nueva, setNueva]           = useState('')

  useEffect(() => {
    api.get('/proveedores?limit=200').then(r => {
      const cats = [...new Set(
        (r.data.data || r.data)
          .map(p => p.categoria)
          .filter(Boolean)
      )].sort()
      setCategorias(cats)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const agregar = () => {
    const val = nueva.trim()
    if (!val || categorias.includes(val)) return
    setCategorias(p => [...p, val].sort())
    setNueva('')
  }

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-gray-500">
        Categorías usadas actualmente en el sistema. Para asignar una categoría, edita el perfil del proveedor.
      </p>

      <div className="flex flex-wrap gap-2">
        {categorias.length === 0 && (
          <span className="text-sm text-gray-300">Sin categorías registradas</span>
        )}
        {categorias.map(cat => (
          <span key={cat} className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
            {cat}
          </span>
        ))}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Vista previa de nueva categoría</h3>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Ej: Logística"
            value={nueva}
            onChange={e => setNueva(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregar()}
          />
          <button onClick={agregar} className="btn-primary px-4">Agregar</button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Se aplica al crear o editar un proveedor en el campo "Categoría".
        </p>
      </div>
    </div>
  )
}

// ── Sección: Seguridad ────────────────────────────────────────────────────────
const TabSeguridad = () => {
  const items = [
    { ok: true,  label: 'A01 – Broken Access Control',        desc: 'RBAC implementado por rol: admin, gerente, comprador, analista' },
    { ok: true,  label: 'A02 – Cryptographic Failures',       desc: 'Contraseñas hasheadas con bcrypt (12 rondas). JWT con expiración 8h' },
    { ok: true,  label: 'A03 – Injection',                    desc: 'Supabase usa queries parametrizadas. Inputs sanitizados en middleware' },
    { ok: true,  label: 'A04 – Insecure Design',              desc: 'Rate limiting: login (10/15min), chatbot (20/min), API global (500/15min)' },
    { ok: true,  label: 'A05 – Security Misconfiguration',    desc: 'Helmet headers, CORS restrictivo, body limit 1 MB' },
    { ok: true,  label: 'A06 – Vulnerable Components',        desc: 'Dependencias actualizadas: Express 4.18, bcryptjs 2.4, jsonwebtoken 9' },
    { ok: true,  label: 'A07 – Authentication Failures',      desc: 'loginLimiter bloquea brute force. Token verificado en DB en cada request' },
    { ok: false, label: 'A08 – Software Integrity Failures',  desc: 'No aplica (sin deserialización de objetos o plugins externos)' },
    { ok: true,  label: 'A09 – Security Logging & Monitoring',desc: 'logSecurityEvent registra 401/403 con IP, usuario y timestamp' },
    { ok: false, label: 'A10 – SSRF',                         desc: 'No aplica (el backend no hace fetch de URLs externas proporcionadas por usuario)' },
  ]

  return (
    <div className="space-y-2 max-w-2xl">
      <p className="text-sm text-gray-500 mb-4">
        Estado de cobertura del <strong>OWASP Top 10</strong> en el backend del SRM.
      </p>
      {items.map(item => (
        <div key={item.label} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
            item.ok ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
          }`}>
            {item.ok ? '✓' : '—'}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page principal ────────────────────────────────────────────────────────────
const ConfiguracionPage = () => {
  const [tab, setTab]       = useState('empresa')
  const [config, setConfig] = useState(loadConfig)

  const handleChange = (newConfig) => {
    setConfig(newConfig)
    saveConfig(newConfig)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Cog6ToothIcon className="w-6 h-6 text-gray-500" />
          <h1 className="text-2xl font-bold font-heading text-gray-800">Configuración</h1>
        </div>
        <p className="text-sm text-gray-400">Parámetros generales del sistema SRM</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="card max-w-2xl">
        {tab === 'empresa'    && <TabEmpresa    config={config} onChange={handleChange} />}
        {tab === 'categorias' && <TabCategorias />}
        {tab === 'seguridad'  && <TabSeguridad  />}
      </div>
    </div>
  )
}

export default ConfiguracionPage
