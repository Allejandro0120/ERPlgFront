/**
 * api/middleware/authMiddleware.js
 *
 * Guard de navegación que maneja:
 *  1. Redirigir al login si la ruta requiere auth y no hay sesión.
 *  2. Redirigir a la primera ruta del usuario si ya está autenticado y va al login.
 *  3. Cargar el perfil desde el servidor (una sola vez por sesión) si la ruta requiere auth.
 *  4. Validar que la ruta destino esté dentro de las secciones del perfil.
 */

import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { authService } from "@/api/services/authService";

/**
 * Carga el perfil del usuario desde el servidor y lo guarda en el store.
 * Solo se llama cuando aún no hay datos de perfil (isAuthenticated = false).
 *
 * @returns {boolean} true si se cargó correctamente, false si no hay sesión válida.
 */
async function loadProfile() {
  const authStore = useAuthStore();
  const uiStore = useUiStore();

  try {
    const response = await authService.profile();
    const profileData = response.data.data;

    authStore.setAuth({
      Nombre: profileData.nombre,
      Rol: profileData.rol,
      authenticated: true,
    });
    authStore.setProfile(profileData);

    const firstRoute = authStore.firstRoute;
    if (firstRoute) {
      uiStore.setActiveModule(firstRoute.module);
    }

    return true;
  } catch {
    // Sin sesión válida (la cookie no existe o expiró).
    // El interceptor de axios ya habrá mostrado el toast si aplica.
    authStore.clearAuth();
    return false;
  }
}

/**
 * Verifica si una ruta está dentro de las secciones permitidas del perfil.
 */
function hasAccessToRoute(to, authStore) {
  return authStore.orderedMenu.some((group) => {
    const alias = group.Alias || group.Nombre?.toLowerCase();
    return group.secciones.some(
      (seccion) =>
        to.path.startsWith(`/${alias}${seccion.Ruta}`) ||
        to.path === `/${alias}`,
    );
  });
}

/**
 * Middleware principal. Se registra en router.beforeEach().
 */
export async function authMiddleware(to, from) {
    console.log("authMiddleware called")
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth !== false)

  if (!requiresAuth) {
    if (to.name === "login" && authStore.isAuthenticated) {
      const firstRoute = authStore.firstRoute
      return firstRoute ? { path: firstRoute.path } : { name: "login" }
    }
    return true
  }

  if (!authStore.isAuthenticated) {
    const loaded = await loadProfile()
    if (!loaded) return { name: "login" }
  }

  if (to.path !== "/") {
    if (!hasAccessToRoute(to, authStore)) {
      const firstRoute = authStore.firstRoute
      if (firstRoute) return { path: firstRoute.path }

      authStore.clearAuth()
      return { name: "login" }
    }
  }

  return true
}
