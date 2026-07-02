// CALENDARIO
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'
import { formatFecha } from '../hooks/helpers'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function tipoColor(tipo) {
  return { pp: 'danger', audiencia: 'info', plazo: 'warn', sentencia: 'info' }[tipo] || 'info'
}

export function Calendario() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const hoyReal = new Date()
  const [mes, setMes] = useState(hoyReal.getMonth())
  const [anio, setAnio] = useState(hoyReal.getFullYear())
  const [eventos, setEventos] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [nuevoEvento, setNuevoEvento] = useState({ titulo: '', fecha: '', hora: '', tipo: 'audiencia', descripcion: '' })
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    const desde = `${anio}-${String(mes + 1).padStart(2, '0')}-01`
    const hasta = `${anio}-${String(mes + 1).padStart(2, '0')}-31`
    const { data } = await supabase.from('eventos').select('*, causas(numero, caratula)')
      .eq('usuario_id', usuario.id).gte('fecha', desde).lte('fecha', hasta).order('fecha')
    setEventos(data || [])
  }

  useEffect(() => { if (usuario) cargar() }, [mes, anio, usuario])

  const cambiarMes = (d) => {
    let nm = mes + d, na = anio
    if (nm > 11) { nm = 0; na++ }
    if (nm < 0) { nm = 11; na-- }
    setMes(nm); setAnio(na)
  }

  const guardarEvento = async () => {
    if (!nuevoEvento.titulo || !nuevoEvento.fecha) return
    setGuardando(true)
    await supabase.from('eventos').insert({ ...nuevoEvento, usuario_id: usuario.id })
    setModalOpen(false)
    setNuevoEvento({ titulo: '', fecha: '', hora: '', tipo: 'audiencia', descripcion: '' })
    setGuardando(false)
    cargar()
  }

  const primerDia = new Date(anio, mes, 1).getDay()
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const diasMesAnt = new Date(anio, mes, 0).getDate()
  const hoyStr = `${hoyReal.getFullYear()}-${String(hoyReal.getMonth() + 1).padStart(2, '0')}-${String(hoyReal.getDate()).padStart(2, '0')}`

  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push({ dia: diasMesAnt - primerDia + i + 1, otro: true })
  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    celdas.push({ dia: d, otro: false, fecha: fechaStr, evs: eventos.filter(e => e.fecha === fechaStr) })
  }
  const rest = (7 - celdas.length % 7) % 7
  for (let i = 1; i <= rest; i++) celdas.push({ dia: i, otro: true })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="cal-nav" style={{ flex: 1, margin: 0 }}>
          <button className="cal-nav-btn" onClick={() => cambiarMes(-1)}><i className="ti ti-chevron-left"></i></button>
          <div className="cal-month">{MESES[mes]} {anio}</div>
          <button className="cal-nav-btn" onClick={() => cambiarMes(1)}><i className="ti ti-chevron-right"></i></button>
        </div>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => setModalOpen(true)}>
          <i className="ti ti-plus"></i>Nuevo evento
        </button>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div className="cal-grid">
          {DIAS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
          {celdas.map((c, i) => (
            <div key={i} className={`cal-cell ${c.fecha === hoyStr ? 'today' : ''} ${c.otro ? 'other-month' : ''}`}>
              <div className="cal-num">{c.dia}</div>
              {c.evs?.map(e => (
                <div key={e.id} className={`cal-event ${tipoColor(e.tipo)}`} onClick={() => e.causa_id && navigate(`/causas/${e.causa_id}`)} title={e.titulo}>{e.titulo}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="section-title"><i className="ti ti-list"></i>Eventos de {MESES[mes]}</div>
      {eventos.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sin eventos este mes</div>}
      {eventos.map(e => (
        <div key={e.id} className="alert-item" style={{ cursor: e.causa_id ? 'pointer' : 'default' }} onClick={() => e.causa_id && navigate(`/causas/${e.causa_id}`)}>
          <div className={`urgencia-dot ${e.urgencia === 'alta' ? 'u-alta' : e.urgencia === 'media' ? 'u-media' : 'u-baja'}`}></div>
          <div className="alert-text" style={{ paddingLeft: 8 }}>
            <div className="alert-title">{e.titulo}</div>
            {e.causas?.numero && <div className="alert-sub">Causa N° {e.causas.numero}</div>}
          </div>
          <div className="alert-time" style={{ color: 'var(--muted)' }}>{formatFecha(e.fecha)}{e.hora ? ` · ${e.hora}` : ''}</div>
        </div>
      ))}

      {modalOpen && (
        <div className="modal-backdrop open" onClick={ev => ev.target === ev.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-title">Nuevo evento</div>
            <div className="form-group"><label className="form-label">Titulo *</label><input value={nuevoEvento.titulo} onChange={e => setNuevoEvento(v => ({ ...v, titulo: e.target.value }))} placeholder="Audiencia preparatoria" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Fecha *</label><input type="date" value={nuevoEvento.fecha} onChange={e => setNuevoEvento(v => ({ ...v, fecha: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Hora</label><input type="time" value={nuevoEvento.hora} onChange={e => setNuevoEvento(v => ({ ...v, hora: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Tipo</label>
              <select value={nuevoEvento.tipo} onChange={e => setNuevoEvento(v => ({ ...v, tipo: e.target.value }))}>
                <option value="audiencia">Audiencia</option>
                <option value="pp">Vencimiento PP</option>
                <option value="plazo">Plazo procesal</option>
                <option value="sentencia">Sentencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Descripcion</label><textarea value={nuevoEvento.descripcion} onChange={e => setNuevoEvento(v => ({ ...v, descripcion: e.target.value }))} style={{ height: 70, resize: 'none' }} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarEvento} disabled={guardando}><i className="ti ti-check"></i>{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Calendario
