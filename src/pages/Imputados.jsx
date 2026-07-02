import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'
import { etapaClass } from '../hooks/helpers'

export default function Imputados() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [imputados, setImputados] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) return
    supabase.from('imputados').select('*, causas!inner(numero, caratula, etapa, usuario_id)')
      .eq('causas.usuario_id', usuario.id)
      .order('nombre')
      .then(({ data }) => { setImputados(data || []); setCargando(false) })
  }, [usuario])

  const filtrados = imputados.filter(i => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return i.nombre?.toLowerCase().includes(q) || i.rut?.toLowerCase().includes(q)
  })

  const iniciales = (n) => n?.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?'

  if (cargando) return <div className="loading"><i className="ti ti-loader-2"></i> Cargando...</div>

  return (
    <>
      <div className="toolbar">
        <div className="search-wrap">
          <i className="ti ti-search"></i>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o RUT..." />
        </div>
      </div>

      {filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          <i className="ti ti-users" style={{ fontSize: 40, display: 'block', marginBottom: 10, opacity: .4 }}></i>
          Sin imputados registrados
        </div>
      )}

      <div className="grid-3">
        {filtrados.map(i => (
          <div key={i.id} className="card-sm" style={{ cursor: 'pointer', transition: 'border-color .2s' }}
            onClick={() => i.causa_id && navigate(`/causas/${i.causa_id}`)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="avatar" style={{ width: 40, height: 40, fontSize: 13, background: i.estado === 'Detenido' ? 'rgba(248,113,113,.2)' : 'var(--accent)', color: i.estado === 'Detenido' ? 'var(--danger)' : '#fff' }}>
                {iniciales(i.nombre)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{i.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{i.rut || 'Sin RUT'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>Estado</span>
              <span style={{ color: i.estado === 'Detenido' ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>{i.estado || 'En libertad'}</span>
            </div>
            {i.unidad_penitenciaria && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}><i className="ti ti-building" style={{ fontSize: 11 }}></i> {i.unidad_penitenciaria}</div>}
            {i.causas && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Causa N° {i.causas.numero}</span>
                <span className={`etapa ${etapaClass(i.causas.etapa)}`}>{i.causas.etapa}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
