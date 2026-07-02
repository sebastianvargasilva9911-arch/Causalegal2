import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'
import { formatFecha, diasRestantes } from '../hooks/helpers'

function saludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  const nombre = usuario?.user_metadata?.nombre?.split(' ')[0] || 'Abogado'
  const especialidad = usuario?.user_metadata?.tipo_abogado || ''

  useEffect(() => {
    if (!usuario) return
    const cargar = async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const en7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      const en14 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

      const { data: causas } = await supabase.from('causas').select('*, imputados(nombre, rut, estado)').eq('usuario_id', usuario.id)
      const { data: eventos } = await supabase.from('eventos').select('*, causas(numero, caratula)').eq('usuario_id', usuario.id).gte('fecha', hoy).lte('fecha', en14).order('fecha')
      const { data: audiencias } = await supabase.from('eventos').select('*, causas(numero)').eq('usuario_id', usuario.id).eq('tipo', 'audiencia').gte('fecha', hoy).order('fecha').limit(5)

      const activas = causas?.filter(c => !['Sentencia', 'Sobreseido'].includes(c.etapa)) || []
      const ppCriticas = causas?.filter(c => c.pp_vencimiento && c.pp_vencimiento <= en7) || []

      const pipeline = ['Investigacion', 'Imputado', 'Procesado', 'A juicio', 'Sentencia'].map(e => ({
        etapa: e, total: causas?.filter(c => c.etapa === e).length || 0
      }))

      setData({
        causasActivas: activas.length,
        ppCriticas: ppCriticas.length,
        eventosProximos: eventos?.filter(e => e.fecha <= en7).length || 0,
        pipeline,
        alertas: eventos || [],
        proximasAudiencias: audiencias || []
      })
    }
    cargar()
  }, [usuario])

  if (!data) return <div className="loading"><i className="ti ti-loader-2"></i> Cargando...</div>

  const colorU = (u) => u === 'alta' ? 'var(--danger)' : u === 'media' ? 'var(--warn)' : 'var(--success)'
  const bgU = (u) => u === 'alta' ? 'rgba(248,113,113,.12)' : u === 'media' ? 'rgba(251,191,36,.12)' : 'rgba(52,211,153,.1)'
  const iconoTipo = (t) => ({ pp: 'ti-lock', audiencia: 'ti-scale', plazo: 'ti-clock', sentencia: 'ti-gavel' }[t] || 'ti-bell')

  return (
    <>
      {/* Saludo personalizado */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 2 }}>
          {saludo()}, {nombre} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          {especialidad ? `Área ${especialidad} · ` : ''}{new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid-4">
        <div className="card-sm">
          <div className="stat-label">Causas activas</div>
          <div className="stat-val">{data.causasActivas}</div>
          <span className="stat-badge badge-info"><i className="ti ti-folder" style={{ fontSize: 10 }}></i> En curso</span>
        </div>
        <div className="card-sm">
          <div className="stat-label">PP próximas a vencer</div>
          <div className="stat-val" style={{ color: data.ppCriticas > 0 ? 'var(--danger)' : 'inherit' }}>{data.ppCriticas}</div>
          <span className={`stat-badge ${data.ppCriticas > 0 ? 'badge-danger' : 'badge-neutral'}`}>
            <i className="ti ti-lock" style={{ fontSize: 10 }}></i> Próx. 7 días
          </span>
        </div>
        <div className="card-sm">
          <div className="stat-label">Eventos próximos</div>
          <div className="stat-val" style={{ color: data.eventosProximos > 0 ? 'var(--warn)' : 'inherit' }}>{data.eventosProximos}</div>
          <span className="stat-badge badge-warn"><i className="ti ti-calendar" style={{ fontSize: 10 }}></i> Esta semana</span>
        </div>
        <div className="card-sm">
          <div className="stat-label">Audiencias pendientes</div>
          <div className="stat-val">{data.proximasAudiencias.length}</div>
          <span className="stat-badge badge-neutral">Próximas</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div className="section-title"><i className="ti ti-git-branch"></i>Estado de causas</div>
        <div className="pipeline">
          {data.pipeline.map(p => (
            <div key={p.etapa} className={`pipe-step ${p.total > 0 ? 'active' : ''}`} onClick={() => navigate('/causas')} style={{ cursor: 'pointer' }}>
              <div className="pipe-count" style={{ color: p.total > 0 ? 'var(--accent)' : 'var(--muted)' }}>{p.total}</div>
              <div className="pipe-label">{p.etapa}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title"><i className="ti ti-bell-ringing"></i>Alertas urgentes</div>
          {data.alertas.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sin alertas por ahora ✓</div>}
          {data.alertas.slice(0, 4).map(a => (
            <div key={a.id} className="alert-item" onClick={() => a.causa_id && navigate(`/causas/${a.causa_id}`)} style={{ cursor: 'pointer' }}>
              <div className="alert-icon" style={{ background: bgU(a.urgencia) }}>
                <i className={`ti ${iconoTipo(a.tipo)}`} style={{ color: colorU(a.urgencia), fontSize: 17 }}></i>
              </div>
              <div className="alert-text">
                <div className="alert-title">{a.titulo}</div>
                <div className="alert-sub">Causa N° {a.causas?.numero} · {formatFecha(a.fecha)}</div>
              </div>
              <div className="alert-time" style={{ color: colorU(a.urgencia) }}>{diasRestantes(a.fecha)}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title"><i className="ti ti-calendar-check"></i>Próximas audiencias</div>
          {data.proximasAudiencias.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sin audiencias próximas</div>}
          {data.proximasAudiencias.map(a => (
            <div key={a.id} className="alert-item" onClick={() => a.causa_id && navigate(`/causas/${a.causa_id}`)} style={{ cursor: 'pointer' }}>
              <div className="alert-icon" style={{ background: 'rgba(79,124,255,.1)' }}>
                <i className="ti ti-scale" style={{ color: 'var(--accent)', fontSize: 17 }}></i>
              </div>
              <div className="alert-text">
                <div className="alert-title">{a.titulo}</div>
                <div className="alert-sub">Causa N° {a.causas?.numero}{a.hora ? ` · ${a.hora} hrs` : ''}</div>
              </div>
              <div className="alert-time" style={{ color: 'var(--muted)' }}>{formatFecha(a.fecha)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
