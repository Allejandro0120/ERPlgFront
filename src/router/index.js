// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import carteraRoutes from "@/modules/cartera/index.js";
import mercanciaRoutes from "@/modules/mercancia/index.js";
import facturacionRoutes from "@/modules/facturacion/index.js";

// Función helper para obtener la primera ruta del menú del usuario
function getFirstUserRoute() {
  const authStore = useAuthStore();
  const firstRoute = authStore.firstRoute;
  
  return firstRoute?.path || "/auth/login";
}

const routes = [
  {
    path: "/",
    component: () => import("@/layout/DefaultLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: () => getFirstUserRoute(),
      },
      ...carteraRoutes,
      ...mercanciaRoutes,
      ...facturacionRoutes,
    ],
  },
  {
    path: '/auth',
    component: () => import('@/layout/BlankLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/modules/auth/views/LoginView.vue'),
        meta: { title: 'Iniciar sesión', requiresAuth: false },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/shared/ui/NotFoundView.vue'),
    meta: { title: 'Página no encontrada', requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation Guard para proteger rutas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);
  const isAuthenticated = authStore.isAuthenticated;

  if (requiresAuth && !isAuthenticated) {
    // Ruta protegida sin autenticación -> redirigir al login
    next({ name: 'login' });
  } else if (to.name === 'login' && isAuthenticated) {
    // Usuario autenticado intentando ir al login -> redirigir a su primera ruta
    next({ path: getFirstUserRoute() });
  } else if (requiresAuth && isAuthenticated && to.path !== '/') {
    // Solo validamos acceso mediante las secciones que trae el perfil
    const hasAccessToRoute = authStore.orderedMenu.some(group => {
      const groupAlias = group.Alias || group.Nombre?.toLowerCase();
      // Verificamos si la ruta a la que intenta acceder está dentro de las secciones permitidas
      return group.secciones.some(seccion => 
        to.path.startsWith(`/${groupAlias}${seccion.Ruta}`) || to.path === `/${groupAlias}`
      );
    });
    
    if (!hasAccessToRoute) {
      // Si tiene una primera ruta disponible (basada en sus secciones), lo redirigimos a ella
      if (authStore.firstRoute) {
        next({ path: authStore.firstRoute.path });
      } else {
        // Si no tiene menú disponible, cerramos sesión
        authStore.clearAuth();
        next({ name: 'login' });
      }
    } else {
      // Está en sus secciones -> permitir
      next();
    }
  } else {
    // Permitir navegación
    next();
  }
});

export default router;
