import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatFecha, diasRestantes, vencClass } from '../hooks/helpers'

const iconoTipo = (t) => ({ pp: 'ti-lock', audiencia: 'ti-scale', plazo: 'ti-clock', sentencia: 'ti-gavel' }[t] || 'ti-bell')
const colorU = (u) => u === 'alta' ? 'var(--danger)' : u === 'media' ? 'var(--warn)' : 'var(--success)'
const bgU = (u) => u === 'alta' ? 'rgba(248,113,113,.12)' : u === 'media' ? 'rgba(251,191,36,.12)' : 'rgba(52,211,153,.1)'

export default function PanelNotificaciones({ eventos, onCerrar, onEliminar, onEliminarTodas }) {
  const navigate = useNavigate()
  const panelRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onCerrar()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onCerrar])

  const ir = (causaId) => {
    if (causaId) { navigate(`/causas/${causaId}`); onCerrar() }
  }

  return (
    <div ref={panelRef} style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 8,
      width: 340, background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      zIndex: 500, overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          Notificaciones
          {eventos.length > 0 && (
            <span style={{ marginLeft: 8, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>
              {eventos.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {eventos.length > 0 && (
            <button onClick={onEliminarTodas} style={{ fontSize: 11, color: 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '3px 6px', borderRadius: 4, transition: 'color .2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--danger)'}
              onMouseLeave={e => e.target.style.color = 'var(--muted)'}
            >
              Borrar todas
            </button>
          )}
          <button onClick={onCerrar} style={{ color: 'var(--muted)', fontSize: 16, padding: 2 }}>
            <i className="ti ti-x"></i>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {eventos.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)' }}>
            <i className="ti ti-bell-off" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: .4 }}></i>
            <div style={{ fontSize: 13 }}>Sin notificaciones pendientes</div>
          </div>
        )}
        {eventos.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid rgba(42,48,69,.4)', transition: 'background .15s' }}
            onMouseEnter={el => el.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={el => el.currentTarget.style.background = ''}
          >
            {/* Icono */}
            <div style={{ width: 34, height: 34, borderRadius: 8, background: bgU(e.urgencia), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: e.causa_id ? 'pointer' : 'default' }}
              onClick={() => ir(e.causa_id)}
            >
              <i className={`ti ${iconoTipo(e.tipo)}`} style={{ color: colorU(e.urgencia), fontSize: 16 }}></i>
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0, cursor: e.causa_id ? 'pointer' : 'default' }} onClick={() => ir(e.causa_id)}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titulo}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                {e.causas?.numero ? `Causa N° ${e.causas.numero} · ` : ''}{formatFecha(e.fecha)}
              </div>
            </div>

            {/* Días restantes + X */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span className={`venc-chip ${vencClass(e.fecha)}`} style={{ fontSize: 10 }}>{diasRestantes(e.fecha)}</span>
              <button onClick={() => onEliminar(e.id)} style={{ color: 'var(--muted)', fontSize: 13, padding: '1px 3px', borderRadius: 4, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                onMouseEnter={el => el.currentTarget.style.color = 'var(--danger)'}
                onMouseLeave={el => el.currentTarget.style.color = 'var(--muted)'}
                title="Eliminar notificación"
              >
                <i className="ti ti-x"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {eventos.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <button onClick={() => { navigate('/alertas'); onCerrar() }} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Ver todas las alertas →
          </button>
        </div>
      )}
    </div>
  )
}
