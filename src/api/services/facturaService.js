import api from '@/api/axios'

export const facturaService = {
  /**
   * Obtiene facturas con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getFacturas: (
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

    return api.get(`v1/invoices/list?${params.toString()}`)
  },

  /**
   * Descarga el PDF de una factura por su ID de transacción
   * @param {number} idTransaccion - ID de transacción de la factura
   */
  getFacturaPDF: (idTransaccion) =>
    api.get(`v1/invoices/pdf/${idTransaccion}`, { responseType: 'blob' }),
}
