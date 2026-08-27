// src/modules/facturacion/ventasRoutes.js
export default {
  path: 'ventas',
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
    {
      path: 'facturas',
      name: 'facturas',
      component: () => import('./views/FacturasListView.vue'),
      meta: { title: 'Gestión de Facturas', permiso: 'Facturas.READ' },
    },
  ],
}
