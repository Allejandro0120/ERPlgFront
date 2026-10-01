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

  /**
   * Obtiene facturaciones (PF-xxxxx) ya emitidas, con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales (IdCliente, IdPedidoOrigen)
   */
  getFacturaciones: (
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

    return api.get(`v1/order-settlements/list?${params.toString()}`)
  },

  /**
   * Obtiene el detalle completo de una facturación (PF-xxxxx) por su ID de transacción
   * @param {number|string} IdTransaccion - ID de transacción de la facturación
   */
  getFacturacionById: (IdTransaccion) => api.get(`v1/order-settlements/unique/${IdTransaccion}`),

  /**
   * Obtiene las líneas facturables de un pedido en estado "Aprobado" o "Facturado_Parcial"
   * @param {number|string} idPedidoOrigen - ID de transacción del pedido origen
   * @returns {Promise} Promesa con el encabezado (incluye Estado) y las líneas facturables
   */
  getLineasFacturables: (idPedidoOrigen) =>
    api.get(`v1/order-settlements/settleable/${idPedidoOrigen}`),

  /**
   * Crea una facturación (parcial o total) sobre un subconjunto de líneas facturables.
   * Si el pedido de origen quedó marcado como EsParaRemision al crearse, el back enruta
   * internamente esta misma llamada hacia la lógica de remisión: la respuesta trae
   * Remision/LineasRemisionadas en vez de OrderSettlement/LineasFacturadas.
   * @param {object} facturacionData - { IdPedidoOrigen, FechaEntregaReal, Transportadora?, detalles }
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  createFacturacion: (facturacionData) => api.post('v1/order-settlements/create', facturacionData),

  /**
   * Valida que la combinación producto + ubicación + código de lote
   * corresponda a la asignación de picking real del pedido de origen (evita
   * confiar en el front para esta validación)
   * @param {object} params - { IdPedidoOrigen, IdProducto, IdUbicacion, CodigoLote }
   * @returns {Promise} Promesa con { Coincide: boolean }
   */
  validatePickingMatch: ({ IdPedidoOrigen, IdProducto, IdUbicacion, CodigoLote }) => {
    const params = new URLSearchParams({ IdPedidoOrigen, IdProducto, IdUbicacion, CodigoLote })

    return api.get(`v1/order-settlements/validate-picking?${params.toString()}`)
  },

  /**
   * Obtiene remisiones ya emitidas (facturadas o no), con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getRemisiones: (
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

    return api.get(`v1/remissions/list?${params.toString()}`)
  },

  /**
   * Obtiene el detalle completo de una remisión por su ID de transacción
   * @param {number|string} IdTransaccion - ID de transacción de la remisión
   */
  getRemisionById: (IdTransaccion) => api.get(`v1/remissions/unique/${IdTransaccion}`),

  /**
   * Factura una o varias remisiones pendientes (sin facturar aún), generando
   * la factura (PF-xxxxx) correspondiente. Cada id se procesa de forma
   * independiente en el back: una remisión que falla no aborta las demás.
   * @param {object} payload - { IdsRemision: number[], DireccionEntrega?, ObservacionFacturacion? }
   */
  invoiceRemisiones: (payload) => api.post('v1/remissions/invoice', payload),
}
