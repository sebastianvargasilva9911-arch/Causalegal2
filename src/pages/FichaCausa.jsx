import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import supabase from '../supabase'
import { etapaClass, formatFecha } from '../hooks/helpers'
import { exportarCausaPDF } from '../hooks/usePDF'
import { toast } from '../components/Toast'
import ModalConfirmar from '../components/ModalConfirmar'

const etapas = ['Investigacion', 'Imputado', 'Procesado', 'A juicio', 'Sentencia', 'Sobreseido']
const TRIBUNALES = [
  '1° Juzgado Civil de Puerto Montt', '2° Juzgado Civil de Puerto Montt',
  'Juzgado de Letras del Trabajo de Puerto Montt', 'Juzgado de Familia de Puerto Montt',
  'Juzgado de Garantía de Puerto Montt', 'Tribunal de Juicio Oral en lo Penal de Puerto Montt', 'Otro'
]

export default function FichaCausa() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [causa, setCausa] = useState(null)
  const [tab, setTab] = useState('historial')
  const [nuevaNota, setNuevaNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({})
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [confirmarArchivar, setConfirmarArchivar] = useState(false)
  const [confirmarEliminarDoc, setConfirmarEliminarDoc] = useState(null)
  const [modalAudiencia, setModalAudiencia] = useState(false)
  const [nuevaAudiencia, setNuevaAudiencia] = useState({ titulo: '', fecha: '', hora: '', tipo: 'audiencia', descripcion: '' })
  const [guardandoAudiencia, setGuardandoAudiencia] = useState(false)
  const [subiendoDoc, setSubiendoDoc] = useState(false)

  const cargar = async () => {
    const { data } = await supabase.from('causas').select(`*, imputados(*), historial(*), notas(*), documentos(*), eventos(*)`).eq('id', id).single()
    if (data) {
      data.historial?.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
      data.notas?.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
      data.eventos?.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      data.documentos?.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
      setCausa(data); setForm(data)
    }
  }

  useEffect(() => { cargar() }, [id])

  const guardarNota = async () => {
    if (!nuevaNota.trim()) return
    setGuardandoNota(true)
    await supabase.from('notas').insert({ texto: nuevaNota, causa_id: id })
    setNuevaNota(''); setGuardandoNota(false)
    toast('Nota guardada'); cargar()
  }

  const guardarEdicion = async () => {
    await supabase.from('causas').update({
      numero: form.numero, caratula: form.caratula, delito: form.delito,
      tribunal: form.tribunal, fiscal: form.fiscal, etapa: form.etapa,
      fecha_inicio: form.fecha_inicio, pp_vencimiento: form.pp_vencimiento,
      unidad_penitenciaria: form.unidad_penitenciaria,
      actualizado_en: new Date().toISOString()
    }).eq('id', id)
    await supabase.from('historial').insert({ titulo: 'Causa actualizada', descripcion: `Etapa: ${form.etapa}`, causa_id: id })
    setEditando(false); toast('Causa actualizada'); cargar()
  }

  const eliminarCausa = async () => {
    // Eliminar archivos de storage
    const { data: docs } = await supabase.from('documentos').select('storage_path').eq('causa_id', id)
    if (docs?.length) {
      await supabase.storage.from('documentos').remove(docs.map(d => d.storage_path))
    }
    await supabase.from('notas').delete().eq('causa_id', id)
    await supabase.from('historial').delete().eq('causa_id', id)
    await supabase.from('documentos').delete().eq('causa_id', id)
    await supabase.from('eventos').delete().eq('causa_id', id)
    await supabase.from('imputados').delete().eq('causa_id', id)
    await supabase.from('causas').delete().eq('id', id)
    toast('Causa eliminada', 'error')
    navigate('/causas')
  }

  const archivarCausa = async () => {
    await supabase.from('causas').update({ etapa: 'Sobreseido', actualizado_en: new Date().toISOString() }).eq('id', id)
    await supabase.from('historial').insert({ titulo: 'Causa archivada', descripcion: 'Marcada como sobreseída/cerrada.', causa_id: id })
    setConfirmarArchivar(false); toast('Causa archivada', 'warn'); cargar()
  }

  const guardarAudiencia = async () => {
    if (!nuevaAudiencia.titulo || !nuevaAudiencia.fecha) { toast('Completa título y fecha', 'error'); return }
    setGuardandoAudiencia(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('eventos').insert({ ...nuevaAudiencia, causa_id: id, usuario_id: user.id })
    setModalAudiencia(false)
    setNuevaAudiencia({ titulo: '', fecha: '', hora: '', tipo: 'audiencia', descripcion: '' })
    setGuardandoAudiencia(false)
    toast('Audiencia agregada'); cargar()
  }

  const subirDocumento = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast('El archivo no puede superar 10MB', 'error'); return }
    setSubiendoDoc(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop()
      const storagePath = `${user.id}/${id}/${Date.now()}.${ext}`
      const { error: errUp } = await supabase.storage.from('documentos').upload(storagePath, file)
      if (errUp) throw errUp
      await supabase.from('documentos').insert({
        nombre: file.name,
        tipo: ext,
        tamanio: `${(file.size / 1024).toFixed(0)} KB`,
        storage_path: storagePath,
        causa_id: id
      })
      toast('Documento subido correctamente')
      cargar()
    } catch (e) {
      toast('Error al subir el documento', 'error')
    } finally {
      setSubiendoDoc(false)
      e.target.value = ''
    }
  }

  const descargarDocumento = async (doc) => {
    try {
      const { data, error } = await supabase.storage.from('documentos').download(doc.storage_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = doc.nombre; a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Error al descargar el documento', 'error')
    }
  }

  const eliminarDocumento = async (doc) => {
    try {
      await supabase.storage.from('documentos').remove([doc.storage_path])
      await supabase.from('documentos').delete().eq('id', doc.id)
      toast('Documento eliminado', 'warn')
      cargar()
    } catch {
      toast('Error al eliminar el documento', 'error')
    }
    setConfirmarEliminarDoc(null)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAud = (k, v) => setNuevaAudiencia(f => ({ ...f, [k]: v }))

  if (!causa) return <div className="loading"><i className="ti ti-loader-2"></i> Cargando...</div>

  const imp = causa.imputados?.[0]
  const archivada = causa.etapa === 'Sobreseido' || causa.etapa === 'Sentencia'

  const iconoDoc = (tipo) => {
    const map = { pdf: 'ti-file-type-pdf', doc: 'ti-file-type-doc', docx: 'ti-file-type-doc', jpg: 'ti-photo', jpeg: 'ti-photo', png: 'ti-photo' }
    return map[tipo?.toLowerCase()] || 'ti-file'
  }

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/causas')}>
        <i className="ti ti-arrow-left"></i>Volver a causas
      </button>

      <div className="ficha-header">
        <div className="ficha-icon"><i className="ti ti-folder-open"></i></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ficha-title">Causa N° {causa.numero} · {imp?.nombre || causa.caratula}</div>
              <div className="ficha-meta">
                <span><i className="ti ti-building" style={{ fontSize: 12 }}></i>{causa.tribunal || 'Sin tribunal'}</span>
                <span><i className="ti ti-user" style={{ fontSize: 12 }}></i>Fiscal: {causa.fiscal || '—'}</span>
                <span><i className="ti ti-calendar" style={{ fontSize: 12 }}></i>Inicio: {formatFecha(causa.fecha_inicio)}</span>
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`etapa ${etapaClass(causa.etapa)}`}>{causa.etapa}</span>
                {archivada && <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}><i className="ti ti-archive" style={{ fontSize: 12 }}></i>Archivada</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
              <button className="btn btn-ghost" onClick={() => exportarCausaPDF(causa)} style={{ fontSize: 12 }}>
                <i className="ti ti-file-download"></i><span className="hide-mobile">PDF</span>
              </button>
              <button className="btn btn-ghost" onClick={() => setEditando(v => !v)} style={{ fontSize: 12 }}>
                <i className={`ti ${editando ? 'ti-x' : 'ti-edit'}`}></i><span className="hide-mobile">{editando ? 'Cancelar' : 'Editar'}</span>
              </button>
              {!archivada && (
                <button className="btn btn-ghost" onClick={() => setConfirmarArchivar(true)} style={{ fontSize: 12 }}>
                  <i className="ti ti-archive"></i><span className="hide-mobile">Archivar</span>
                </button>
              )}
              <button className="btn" onClick={() => setConfirmarEliminar(true)} style={{ fontSize: 12, background: 'rgba(248,113,113,.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,.2)' }}>
                <i className="ti ti-trash"></i><span className="hide-mobile">Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {editando ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title"><i className="ti ti-edit"></i>Editar causa</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Número</label><input value={form.numero || ''} onChange={e => set('numero', e.target.value.replace(/[^0-9-]/g, ''))} /></div>
            <div className="form-group"><label className="form-label">Etapa</label>
              <select value={form.etapa || ''} onChange={e => set('etapa', e.target.value)}>
                {etapas.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Carátula</label><input value={form.caratula || ''} onChange={e => set('caratula', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Tribunal</label>
              <select value={form.tribunal || ''} onChange={e => set('tribunal', e.target.value)}>
                {TRIBUNALES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Fiscal</label><input value={form.fiscal || ''} onChange={e => set('fiscal', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Delito</label><input value={form.delito || ''} onChange={e => set('delito', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Vencimiento PP</label><input type="date" value={form.pp_vencimiento || ''} onChange={e => set('pp_vencimiento', e.target.value)} /></div>
          </div>
          <div className="form-group"><label className="form-label">Unidad penitenciaria</label><input value={form.unidad_penitenciaria || ''} onChange={e => set('unidad_penitenciaria', e.target.value)} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarEdicion}><i className="ti ti-check"></i>Guardar</button>
          </div>
        </div>
      ) : (
        <div className="info-grid">
          <div className="info-item"><div className="info-label">Imputado</div><div className="info-value">{imp?.nombre || '—'}</div></div>
          <div className="info-item"><div className="info-label">RUT</div><div className="info-value">{imp?.rut || '—'}</div></div>
          <div className="info-item"><div className="info-label">Delito</div><div className="info-value">{causa.delito || '—'}</div></div>
          <div className="info-item"><div className="info-label">Prisión preventiva</div><div className="info-value" style={{ color: causa.pp_vencimiento ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>{causa.pp_vencimiento ? `Vence ${formatFecha(causa.pp_vencimiento)}` : 'Sin PP'}</div></div>
          <div className="info-item"><div className="info-label">Unidad penitenciaria</div><div className="info-value">{causa.unidad_penitenciaria || '—'}</div></div>
          <div className="info-item"><div className="info-label">Estado imputado</div><div className="info-value" style={{ color: imp?.estado === 'Detenido' ? 'var(--danger)' : 'var(--success)' }}>{imp?.estado || '—'}</div></div>
        </div>
      )}

      <div className="tabs">
        {[['historial', 'Historial'], ['documentos', `Documentos${causa.documentos?.length ? ` (${causa.documentos.length})` : ''}`], ['notas', 'Notas'], ['eventos', `Audiencias${causa.eventos?.length ? ` (${causa.eventos.length})` : ''}`]].map(([k, v]) => (
          <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'historial' && (
        <div className="timeline">
          {causa.historial?.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sin historial</div>}
          {causa.historial?.map((h, i) => (
            <div key={h.id} className="tl-item">
              <div className={`tl-dot ${i === 0 ? 'active' : ''}`}><i className="ti ti-circle-dot"></i></div>
              <div className="tl-content">
                <div className="tl-title">{h.titulo}</div>
                {h.descripcion && <div className="tl-desc">{h.descripcion}</div>}
                <div className="tl-date">{new Date(h.creado_en).toLocaleDateString('es-CL')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'documentos' && (
        <div>
          {causa.documentos?.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--muted)' }}>
              <i className="ti ti-files" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: .4 }}></i>
              <div style={{ fontSize: 13 }}>Sin documentos adjuntos</div>
            </div>
          )}
          {causa.documentos?.map(d => (
            <div key={d.id} className="card-sm" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className={`ti ${iconoDoc(d.tipo)}`} style={{ fontSize: 22, color: 'var(--accent)', flexShrink: 0 }}></i>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d.tamanio} · {new Date(d.creado_en).toLocaleDateString('es-CL')}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => descargarDocumento(d)} title="Descargar">
                    <i className="ti ti-download"></i>
                  </button>
                  <button onClick={() => setConfirmarEliminarDoc(d)} style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(248,113,113,.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,.2)', cursor: 'pointer', fontSize: 12 }} title="Eliminar">
                    <i className="ti ti-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={subirDocumento} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
            <button className="btn btn-ghost" onClick={() => fileRef.current.click()} disabled={subiendoDoc}>
              <i className={`ti ${subiendoDoc ? 'ti-loader-2' : 'ti-upload'}`}></i>
              {subiendoDoc ? 'Subiendo...' : 'Subir documento'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>PDF, Word, Excel, imágenes · Máximo 10MB</div>
          </div>
        </div>
      )}

      {tab === 'notas' && (
        <div>
          {causa.notas?.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>Sin notas</div>}
          {causa.notas?.map(n => (
            <div key={n.id} className="nota-item">
              <div className="nota-meta">{new Date(n.creado_en).toLocaleDateString('es-CL')}</div>
              <div className="nota-text">{n.texto}</div>
            </div>
          ))}
          <textarea value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Agregar nueva nota..." style={{ marginTop: 12, height: 80, resize: 'none' }} />
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={guardarNota} disabled={guardandoNota}>
            <i className="ti ti-check"></i>{guardandoNota ? 'Guardando...' : 'Guardar nota'}
          </button>
        </div>
      )}

      {tab === 'eventos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => setModalAudiencia(true)}>
              <i className="ti ti-plus"></i>Agregar audiencia
            </button>
          </div>
          {causa.eventos?.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Sin audiencias registradas</div>}
          {causa.eventos?.map(e => (
            <div key={e.id} className="alert-item">
              <div className="alert-icon" style={{ background: 'rgba(79,124,255,.1)' }}>
                <i className="ti ti-calendar-event" style={{ color: 'var(--accent)', fontSize: 17 }}></i>
              </div>
              <div className="alert-text">
                <div className="alert-title">{e.titulo}</div>
                {e.descripcion && <div className="alert-sub">{e.descripcion}</div>}
              </div>
              <div className="alert-time" style={{ color: 'var(--muted)' }}>{formatFecha(e.fecha)}{e.hora ? ` · ${e.hora}` : ''}</div>
            </div>
          ))}
        </div>
      )}

      {modalAudiencia && (
        <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && setModalAudiencia(false)}>
          <div className="modal">
            <div className="modal-title">Agregar audiencia</div>
            <div className="form-group"><label className="form-label">Título *</label><input value={nuevaAudiencia.titulo} onChange={e => setAud('titulo', e.target.value)} placeholder="Audiencia preparatoria" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Fecha *</label><input type="date" value={nuevaAudiencia.fecha} onChange={e => setAud('fecha', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Hora</label><input type="time" value={nuevaAudiencia.hora} onChange={e => setAud('hora', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Tipo</label>
              <select value={nuevaAudiencia.tipo} onChange={e => setAud('tipo', e.target.value)}>
                <option value="audiencia">Audiencia</option>
                <option value="pp">Vencimiento PP</option>
                <option value="plazo">Plazo procesal</option>
                <option value="sentencia">Sentencia</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Descripción</label><textarea value={nuevaAudiencia.descripcion} onChange={e => setAud('descripcion', e.target.value)} style={{ height: 70, resize: 'none' }} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalAudiencia(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarAudiencia} disabled={guardandoAudiencia}><i className="ti ti-check"></i>{guardandoAudiencia ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmarEliminar && (
        <ModalConfirmar
          titulo="Eliminar causa"
          descripcion={`¿Eliminas permanentemente la Causa N° ${causa.numero}? Esta acción no se puede deshacer.`}
          onConfirmar={eliminarCausa}
          onCancelar={() => setConfirmarEliminar(false)}
        />
      )}

      {confirmarArchivar && (
        <ModalConfirmar
          titulo="Archivar causa"
          descripcion={`¿Archivas la Causa N° ${causa.numero}? Se marcará como sobreseída pero podrás seguir consultándola.`}
          onConfirmar={archivarCausa}
          onCancelar={() => setConfirmarArchivar(false)}
          peligro={false}
        />
      )}

      {confirmarEliminarDoc && (
        <ModalConfirmar
          titulo="Eliminar documento"
          descripcion={`¿Eliminas "${confirmarEliminarDoc.nombre}"? Esta acción no se puede deshacer.`}
          onConfirmar={() => eliminarDocumento(confirmarEliminarDoc)}
          onCancelar={() => setConfirmarEliminarDoc(null)}
        />
      )}
    </>
  )
}
