// src/modules/facturacion/facturacionRoutes.js
export default {
  path: 'facturacion',
  children: [
    {
      path: 'pedidos',
      name: 'pedidos',
      component: () => import('./views/PedidosListView.vue'),
      meta: { title: 'Gestión de Pedidos', permiso: 'Pedidos.READ' },
    },
    {
      path: 'cotizaciones',
      name: 'cotizaciones',
      component: () => import('./views/CotizacionesListView.vue'),
      meta: { title: 'Gestión de Cotizaciones', permiso: 'Cotizaciones.READ' },
    },
  ],
}
