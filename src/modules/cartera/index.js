// src/modules/cartera/index.js
export default [
  {
    path: '/cartera/clientes',
    name: 'clientes',
    component: () => import('./views/ClientesListView.vue'),
    meta: { title: 'Gestión de Clientes', permiso: 'Clientes.READ' },
  },
  // {
  //   path: '/cecos',
  //   name: 'cecos',
  //   component: () => import('./views/CecosListView.vue'),
  //   meta: { title: 'Centros de Costo', permiso: 'Cecos.READ' },
  // },
]