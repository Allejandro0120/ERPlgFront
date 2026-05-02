export default [
  {
    path: '/facturacion/pedidos',
    name: 'pedidos',
    component: () => import('./views/PedidosView.vue'),
    meta: { title: 'Gestión de Pedidos', permiso: 'Pedidos.READ' },
  },
  {
    path: '/facturacion/cotizaciones',
    name: 'cotizaciones',
    component: () => import('./views/CotizacionesView.vue'),
    meta: { title: 'Gestión de Cotizaciones', permiso: 'Cotizaciones.READ' },
  },
]
