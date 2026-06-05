import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './guards/ProtectedRoute.jsx'
import Navbar  from './components/layout/Navbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Login            from './pages/Login.jsx'
import Dashboard        from './pages/Dashboard.jsx'
import ProveedoresList  from './pages/proveedores/ProveedoresList.jsx'
import ProveedorForm    from './pages/proveedores/ProveedorForm.jsx'
import ProveedorPerfil  from './pages/proveedores/ProveedorPerfil.jsx'

// Layout principal con navbar + sidebar
const AppLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <Sidebar />
    <main className="ml-60 pt-16 min-h-screen">
      <Outlet />
    </main>
  </div>
)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"          element={<Dashboard />} />
            <Route path="/proveedores"        element={<ProveedoresList />} />
            <Route path="/proveedores/nuevo"  element={<ProveedorForm />} />
            <Route path="/proveedores/:id"    element={<ProveedorPerfil />} />
            <Route path="/proveedores/:id/editar" element={<ProveedorForm />} />
            <Route path="/ordenes"      element={<div className="p-6 text-gray-500">Módulo en desarrollo…</div>} />
            <Route path="/evaluaciones" element={<div className="p-6 text-gray-500">Módulo en desarrollo…</div>} />
            <Route path="/alertas"      element={<div className="p-6 text-gray-500">Módulo en desarrollo…</div>} />
            <Route path="/chatbot"      element={<div className="p-6 text-gray-500">Módulo en desarrollo…</div>} />
            <Route path="/usuarios"     element={<ProtectedRoute roles={['admin']} />} />
            <Route path="/configuracion" element={<div className="p-6 text-gray-500">Módulo en desarrollo…</div>} />
          </Route>
        </Route>

        {/* Redirect raíz */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)

export default App
