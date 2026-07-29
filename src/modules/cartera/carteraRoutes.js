// src/modules/cartera/carteraRoutes.js
export default {
  path: 'cartera',
  children: [
    {
      path: 'clientes',
      name: 'clientes',
      component: () => import('./views/ClientesListView.vue'),
      meta: { title: 'Gestión de Clientes', permiso: 'Clientes.READ' },
    },
  ],
}
