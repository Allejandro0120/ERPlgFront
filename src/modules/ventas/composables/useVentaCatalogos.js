import { ref } from 'vue'
import { comercialService } from '@/api/services/comercialService'

export function useVentaCatalogos() {
  const tiposVenta = ref([])
  const metodosPago = ref([])
  const nombreListaPrecio = ref('')
  const productosListaPrecio = ref([])

  const cargarTiposVenta = async () => {
    const response = await comercialService.getTiposVenta()
    tiposVenta.value = response.data?.success ? response.data.data || [] : []
  }

  const cargarMetodosPago = async () => {
    const response = await comercialService.getMetodosPago()
    metodosPago.value = response.data?.success ? response.data.data || [] : []
  }

  // Catálogos necesarios para mostrar los selects habilitados en modo edición
  const cargarCatalogosEdicion = async () => {
    const jobs = [
      { key: 'tiposVenta', run: cargarTiposVenta, fallback: () => (tiposVenta.value = []) },
      { key: 'metodosPago', run: cargarMetodosPago, fallback: () => (metodosPago.value = []) },
    ]

    const results = await Promise.allSettled(jobs.map((job) => job.run()))
    const failed = []
    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        jobs[index].fallback()
        failed.push(jobs[index].key)
      }
    }

    return { ok: failed.length === 0, failed }
  }

  // Productos disponibles según la lista de precios de la cotización (para agregar líneas en edición)
  const cargarProductosListaPrecio = async (idListaPrecio) => {
    if (!idListaPrecio) {
      nombreListaPrecio.value = ''
      productosListaPrecio.value = []
      return { ok: true, failed: [] }
    }
    try {
      const response = await comercialService.getListaPreciosById(idListaPrecio)
      if (response.data?.success) {
        const lista = response.data.data || {}
        nombreListaPrecio.value = lista.NombreLista ?? ''
        productosListaPrecio.value = lista.detalles || []
      }
      return { ok: true, failed: [] }
    } catch (error) {
      console.error('Error al obtener la lista de precios:', error)
      nombreListaPrecio.value = ''
      productosListaPrecio.value = []
      return { ok: false, failed: ['productosListaPrecio'] }
    }
  }

  // Productos con stock disponible según lista de precios + cedi (para creación de cotizaciones)
  const cargarProductosDisponibles = async (idListaPrecio, idCedi) => {
    if (!idListaPrecio || !idCedi) {
      nombreListaPrecio.value = ''
      productosListaPrecio.value = []
      return { ok: true, failed: [] }
    }
    try {
      const response = await comercialService.getStockDisponible(idListaPrecio, idCedi)
      if (response.data?.success) {
        const lista = response.data.data || {}
        nombreListaPrecio.value = lista.NombreLista ?? ''
        productosListaPrecio.value = lista.detalles || []
      }
      return { ok: true, failed: [] }
    } catch (error) {
      console.error('Error al obtener los productos disponibles:', error)
      nombreListaPrecio.value = ''
      productosListaPrecio.value = []
      return { ok: false, failed: ['productosDisponibles'] }
    }
  }

  // Todos los productos de la lista de precios + cedi, tengan o no stock (para creación de cotizaciones)
  const cargarTodosLosProductos = async (idListaPrecio, idCedi) => {
    if (!idListaPrecio || !idCedi) {
      nombreListaPrecio.value = ''
      productosListaPrecio.value = []
      return { ok: true, failed: [] }
    }
    try {
      const response = await comercialService.getProductosListaPrecio(idListaPrecio, idCedi)
      if (response.data?.success) {
        const lista = response.data.data || {}
        nombreListaPrecio.value = lista.NombreLista ?? ''
        productosListaPrecio.value = lista.detalles || []
      }
      return { ok: true, failed: [] }
    } catch (error) {
      console.error('Error al obtener los productos de la lista de precios:', error)
      nombreListaPrecio.value = ''
      productosListaPrecio.value = []
      return { ok: false, failed: ['productosListaPrecio'] }
    }
  }

  return {
    tiposVenta,
    metodosPago,
    nombreListaPrecio,
    productosListaPrecio,
    cargarCatalogosEdicion,
    cargarProductosListaPrecio,
    cargarProductosDisponibles,
    cargarTodosLosProductos,
  }
}
