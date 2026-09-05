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
   * Obtiene los productos con stock disponible de una lista de precios en un cedi
   * @param {number} idListaPrecio - ID de la lista de precios
   * @param {number} idCedi - ID del centro de distribución
   * @returns {Promise} Promesa con los productos disponibles
   */
  getStockDisponible: (idListaPrecio, idCedi) =>
    api.get(`v1/comercial/price-lists/${idListaPrecio}/available-stock/${idCedi}`),

  /**
   * Obtiene todos los productos de una lista de precios en un cedi, tengan o no stock disponible
   * @param {number} idListaPrecio - ID de la lista de precios
   * @param {number} idCedi - ID del centro de distribución
   * @returns {Promise} Promesa con los productos de la lista
   */
  getProductosListaPrecio: (idListaPrecio, idCedi) =>
    api.get(`v1/comercial/price-lists/${idListaPrecio}/products/${idCedi}`),

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

  /**
   * Descarga la plantilla oficial de Excel para importar/actualizar productos de una lista de precios
   * @returns {Promise} Promesa con el archivo (blob)
   */
  getPlantillaImportacionProductos: () =>
    api.get('v1/comercial/price-lists/import/template', { responseType: 'blob' }),

  /**
   * Importa/actualiza los productos de una lista de precios desde un archivo de Excel
   * @param {string} codigo - Código de la lista de precios (no el ID)
   * @param {FormData} formData - FormData con el archivo en el campo 'archivo'
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  importarProductosListaPrecio: (codigo, formData) =>
    // El Content-Type debe ir en undefined (no omitirse): la instancia de axios fija
    // 'application/json' por defecto, y con eso axios serializa el FormData a JSON en
    // vez de enviarlo como multipart. Al forzarlo a undefined, deja que el navegador
    // genere el boundary correcto de 'multipart/form-data' él mismo.
    api.post(`v1/comercial/price-lists/${codigo}/import`, formData, {
      headers: { 'Content-Type': undefined },
    }),

  /**
   * Obtiene los tipos de venta disponibles (Caché en Memoria)
   */
  getTiposVenta: () => withCache('tiposVenta', () => api.get('v1/comercial/sale-types')),

  /**
   * Obtiene los métodos de pago disponibles (Caché en Memoria)
   */
  getMetodosPago: () => withCache('metodosPago', () => api.get('v1/comercial/payment-methods')),
}
