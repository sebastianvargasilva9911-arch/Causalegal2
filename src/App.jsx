import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Causas from './pages/Causas'
import FichaCausa from './pages/FichaCausa'
import Calendario from './pages/Calendario'
import Alertas from './pages/Alertas'
import Imputados from './pages/Imputados'
import CompletarPerfil from './pages/CompletarPerfil'
import NotFound from './pages/NotFound'
import Perfil from './pages/Perfil'
import RecuperarPassword from './pages/RecuperarPassword'

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div className="loading"><i className="ti ti-loader-2"></i> Cargando...</div>
  if (!usuario) return <Navigate to="/login" />
  if (!usuario.user_metadata?.perfil_completo && !usuario.user_metadata?.nombre) {
    return <Navigate to="/completar-perfil" />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/completar-perfil" element={<CompletarPerfil />} />
          <Route path="/recuperar-password" element={<RecuperarPassword />} />
          <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
            <Route index element={<Dashboard />} />
            <Route path="causas" element={<Causas />} />
            <Route path="causas/:id" element={<FichaCausa />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="imputados" element={<Imputados />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
