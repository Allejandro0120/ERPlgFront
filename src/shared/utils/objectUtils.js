/**
 * Construye un objeto con solo los campos indicados,
 * aplicando defaults cuando el campo es undefined o null.
 */
export function pickFields(source, fields, defaults = {}) {
  return Object.fromEntries(fields.map((key) => [key, source[key] ?? defaults[key] ?? null]))
}
