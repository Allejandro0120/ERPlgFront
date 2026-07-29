/**
 * Formatea una fecha ISO a DD/MM/YYYY
 * NOTA: no aplica ninguna conversión de zona horaria — toma los
 * componentes tal cual vienen en el string ISO (el backend ya
 * entrega la fecha correcta, aquí solo se formatea).
 * @param {string} isoDate — ej: "2026-06-08T21:14:41.303Z"
 * @returns {string} — ej: "08/06/2026"
 */
export function formatDate(isoDate) {
  if (!isoDate) {
    return ''
  }
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formatea una fecha ISO a hora en formato 12h con am/pm
 * NOTA: no aplica ninguna conversión de zona horaria — toma los
 * componentes tal cual vienen en el string ISO.
 * @param {string} isoDate — ej: "2026-06-08T21:14:41.303Z"
 * @returns {string} — ej: "9:14 pm"
 */
export function formatTime12h(isoDate) {
  if (!isoDate) {
    return ''
  }
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  let hours = date.getUTCHours()
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const period = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12 || 12
  return `${hours}:${minutes} ${period}`
}

/**
 * Combina fecha y hora en un solo string
 * @param {string} isoDate — ej: "2026-06-08T21:14:41.303Z"
 * @returns {string} — ej: "08/06/2026, 9:14 pm"
 */
export function formatDateTime(isoDate) {
  const datePart = formatDate(isoDate)
  const timePart = formatTime12h(isoDate)
  if (!datePart) {
    return ''
  }
  return timePart ? `${datePart}, ${timePart}` : datePart
}
