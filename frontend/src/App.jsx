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
import OrdenesList          from './pages/ordenes/OrdenesList.jsx'
import OrdenForm            from './pages/ordenes/OrdenForm.jsx'
import OrdenDetalle         from './pages/ordenes/OrdenDetalle.jsx'
import EvaluacionesDashboard from './pages/evaluaciones/EvaluacionesDashboard.jsx'
import EvaluacionForm       from './pages/evaluaciones/EvaluacionForm.jsx'
import CriteriosConfig      from './pages/evaluaciones/CriteriosConfig.jsx'
import AlertasPanel         from './pages/alertas/AlertasPanel.jsx'
import ReglasConfig         from './pages/alertas/ReglasConfig.jsx'
import UsuariosList         from './pages/usuarios/UsuariosList.jsx'
import ConfiguracionPage    from './pages/configuracion/ConfiguracionPage.jsx'
import PerfilPage           from './pages/PerfilPage.jsx'
import ChatWidget           from './components/chatbot/ChatWidget.jsx'
import AlertToastContainer  from './components/ui/AlertToast.jsx'

// ── Página 404 personalizada ──────────────────────────────────────────────────
const NotFoundPage = () => (
  <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
      <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    </div>
    <h1 className="text-6xl font-bold text-indigo-600 mb-2">404</h1>
    <h2 className="text-xl font-semibold text-gray-800 mb-3">Página no encontrada</h2>
    <p className="text-gray-500 text-sm max-w-xs mb-6">
      La página que buscas no existe o fue movida a otra dirección.
    </p>
    <a
      href="/dashboard"
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
    >
      Ir al dashboard
    </a>
  </div>
)

// ── Página placeholder para /chatbot (el widget ya está flotante) ──────────────
const ChatbotPage = () => (
  <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">Asistente SRM</h2>
    <p className="text-gray-400 text-sm max-w-xs">
      El chatbot está disponible en todo momento desde el botón flotante en la esquina inferior derecha.
    </p>
  </div>
)

// ── Layout principal con navbar + sidebar ─────────────────────────────────────
const AppLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <Sidebar />
    <main className="ml-60 pt-16 min-h-screen">
      <Outlet />
    </main>
    <ChatWidget />
    <AlertToastContainer />
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
            <Route path="/ordenes"            element={<OrdenesList />} />
            <Route path="/ordenes/nueva"      element={<OrdenForm />} />
            <Route path="/ordenes/:id"        element={<OrdenDetalle />} />
            <Route path="/evaluaciones"       element={<EvaluacionesDashboard />} />
            <Route path="/evaluaciones/nueva" element={<EvaluacionForm />} />
            <Route path="/evaluaciones/criterios" element={<CriteriosConfig />} />
            <Route path="/alertas"            element={<AlertasPanel />} />
            <Route path="/alertas/reglas"     element={<ReglasConfig />} />
            <Route path="/usuarios"           element={<UsuariosList />} />
            <Route path="/chatbot"            element={<ChatbotPage />} />
            <Route path="/configuracion"      element={<ConfiguracionPage />} />
            <Route path="/perfil"             element={<PerfilPage />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)

export default App
