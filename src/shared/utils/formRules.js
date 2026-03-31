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
};
