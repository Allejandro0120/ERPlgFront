export const CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
])

export const allow = {
  onlyDigits: /^[0-9]$/,
  numericWithDash: /^[0-9-]$/,
  decimal: /^[0-9.,]$/,
  onlyLetters: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]$/,
  onlyLettersNoAccents: /^[a-zA-Z\s]$/,
  alphanumericDash: /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ_-]$/,
  alphanumericDashDot: /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ_.\- ]$/,
  onlyDigitsAndDot: /^[0-9.]$/,
  alphanumericDashNoAccents: /^[a-zA-Z0-9_-]$/,
}

function isValidChar(char, pattern) {
  return pattern.test(char)
}

export function blockKey(event, pattern) {
  if (CONTROL_KEYS.has(event.key) || event.ctrlKey || event.metaKey) return
  if (!isValidChar(event.key, pattern)) event.preventDefault()
}

export function blockPaste(event, pattern) {
  const text = event.clipboardData?.getData('text') ?? ''
  if (!text.split('').every((char) => isValidChar(char, pattern))) {
    event.preventDefault()
  }
}

export function sanitizeInput(value, pattern) {
  if (!value) return value
  return value
    .split('')
    .filter((char) => pattern.test(char))
    .join('')
}
