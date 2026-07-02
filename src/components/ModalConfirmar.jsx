export default function ModalConfirmar({ titulo, descripcion, onConfirmar, onCancelar, peligro = true }) {
  return (
    <div className="modal-backdrop open" onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: peligro ? 'rgba(248,113,113,.12)' : 'rgba(79,124,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${peligro ? 'ti-alert-triangle' : 'ti-info-circle'}`} style={{ fontSize: 20, color: peligro ? 'var(--danger)' : 'var(--accent)' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{titulo}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{descripcion}</div>
          </div>
        </div>
        <div className="modal-footer" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button
            className="btn"
            style={{ background: peligro ? 'rgba(248,113,113,.15)' : 'var(--accent)', color: peligro ? 'var(--danger)' : '#fff', border: peligro ? '1px solid rgba(248,113,113,.3)' : 'none' }}
            onClick={onConfirmar}
          >
            {peligro ? <><i className="ti ti-trash"></i>Eliminar</> : <><i className="ti ti-check"></i>Confirmar</>}
          </button>
        </div>
      </div>
    </div>
  )
}
