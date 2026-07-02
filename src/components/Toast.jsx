import { useEffect, useState } from 'react'

let toastFn = null

export function toast(mensaje, tipo = 'success') {
  if (toastFn) toastFn(mensaje, tipo)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastFn = (mensaje, tipo) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, mensaje, tipo }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    return () => { toastFn = null }
  }, [])

  const iconos = { success: 'ti-circle-check', error: 'ti-circle-x', warn: 'ti-alert-triangle', info: 'ti-info-circle' }
  const colores = { success: 'var(--success)', error: 'var(--danger)', warn: 'var(--warn)', info: 'var(--accent)' }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--surface)', border: `1px solid ${colores[t.tipo]}`,
          borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          animation: 'slideIn .3s ease'
        }}>
          <i className={`ti ${iconos[t.tipo]}`} style={{ color: colores[t.tipo], fontSize: 18, flexShrink: 0 }}></i>
          <span style={{ fontSize: 13 }}>{t.mensaje}</span>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  )
}
