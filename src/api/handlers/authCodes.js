/**

 * Fuente de verdad única para los códigos de error de autenticación.
 * Cada código viene tal cual lo envía el backend, con closeSession
 * indicando si el front debe cerrar la sesión al recibirlo.
 *
 * Para agregar un caso nuevo: solo añadir una entrada aquí.
 */

export const AUTH_CODES = {
  SESSION_CLOSED: { action: "logout" },
  SESSION_REVOKED: { action: "logout" },
  SESSION_EXPIRED: { action: "logout" },
  TOKEN_INVALID: { action: "logout" },
  TOKEN_EXPIRED: { action: "refresh" },
  AUTHENTICATION_FAILED: { action: "none" },
};
