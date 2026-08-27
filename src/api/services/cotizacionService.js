import api from '@/api/axios'

export const cotizacionService = {
  /**
   * Obtiene cotizaciones con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getCotizaciones: (
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

    return api.get(`v1/quotations/list?${params.toString()}`)
  },

  /**
   * Obtiene el catálogo de estados de cotización (Abierta, Cerrada, Procesada)
   * @returns {Promise} Promesa con el listado de estados
   */
  getEstados: () => api.get('v1/quotations/states'),

  /**
   * Obtiene una cotización por su ID de transacción
   * @param {string} IdTransaccion - ID de transacción de la cotización
   * @returns {Promise} Promesa con los datos de la cotización
   */
  getCotizacionById: (IdTransaccion) => api.get(`v1/quotations/unique/${IdTransaccion}`),

  /**
   * Crea una nueva cotización
   * @param {object} cotizacionData - Datos de la cotización (incluye detalles)
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  createCotizacion: (cotizacionData) => api.post('v1/quotations/create', cotizacionData),

  /**
   * Actualiza una cotización existente enviando solo los campos y detalles modificados
   * @param {object} updateData - Datos a actualizar (incluye IdTransaccion y, opcionalmente, detalles)
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  updateCotizacion: (updateData) => api.put('v1/quotations/update', updateData),

  /**
   * Anula (cierra) una cotización abierta, registrando la observación de la anulación
   * @param {object} closeData - { IdTransaccion, ObservacionCierre }
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  closeCotizacion: (closeData) => api.put('v1/quotations/close', closeData),

  /**
   * Obtiene los detalles de un producto específico dentro de una cotización por su ID para obtener la data correspondiente a la generacion del pdf
   * @param {*} id  - ID del detalle de la cotización
   */
  getCotizacionPDF: (id) => api.get(`v1/quotations/pdf/${id}`, { responseType: 'blob' }),
}
