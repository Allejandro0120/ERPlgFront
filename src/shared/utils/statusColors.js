// ─── Dominios de Estado (Evitar Magic Strings) ────────────────────────────────
export const DOMINIOS_ESTADO = {
  CLIENTE: 'CLIENTE',
  SUCURSAL: 'SUCURSAL',
  PEDIDO: 'PEDIDO',
  FACTURA: 'FACTURA',
  USUARIO: 'USUARIO',
  ACTA: 'ACTA',
  PRODUCTO_ACTA: 'PRODUCTO_ACTA',
}

// ─── Mapeo de colores por dominio ─────────────────────────────────────────────
const ESTADO_COLORS = {
  [DOMINIOS_ESTADO.CLIENTE]: {
    activo: 'success',
    inactivo: 'error',
    restringido: 'warning',
    suspendido: 'grey',
  },
  [DOMINIOS_ESTADO.SUCURSAL]: {
    habilitada: 'success',
    deshabilitada: 'error',
  },
  [DOMINIOS_ESTADO.ACTA]: {
    pendiente: 'warning',
    cerrada: 'success',
    borrador: 'grey',
  },
  [DOMINIOS_ESTADO.PRODUCTO_ACTA]: {
    aceptado: 'success',
    rechazado: 'error',
  },
}

// ─── Mapeo semántico para valores booleanos por dominio ───────────────────────
const BOOLEAN_KEYS = {
  [DOMINIOS_ESTADO.SUCURSAL]: { true: 'habilitada', false: 'deshabilitada' },
  [DOMINIOS_ESTADO.PRODUCTO_ACTA]: { true: 'aceptado', false: 'rechazado' },
}

/**
 * Obtiene el color Vuetify para un estado dado.
 * @param {string|number|boolean} valor - Nombre, ID o booleano del estado
 * @param {string} dominio - Usar DOMINIOS_ESTADO (ej: DOMINIOS_ESTADO.CLIENTE)
 * @returns {string} Color de Vuetify (ej: "success", "error", "grey")
 */
export function getEstadoColor(valor, dominio = DOMINIOS_ESTADO.CLIENTE) {
  const colorMap = ESTADO_COLORS[dominio] ?? ESTADO_COLORS[DOMINIOS_ESTADO.CLIENTE]

  if (typeof valor === 'boolean') {
    const boolMap = BOOLEAN_KEYS[dominio]
    // String(true) → "true", evita coerción implícita
    const key = boolMap?.[String(valor)] ?? (valor ? 'activo' : 'inactivo')
    return colorMap[key] ?? 'grey'
  }

  const key = (valor ?? '').toString().trim().toLowerCase()
  return colorMap[key] ?? 'grey'
}
