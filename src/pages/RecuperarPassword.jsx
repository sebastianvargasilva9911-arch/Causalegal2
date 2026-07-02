import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabase'

function nivelPassword(p) {
  if (!p) return { nivel: 0, texto: '', color: '' }
  let pts = 0
  if (p.length >= 6) pts++
  if (p.length >= 10) pts++
  if (/[A-Z]/.test(p)) pts++
  if (/[0-9]/.test(p)) pts++
  const map = [null,
    { nivel: 1, texto: 'Muy débil', color: 'var(--danger)' },
    { nivel: 2, texto: 'Débil', color: '#f97316' },
    { nivel: 3, texto: 'Media', color: 'var(--warn)' },
    { nivel: 4, texto: 'Fuerte', color: 'var(--accent)' },
    { nivel: 5, texto: 'Muy fuerte', color: 'var(--success)' },
  ]
  return map[Math.min(pts, 5)] || map[1]
}

export default function RecuperarPassword() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('solicitar') // 'solicitar' | 'nueva'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarPass, setMostrarPass] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const nivel = nivelPassword(password)

  // Detectar si viene desde el link del email (tiene access_token en la URL)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setModo('nueva')
    }
  }, [])

  const solicitarRecuperacion = async (e) => {
    e.preventDefault()
    setError(''); setMensaje('')
    if (!email) { setError('Ingresá tu email'); return }
    setCargando(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/recuperar-password'
      })
      if (err) throw err
      setMensaje('Te enviamos un email con el link para recuperar tu contraseña. Revisá tu bandeja de entrada.')
    } catch (e) {
      setError(e.message || 'Error al enviar el email')
    } finally {
      setCargando(false)
    }
  }

  const guardarNuevaPassword = async (e) => {
    e.preventDefault()
    setError(''); setMensaje('')
    if (!password) { setError('Ingresá la nueva contraseña'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password.length > 12) { setError('Máximo 12 caracteres'); return }
    if (!/[A-Z]/.test(password)) { setError('Al menos una mayúscula'); return }
    if (!/[0-9]/.test(password)) { setError('Al menos un número'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }
    setCargando(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setMensaje('¡Contraseña actualizada! Redirigiendo...')
      setTimeout(() => navigate('/'), 2000)
    } catch (e) {
      setError(e.message || 'Error al actualizar la contraseña')
    } finally {
      setCargando(false)
    }
  }

  const labelStyle = { fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5, display: 'block' }
  const inputStyle = { padding: '8px 10px', fontSize: 13 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px 28px', width: '100%', maxWidth: 400 }}>

        <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
          CausaLegal
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 22 }}>
          {modo === 'solicitar' ? 'Recuperar contraseña' : 'Crear nueva contraseña'}
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 14, padding: '8px 12px', fontSize: 12 }}>{error}</div>}
        {mensaje && <div style={{ background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.3)', color: 'var(--success)', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14 }}>{mensaje}</div>}

        {/* SOLICITAR RECUPERACION */}
        {modo === 'solicitar' && (
          <form onSubmit={solicitarRecuperacion}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Tu email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 10, marginBottom: 14 }} disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </form>
        )}

        {/* NUEVA PASSWORD */}
        {modo === 'nueva' && (
          <form onSubmit={guardarNuevaPassword}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  maxLength={12}
                  style={{ ...inputStyle, paddingRight: 36 }}
                />
                <button type="button" onClick={() => setMostrarPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 15 }}>
                  <i className={`ti ${mostrarPass ? 'ti-eye-off' : 'ti-eye'}`}></i>
                </button>
              </div>
              {password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                    {[1,2,3,4,5].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= nivel.nivel ? nivel.color : 'var(--border)', transition: 'background .3s' }}></div>)}
                  </div>
                  <div style={{ fontSize: 11, color: nivel.color }}>{nivel.texto}</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarPass ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  maxLength={12}
                  style={{ ...inputStyle, paddingRight: 36 }}
                />
                {confirmar && (
                  <i className={`ti ${password === confirmar ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: password === confirmar ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}></i>
                )}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 10, marginBottom: 14 }} disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/login')}>
            <i className="ti ti-arrow-left" style={{ fontSize: 11 }}></i> Volver al inicio de sesión
          </span>
        </div>
      </div>
    </div>
  )
}
