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

  // Convert to string to handle partial inputs
  const strValue = String(value)

  // 1. Clean the input: keep only digits and comma
  // This removes existing dots so we can re-format correctly
  const cleanValue = strValue.replace(/[^\d,]/g, '')

  // 2. Handle multiple commas: keep only the first one
  const parts = cleanValue.split(',')
  let integerPart = parts[0]

  // If there is a decimal part, take the comma and up to 2 decimal digits
  let decimalPart = ''
  if (parts.length > 1) {
    decimalPart = ',' + parts[1].slice(0, 2)
  }

  // 3. Format the integer part with thousands separators (dots)
  // Regex to insert dots every 3 digits from the right
  if (integerPart) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // 4. Combine parts
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
