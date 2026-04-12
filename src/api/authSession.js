import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/api/services/authService";
import { $loading } from "@/plugins/loading/loading";
import router from "@/router"; // <-- Importamos desde el router

let abortController = new AbortController();
let refreshPromise = null;
let isClosingSession = false;
let closeSessionPromise = null;

const NO_SERVER_LOGOUT_CODES = new Set(["SESSION_REVOKED", "SESSION_CLOSED"]);

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getAbortSignal() {
  return abortController.signal;
}

export function isSessionClosing() {
  return isClosingSession;
}

export async function closeSession(options = {}) {
  // Evitar cerrar sesión repetidas veces si ya estamos en ese proceso,
  // o si ya no estamos autenticados (la sesión ya fue limpiada).
  if (closeSessionPromise) return closeSessionPromise;
  if (!useAuthStore().isAuthenticated && !useAuthStore().accessTokenHint) return;

  const {
    code = null,
    skipServerLogout = false,
    showRevokedLoading = code === "SESSION_REVOKED",
  } = options;

  isClosingSession = true;

  closeSessionPromise = (async () => {
    const mustSkipServerLogout =
      skipServerLogout || NO_SERVER_LOGOUT_CODES.has(code);

    try {
      if (showRevokedLoading) {
        $loading.show("Tu sesión fue revocada. Redirigiendo...");
        await wait(1000);
      }

      if (!mustSkipServerLogout) {
        await authService.logout();
      }
    } catch (error) {
      // ignorar
      console.error("Fallo la redirección al login:", error);
    } finally {
      abortController.abort();
      abortController = new AbortController();
      useAuthStore().clearAuth();
      $loading.hide();
      console.log("Redirigiendo al login...");
      // REDIRECCIÓN AL LOGIN!
      await router.replace({ name: "login" }).catch((err) => {
        console.error("Router error:", err);
      }); // primero redirigir
      isClosingSession = false; // luego limpiar
      closeSessionPromise = null;
    }
  })();

  return closeSessionPromise;
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
        await closeSession({ code, skipServerLogout: true });
      }
      return false;
    } finally {
      refreshPromise = null; // ← acá sí va el finally: siempre permitir un nuevo intento
    }
  })();

  return refreshPromise;
}
