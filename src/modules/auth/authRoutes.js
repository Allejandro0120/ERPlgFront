// src/modules/auth/authRoutes.js
export default [
  {
    path: 'login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { title: 'Iniciar sesión', requiresAuth: false },
  },
]
