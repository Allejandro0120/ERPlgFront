import api from '@/api/axios'

export const cargueService = {
  /**
   * Obtiene lista de cargues con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getCargues: (page = 1, limit = 10, search = '', sortBy = '', sortOrder = 'asc', filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    })

    return api.get(`v1/load/list?${params.toString()}`)
  },

  /**
   * Obtiene los detalles de un cargue por su ID
   * @param {number} id - ID del cargue
   */
  getCargueById: (id) => api.get(`v1/load/unique/${id}`),

  /**
   * crear nuevo cargue
   * @param {object} cargueData - Datos del cargue a crear, incluyendo:
   *  - IdActaRecepcion: ID del acta de recepción (requerido)
   *  - Observaciones: Observaciones generales (opcional, max 2000 caracteres)
   *  - detalles: Array de detalles del acta de cargue (requerido), cada detalle incluye:
   *    - IdDetalleRecepcion: ID del detalle de recepción (requerido)
   *    - IdUbicacion: ID de la ubicación (requerido)
   *    - CantidadAsignada: Cantidad asignada (requerido, mínimo 0)
   *    - Observaciones: Observaciones específicas del detalle (opcional, max 1000 caracteres)
   */
  createCargue: (cargueData) => api.post('v1/load/create', cargueData),

  /**
   * Obtiene el PDF de un cargue por su ID
   * @param {number} id - ID del cargue
   */
  getCarguePDF: (id) => api.get(`v1/load/pdf/${id}`, { responseType: 'blob' }),
}
