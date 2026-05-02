import api from '@/api/axios'
import { withCache } from '@/api/utils/apiCache'

export const recepcionService = {
  /**
   * Obtiene lista de recepciones con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getRecepciones: (
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

    return api.get(`v1/reception/reports?${params.toString()}`)
  },
  /**
   * Obtiene la lista de estados de recepción
   */
  getRecepcionEstados: () => withCache('recepcion_estados', () => api.get('v1/reception/states')),

  /**
   * Obtiene los detalles de una recepción por su ID
   * @param {number} id - ID de la recepción
   */
  getRecepcionById: (id) => api.get(`v1/reception/reports/unique/${id}`),

  /**
   * Obtiene los detalles de un producto específico dentro de una recepción por su ID
   * @param {*} id  - ID del detalle de la recepción
   */
  getDetalleRecepcionById: (id) => api.get(`v1/reception/reports/unique/details/${id}`),
}
