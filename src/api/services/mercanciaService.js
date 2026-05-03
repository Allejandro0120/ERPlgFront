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
}
