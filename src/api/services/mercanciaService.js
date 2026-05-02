import api from '@/api/axios'
import { withCache } from '@/api/utils/apiCache'

export const mercanciaService = {
  /**
   * Obtiene las listas de precios disponibles (Caché en Memoria)
   */
  getListasPrecios: () => withCache('listasPrecios', () => api.get('v1/ware/price-lists')),
}
