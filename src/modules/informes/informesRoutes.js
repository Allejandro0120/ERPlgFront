// src/modules/informes/informesRoutes.js
export default {
  path: 'informes',
  children: [
    {
      path: 'historico-producto',
      name: 'historico-producto',
      component: () => import('./views/HistoricoProductoView.vue'),
      meta: { title: 'Histórico por Producto', permiso: 'HistoricoProducto.READ' },
    },
  ],
}
