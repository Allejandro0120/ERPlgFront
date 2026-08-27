import api from '@/api/axios'

export const pickingService = {
  /**
   * Obtiene los pedidos pendientes de picking: aquellos en estado "Aprobado" o
   * "Facturado_Parcial", elegibles para seguir siendo facturados/despachados
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getPedidosPendientes: (
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

    return api.get(`v1/order-settlements/settleable-orders?${params.toString()}`)
  },
}
