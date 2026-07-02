import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlertas } from '../hooks/useAlertas'
import ModalNuevaCausa from './ModalNuevaCausa'
import BusquedaGlobal from './BusquedaGlobal'
import Onboarding from './Onboarding'
import PanelNotificaciones from './PanelNotificaciones'
import { ToastContainer } from './Toast'

const titulos = {
  '/': 'Dashboard', '/causas': 'Causas', '/calendario': 'Calendario',
  '/alertas': 'Alertas', '/imputados': 'Imputados', '/perfil': 'Mi perfil',
}

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [busquedaOpen, setBusquedaOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const { eventos, count, eliminarEvento, eliminarTodos } = useAlertas()

  useEffect(() => {
    const visto = localStorage.getItem('cl_onboarding')
    if (!visto) { setOnboardingOpen(true); localStorage.setItem('cl_onboarding', '1') }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setBusquedaOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const titulo = Object.entries(titulos).find(([k]) =>
    k === '/' ? location.pathname === '/' : location.pathname.startsWith(k)
  )?.[1] || 'CausaLegal'

  const nombre = usuario?.user_metadata?.nombre || usuario?.email?.split('@')[0] || 'Usuario'
  const especialidad = usuario?.user_metadata?.tipo_abogado || 'Abogado'
  const iniciales = nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const cerrar = () => setSidebarOpen(false)

  return (
    <div className="app">
      <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={cerrar} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-text"><span className="logo-dot"></span>CausaLegal</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={cerrar}>
            <i className="ti ti-layout-dashboard"></i>Dashboard
          </NavLink>
          <NavLink to="/causas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={cerrar}>
            <i className="ti ti-folder"></i>Causas
          </NavLink>
          <NavLink to="/calendario" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={cerrar}>
            <i className="ti ti-calendar"></i>Calendario
          </NavLink>
          <div className="nav-section">Gestión</div>
          <NavLink to="/alertas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={cerrar}>
            <i className="ti ti-bell"></i>Alertas
            {count > 0 && (
              <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, minWidth: 18, textAlign: 'center' }}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </NavLink>
          <NavLink to="/imputados" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={cerrar}>
            <i className="ti ti-users"></i>Imputados
          </NavLink>
          <div className="nav-section">Cuenta</div>
          <NavLink to="/perfil" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={cerrar}>
            <i className="ti ti-user-circle"></i>Mi perfil
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info" style={{ cursor: 'pointer' }} onClick={() => { navigate('/perfil'); cerrar() }}>
            <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{iniciales}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{nombre}</div>
              <div className="user-role">{especialidad}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout() }} title="Cerrar sesión" style={{ color: 'var(--muted)', padding: 4, flexShrink: 0 }}>
              <i className="ti ti-logout" style={{ fontSize: 16 }}></i>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(v => !v)}>
            <i className="ti ti-menu-2"></i>
          </button>
          <span className="topbar-title">{titulo}</span>

          {/* Búsqueda */}
          <button onClick={() => setBusquedaOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
            <i className="ti ti-search" style={{ fontSize: 14 }}></i>
            <span className="hide-mobile">Buscar...</span>
            <span className="hide-mobile" style={{ fontSize: 10, padding: '1px 5px', background: 'var(--border)', borderRadius: 4 }}>Ctrl+K</span>
          </button>

          {/* Campana con panel */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setPanelOpen(v => !v)}
              style={{ position: 'relative', color: count > 0 ? 'var(--text)' : 'var(--muted)', padding: 6, borderRadius: 8, background: panelOpen ? 'var(--surface2)' : count > 0 ? 'rgba(248,113,113,.08)' : 'var(--surface2)', border: `1px solid ${count > 0 ? 'rgba(248,113,113,.3)' : 'var(--border)'}`, transition: 'all .2s' }}
            >
              <i className="ti ti-bell" style={{ fontSize: 17 }}></i>
              {count > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 20, minWidth: 16, textAlign: 'center' }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
            {panelOpen && (
              <PanelNotificaciones
                eventos={eventos}
                onCerrar={() => setPanelOpen(false)}
                onEliminar={eliminarEvento}
                onEliminarTodas={eliminarTodos}
              />
            )}
          </div>

          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ fontSize: 12, padding: '7px 12px', flexShrink: 0 }}>
            <i className="ti ti-plus"></i><span className="hide-mobile">Nueva causa</span>
          </button>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </main>

      {modalOpen && <ModalNuevaCausa onClose={() => setModalOpen(false)} onCreada={(id) => { setModalOpen(false); navigate(`/causas/${id}`) }} />}
      {busquedaOpen && <BusquedaGlobal onClose={() => setBusquedaOpen(false)} />}
      {onboardingOpen && <Onboarding onCerrar={() => setOnboardingOpen(false)} />}
      <ToastContainer />
    </div>
  )
}
