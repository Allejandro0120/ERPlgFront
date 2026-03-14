/**
 * api/authSession.js
 *
 * Maneja el ciclo de vida de la sesión:
 *  - Cancela todas las peticiones en vuelo cuando la sesión termina.
 *  - Limpia los stores de auth y ui.
 *  - Redirige al login.
 *
 * Se importa en el interceptor de axios y donde sea necesario
 * (p.ej. botón de "Cerrar sesión").
 */

import router from "@/router";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";

// AbortController compartido por toda la app.
// Cuando se cancela, axios lanza un CanceledError en todas las peticiones activas.
let _abortController = new AbortController();

/** Devuelve la señal que deben usar todas las peticiones axios. */
export function getAbortSignal() {
  return _abortController.signal;
}

/** Resetea el controller para que las próximas peticiones sean válidas. */
function resetAbortController() {
  _abortController = new AbortController();
}

/**
 * Cierra la sesión del usuario:
 * 1. Cancela todas las peticiones en vuelo.
 * 2. Limpia los stores.
 * 3. Redirige al login.
 *
 * Es idempotente: si ya estamos en el login no navega de nuevo.
 */
export async function closeSession() {
  // 1. Cancela peticiones en vuelo
  _abortController.abort();
  resetAbortController();

  // 2. Limpia stores
  const authStore = useAuthStore();
  const uiStore = useUiStore();
  authStore.clearAuth();
  uiStore.setActiveModule(null);

  // 3. Redirige al login (solo si no estamos ya ahí)
  if (router.currentRoute.value.name !== "login") {
    await router.push({ name: "login" });
  }
}
