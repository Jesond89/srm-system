import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { providersService } from '../../services/providers.service.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { ArrowLeftIcon, PencilSquareIcon, ArrowDownTrayIcon,
         TrashIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import api from '../../services/api.js'

const categoriaColors = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100  text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100   text-red-700',
}

const estadoColors = {
  borrador:    'bg-gray-100   text-gray-600',
  enviado:     'bg-blue-100   text-blue-600',
  confirmado:  'bg-indigo-100 text-indigo-600',
  en_transito: 'bg-yellow-100 text-yellow-600',
  recibido:    'bg-green-100  text-green-600',
  cancelado:   'bg-red-100    text-red-600',
}

const ProveedorPerfil = () => {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const canEdit   = ['admin','gerente','comprador'].includes(user?.rol)

  const [proveedor,   setProveedor]   = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('info')
  const [uploading,   setUploading]   = useState(false)
  const [tipoDoc,     setTipoDoc]     = useState('contrato')
  const [documentos,  setDocumentos]  = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    providersService.obtener(id)
      .then(setProveedor)
      .catch(() => navigate('/proveedores'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    if (tab === 'documentos') {
      setLoadingDocs(true)
      providersService.listarDocumentos(id)
        .then(setDocumentos)
        .finally(() => setLoadingDocs(false))
    }
  }, [tab, id])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      fd.append('tipo', tipoDoc)
      const nuevo = await providersService.subirDocumento(id, fd)
      setDocumentos(prev => [nuevo, ...prev])
    } catch (err) {
      alert(err.response?.data?.message || 'Error al subir archivo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDescargar = async (docId, nombre) => {
    try {
      const { url } = await providersService.urlDocumento(id, docId)
      const a = document.createElement('a')
      a.href = url
      a.download = nombre
      a.target = '_blank'
      a.click()
    } catch {
      alert('Error al obtener URL de descarga')
    }
  }

  const handleEliminar = async (docId) => {
    if (!confirm('¿Eliminar este documento?')) return
    try {
      await providersService.eliminarDocumento(id, docId)
      setDocumentos(prev => prev.filter(d => d.id !== docId))
    } catch {
      alert('Error al eliminar documento')
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>
  if (!proveedor) return null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/proveedores')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-gray-800">{proveedor.nombre}</h1>
              {proveedor.categoria && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoriaColors[proveedor.categoria]}`}>
                  Categoría {proveedor.categoria}
                </span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${proveedor.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {proveedor.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-sm text-gray-400 font-mono mt-0.5">{proveedor.rfc}</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={() => navigate(`/proveedores/${id}/editar`)} className="btn-secondary flex items-center gap-2">
            <PencilSquareIcon className="w-4 h-4" />
            Editar
          </button>
        )}
      </div>

      {/* Score card */}
      {proveedor.score_actual > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Score actual',  value: proveedor.score_actual?.toFixed(1) || '—' },
            { label: 'Categoría',     value: proveedor.categoria || '—' },
            { label: 'Evaluaciones',  value: proveedor.evaluaciones?.length || 0 },
            { label: 'Órdenes',       value: proveedor.ordenes_compra?.length || 0 },
          ].map(c => (
            <div key={c.label} className="card text-center">
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-5">
        {[
          { key: 'info',        label: 'Información' },
          { key: 'historial',   label: 'Historial OCs' },
          { key: 'evaluaciones',label: 'Evaluaciones' },
          { key: 'documentos',  label: 'Documentos' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Información */}
      {tab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {[
            { label: 'Nombre',    value: proveedor.nombre },
            { label: 'RFC',       value: proveedor.rfc, mono: true },
            { label: 'Email',     value: proveedor.email || '—' },
            { label: 'Teléfono',  value: proveedor.telefono || '—' },
            { label: 'Dirección', value: proveedor.direccion || '—', full: true },
          ].map(f => (
            <div key={f.label} className={f.full ? 'sm:col-span-2' : ''}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{f.label}</p>
              <p className={`text-sm text-gray-800 mt-0.5 ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Historial OCs */}
      {tab === 'historial' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark text-white text-left">
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {!proveedor.evaluaciones?.length ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sin órdenes de compra</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Evaluaciones */}
      {tab === 'evaluaciones' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-dark text-white text-left">
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium text-center">Score</th>
                <th className="px-4 py-3 font-medium text-center">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {proveedor.evaluaciones?.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Sin evaluaciones registradas</td></tr>
              ) : proveedor.evaluaciones?.map((e, i) => (
                <tr key={e.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-mono text-gray-600">{e.periodo}</td>
                  <td className="px-4 py-3 text-center font-medium">{e.score.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoriaColors[e.categoria]}`}>
                      {e.categoria}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Tab: Documentos */}
      {tab === 'documentos' && (
        <div className="space-y-4">
          {/* Subir documento */}
          {canEdit && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
              <select
                value={tipoDoc}
                onChange={e => setTipoDoc(e.target.value)}
                className="input text-sm py-1.5"
              >
                {['contrato','certificado','factura','cotizacion','otro'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                className="btn-primary flex items-center gap-2 text-sm py-1.5"
              >
                <PaperClipIcon className="w-4 h-4" />
                {uploading ? 'Subiendo...' : 'Subir documento'}
              </button>
            </div>
          )}

          {/* Lista de documentos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loadingDocs ? (
              <p className="p-6 text-center text-gray-400 text-sm">Cargando documentos...</p>
            ) : documentos.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">Sin documentos adjuntos</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark text-white text-left">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((doc, i) => (
                    <tr key={doc.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-700 flex items-center gap-2">
                        <PaperClipIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{doc.nombre}</span>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-500">{doc.tipo}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {new Date(doc.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDescargar(doc.id, doc.nombre)}
                            title="Descargar"
                            className="text-primary hover:text-primary/80"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleEliminar(doc.id)}
                              title="Eliminar"
                              className="text-red-400 hover:text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProveedorPerfil
