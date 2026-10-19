import api from '@/api/axios'

export const informesService = {
  /**
   * Movimientos de un producto en un rango de fechas, con precio de compra (actas de cargue)
   * y precio de venta (remisiones y facturas)
   * @param {{ IdProducto: number, desde: string, hasta: string }} filters - fechas en formato AAAA-MM-DD
   */
  getHistoricoProducto: (filters) => {
    const params = new URLSearchParams(filters)
    return api.get(`v1/inventory/product-history?${params.toString()}`)
  },

  /**
   * Descarga en Excel el mismo histórico
   * @param {{ IdProducto: number, desde: string, hasta: string }} filters
   */
  exportHistoricoProducto: (filters) => {
    const params = new URLSearchParams(filters)
    return api.get(`v1/inventory/product-history/export?${params.toString()}`, {
      responseType: 'blob',
    })
  },
}
