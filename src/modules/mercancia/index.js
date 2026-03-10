// src/modules/cartera/index.js
export default [
  {
    path: '/mercancia/kardex',
    name: 'productos',
    component: () => import('./views/ProductosListView.vue'),
    meta: { title: 'Gestión de Productos', permiso: 'Productos.READ' },
  },

]