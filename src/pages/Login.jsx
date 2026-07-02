import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import supabase from '../supabase'

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

function nivelPassword(p) {
  if (!p) return { nivel: 0, texto: '', color: '' }
  let pts = 0
  if (p.length >= 6) pts++
  if (p.length >= 10) pts++
  if (/[A-Z]/.test(p)) pts++
  if (/[0-9]/.test(p)) pts++
  if (/[^A-Za-z0-9]/.test(p)) pts++
  const map = [null,
    { nivel: 1, texto: 'Muy débil', color: 'var(--danger)' },
    { nivel: 2, texto: 'Débil', color: '#f97316' },
    { nivel: 3, texto: 'Media', color: 'var(--warn)' },
    { nivel: 4, texto: 'Fuerte', color: 'var(--accent)' },
    { nivel: 5, texto: 'Muy fuerte', color: 'var(--success)' },
  ]
  return map[Math.min(pts, 5)] || map[1]
}

function validarPassword(p) {
  const e = []
  if (p.length < 6) e.push('Mínimo 6 caracteres')
  if (p.length > 12) e.push('Máximo 12 caracteres')
  if (!/[A-Z]/.test(p)) e.push('Al menos una mayúscula')
  if (!/[0-9]/.test(p)) e.push('Al menos un número')
  return e
}

const TIPOS_ABOGADO = [
  'Penal', 'Civil', 'Familia', 'Laboral', 'Corporativo',
  'Tributario', 'Administrativo', 'Migratorio / Extranjería', 'Otro'
]

