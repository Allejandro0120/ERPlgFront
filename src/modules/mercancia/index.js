// src/modules/cartera/index.js
export default [
  {
    path: '/mercancia/kardex',
    name: 'productos',
    component: () => import('./views/ProductosListView.vue'),
    meta: { title: 'Gestión de Productos', permiso: 'Productos.READ' },
  },
    {
    path: '/mercancia/inventario',
    name: 'inventario',
    component: () => import('./views/InventarioView.vue'),
    meta: { title: 'Gestión de Inventario', permiso: 'Inventario.READ' },
  },
    {
    path: '/mercancia/recepcion-mercancia',
    name: 'recepciones',
    component: () => import('./views/RecepcionView.vue'),
    meta: { title: 'Gestión de Recepciones', permiso: 'Recepciones.READ' },
  },

]