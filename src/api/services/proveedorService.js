import api from '@/api/axios'
import { withCache } from '@/api/utils/apiCache'

export const proveedorService = {
  /**
   * Obtiene la lista de proveedores (Petición Cacheada de manera Global)
   */
  getProveedores: () => withCache('proveedores_list', () => api.get('v1/providers/list')),
}
