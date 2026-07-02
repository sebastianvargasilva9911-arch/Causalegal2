import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'
import { etapaClass, vencClass, diasRestantes } from '../hooks/helpers'

const etapas = ['', 'Investigacion', 'Imputado', 'Procesado', 'A juicio', 'Sentencia', 'Sobreseido']

export default function Causas() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [causas, setCausas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [etapa, setEtapa] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!usuario) return
    supabase.from('causas').select('*, imputados(nombre, rut, estado)')
      .eq('usuario_id', usuario.id)
      .order('actualizado_en', { ascending: false })
      .then(({ data }) => { setCausas(data || []); setCargando(false) })
  }, [usuario])

  const filtradas = causas.filter(c => {
    const imp = c.imputados?.[0]
    const q = busqueda.toLowerCase()
    const match = !q || [c.numero, c.caratula, imp?.nombre, c.delito].some(v => v?.toLowerCase().includes(q))
    const etapaMatch = !etapa || c.etapa === etapa
    return match && etapaMatch
  })

  const urgenciaColor = (c) => {
    if (!c.pp_vencimiento) return 'u-baja'
    const cls = vencClass(c.pp_vencimiento)
    return cls === 'venc-hoy' ? 'u-alta' : cls === 'venc-prox' ? 'u-media' : 'u-baja'
  }

  if (cargando) return <div className="loading"><i className="ti ti-loader-2"></i> Cargando...</div>

  return (
    <>
      <div className="toolbar">
        <div className="search-wrap">
          <i className="ti ti-search"></i>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por caratula, N° causa o imputado..." />
        </div>
        <select className="filter-select" value={etapa} onChange={e => setEtapa(e.target.value)}>
          {etapas.map(e => <option key={e} value={e}>{e || 'Todas las etapas'}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 16 }}></th>
                <th>N° Causa</th>
                <th>Caratula</th>
                <th>Imputado</th>
                <th>Tribunal</th>
                <th>Etapa</th>
                <th>Venc. PP</th>
                <th>Delito</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Sin resultados</td></tr>
              )}
              {filtradas.map(c => (
                <tr key={c.id} onClick={() => navigate(`/causas/${c.id}`)}>
                  <td><span className={`urgencia-dot ${urgenciaColor(c)}`}></span></td>
                  <td style={{ fontWeight: 500, color: 'var(--accent)' }}>{c.numero}</td>
                  <td>{c.caratula}</td>
                  <td>{c.imputados?.[0]?.nombre || '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{c.tribunal || '—'}</td>
                  <td><span className={`etapa ${etapaClass(c.etapa)}`}>{c.etapa}</span></td>
                  <td>
                    {c.pp_vencimiento
                      ? <span className={`venc-chip ${vencClass(c.pp_vencimiento)}`}>{diasRestantes(c.pp_vencimiento)}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{c.delito || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
