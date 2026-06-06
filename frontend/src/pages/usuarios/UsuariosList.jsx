import { useState, useEffect, useCallback } from 'react'
import { usersService } from '../../services/users.service.js'
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon,
         KeyIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const rolColors = {
  admin:    'bg-red-100 text-red-700',
  gerente:  'bg-blue-100 text-blue-700',
  comprador:'bg-green-100 text-green-700',
  analista: 'bg-gray-100 text-gray-600',
}

const roles = ['admin', 'gerente', 'comprador', 'analista']

const UsuariosList = () => {
  const [usuarios,  setUsuarios]  = useState([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [rolFiltro, setRolFiltro] = useState('')
  const [page,      setPage]      = useState(1)

  // Modal nuevo usuario
  const [showNew,   setShowNew]   = useState(false)
  const [newForm,   setNewForm]   = useState({ nombre:'', email:'', password:'', rol:'comprador' })
  const [newError,  setNewError]  = useState('')
  const [newSaving, setNewSaving] = useState(false)

  // Edición inline
  const [editId,   setEditId]    = useState(null)
  const [editForm, setEditForm]  = useState({})

  // Reset password
  const [pwdId,    setPwdId]     = useState(null)
  const [newPwd,   setNewPwd]    = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await usersService.listar({ search, rol: rolFiltro, page, limit: 15 })
      setUsuarios(r.data || [])
      setTotal(r.total || 0)
    } catch { setUsuarios([]) }
    finally  { setLoading(false) }
  }, [search, rolFiltro, page])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { setPage(1) }, [search, rolFiltro])

  const handleCreate = async (e) => {
    e.preventDefault()
    setNewError('')
    setNewSaving(true)
    try {
      await usersService.crear(newForm)
      setShowNew(false)
      setNewForm({ nombre:'', email:'', password:'', rol:'comprador' })
      cargar()
    } catch (err) {
      setNewError(err.response?.data?.error || 'Error al crear usuario')
    } finally { setNewSaving(false) }
  }

  const saveEdit = async (id) => {
    try {
      await usersService.actualizar(id, editForm)
      setEditId(null)
      cargar()
    } catch (err) { alert(err.response?.data?.error || 'Error') }
  }

  const toggleActivo = async (u) => {
    await usersService.actualizar(u.id, { activo: !u.activo })
    cargar()
  }

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 8) return alert('Mínimo 8 caracteres')
    try {
      await usersService.cambiarPassword(pwdId, newPwd)
      setPwdId(null)
      setNewPwd('')
      alert('Contraseña actualizada')
    } catch (err) { alert(err.response?.data?.error || 'Error') }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" placeholder="Buscar por nombre o email..." />
        </div>
        <select value={rolFiltro} onChange={e => setRolFiltro(e.target.value)}
          className="input-field w-40">
          <option value="">Todos los roles</option>
          {roles.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark text-white text-left">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium text-center">Rol</th>
              <th className="px-4 py-3 font-medium text-center">Estado</th>
              <th className="px-4 py-3 font-medium text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin usuarios</td></tr>
            ) : usuarios.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                {editId === u.id ? (
                  <>
                    <td className="px-3 py-2">
                      <input value={editForm.nombre} onChange={e => setEditForm(p=>({...p, nombre: e.target.value}))}
                        className="input-field text-xs py-1" />
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-xs">{u.email}</td>
                    <td className="px-3 py-2 text-center">
                      <select value={editForm.rol} onChange={e => setEditForm(p=>({...p, rol: e.target.value}))}
                        className="input-field text-xs py-1">
                        {roles.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-400 text-xs">—</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => saveEdit(u.id)} className="text-green-600 hover:text-green-800">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rolColors[u.rol]}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActivo(u)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                          u.activo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => { setEditId(u.id); setEditForm({ nombre: u.nombre, rol: u.rol }) }}
                          className="text-gray-400 hover:text-primary" title="Editar">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setPwdId(u.id); setNewPwd('') }}
                          className="text-gray-400 hover:text-blue-500" title="Cambiar contraseña">
                          <KeyIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {total > 15 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Página {page} de {Math.ceil(total/15)}</span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button disabled={page>=Math.ceil(total/15)} onClick={() => setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nuevo usuario */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Nuevo usuario</h2>
            {newError && <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 mb-4 border border-red-200">{newError}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={newForm.nombre} onChange={e => setNewForm(p=>({...p, nombre: e.target.value}))}
                className="input-field" placeholder="Nombre completo" required />
              <input type="email" value={newForm.email} onChange={e => setNewForm(p=>({...p, email: e.target.value}))}
                className="input-field" placeholder="Email" required />
              <input type="password" value={newForm.password} onChange={e => setNewForm(p=>({...p, password: e.target.value}))}
                className="input-field" placeholder="Contraseña (mín. 8 caracteres)" minLength={8} required />
              <select value={newForm.rol} onChange={e => setNewForm(p=>({...p, rol: e.target.value}))}
                className="input-field">
                {roles.map(r => <option key={r}>{r}</option>)}
              </select>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={newSaving} className="btn-primary flex-1">
                  {newSaving ? 'Creando...' : 'Crear usuario'}
                </button>
                <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset password */}
      {pwdId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Cambiar contraseña</h2>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              className="input-field mb-4" placeholder="Nueva contraseña (mín. 8 caracteres)" minLength={8} />
            <div className="flex gap-3">
              <button onClick={handleResetPwd} className="btn-primary flex-1">Guardar</button>
              <button onClick={() => setPwdId(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsuariosList
