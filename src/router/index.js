/**
 * router/index.js
 *
 * Solo define las rutas y registra el middleware.
 * Toda la lógica de auth vive en api/middleware/authMiddleware.js.
 * Cada módulo declara sus rutas (con su prefijo) en modules/<modulo>/<modulo>Routes.js.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { authMiddleware } from '@/api/middleware/authMiddleware'
import authRoutes from '@/modules/auth/authRoutes.js'
import carteraRoutes from '@/modules/cartera/carteraRoutes.js'
import comercialRoutes from '@/modules/comercial/comercialRoutes.js'
import ventasRoutes from '@/modules/facturacion/ventasRoutes.js'
import logisticaRoutes from '@/modules/logistica/logisticaRoutes.js'
import mercanciaRoutes from '@/modules/mercancia/mercanciaRoutes.js'

const routes = [
  {
    path: '/',
    component: () => import('@/layout/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    redirect: { name: 'clientes' },
    children: [carteraRoutes, mercanciaRoutes, ventasRoutes, logisticaRoutes, comercialRoutes],
  },
  {
    path: '/auth',
    component: () => import('@/layout/BlankLayout.vue'),
    meta: { requiresAuth: false },
    children: [...authRoutes],
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

const BASE_TITLE = 'LogicPharma ERP'

router.beforeEach(authMiddleware)

// Actualiza el título de la pestaña según la ruta activa (usa meta.title).
router.afterEach((to) => {
  const pageTitle = to.meta?.title
  document.title = pageTitle ? `${pageTitle} · ${BASE_TITLE}` : BASE_TITLE
})

export default router
