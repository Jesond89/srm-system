import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { providersService } from '../../services/providers.service.js'
import { generarReporteProveedores } from '../../services/reportes.service.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const categoriaColors = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100  text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100   text-red-700',
}

const ProveedoresList = () => {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const canCreate  = ['admin','gerente','comprador'].includes(user?.rol)

  const [proveedores, setProveedores] = useState([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [categoria,   setCategoria]   = useState('')
  const [page,        setPage]        = useState(1)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await providersService.listar({ search, categoria, page, limit: 15 })
      setProveedores(res.data || [])
      setTotal(res.total || 0)
    } catch { setProveedores([]) }
    finally  { setLoading(false) }
  }, [search, categoria, page])

  useEffect(() => { cargar() }, [cargar])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, categoria])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Proveedores</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} proveedor{total !== 1 ? 'es' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const res = await providersService.listar({ limit: 500 })
              generarReporteProveedores(res.data || [])
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Exportar PDF
          </button>
          {canCreate && (
            <button onClick={() => navigate('/proveedores/nuevo')} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Nuevo proveedor
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o RFC..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className="input-field pl-9 pr-8 w-40"
          >
            <option value="">Categoría</option>
            <option value="A">A — Excelente</option>
            <option value="B">B — Bueno</option>
            <option value="C">C — Regular</option>
            <option value="D">D — Deficiente</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark text-white text-left">
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">RFC</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium text-center">Categoría</th>
              <th className="px-4 py-3 font-medium text-center">Score</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : proveedores.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                {search || categoria ? 'Sin resultados para los filtros aplicados.' : 'Aún no hay proveedores registrados.'}
              </td></tr>
            ) : proveedores.map((p, i) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/proveedores/${p.id}`)}
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                <td className="px-4 py-3 font-mono text-gray-500">{p.rfc}</td>
                <td className="px-4 py-3 text-gray-500">{p.email || '—'}</td>
                <td className="px-4 py-3 text-center">
                  {p.categoria ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoriaColors[p.categoria]}`}>
                      {p.categoria}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center font-medium text-gray-700">
                  {p.score_actual > 0 ? p.score_actual.toFixed(1) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {page} de {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProveedoresList
