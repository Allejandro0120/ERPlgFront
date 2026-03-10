// src/global/sidebar/menu.mock.js
export const profileResponse = {
  success: true,
  data: {
    menu: [
      {
        Nombre: 'Facturación',
        Alias: 'facturacion',
        Icono: 'mdi-file-document-outline',
        OrdenMenu: 1,
        secciones: [
          {
            Nombre: 'Cotizaciones',
            Icono: 'mdi-file-clock-outline',
            Ruta: '/cotizaciones',
            OrdenMenu: 1,
          },
          {
            Nombre: 'Facturas',
            Icono: 'mdi-receipt-text-outline',
            Ruta: '/facturas',
            OrdenMenu: 2,
          },
        ],
      },
      {
        Nombre: 'Cartera',
        Alias: 'cartera',
        Icono: 'mdi-briefcase-account-outline',
        OrdenMenu: 2,
        secciones: [
          {
            Nombre: 'Clientes',
            Icono: 'mdi-account-group-outline',
            Ruta: '/clientes',
            OrdenMenu: 0,
          },
          {
            Nombre: 'Centros de costo',
            Icono: 'mdi-sitemap-outline',
            Ruta: '/cecos',
            OrdenMenu: 1,
          },
        ],
      },
      {
        Nombre: 'Inventario',
        Alias: 'inventario',
        Icono: 'mdi-package-variant-closed',
        OrdenMenu: 3,
        secciones: [
          {
            Nombre: 'Productos',
            Icono: 'mdi-pill',
            Ruta: '/productos',
            OrdenMenu: 0,
          },
          {
            Nombre: 'Lista de precios',
            Icono: 'mdi-tag-outline',
            Ruta: '/precios',
            OrdenMenu: 1,
          },
        ],
      },
      {
        Nombre: 'Pedidos',
        Alias: 'pedidos',
        Icono: 'mdi-cart-outline',
        OrdenMenu: 4,
        secciones: [
          {
            Nombre: 'Pedidos clientes',
            Icono: 'mdi-clipboard-list-outline',
            Ruta: '/pedidos/clientes',
            OrdenMenu: 0,
          },
        ],
      },
      {
        Nombre: 'Usuarios',
        Alias: 'usuarios',
        Icono: 'mdi-shield-account-outline',
        OrdenMenu: 5,
        secciones: [
          {
            Nombre: 'Usuarios',
            Icono: 'mdi-account-outline',
            Ruta: '/usuarios',
            OrdenMenu: 0,
          },
        ],
      },
    ],
  },
}

export function getOrderedMenu() {
  return profileResponse.data.menu
    .sort((a, b) => a.OrdenMenu - b.OrdenMenu)
    .map((group) => ({
      ...group,
      secciones: group.secciones.sort((a, b) => a.OrdenMenu - b.OrdenMenu),
    }))
}