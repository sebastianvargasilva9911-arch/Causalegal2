import { useState, useRef, useEffect } from 'react'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'

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
  const map = [null,
    { nivel: 1, texto: 'Muy débil', color: 'var(--danger)' },
    { nivel: 2, texto: 'Débil', color: '#f97316' },
    { nivel: 3, texto: 'Media', color: 'var(--warn)' },
    { nivel: 4, texto: 'Fuerte', color: 'var(--accent)' },
    { nivel: 5, texto: 'Muy fuerte', color: 'var(--success)' },
  ]
  return map[Math.min(pts, 5)] || map[1]
}

const TIPOS_ABOGADO = [
  'Penal', 'Civil', 'Familia', 'Laboral', 'Corporativo',
  'Tributario', 'Administrativo', 'Migratorio / Extranjería', 'Otro'
]

export default function Perfil() {
  const { usuario } = useAuth()
  const fileRef = useRef()
  const meta = usuario?.user_metadata || {}

  const [form, setForm] = useState({
    nombre: meta.nombre || '',
    rut: meta.rut || '',
    telefono: meta.telefono || '',
    tipo_abogado: meta.tipo_abogado || '',
  })
  const [rutValido, setRutValido] = useState(meta.rut ? validarRUT(meta.rut) : null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoURL, setFotoURL] = useState(null)

  const [passForm, setPassForm] = useState({ nueva: '', confirmar: '' })
  const [mostrarPass, setMostrarPass] = useState(false)

  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [msgPerfil, setMsgPerfil] = useState('')
  const [errPerfil, setErrPerfil] = useState('')
  const [msgPass, setMsgPass] = useState('')
  const [errPass, setErrPass] = useState('')

  const nivel = nivelPassword(passForm.nueva)

  useEffect(() => {
    // Cargar foto de perfil si existe
    const cargarFoto = async () => {
      if (!usuario) return
      const extensiones = ['jpg', 'jpeg', 'png', 'webp']
      for (const ext of extensiones) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${usuario.id}.${ext}`)
        if (data?.publicUrl) {
          // Verificar si existe
          const res = await fetch(data.publicUrl, { method: 'HEAD' })
          if (res.ok) { setFotoURL(data.publicUrl); break }
        }
      }
    }
    cargarFoto()
  }, [usuario])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setPass = (k, v) => setPassForm(f => ({ ...f, [k]: v }))

  const onRUT = (v) => {
    const f = formatRUT(v)
    set('rut', f)
    if (f.length >= 9) setRutValido(validarRUT(f))
    else setRutValido(null)
  }

  const onFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setErrPerfil('La foto no puede superar 2MB'); return }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const guardarPerfil = async () => {
    setErrPerfil(''); setMsgPerfil('')
    if (!form.nombre.trim()) { setErrPerfil('El nombre es obligatorio'); return }
    if (form.rut && !validarRUT(form.rut)) { setErrPerfil('El RUT ingresado no es válido'); return }
    setGuardandoPerfil(true)
    try {
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop()
        await supabase.storage.from('avatars').upload(`${usuario.id}.${ext}`, fotoFile, { upsert: true })
        const { data } = supabase.storage.from('avatars').getPublicUrl(`${usuario.id}.${ext}`)
        setFotoURL(data.publicUrl)
        setFotoFile(null)
        setFotoPreview(null)
      }
      const { error } = await supabase.auth.updateUser({
        data: { ...meta, nombre: form.nombre.trim(), rut: form.rut, telefono: form.telefono, tipo_abogado: form.tipo_abogado }
      })
      if (error) throw error
      setMsgPerfil('Perfil actualizado correctamente')
    } catch (e) {
      setErrPerfil(e.message || 'Error al guardar')
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const guardarPassword = async () => {
    setErrPass(''); setMsgPass('')
    if (!passForm.nueva) { setErrPass('Ingresá la nueva contraseña'); return }
    if (passForm.nueva.length < 6) { setErrPass('Mínimo 6 caracteres'); return }
    if (passForm.nueva.length > 12) { setErrPass('Máximo 12 caracteres'); return }
    if (!/[A-Z]/.test(passForm.nueva)) { setErrPass('Al menos una mayúscula'); return }
    if (!/[0-9]/.test(passForm.nueva)) { setErrPass('Al menos un número'); return }
    if (passForm.nueva !== passForm.confirmar) { setErrPass('Las contraseñas no coinciden'); return }
    setGuardandoPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.nueva })
      if (error) throw error
      setMsgPass('Contraseña actualizada correctamente')
      setPassForm({ nueva: '', confirmar: '' })
    } catch (e) {
      setErrPass(e.message || 'Error al cambiar contraseña')
    } finally {
      setGuardandoPass(false)
    }
  }

  const labelStyle = { fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5, display: 'block' }

  const fotoActual = fotoPreview || fotoURL
  const iniciales = form.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 2 }}>Mi perfil</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{usuario?.email}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* DATOS PERSONALES */}
        <div className="card">
          <div className="section-title"><i className="ti ti-user-circle"></i>Datos personales</div>

          {/* Foto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface2)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {fotoActual
                  ? <img src={fotoActual} alt="perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--accent)' }}>{iniciales}</span>
                }
              </div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-camera" style={{ fontSize: 11, color: '#fff' }}></i>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFoto} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{form.nombre || 'Sin nombre'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{form.tipo_abogado || 'Sin especialidad'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Clic en la foto para cambiarla</div>
            </div>
          </div>

          {errPerfil && <div className="error-msg" style={{ marginBottom: 12, padding: '8px 12px', fontSize: 12 }}>{errPerfil}</div>}
          {msgPerfil && <div style={{ background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.3)', color: 'var(--success)', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{msgPerfil}</div>}

          <div className="form-group">
            <label style={labelStyle}>Nombre completo *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Jorge López" />
          </div>

          <div className="form-group">
            <label style={labelStyle}>Especialidad</label>
            <select value={form.tipo_abogado} onChange={e => set('tipo_abogado', e.target.value)}>
              <option value="">Seleccioná tu área...</option>
              {TIPOS_ABOGADO.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label style={labelStyle}>RUT</label>
              <div style={{ position: 'relative' }}>
                <input value={form.rut} onChange={e => onRUT(e.target.value)} placeholder="12.345.678-9" maxLength={12} style={{ paddingRight: 32 }} />
                {rutValido !== null && (
                  <i className={`ti ${rutValido ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: rutValido ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}></i>
                )}
              </div>
              {rutValido === false && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 3 }}>RUT inválido</div>}
            </div>
            <div className="form-group">
              <label style={labelStyle}>Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+56 9 1234 5678" type="tel" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-primary" onClick={guardarPerfil} disabled={guardandoPerfil}>
              <i className={`ti ${guardandoPerfil ? 'ti-loader-2' : 'ti-check'}`}></i>
              {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* SEGURIDAD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {usuario?.app_metadata?.provider === 'google' ? (
            <div className="card">
              <div className="section-title"><i className="ti ti-brand-google"></i>Contraseña</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(79,124,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-info-circle" style={{ color: 'var(--accent)', fontSize: 18 }}></i>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Tu cuenta usa <strong style={{ color: 'var(--text)' }}>Google</strong> para iniciar sesión. La contraseña se administra desde tu cuenta de Google.
                </div>
              </div>
            </div>
          ) : (
          <div className="card">
            <div className="section-title"><i className="ti ti-lock"></i>Cambiar contraseña</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Mínimo 6 caracteres, máximo 12, al menos una mayúscula y un número.
            </div>

            {errPass && <div className="error-msg" style={{ marginBottom: 12, padding: '8px 12px', fontSize: 12 }}>{errPass}</div>}
            {msgPass && <div style={{ background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.3)', color: 'var(--success)', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>{msgPass}</div>}

            <div className="form-group">
              <label style={labelStyle}>Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={mostrarPass ? 'text' : 'password'} value={passForm.nueva} onChange={e => setPass('nueva', e.target.value)} placeholder="••••••••" maxLength={12} style={{ paddingRight: 36 }} />
                <button type="button" onClick={() => setMostrarPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 15 }}>
                  <i className={`ti ${mostrarPass ? 'ti-eye-off' : 'ti-eye'}`}></i>
                </button>
              </div>
              {passForm.nueva && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                    {[1,2,3,4,5].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: n <= nivel.nivel ? nivel.color : 'var(--border)', transition: 'background .3s' }}></div>)}
                  </div>
                  <div style={{ fontSize: 11, color: nivel.color }}>{nivel.texto}</div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label style={labelStyle}>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={mostrarPass ? 'text' : 'password'} value={passForm.confirmar} onChange={e => setPass('confirmar', e.target.value)} placeholder="••••••••" maxLength={12} style={{ paddingRight: 36 }} />
                {passForm.confirmar && (
                  <i className={`ti ${passForm.nueva === passForm.confirmar ? 'ti-circle-check' : 'ti-circle-x'}`} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: passForm.nueva === passForm.confirmar ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}></i>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={guardarPassword} disabled={guardandoPass}>
                <i className={`ti ${guardandoPass ? 'ti-loader-2' : 'ti-lock'}`}></i>
                {guardandoPass ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </div>
          )}

          {/* Info de cuenta */}
          <div className="card">
            <div className="section-title"><i className="ti ti-info-circle"></i>Información de cuenta</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Email</span>
                <span style={{ fontWeight: 500 }}>{usuario?.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Proveedor</span>
                <span style={{ fontWeight: 500 }}>{usuario?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Cuenta creada</span>
                <span style={{ fontWeight: 500 }}>{usuario?.created_at ? new Date(usuario.created_at).toLocaleDateString('es-CL') : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Especialidad</span>
                <span style={{ fontWeight: 500 }}>{form.tipo_abogado || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
