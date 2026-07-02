import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 80, color: 'var(--accent)', lineHeight: 1, marginBottom: 16 }}>404</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 8 }}>Página no encontrada</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>La URL que ingresaste no existe o fue movida.</div>
        <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '10px 24px' }} onClick={() => navigate('/')}>
          <i className="ti ti-arrow-left"></i>Volver al inicio
        </button>
      </div>
    </div>
  )
}
