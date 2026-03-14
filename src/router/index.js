/**
 * router/index.js
 *
 * Solo define las rutas y registra el middleware.
 * Toda la lógica de auth vive en api/middleware/authMiddleware.js.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { authMiddleware }  from '@/api/middleware/authMiddleware'
import { useAuthStore }    from '@/stores/auth.store'
import carteraRoutes       from '@/modules/cartera/index.js'
import mercanciaRoutes     from '@/modules/mercancia/index.js'
import facturacionRoutes   from '@/modules/facturacion/index.js'

const routes = [
  {
    path: '/',
    component: () => import('@/layout/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: () => {
          const authStore  = useAuthStore()
          const firstRoute = authStore.firstRoute
          return firstRoute?.path ?? '/auth/login'
        },
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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(authMiddleware)

export default router