export default function Login() {
  const { login, loginGoogle } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '', rut: '', telefono: '', tipo_abogado: '' })
  const [foto, setFoto] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(false)
  const [rutValido, setRutValido] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const onFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setErrorMsg('La foto no puede superar 2MB'); return }
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const onRUT = (v) => {
    const f = formatRUT(v)
    set('rut', f)
    if (f.length >= 9) setRutValido(validarRUT(f))
    else setRutValido(null)
  }

  const nivel = nivelPassword(form.password)
  const erroresPass = form.password ? validarPassword(form.password) : []

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg(''); setMensaje('')
    if (!form.email || !form.password) { setErrorMsg('Completá todos los campos'); return }
    setCargando(true)
    try { await login(form.email, form.password); navigate('/') }
    catch { setErrorMsg('Email o contraseña incorrectos') }
    finally { setCargando(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setErrorMsg(''); setMensaje('')
    if (!form.nombre || !form.email || !form.password) { setErrorMsg('Completá los campos obligatorios'); return }
    if (!form.tipo_abogado) { setErrorMsg('Seleccioná tu especialidad'); return }
    if (!form.rut) { setErrorMsg('El RUT es obligatorio'); return }
    if (!validarRUT(form.rut)) { setErrorMsg('El RUT ingresado no es válido'); return }
    const errPass = validarPassword(form.password)
    if (errPass.length > 0) { setErrorMsg(errPass[0]); return }
    if (form.password !== form.confirmar) { setErrorMsg('Las contraseñas no coinciden'); return }
    setCargando(true)
    try {
      const { data, error: errReg } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { nombre: form.nombre, rut: form.rut, telefono: form.telefono, tipo_abogado: form.tipo_abogado, perfil_completo: true } }
      })
      if (errReg) throw errReg
      if (foto && data.user) {
        const ext = foto.name.split('.').pop()
        await supabase.storage.from('avatars').upload(`${data.user.id}.${ext}`, foto, { upsert: true })
      }
      setMensaje('¡Cuenta creada! Revisá tu email para confirmar.')
      setModo('login')
      setForm(f => ({ ...f, password: '', confirmar: '' }))
    } catch (e) { setErrorMsg(e.message || 'Error al registrar') }
    finally { setCargando(false) }
  }

  const handleGoogle = async () => {
    try { await loginGoogle() }
    catch (e) { setErrorMsg(e.message || 'Error con Google') }
  }

  const inputStyle = { padding: '7px 10px', fontSize: 13 }
  const labelStyle = { fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4, display: 'block' }

  const BtnGoogle = () => (
    <button type="button" onClick={handleGoogle} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: 9, gap: 8 }}>
      <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Continuar con Google
    </button>
  )

  const Divider = ({ texto }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{texto}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px 28px', width: '100%', maxWidth: modo === 'register' ? 500 : 380 }}>

        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
          CausaLegal
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
          {modo === 'login' ? 'Gestión de causas penales' : 'Crear nueva cuenta'}
        </div>

        {errorMsg && <div className="error-msg" style={{ marginBottom: 12, padding: '8px 12px', fontSize: 12 }}>{errorMsg}</div>}
        {mensaje && <div style={{ background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.3)', color: 'var(--success)', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{mensaje}</div>}

        {/* LOGIN */}
        {modo === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Contraseña</label>
                <span style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/recuperar-password')}>
                  ¿Olvidaste tu contraseña?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={mostrarPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 36 }} />
                <button type="button" onClick={() => setMostrarPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 15 }}>
                  <i className={`ti ${mostrarPass ? 'ti-eye-off' : 'ti-eye'}`}></i>
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 9, marginBottom: 2 }} disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
            <Divider texto="o continuá con" />
            <BtnGoogle />
          </form>
        )}

        {/* REGISTER */}
        {modo === 'register' && (
          <form onSubmit={handleRegister}>
            {/* Foto + Nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              <div style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} onClick={() => fileRef.current.click()}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface2)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {fotoPreview ? <img src={fotoPreview} alt="perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="ti ti-camera" style={{ fontSize: 22, color: 'var(--muted)' }}></i>}
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-plus" style={{ fontSize: 10, color: '#fff' }}></i>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFoto} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Jorge López" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Especialidad *</label>
              <select value={form.tipo_abogado} onChange={e => set('tipo_abogado', e.target.value)} style={inputStyle}>
                <option value="">Seleccioná tu área...</option>
                {TIPOS_ABOGADO.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>RUT *</label>
                <div style={{ position: 'relative' }}>
                  <input value={form.rut} onChange={e => onRUT(e.target.value)} placeholder="12.345.678-9" maxLength={12} style={{ ...inputStyle, paddingRight: 28 }} />
                  {rutValido !== null && <i className={`ti ${rutValido ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: rutValido ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}></i>}
                </div>
                {rutValido === false && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>RUT inválido</div>}
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" type="tel" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <div style={{ position: 'relative' }}>
                  <input type={mostrarPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" maxLength={12} style={{ ...inputStyle, paddingRight: 28 }} />
                  <button type="button" onClick={() => setMostrarPass(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14 }}>
                    <i className={`ti ${mostrarPass ? 'ti-eye-off' : 'ti-eye'}`}></i>
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                      {[1,2,3,4,5].map(n => <div key={n} style={{ flex: 1, height: 2, borderRadius: 2, background: n <= nivel.nivel ? nivel.color : 'var(--border)', transition: 'background .3s' }}></div>)}
                    </div>
                    <div style={{ fontSize: 10, color: nivel.color }}>{nivel.texto}</div>
                    {erroresPass.map(e => <div key={e} style={{ fontSize: 10, color: 'var(--danger)' }}>• {e}</div>)}
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Confirmar *</label>
                <div style={{ position: 'relative' }}>
                  <input type={mostrarPass ? 'text' : 'password'} value={form.confirmar} onChange={e => set('confirmar', e.target.value)} placeholder="••••••••" maxLength={12} style={{ ...inputStyle, paddingRight: 28 }} />
                  {form.confirmar && <i className={`ti ${form.password === form.confirmar ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: form.password === form.confirmar ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}></i>}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 9, marginBottom: 2 }} disabled={cargando}>
              {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            <Divider texto="o registrate con" />
            <BtnGoogle />
          </form>
        )}

        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
          {modo === 'login'
            ? <>¿No tenés cuenta? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => { setModo('register'); setErrorMsg(''); setMensaje('') }}>Registrarse</span></>
            : <>¿Ya tenés cuenta? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => { setModo('login'); setErrorMsg(''); setMensaje('') }}>Iniciar sesión</span></>
          }
        </div>
      </div>
    </div>
  )
}
