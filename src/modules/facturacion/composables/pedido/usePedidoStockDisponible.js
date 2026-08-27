import { ref } from 'vue'
import { pedidoService } from '@/api/services/pedidoService'

/**
 * Disponibilidad de un producto (lotes + ubicaciones) en el cedi del pedido.
 *
 * Sin caché a propósito: el stock puede cambiar entre una consulta y otra (otro
 * usuario toma inventario, o el mismo pedido en curso ya reservó unidades), así
 * que cada vez que se selecciona un producto se vuelve a consultar el backend.
 */
export function usePedidoStockDisponible() {
  const ubicaciones = ref([])
  const cargando = ref(false)

  const cargarDisponibilidad = async (idProducto, idCedi) => {
    if (!idProducto || !idCedi) {
      ubicaciones.value = []
      return { ok: true }
    }

    cargando.value = true
    try {
      const response = await pedidoService.getStockDisponibleProducto(idProducto, idCedi)
      ubicaciones.value = response.data?.success ? (response.data.data?.ubicaciones ?? []) : []
      return { ok: true }
    } catch (error) {
      console.error('Error al obtener la disponibilidad del producto:', error)
      ubicaciones.value = []
      return { ok: false }
    } finally {
      cargando.value = false
    }
  }

  const limpiarDisponibilidad = () => {
    ubicaciones.value = []
  }

  return { ubicaciones, cargando, cargarDisponibilidad, limpiarDisponibilidad }
}
