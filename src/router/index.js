// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import carteraRoutes from "@/modules/cartera/index.js";
import mercanciaRoutes from "@/modules/mercancia/index.js";

// Función helper para obtener la primera ruta del menú del usuario
function getFirstUserRoute() {
  const authStore = useAuthStore();
  const firstGroup = authStore.orderedMenu[0];
  const firstRoute = firstGroup?.secciones[0]?.Ruta;
  const firstAlias = firstGroup?.Alias;
  
  return firstRoute && firstAlias 
    ? `/${firstAlias}${firstRoute}` 
    : "/auth/login"; // Fallback solo por seguridad
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
  } else {
    // Permitir navegación
    next();
  }
});

export default router;
