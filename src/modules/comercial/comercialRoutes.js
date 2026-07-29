// src/modules/comercial/comercialRoutes.js
export default {
  path: 'comercial',
  children: [
    {
      path: 'lista-precios',
      name: 'lista-precios',
      component: () => import('./views/ListaPreciosListView.vue'),
      meta: { title: 'Lista de Precios', permiso: 'ListaPrecios.READ' },
    },
  ],
}
