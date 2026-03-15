import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/api/services/authService";

let abortController = new AbortController();
let refreshPromise = null;
let isClosingSession = false;

export function getAbortSignal() {
  return abortController.signal;
}

export function isSessionClosing() {
  return isClosingSession;
}

export async function closeSession() {
  if (isClosingSession) return; // ← corta re-entrada
  isClosingSession = true;

  try {
    await authService.logout();
  } catch {
    // ignorar
  } finally {
    abortController.abort();
    abortController = new AbortController();
    useAuthStore().clearAuth();
    isClosingSession = false;
  }
}

/**
 * Intenta refrescar el token una sola vez aunque lleguen N requests con TOKEN_EXPIRED.
 * Si el refresh falla con SESSION_CLOSED o SESSION_REVOKED → cierra sesión.
 * @returns {boolean} true si se refrescó OK, false si hay que cerrar sesión.
 */
export async function tryRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      await authService.refreshToken();
      return true;
    } catch (error) {
      const code = error.response?.data?.code ?? error.response?.data?.error;
      // Si el refresh falla con estos códigos, cerrar sesión
      const fatalCodes = ["SESSION_CLOSED", "SESSION_REVOKED"];
      if (fatalCodes.includes(code)) {
        error._handled = true; // ← Marcar handled ANTES de cerrar sesión
        await closeSession();
      }
      return false;
    } finally {
      refreshPromise = null; // ← acá sí va el finally: siempre permitir un nuevo intento
    }
  })();

  return refreshPromise;
}
