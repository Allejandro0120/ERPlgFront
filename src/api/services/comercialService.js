import api from '@/api/axios'
import { withCache } from '@/api/utils/apiCache'

export const comercialService = {
  /**
   * Obtiene las listas de precios disponibles para que sean seleccionadas en el apartado de clientes (Caché en Memoria)
   */
  getListasPreciosBasica: () =>
    withCache('listasPrecios', () => api.get('v1/comercial/price-lists/summary')),

  /**
   * Obtiene lista de precios con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getListasPrecios: (
    page = 1,
    limit = 10,
    search = '',
    sortBy = '',
    sortOrder = 'asc',
    filters = {},
  ) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    })

    return api.get(`v1/comercial/price-lists?${params.toString()}`)
  },

  /**
   * Obtiene una lista de precios por su ID
   * @param {string} id - ID de la lista de precios
   * @returns {Promise} Promesa con los datos de la lista de precios
   */
  getListaPreciosById: (id) => api.get(`v1/comercial/price-lists/unique/${id}`),

  /**
   * Crea una nueva lista de precios
   * @param {object} listaPreciosData - Datos de la lista de precios
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  createListaPrecios: (listaPreciosData) =>
    api.post('v1/comercial/price-lists/create', listaPreciosData),

  /**
   * Actualiza una lista de precios existente
   * @param {string} id - ID de la lista de precios a actualizar
   * */
  updateListaPrecios: (id, updateData) =>
    api.put(`v1/comercial/price-lists/update/${id}`, updateData),
}
