import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './guards/ProtectedRoute.jsx'
import Navbar  from './components/layout/Navbar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Login     from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

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
            <Route path="/dashboard"    element={<Dashboard />} />
            {/* Los demás módulos se agregarán aquí en futuros sprints */}
            <Route path="/proveedores"  element={<div className="p-6 text-gray-500">Módulo en desarrollo…</div>} />
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
