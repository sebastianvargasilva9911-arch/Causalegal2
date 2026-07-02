export function etapaClass(etapa) {
  const map = {
    'Investigacion': 'e-investigacion',
    'Investigación': 'e-investigacion',
    'Imputado': 'e-imputado',
    'Procesado': 'e-procesado',
    'A juicio': 'e-juicio',
    'Sentencia': 'e-sentencia',
    'Sobreseido': 'e-sobreseido',
    'Sobreseído': 'e-sobreseido',
  }
  return map[etapa] || 'e-investigacion'
}

export function vencClass(fecha) {
  if (!fecha) return ''
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + 'T00:00:00')
  const diff = Math.ceil((f - hoy) / 86400000)
  if (diff <= 0) return 'venc-hoy'
  if (diff <= 7) return 'venc-prox'
  return 'venc-ok'
}

export function formatFecha(fecha) {
  if (!fecha) return '—'
  const f = new Date(fecha + 'T00:00:00')
  return f.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function diasRestantes(fecha) {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const f = new Date(fecha + 'T00:00:00')
  const diff = Math.ceil((f - hoy) / 86400000)
  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  return `${diff}d`
}
