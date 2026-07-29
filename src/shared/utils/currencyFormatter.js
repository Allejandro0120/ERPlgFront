/**
 * Formats a number or string into Colombian Peso format without the currency symbol ($).
 * Uses period (.) for thousands and comma (,) for decimals.
 * Handles partial inputs for typing.
 * Example: 1234.56 -> "1.234,56"
 */
export function formatCOP(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const strValue = String(value)

  // ✅ Solo normaliza si es claramente un número del backend:
  // 4+ dígitos enteros + punto + dígitos (ej: "8600000.5")
  // El usuario nunca llega aquí porque al escribir "1234" ya tiene puntos: "1.234"
  const normalized = /^\d{4,}\.\d+$/.test(strValue) ? strValue.replace('.', ',') : strValue

  const cleanValue = normalized.replace(/[^\d,]/g, '')

  const parts = cleanValue.split(',')
  let integerPart = parts[0]

  let decimalPart = ''
  if (parts.length > 1) {
    decimalPart = ',' + parts[1].slice(0, 2)
  }

  if (integerPart) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  return integerPart + decimalPart
}

/**
 * Parses a COP formatted string into a standard JavaScript number.
 * Example: "1.234,56" -> 1234.56
 */
export function parseCOP(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  // Remove dots and convert comma to dot for parsing
  const clean = String(value).replace(/\./g, '').replace(',', '.')
  const number = Number.parseFloat(clean)
  return Number.isNaN(number) ? null : number
}
