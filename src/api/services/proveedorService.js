import api from '@/api/axios'
import { clearCache, withCache } from '@/api/utils/apiCache'

export const proveedorService = {
  /**
   * Obtiene la lista de proveedores (Petición Cacheada de manera Global)
   */
  getProveedores: () => withCache('proveedores_list', () => api.get('v1/providers/list')),

  /**
   * Invalida la caché de la lista de proveedores
   */
  invalidateProveedoresCache: () => clearCache('proveedores_list'),

  /**
   * Crea un nuevo proveedor
   * @param {Object} proveedorData - Datos del proveedor a crear
   */
  createProveedor: (proveedorData) => api.post('v1/providers/create', proveedorData),
}
