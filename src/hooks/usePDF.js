export function exportarCausaPDF(causa) {
  const imp = causa.imputados?.[0]
  const fecha = (f) => {
    if (!f) return '—'
    const d = new Date(f + 'T00:00:00')
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Causa N° ${causa.numero}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid #4f7cff; }
        .logo { font-size: 22px; font-weight: 700; color: #4f7cff; }
        .fecha-impresion { font-size: 11px; color: #666; text-align: right; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .etapa { display: inline-block; background: #e8f0ff; color: #4f7cff; font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
        .item { background: #f8f9fc; border-radius: 8px; padding: 10px 13px; }
        .item-label { font-size: 10px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
        .item-value { font-size: 13px; font-weight: 500; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: 700; color: #4f7cff; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0; }
        .tl-item { display: flex; gap: 12px; margin-bottom: 10px; }
        .tl-dot { width: 8px; height: 8px; border-radius: 50%; background: #4f7cff; flex-shrink: 0; margin-top: 5px; }
        .tl-title { font-size: 13px; font-weight: 500; }
        .tl-desc { font-size: 12px; color: #666; }
        .tl-date { font-size: 11px; color: #999; }
        .nota { background: #f8f9fc; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; font-size: 12px; }
        .nota-fecha { font-size: 10px; color: #999; margin-bottom: 3px; }
        .evento { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
        .pp-critica { background: #fff3f3; border: 1px solid #ffcdd2; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; color: #c62828; font-size: 12px; font-weight: 500; }
        .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #999; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">● CausaLegal</div>
          <div style="font-size:11px;color:#666;margin-top:2px">Resumen de causa</div>
        </div>
        <div class="fecha-impresion">
          Generado el ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}<br>
          ${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
        </div>
      </div>

      ${causa.pp_vencimiento ? `
        <div class="pp-critica">
          ⚠️ Prisión preventiva vence el ${fecha(causa.pp_vencimiento)} — verificar renovación o excarcelación
        </div>
      ` : ''}

      <h1>Causa N° ${causa.numero}</h1>
      <div style="font-size:13px;color:#666;margin-bottom:8px">${causa.caratula}</div>
      <span class="etapa">${causa.etapa}</span>

      <div class="grid">
        <div class="item"><div class="item-label">Imputado</div><div class="item-value">${imp?.nombre || '—'}</div></div>
        <div class="item"><div class="item-label">RUT</div><div class="item-value">${imp?.rut || '—'}</div></div>
        <div class="item"><div class="item-label">Estado</div><div class="item-value">${imp?.estado || '—'}</div></div>
        <div class="item"><div class="item-label">Tribunal</div><div class="item-value">${causa.tribunal || '—'}</div></div>
        <div class="item"><div class="item-label">Fiscal</div><div class="item-value">${causa.fiscal || '—'}</div></div>
        <div class="item"><div class="item-label">Delito</div><div class="item-value">${causa.delito || '—'}</div></div>
        <div class="item"><div class="item-label">Fecha inicio</div><div class="item-value">${fecha(causa.fecha_inicio)}</div></div>
        <div class="item"><div class="item-label">Venc. PP</div><div class="item-value" style="color:${causa.pp_vencimiento ? '#c62828' : 'inherit'}">${causa.pp_vencimiento ? fecha(causa.pp_vencimiento) : 'Sin PP'}</div></div>
        <div class="item"><div class="item-label">Unidad penitenciaria</div><div class="item-value">${causa.unidad_penitenciaria || '—'}</div></div>
      </div>

      ${causa.historial?.length > 0 ? `
        <div class="section">
          <div class="section-title">Historial procesal</div>
          ${causa.historial.map(h => `
            <div class="tl-item">
              <div class="tl-dot"></div>
              <div>
                <div class="tl-title">${h.titulo}</div>
                ${h.descripcion ? `<div class="tl-desc">${h.descripcion}</div>` : ''}
                <div class="tl-date">${new Date(h.creado_en).toLocaleDateString('es-CL')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${causa.eventos?.length > 0 ? `
        <div class="section">
          <div class="section-title">Audiencias y eventos</div>
          ${causa.eventos.map(e => `
            <div class="evento">
              <span>${e.titulo}</span>
              <span style="color:#666">${fecha(e.fecha)}${e.hora ? ' · ' + e.hora + ' hrs' : ''}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${causa.notas?.length > 0 ? `
        <div class="section">
          <div class="section-title">Notas</div>
          ${causa.notas.map(n => `
            <div class="nota">
              <div class="nota-fecha">${new Date(n.creado_en).toLocaleDateString('es-CL')}</div>
              ${n.texto}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="footer">
        Documento generado por CausaLegal · ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </body>
    </html>
  `

  const ventana = window.open('', '_blank')
  ventana.document.write(html)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => ventana.print(), 500)
}
