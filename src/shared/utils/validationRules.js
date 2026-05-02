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
  differentFrom:
    (getter, message = 'El valor debe ser diferente') =>
    (v) =>
      v !== getter() || message,
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
}
