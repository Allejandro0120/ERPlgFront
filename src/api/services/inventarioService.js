import api from '@/api/axios'
import { withCache } from '@/api/utils/apiCache'

export const inventarioService = {
  /**
   * Obtiene la lista de movimientos de ajuste de inventario predeterminada
   */
  getTiposAjusteInv: () =>
    withCache('mov_adjustment_types', () => api.get('v1/inventory/adjustment-types')),

  /**
   * Realiza un ajuste de inventario (positivo, negativo o traslado)
   * @param {object} ajusteData - Datos del ajuste
   */
  realizarAjuste: (ajusteData) => api.post('v1/inventory/adjustment', ajusteData),
}
