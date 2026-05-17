import api from '@/api/axios'
import { withCache } from '@/api/utils/apiCache'

export const mercanciaService = {
  /**
   * Obtiene las listas de precios disponibles (Caché en Memoria)
   */
  getListasPrecios: () => withCache('listasPrecios', () => api.get('v1/ware/price-lists')),

  /**
   * Obtiene los productos según el término de búsqueda
   * @param {*} terminoBusqueda - Término para buscar productos (puede ser nombre, código, mino 4 caracteres)
   * @returns
   */
  getProductos: (terminoBusqueda) => {
    return withCache(`productos_${terminoBusqueda}`, () =>
      api.get('v1/ware/products', { terminoBusqueda }),
    )
  },

  /**
   * Obtiene los saldos de inventario con paginación
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getSaldos: (page = 1, limit = 25, search = '', sortBy = '', sortOrder = 'asc', filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    })

    return api.get(`v1/inventory/balances?${params.toString()}`)
  },

  /**
   * Obtiene el kardex (movimientos) de un producto específico
   */
  getKardex: (
    IdProducto,
    IdLote,
    IdUbicacion,
    page = 1,
    limit = 5,
    search = '',
    sortBy = '',
    sortOrder = 'desc',
    filters = {},
  ) => {
    const params = new URLSearchParams({
      ...(IdProducto && { IdProducto }),
      ...(IdLote && { IdLote }),
      ...(IdUbicacion && { IdUbicacion }),
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    })
    return api.get(`v1/inventory/kardex?${params.toString()}`)
  },
}
