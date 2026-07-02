import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'
import { etapaClass } from '../hooks/helpers'

export default function BusquedaGlobal({ onClose }) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef()
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState({ causas: [], imputados: [], eventos: [] })
  const [buscando, setBuscando] = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!q.trim() || q.length < 2) { setResultados({ causas: [], imputados: [], eventos: [] }); return }
    const timer = setTimeout(async () => {
      setBuscando(true)
      const busq = `%${q}%`
      const [{ data: causas }, { data: imputados }, { data: eventos }] = await Promise.all([
        supabase.from('causas').select('id, numero, caratula, etapa, delito').eq('usuario_id', usuario.id).or(`numero.ilike.${busq},caratula.ilike.${busq},delito.ilike.${busq}`).limit(5),
        supabase.from('imputados').select('id, nombre, rut, causa_id, causas!inner(usuario_id)').eq('causas.usuario_id', usuario.id).or(`nombre.ilike.${busq},rut.ilike.${busq}`).limit(5),
        supabase.from('eventos').select('id, titulo, fecha, causa_id').eq('usuario_id', usuario.id).ilike('titulo', busq).limit(5),
      ])
      setResultados({ causas: causas || [], imputados: imputados || [], eventos: eventos || [] })
      setBuscando(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [q, usuario])

  const total = resultados.causas.length + resultados.imputados.length + resultados.eventos.length
  const hayResultados = total > 0

  const ir = (url) => { navigate(url); onClose() }

  return (
    <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 560, margin: '80px auto auto', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <i className="ti ti-search" style={{ fontSize: 18, color: 'var(--muted)', flexShrink: 0 }}></i>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar causas, imputados, audiencias..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)' }} />
          {buscando && <i className="ti ti-loader-2" style={{ fontSize: 16, color: 'var(--muted)', animation: 'spin 1s linear infinite' }}></i>}
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: 18, padding: 2 }}><i className="ti ti-x"></i></button>
        </div>

        {q.length >= 2 && (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {!hayResultados && !buscando && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                Sin resultados para "{q}"
              </div>
            )}

            {resultados.causas.length > 0 && (
              <div>
                <div style={{ padding: '8px 16px 4px', fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Causas</div>
                {resultados.causas.map(c => (
                  <div key={c.id} onClick={() => ir(`/causas/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(42,48,69,.4)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <i className="ti ti-folder" style={{ color: 'var(--accent)', fontSize: 16, flexShrink: 0 }}></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>Causa N° {c.numero}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.caratula}</div>
                    </div>
                    <span className={`etapa ${etapaClass(c.etapa)}`}>{c.etapa}</span>
                  </div>
                ))}
              </div>
            )}

            {resultados.imputados.length > 0 && (
              <div>
                <div style={{ padding: '8px 16px 4px', fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Imputados</div>
                {resultados.imputados.map(i => (
                  <div key={i.id} onClick={() => ir(`/causas/${i.causa_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(42,48,69,.4)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <i className="ti ti-user" style={{ color: 'var(--muted)', fontSize: 16, flexShrink: 0 }}></i>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{i.nombre}</div>
                      {i.rut && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{i.rut}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultados.eventos.length > 0 && (
              <div>
                <div style={{ padding: '8px 16px 4px', fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Audiencias</div>
                {resultados.eventos.map(e => (
                  <div key={e.id} onClick={() => ir(e.causa_id ? `/causas/${e.causa_id}` : '/calendario')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer' }} onMouseEnter={el => el.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={el => el.currentTarget.style.background = ''}>
                    <i className="ti ti-calendar-event" style={{ color: 'var(--muted)', fontSize: 16, flexShrink: 0 }}></i>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{e.titulo}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.fecha}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {q.length < 2 && (
          <div style={{ padding: '16px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Escribí al menos 2 caracteres para buscar
          </div>
        )}
      </div>
    </div>
  )
}
