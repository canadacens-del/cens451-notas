import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import CargarNotas from './pages/CargarNotas'
import ConsultarNotas from './pages/ConsultarNotas'
import Informes from './pages/Informes'
import AdminEstructura from './pages/AdminEstructura'

function ProtectedRoute({ children, roles }) {
  const { user, perfil, loading } = useAuth()
  if (loading) return <div style={{ padding:'2rem', color:'#6b7280' }}>Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(perfil?.rol)) return <Navigate to="/" />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/cargar" element={<ProtectedRoute roles={['admin','docente']}><CargarNotas /></ProtectedRoute>} />
      <Route path="/consultar" element={<ProtectedRoute><ConsultarNotas /></ProtectedRoute>} />
      <Route path="/informes" element={<ProtectedRoute roles={['admin','directivo']}><Informes /></ProtectedRoute>} />
      <Route path="/admin/estructura" element={<ProtectedRoute roles={['admin']}><AdminEstructura /></ProtectedRoute>} />
      <Route path="/admin/usuarios" element={<ProtectedRoute roles={['admin']}><AdminEstructura /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
