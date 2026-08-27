// src/modules/logistica/logisticaRoutes.js
export default {
  path: 'logistica',
  children: [
    {
      path: 'cargue-mercancia',
      name: 'cargues',
      component: () => import('./views/CarguesListView.vue'),
      meta: { title: 'Gestión de Cargue', permiso: 'Cargue.READ' },
    },
    {
      path: 'recepcion-mercancia',
      name: 'recepciones',
      component: () => import('./views/RecepcionesListView.vue'),
      meta: { title: 'Gestión de Recepciones', permiso: 'Recepciones.READ' },
    },
    {
      path: 'picking',
      name: 'picking',
      component: () => import('./views/PickingListView.vue'),
      meta: { title: 'Picking', permiso: 'Picking.READ' },
    },
  ],
}
