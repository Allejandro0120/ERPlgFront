export const rules = {
  required: (v) => {
    if (typeof v === "string")
      return (v && v.trim().length > 0) || "Este campo es obligatorio";
    return (
      (v !== null && v !== undefined && v !== "") || "Este campo es obligatorio"
    );
  },
  email: (v) => !v || /.+@.+\..+/.test(v) || "Correo no válido",
  soloDigitosGuion: (v) =>
    !v || /^[0-9\-]+$/.test(v) || "Solo se permiten números y guion ( - )",
  minLength:
    (len = 1, label = "Este campo") =>
    (v) =>
      (v && v.length >= len) ||
      `${label} debe tener al menos ${len} caracteres`,
  differentFrom:
    (getter, message = "El valor debe ser diferente") =>
    (v) =>
      v !== getter() || message,
  matchesWith:
    (getter, message = "Los valores no coinciden") =>
    (v) =>
      v === getter() || message,
  passwordStrength: (v) => {
    if (!v) return true;
    const errors = [];
    if (v.length < 8) errors.push("al menos 8 caracteres");
    if (!/[A-Z]/.test(v)) errors.push("una mayúscula");
    if (!/[a-z]/.test(v)) errors.push("una minúscula");
    if (!/[0-9]/.test(v)) errors.push("un número");
    if (!/[^A-Za-z0-9]/.test(v)) errors.push("un carácter especial (!@#$...)");
    return errors.length === 0 || `Debe contener: ${errors.join(", ")}`;
  },
};
