import { useState } from 'react'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from './Toast'

function validarRUT(rut) {
  if (!rut) return false
  const clean = rut.replace(/[^0-9kK]/g, '')
  if (clean.length < 8) return false
  const cuerpo = clean.slice(0, -1)
  const dv = clean.slice(-1).toLowerCase()
  let suma = 0, multiplo = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo
    multiplo = multiplo < 7 ? multiplo + 1 : 2
  }
  const dvEsperado = 11 - (suma % 11)
  const dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : String(dvEsperado)
  return dv === dvCalc
}

function formatRUT(value) {
  const clean = value.replace(/[^0-9kK]/g, '')
  if (clean.length <= 1) return clean
  const cuerpo = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${clean.slice(-1)}`
}

const etapas = ['Investigacion', 'Imputado', 'Procesado', 'A juicio', 'Sentencia']
const tribunales = [
  '1° Juzgado Civil de Puerto Montt', '2° Juzgado Civil de Puerto Montt',
  'Juzgado de Letras del Trabajo de Puerto Montt', 'Juzgado de Familia de Puerto Montt',
  'Juzgado de Garantía de Puerto Montt', 'Tribunal de Juicio Oral en lo Penal de Puerto Montt', 'Otro'
]

export default function ModalNuevaCausa({ onClose, onCreada }) {
  const { usuario } = useAuth()
  const [form, setForm] = useState({
    numero: '', caratula: '', delito: '', tribunal: '', fiscal: '',
    etapa: '', fecha_inicio: '', pp_vencimiento: '',
    unidad_penitenciaria: '', imputado_nombre: '', imputado_rut: ''
  })
  const [rutValido, setRutValido] = useState(null)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onRUT = (v) => {
    const f = formatRUT(v)
    set('imputado_rut', f)
    if (f.length >= 9) setRutValido(validarRUT(f))
    else setRutValido(null)
  }

  const guardar = async () => {
    setError('')

    // Validar todos los campos obligatorios
    if (!form.numero.trim()) { setError('El número de causa es obligatorio'); return }
    if (!form.caratula.trim()) { setError('La carátula es obligatoria'); return }
    if (!form.imputado_nombre.trim()) { setError('El nombre del imputado es obligatorio'); return }
    if (!form.imputado_rut.trim()) { setError('El RUT del imputado es obligatorio'); return }
    if (!validarRUT(form.imputado_rut)) { setError('El RUT del imputado no es válido'); return }
    if (!form.etapa) { setError('La etapa procesal es obligatoria'); return }
    if (!form.tribunal) { setError('El tribunal es obligatorio'); return }
    if (!form.delito.trim()) { setError('El delito es obligatorio'); return }
    if (!form.fiscal.trim()) { setError('El fiscal es obligatorio'); return }
    if (!form.fecha_inicio) { setError('La fecha de inicio es obligatoria'); return }

    setGuardando(true)
    try {
      const { data: causa, error: errCausa } = await supabase.from('causas').insert({
        numero: form.numero.trim(),
        caratula: form.caratula.trim(),
        delito: form.delito.trim(),
        tribunal: form.tribunal,
        fiscal: form.fiscal.trim(),
        etapa: form.etapa,
        fecha_inicio: form.fecha_inicio,
        pp_vencimiento: form.pp_vencimiento || null,
        unidad_penitenciaria: form.unidad_penitenciaria || null,
        usuario_id: usuario.id
      }).select().single()

      if (errCausa) throw errCausa

      await supabase.from('imputados').insert({
        nombre: form.imputado_nombre.trim(),
        rut: form.imputado_rut,
        causa_id: causa.id
      })

      await supabase.from('historial').insert({
        titulo: 'Causa creada',
        descripcion: `Causa N° ${form.numero} ingresada al sistema.`,
        causa_id: causa.id
      })

      if (form.pp_vencimiento) {
        await supabase.from('eventos').insert({
          titulo: `Vence prisión preventiva — ${form.imputado_nombre}`,
          fecha: form.pp_vencimiento,
          tipo: 'pp',
          urgencia: 'alta',
          causa_id: causa.id,
          usuario_id: usuario.id
        })
      }

      toast('Causa creada correctamente')
      onCreada(causa.id)
    } catch (e) {
      setError(e.message || 'Error al guardar')
      setGuardando(false)
    }
  }

  return (
    <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Nueva causa</div>
        {error && <div className="error-msg" style={{ marginBottom: 14, fontSize: 12, padding: '8px 12px' }}>{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Número de causa *</label>
            <input value={form.numero} onChange={e => set('numero', e.target.value)} placeholder="Ej: 9502-2026" />
          </div>
          <div className="form-group">
            <label className="form-label">Etapa procesal *</label>
            <select value={form.etapa} onChange={e => set('etapa', e.target.value)}>
              {!form.etapa && <option value="">Seleccionar...</option>}
              {etapas.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Carátula * <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>— Ej: Ministerio Público con González</span></label>
          <input value={form.caratula} onChange={e => set('caratula', e.target.value)} placeholder="Ministerio Público con ..." />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Imputado (apellido, nombre) *</label>
            <input value={form.imputado_nombre} onChange={e => set('imputado_nombre', e.target.value)} placeholder="González, Ana" />
          </div>
          <div className="form-group">
            <label className="form-label">RUT del imputado *</label>
            <div style={{ position: 'relative' }}>
              <input
                value={form.imputado_rut}
                onChange={e => onRUT(e.target.value)}
                placeholder="12.345.678-9"
                maxLength={12}
                style={{ paddingRight: 32 }}
              />
              {rutValido !== null && (
                <i className={`ti ${rutValido ? 'ti-circle-check' : 'ti-circle-x'}`}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: rutValido ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}
                ></i>
              )}
            </div>
            {rutValido === false && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>RUT inválido</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tribunal *</label>
            <select value={form.tribunal} onChange={e => set('tribunal', e.target.value)}>
              {!form.tribunal && <option value="">Seleccionar...</option>}
              {tribunales.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Delito imputado *</label>
            <input value={form.delito} onChange={e => set('delito', e.target.value)} placeholder="Ej: Robo con intimidación" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Fiscal a cargo *</label>
            <input value={form.fiscal} onChange={e => set('fiscal', e.target.value)} placeholder="Dr. ..." />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de inicio *</label>
            <input type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Vencimiento Prisión Preventiva
              <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 4 }}>(si aplica)</span>
            </label>
            <input type="date" value={form.pp_vencimiento} onChange={e => set('pp_vencimiento', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Unidad penitenciaria <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(si está detenido)</span></label>
            <input value={form.unidad_penitenciaria} onChange={e => set('unidad_penitenciaria', e.target.value)} placeholder="CDP ..." />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            <i className={`ti ${guardando ? 'ti-loader-2' : 'ti-check'}`}></i>
            {guardando ? 'Guardando...' : 'Crear causa'}
          </button>
        </div>
      </div>
    </div>
  )
}
