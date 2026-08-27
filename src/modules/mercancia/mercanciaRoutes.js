// src/modules/mercancia/mercanciaRoutes.js
export default {
  path: 'mercancia',
  children: [
    {
      path: 'kardex',
      name: 'productos',
      component: () => import('./views/ProductosListView.vue'),
      meta: { title: 'Gestión de Productos', permiso: 'Productos.READ' },
    },
    {
      path: 'inventario',
      name: 'inventario',
      component: () => import('./views/InventarioListView.vue'),
      meta: { title: 'Gestión de Inventario', permiso: 'Inventario.READ' },
    },
  ],
}
