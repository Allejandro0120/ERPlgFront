/**
 * Formatea una fecha ISO a DD/MM/YYYY (sin conversión de zona horaria)
 * @param {string} isoDate — ej: "2026-05-25T20:55:39.000Z"
 * @returns {string} — ej: "25/05/2026"
 */
export function formatDate(isoDate) {
  const date  = new Date(isoDate);
  const day   = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year  = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha ISO a hora en formato 12h con am/pm (sin conversión de zona horaria)
 * @param {string} isoDate — ej: "2026-05-25T20:55:39.000Z"
 * @returns {string} — ej: "8:55 pm"
 */
export function formatTime12h(isoDate) {
  const date    = new Date(isoDate);
  let   hours   = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const period  = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}

/**
 * Combina fecha y hora en un solo string
 * @param {string} isoDate — ej: "2026-05-25T20:55:39.000Z"
 * @returns {string} — ej: "25/05/2026, 8:55 pm"
 */
export function formatDateTime(isoDate) {
  return `${formatDate(isoDate)}, ${formatTime12h(isoDate)}`;
}