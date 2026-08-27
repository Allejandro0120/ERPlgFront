import api from '@/api/axios'

export const pedidoService = {
  /**
   * Obtiene pedidos con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getPedidos: (page = 1, limit = 10, search = '', sortBy = '', sortOrder = 'asc', filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    })

    return api.get(`v1/orders/list?${params.toString()}`)
  },

  /**
   * Obtiene un pedido por su ID de transacción
   * @param {string} IdTransaccion - ID de transacción del pedido
   * @returns {Promise} Promesa con los datos del pedido
   */
  getPedidoById: (IdTransaccion) => api.get(`v1/orders/unique/${IdTransaccion}`),

  /**
   * Obtiene el catálogo de estados de pedido (Creado, Aprobado, Anulado, Facturado)
   * @returns {Promise} Promesa con el listado de estados
   */
  getEstados: () => api.get('v1/orders/states'),

  /**
   * Obtiene el stock disponible de un producto en un cedi, desglosado por lote y ubicación
   * y ordenado por fecha de vencimiento (FEFO)
   * @param {number} idProducto - ID del producto
   * @param {number} idCedi - ID del cedi donde se hará el picking
   * @returns {Promise} Promesa con la disponibilidad del producto
   */
  getStockDisponibleProducto: (idProducto, idCedi) => {
    const params = new URLSearchParams({ product: idProducto, discenter: idCedi })

    return api.get(`v1/orders/available-stock?${params.toString()}`)
  },

  /**
   * Crea un nuevo pedido
   * @param {object} pedidoData - Datos del pedido (incluye detalles)
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  createPedido: (pedidoData) => api.post('v1/orders/create', pedidoData),

  /**
   * Actualiza un pedido en estado "Creado" (encabezado y/o líneas)
   * @param {object} pedidoData - Datos del pedido a editar (incluye IdTransaccion y detalles)
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  updatePedido: (pedidoData) => api.put('v1/orders/update', pedidoData),

  /**
   * Obtiene el PDF de un pedido por su ID de transacción
   * @param {string} id - ID de transacción del pedido
   */
  getPedidoPDF: (id) => api.get(`v1/orders/pdf/${id}`, { responseType: 'blob' }),

  /**
   * Busca pedidos aprobados por su número de consecutivo (coincidencias)
   * @param {string} numpedido - Número de pedido a buscar
   */
  searchPedidosAprobados: (numpedido) => {
    const params = new URLSearchParams({ numpedido })

    return api.get(`v1/orders/search?${params.toString()}`)
  },

  /**
   * Obtiene la información de un pedido para el proceso de picking:
   * productos con su cantidad asignada, cedi, usuario y observaciones
   * @param {string} IdTransaccion - ID de transacción del pedido
   */
  getPedidoPickingInfo: (IdTransaccion) => api.get(`v1/orders/specific-info/${IdTransaccion}`),

  /**
   * Autoriza (aprueba) un pedido en estado "Creado"
   * @param {string} IdTransaccion - ID de transacción del pedido
   */
  autorizarPedido: (IdTransaccion) => api.put('v1/orders/approve', { IdTransaccion }),

  /**
   * Anula un pedido en estado "Creado" o "Aprobado"
   * @param {string} IdTransaccion - ID de transacción del pedido
   * @param {string} observacionCierre - Motivo de la anulación (obligatorio)
   */
  anularPedido: (IdTransaccion, observacionCierre) =>
    api.put('v1/orders/cancel', { IdTransaccion, ObservacionCierre: observacionCierre }),

  /**
   * Cierra con faltante un pedido en estado "Facturado_Parcial": libera la reserva de
   * inventario del saldo pendiente y cierra el pedido.
   * @param {string} IdTransaccion - ID de transacción del pedido
   * @param {string} observacionCierre - Motivo del cierre (obligatorio)
   */
  cerrarConFaltante: (IdTransaccion, observacionCierre) =>
    api.put('v1/orders/close-with-shortage', {
      IdTransaccion,
      ObservacionCierre: observacionCierre,
    }),

  /**
   * Desautoriza un pedido en estado "Aprobado": lo devuelve a "Creado" sin tocar su contenido.
   * @param {string} IdTransaccion - ID de transacción del pedido
   */
  revertPedido: (IdTransaccion) => api.put('v1/orders/revert', { IdTransaccion }),
}
