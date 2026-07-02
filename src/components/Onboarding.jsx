import { useState } from 'react'

const pasos = [
  { icono: 'ti-folder-plus', titulo: 'Creá tu primera causa', desc: 'Usá el botón "Nueva causa" en la parte superior para registrar una causa con todos sus datos.' },
  { icono: 'ti-bell', titulo: 'Controlá los vencimientos', desc: 'Las alertas te avisan cuando una prisión preventiva o plazo procesal está próximo a vencer.' },
  { icono: 'ti-calendar', titulo: 'Agendá audiencias', desc: 'Desde el Calendario podés registrar audiencias y eventos para no perder ninguna fecha.' },
  { icono: 'ti-file-download', titulo: 'Exportá a PDF', desc: 'Desde la ficha de cada causa podés exportar un resumen completo en PDF para imprimir o compartir.' },
]

export default function Onboarding({ onCerrar }) {
  const [paso, setPaso] = useState(0)
  const ultimo = paso === pasos.length - 1

  return (
    <div className="modal-backdrop open">
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px 28px', width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }}></span>
          Bienvenido a CausaLegal
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 28 }}>Conocé las funciones principales</div>

        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(79,124,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <i className={`ti ${pasos[paso].icono}`} style={{ fontSize: 32, color: 'var(--accent)' }}></i>
        </div>

        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{pasos[paso].titulo}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 }}>{pasos[paso].desc}</div>

        {/* Indicadores */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {pasos.map((_, i) => (
            <div key={i} style={{ width: i === paso ? 20 : 6, height: 6, borderRadius: 3, background: i === paso ? 'var(--accent)' : 'var(--border)', transition: 'all .3s', cursor: 'pointer' }} onClick={() => setPaso(i)}></div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onCerrar}>
            Saltar
          </button>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => ultimo ? onCerrar() : setPaso(p => p + 1)}>
            {ultimo ? <>¡Empezar <i className="ti ti-rocket"></i></> : <>Siguiente <i className="ti ti-arrow-right"></i></>}
          </button>
        </div>
      </div>
    </div>
  )
}
