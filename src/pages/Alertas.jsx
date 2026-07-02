import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'
import { formatFecha, diasRestantes, vencClass } from '../hooks/helpers'

const iconoTipo = (t) => ({ pp: 'ti-lock', audiencia: 'ti-scale', plazo: 'ti-clock', sentencia: 'ti-gavel' }[t] || 'ti-bell')
const colorU = (u) => u === 'alta' ? 'var(--danger)' : u === 'media' ? 'var(--warn)' : 'var(--success)'
const bgU = (u) => u === 'alta' ? 'rgba(248,113,113,.12)' : u === 'media' ? 'rgba(251,191,36,.12)' : 'rgba(52,211,153,.1)'
const dotU = (u) => u === 'alta' ? 'u-alta' : u === 'media' ? 'u-media' : 'u-baja'

export default function Alertas() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) return
    const hoy = new Date().toISOString().split('T')[0]
    supabase.from('eventos').select('*, causas(numero, caratula)')
      .eq('usuario_id', usuario.id).gte('fecha', hoy)
      .order('fecha').then(({ data }) => { setEventos(data || []); setCargando(false) })
  }, [usuario])

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const diff = (e) => Math.ceil((new Date(e.fecha + 'T00:00:00') - hoy) / 86400000)

  const criticas = eventos.filter(e => diff(e) <= 3)
  const semana = eventos.filter(e => diff(e) > 3 && diff(e) <= 7)
  const mes = eventos.filter(e => diff(e) > 7 && diff(e) <= 30)

  const Item = ({ e }) => (
    <div className="alert-item" style={{ cursor: e.causa_id ? 'pointer' : 'default' }} onClick={() => e.causa_id && navigate(`/causas/${e.causa_id}`)}>
      <span className={`urgencia-dot ${dotU(e.urgencia)}`}></span>
      <div className="alert-icon" style={{ background: bgU(e.urgencia), marginLeft: 8 }}>
        <i className={`ti ${iconoTipo(e.tipo)}`} style={{ color: colorU(e.urgencia), fontSize: 18 }}></i>
      </div>
      <div className="alert-text">
        <div className="alert-title">{e.titulo}</div>
        <div className="alert-sub">{e.causas?.numero ? `Causa N° ${e.causas.numero}` : ''}{e.descripcion ? ` · ${e.descripcion}` : ''}</div>
      </div>
      <span className={`venc-chip ${vencClass(e.fecha)}`}>{diasRestantes(e.fecha)}</span>
    </div>
  )

  if (cargando) return <div className="loading"><i className="ti ti-loader-2"></i> Cargando...</div>

  return (
    <>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="stat-label">Criticas (3 dias)</div>
          <div className="stat-val" style={{ color: 'var(--danger)' }}>{criticas.length}</div>
        </div>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--warn)' }}>
          <div className="stat-label">Esta semana</div>
          <div className="stat-val" style={{ color: 'var(--warn)' }}>{semana.length}</div>
        </div>
        <div className="card-sm" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="stat-label">Este mes</div>
          <div className="stat-val" style={{ color: 'var(--success)' }}>{mes.length}</div>
        </div>
      </div>

      {criticas.length > 0 && <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ color: 'var(--danger)' }}><i className="ti ti-alert-triangle"></i>Criticas</div>
        {criticas.map(e => <Item key={e.id} e={e} />)}
      </div>}

      {semana.length > 0 && <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ color: 'var(--warn)' }}><i className="ti ti-clock"></i>Esta semana</div>
        {semana.map(e => <Item key={e.id} e={e} />)}
      </div>}

      {mes.length > 0 && <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title"><i className="ti ti-calendar"></i>Este mes</div>
        {mes.map(e => <Item key={e.id} e={e} />)}
      </div>}

      {eventos.length === 0 && <div className="card">
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <i className="ti ti-bell-off" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: .4 }}></i>
          Sin alertas registradas
        </div>
      </div>}
    </>
  )
}
