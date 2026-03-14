/**

 * Fuente de verdad única para los códigos de error de autenticación.
 * Cada código viene tal cual lo envía el backend, con closeSession
 * indicando si el front debe cerrar la sesión al recibirlo.
 *
 * Para agregar un caso nuevo: solo añadir una entrada aquí.
 */

export const AUTH_CODES = {
  SESSION_CLOSED: { closeSession: true },
  SESSION_EXPIRED: { closeSession: true },
  TOKEN_INVALID: { closeSession: true },
  TOKEN_EXPIRED: { closeSession: true },
  AUTHENTICATION_FAILED: { closeSession: false },
};
