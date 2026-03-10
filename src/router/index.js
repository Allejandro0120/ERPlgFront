// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import carteraRoutes from "@/modules/cartera/index.js";

const routes = [
  {
    path: "/",
    component: () => import("@/layout/DefaultLayout.vue"),
    children: [
      {
        path: "",
        redirect: "/auth/login",
      },
      ...carteraRoutes,
    ],
  },
  {
    path: '/auth',
    component: () => import('@/layout/BlankLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/modules/auth/views/LoginView.vue'),
        meta: { title: 'Iniciar sesión' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
