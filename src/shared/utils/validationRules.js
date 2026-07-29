export const rules = {
  required: (v) => {
    if (typeof v === 'string') {
      return (v && v.trim().length > 0) || 'Este campo es obligatorio'
    }
    return (v !== null && v !== undefined && v !== '') || 'Este campo es obligatorio'
  },
  email: (v) => {
    if (!v) {
      return true
    }

    // Prohibit common Latin-1/Extended letters (tildes/accented chars)
    if (/[\u00C0-\u017F]/.test(v)) {
      return 'No se permiten tildes'
    }

    return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(v) || 'Correo no válido'
  },
  onlyDigitsGuion: (v) => !v || /^[0-9-]+$/.test(v) || 'Solo se permiten números y guion ( - )',
  minLength:
    (len = 1, label = 'Este campo') =>
    (v) =>
      (v && v.length >= len) || `${label} debe tener al menos ${len} caracteres`,
  maxLength:
    (len = 255, label = 'Este campo') =>
    (v) =>
      !v || v.length <= len || `${label} no puede tener más de ${len} caracteres`,
  differentFrom:
    (getter, message = 'El valor debe ser diferente') =>
    (v) =>
      v !== getter() || message,
  numeric: (v) => {
    if (v === null || v === undefined || v === '') {
      return true
    }
    return /^\d+$/.test(String(v)) || 'Solo se permiten valores numéricos'
  },
  matchesWith:
    (getter, message = 'Los valores no coinciden') =>
    (v) =>
      v === getter() || message,
  passwordStrength: (v) => {
    if (!v) {
      return true
    }
    const errors = []
    if (v.length < 8) {
      errors.push('al menos 8 caracteres')
    }
    if (!/[A-Z]/.test(v)) {
      errors.push('una mayúscula')
    }
    if (!/[a-z]/.test(v)) {
      errors.push('una minúscula')
    }
    if (!/[0-9]/.test(v)) {
      errors.push('un número')
    }
    if (!/[^A-Za-z0-9]/.test(v)) {
      errors.push('un carácter especial (!@#$...)')
    }
    return errors.length === 0 || `Debe contener: ${errors.join(', ')}`
  },
  maxValue:
    (max, label = 'El valor') =>
    (v) => {
      if (v === null || v === undefined || v === '') return true
      return Number(v) <= max || `${label} no puede ser mayor a ${max.toLocaleString('es-CO')}`
    },
  maxCOP:
    (max, label = 'El valor') =>
    (v) => {
      if (v === null || v === undefined || v === '') return true
      // "1.234.567,89" → elimina puntos de miles, convierte coma a punto → 1234567.89
      const numeric = Number(String(v).replace(/\./g, '').replace(',', '.'))
      if (Number.isNaN(numeric)) return true
      return numeric <= max || `${label} no puede ser mayor a ${max.toLocaleString('es-CO')}`
    },
}
