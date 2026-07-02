import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'

function formatRUT(value) {
  const clean = value.replace(/[^0-9kK]/g, '')
  if (clean.length <= 1) return clean
  const cuerpo = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${clean.slice(-1)}`
}

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

const TIPOS_ABOGADO = [
  'Penal', 'Civil', 'Familia', 'Laboral', 'Corporativo',
  'Tributario', 'Administrativo', 'Migratorio / Extranjería', 'Otro'
]

export default function CompletarPerfil() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', rut: '', telefono: '', tipo_abogado: '' })
  const [rutValido, setRutValido] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onRUT = (v) => {
    const f = formatRUT(v)
    set('rut', f)
    if (f.length >= 9) setRutValido(validarRUT(f))
    else setRutValido(null)
  }

  const salir = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const guardar = async () => {
    setError('')
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.tipo_abogado) { setError('Seleccioná tu especialidad'); return }
    if (!form.rut) { setError('El RUT es obligatorio'); return }
    if (!validarRUT(form.rut)) { setError('El RUT ingresado no es válido'); return }
    setGuardando(true)
    try {
      const { error: errUpdate } = await supabase.auth.updateUser({
        data: {
          nombre: form.nombre.trim(),
          rut: form.rut,
          telefono: form.telefono,
          tipo_abogado: form.tipo_abogado,
          perfil_completo: true
        }
      })
      if (errUpdate) throw errUpdate
      navigate('/')
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const labelStyle = {
    fontSize: 11, color: 'var(--muted)', fontWeight: 600,
    letterSpacing: '.06em', textTransform: 'uppercase',
    marginBottom: 4, display: 'block'
  }
  const inputStyle = { padding: '8px 10px', fontSize: 13 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px 28px', width: '100%', maxWidth: 440 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
              CausaLegal
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Completá tu perfil para continuar
            </div>
          </div>
          <button
            onClick={salir}
            style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}
          >
            <i className="ti ti-logout" style={{ fontSize: 14 }}></i>
            Salir
          </button>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: 14, padding: '8px 12px', fontSize: 12 }}>{error}</div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Nombre completo *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Jorge López" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Especialidad *</label>
          <select value={form.tipo_abogado} onChange={e => set('tipo_abogado', e.target.value)} style={inputStyle}>
            <option value="">Seleccioná tu área...</option>
            {TIPOS_ABOGADO.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>RUT *</label>
            <div style={{ position: 'relative' }}>
              <input value={form.rut} onChange={e => onRUT(e.target.value)} placeholder="12.345.678-9" maxLength={12} style={{ ...inputStyle, paddingRight: 28 }} />
              {rutValido !== null && (
                <i className={`ti ${rutValido ? 'ti-circle-check' : 'ti-circle-x'}`}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: rutValido ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}
                ></i>
              )}
            </div>
            {rutValido === false && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>RUT inválido</div>}
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" type="tel" style={inputStyle} />
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 10 }} onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Continuar a CausaLegal'}
        </button>
      </div>
    </div>
  )
}
