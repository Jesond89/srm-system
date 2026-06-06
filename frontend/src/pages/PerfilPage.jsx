import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  UserCircleIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import api from '../services/api.js'

const rolColors = {
  admin:    'bg-red-100 text-red-700',
  gerente:  'bg-blue-100 text-blue-700',
  comprador:'bg-green-100 text-green-700',
  analista: 'bg-gray-100 text-gray-700',
}

const rolLabels = {
  admin:    'Administrador',
  gerente:  'Gerente',
  comprador:'Comprador',
  analista: 'Analista',
}

const PerfilPage = () => {
  const { user } = useAuth()

  const [form, setForm]       = useState({ passwordActual: '', passwordNueva: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const handle = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.passwordNueva !== form.confirmar) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }
    if (form.passwordNueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      await api.patch('/auth/me/password', {
        passwordActual: form.passwordActual,
        passwordNueva:  form.passwordNueva,
      })
      setSuccess(true)
      setForm({ passwordActual: '', passwordNueva: '', confirmar: '' })
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Encabezado */}
      <div className="flex items-center gap-2 mb-6">
        <UserCircleIcon className="w-6 h-6 text-gray-500" />
        <h1 className="text-2xl font-bold font-heading text-gray-800">Mi perfil</h1>
      </div>

      {/* Tarjeta de datos */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-xl font-bold font-heading">
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{user?.nombre}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${rolColors[user?.rol]}`}>
              {rolLabels[user?.rol] || user?.rol}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Nombre completo</p>
            <p className="text-gray-700 mt-0.5">{user?.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Correo electrónico</p>
            <p className="text-gray-700 mt-0.5">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Rol en el sistema</p>
            <p className="text-gray-700 mt-0.5">{rolLabels[user?.rol]}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Estado</p>
            <span className="inline-flex items-center gap-1 mt-0.5 text-green-600 text-sm">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Activo
            </span>
          </div>
        </div>
      </div>

      {/* Cambio de contraseña */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <KeyIcon className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-700">Cambiar contraseña</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div>
            <label className="label-field">Contraseña actual</label>
            <input
              type="password"
              className="input-field"
              value={form.passwordActual}
              onChange={handle('passwordActual')}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label-field">Nueva contraseña</label>
            <input
              type="password"
              className="input-field"
              value={form.passwordNueva}
              onChange={handle('passwordNueva')}
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="label-field">Confirmar nueva contraseña</label>
            <input
              type="password"
              className="input-field"
              value={form.confirmar}
              onChange={handle('confirmar')}
              required
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
              Contraseña actualizada correctamente
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PerfilPage
