import api from '@/api/axios'
import { clearCache, withCache } from '@/api/utils/apiCache'

const laboratorio = {
  cacheKey: 'laboratorios_list',
  /**
   * Obtiene la lista de laboratorios (Caché en Memoria)
   */
  getLaboratorios: () =>
    withCache(laboratorio.cacheKey, () => api.get('v1/ware/products/laboratories')),
  /**
   * Crea un nuevo laboratorio
   * @param {object} laboratorioData - Datos del laboratorio
   */
  createLaboratorio: (laboratorioData) =>
    api.post('v1/ware/products/laboratories/create', laboratorioData),

  /**
   * Invalida la caché de la lista de laboratorios
   */
  invalidateLaboratoriosCache: () => clearCache(laboratorio.cacheKey),
}

const concentracion = {
  cacheKey: 'concentraciones_list',
  /**
   * Obtiene la lista de concentraciones (Caché en Memoria)
   */
  getConcentraciones: () =>
    withCache(concentracion.cacheKey, () => api.get('v1/ware/products/concentrations')),

  /**
   * Crea una nueva concentración
   * @param {object} concentracionData - Datos de la concentración
   */
  createConcentracion: (concentracionData) =>
    api.post('v1/ware/products/concentrations/create', concentracionData),

  /**
   * Invalida la caché de la lista de concentraciones
   */
  invalidateConcentracionesCache: () => clearCache(concentracion.cacheKey),
}

const presentacion = {
  cacheKey: 'presentaciones_list',
  /**
   * Obtiene la lista de presentaciones (Caché en Memoria)
   */
  getPresentaciones: () =>
    withCache(presentacion.cacheKey, () => api.get('v1/ware/products/presentations')),

  /**
   * Crea una nueva presentación
   * @param {object} presentacionData - Datos de la presentación
   */
  createPresentacion: (presentacionData) =>
    api.post('v1/ware/products/presentations/create', presentacionData),

  /**
   * Invalida la caché de la lista de presentaciones
   */
  invalidatePresentacionesCache: () => clearCache(presentacion.cacheKey),
}

const molecula = {
  cacheKey: 'moleculas_list',
  /**
   * Obtiene la lista de moléculas (Caché en Memoria)
   */
  getMoleculas: () => withCache(molecula.cacheKey, () => api.get('v1/ware/products/molecules')),

  /**
   * Crea una nueva molécula
   * @param {object} moleculaData - Datos de la molécula
   */
  createMolecula: (moleculaData) => api.post('v1/ware/products/molecules/create', moleculaData),

  /**
   * Invalida la caché de la lista de moléculas
   */
  invalidateMoleculasCache: () => clearCache(molecula.cacheKey),
}

const tarifaIVA = {
  cacheKey: 'tarifasIva_list',
  /**
   * Obtiene la lista de tarifas de IVA (Caché en Memoria)
   */
  getTarifasIva: () => withCache(tarifaIVA.cacheKey, () => api.get('v1/ware/products/iva-taxes')),

  /**
   * Crea una nueva tarifa de IVA
   * @param {*} tarifaIVAData - Datos de la tarifa de IVA
   */
  createTarifaIVA: (tarifaIVAData) => api.post('v1/ware/products/iva-taxes/create', tarifaIVAData),

  /**
   * Invalida la caché de la lista de tarifas de IVA
   */
  invalidateTarifasIVACache: () => clearCache(tarifaIVA.cacheKey),
}

const formaFarmaceutica = {
  cacheKey: 'formasFarmaceuticas_list',
  /**
   * Obtiene la lista de formas farmacéuticas (Caché en Memoria)
   */
  getFormasFarmaceuticas: () =>
    withCache(formaFarmaceutica.cacheKey, () => api.get('v1/ware/products/pharmaceutical-forms')),

  /**
   * Crea una nueva forma farmacéutica
   * @param {*} formaFarmaceuticaData - Datos de la forma farmacéutica
   */
  createFormaFarmaceutica: (formaFarmaceuticaData) =>
    api.post('v1/ware/products/pharmaceutical-forms/create', formaFarmaceuticaData),

  /**
   * Invalida la caché de la lista de formas farmacéuticas
   */
  invalidateFormasFarmaceuticasCache: () => clearCache(formaFarmaceutica.cacheKey),
}

export const mercanciaService = {
  /**
   * Obtiene los productos según el término de búsqueda
   * @param {*} terminoBusqueda - Término para buscar productos (puede ser nombre, código, mino 4 caracteres)
   * @returns
   */
  getProductosSearch: (terminoBusqueda) => {
    return withCache(`productos_${terminoBusqueda}`, () =>
      api.get('v1/ware/products/search', {
        params: { terminoBusqueda },
      }),
    )
  },

  /**
   * Obtiene los saldos de inventario con paginación
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getSaldos: (page = 1, limit = 25, search = '', sortBy = '', sortOrder = 'asc', filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    })

    return api.get(`v1/inventory/balances?${params.toString()}`)
  },

  /**
   * Obtiene el kardex (movimientos) de un producto específico
   */
  getKardex: (
    IdProducto,
    IdLote,
    IdUbicacion,
    page = 1,
    limit = 5,
    search = '',
    sortBy = '',
    sortOrder = 'desc',
    filters = {},
  ) => {
    const params = new URLSearchParams({
      ...(IdProducto && { IdProducto }),
      ...(IdLote && { IdLote }),
      ...(IdUbicacion && { IdUbicacion }),
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    })
    return api.get(`v1/inventory/kardex?${params.toString()}`)
  },

  /**
   * Obtiene los lotes disponibles para un producto específico
   * @param {*} idProducto  - ID del producto para el cual se desean obtener los lotes
   * @returns
   */
  getLotesByProducto: (idProducto) => api.get(`v1/ware/products/${idProducto}/lots`),

  /**
   * Obtiene lista de productos con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getProductos: (
    page = 1,
    limit = 25,
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

    return api.get(`v1/ware/products/list?${params.toString()}`)
  },

  /**
   * Obtiene un producto por su ID
   * @param {number} IdProducto - ID del producto
   */
  getProductoById: (IdProducto) => api.get(`v1/ware/products/unique/${IdProducto}`),

  /**
   * Crea un nuevo producto
   * @param {object} productoData - Datos del producto
   */
  createProducto: (productoData) => api.post('v1/ware/products/create', productoData),

  /**
   * Actualiza un producto existente
   * @param {number} idProducto - ID del producto a actualizar
   * @param {object} productoData - Datos actualizados del producto
   */
  updateProducto: (idProducto, productoData) =>
    api.put(`v1/ware/products/update/${idProducto}`, productoData),

  laboratorio,
  concentracion,
  presentacion,
  molecula,
  tarifaIVA,
  formaFarmaceutica,
}
