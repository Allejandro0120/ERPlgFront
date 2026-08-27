import { computed, ref } from 'vue'
import { pickFields } from '@/shared/utils/objectUtils'

// Estados de cobertura de una línea del pedido (cantidad cotizada vs. cantidad tomada del
// inventario). No existe un estado "sin iniciar": una línea sin tomas puede deberse
// simplemente a que aún no hay stock del producto, así que se clasifica igual que
// cualquier otra cobertura incompleta, como "Faltante".
export const ESTADO_LINEA = {
  FALTANTE: 'Faltante',
  COMPLETO: 'Completo',
}

// Tolerancia de comparación: el back valida la cobertura con el mismo margen (0.0001)
const TOLERANCIA = 0.0001

const LINEA_FIELDS = [
  'IdDetalle',
  'IdProducto',
  'CodigoProducto',
  'NombreProducto',
  'CodigoNombreProducto',
  'Controlado',
  'CadenaFrio',
  'Regulado',
  'Cantidad',
  'PrecioUnitario',
  'PorcentajeDescuento',
  'PorcentajeDescuentoMaximo',
  'PorcentajeIva',
  'Observacion',
]

const LINEA_DEFAULTS = {
  IdDetalle: null,
  IdProducto: null,
  CodigoProducto: '',
  NombreProducto: '',
  CodigoNombreProducto: '',
  Controlado: false,
  CadenaFrio: false,
  Regulado: false,
  Cantidad: 0,
  PrecioUnitario: 0,
  PorcentajeDescuento: 0,
  PorcentajeDescuentoMaximo: null,
  PorcentajeIva: 0,
  Observacion: '',
}

/**
 * Cantidad total ya tomada del inventario para una línea.
 */
export function cantidadTomada(linea) {
  return (linea?.Asignaciones ?? []).reduce((acc, toma) => acc + (Number(toma.Cantidad) || 0), 0)
}

/**
 * Cantidad que aún falta por cubrir en una línea.
 */
export function cantidadFaltante(linea) {
  const faltante = (Number(linea?.Cantidad) || 0) - cantidadTomada(linea)
  return faltante < TOLERANCIA ? 0 : faltante
}

export function estadoLinea(linea) {
  return cantidadFaltante(linea) === 0 ? ESTADO_LINEA.COMPLETO : ESTADO_LINEA.FALTANTE
}

/**
 * Estado del picking de un pedido: líneas de producto y las tomas (lote + ubicación)
 * con las que se cubre la cantidad de cada una.
 */
export function usePedidoAsignaciones() {
  let localLineaCounter = 0

  const lineas = ref([])
  const asignacionDialog = ref({ open: false, localId: null })

  function apiDetalleToLinea(api) {
    const codigoNombre =
      api.CodigoNombreProducto ??
      [api.CodigoProducto, api.NombreProducto].filter(Boolean).join(' - ')
    return {
      LocalId: ++localLineaCounter,
      ...pickFields(api, LINEA_FIELDS, LINEA_DEFAULTS),
      CodigoNombreProducto: codigoNombre,
      Cantidad: Number(api.Cantidad) || 0,
      PrecioUnitario: Number(api.PrecioUnitario) || 0,
      // Cada toma: { IdLote, CodLote, IdUbicacion, CodigoUbicacion, Cantidad }
      Asignaciones: [],
    }
  }

  function hydrateLineas(apiDetalles = []) {
    lineas.value = Array.isArray(apiDetalles)
      ? apiDetalles.map((detalle) => apiDetalleToLinea(detalle))
      : []
  }

  function resetLineas() {
    lineas.value = []
    asignacionDialog.value = { open: false, localId: null }
  }

  const lineaActual = computed(
    () => lineas.value.find((linea) => linea.LocalId === asignacionDialog.value.localId) ?? null,
  )

  function abrirAsignacion(localId) {
    asignacionDialog.value = { open: true, localId }
  }

  function cerrarAsignacion() {
    asignacionDialog.value = { open: false, localId: null }
  }

  function guardarAsignaciones(localId, asignaciones, observacion) {
    const linea = lineas.value.find((item) => item.LocalId === localId)
    if (!linea) return
    linea.Asignaciones = asignaciones.map((toma) => ({ ...toma, Cantidad: Number(toma.Cantidad) }))
    if (observacion !== undefined) linea.Observacion = observacion
    cerrarAsignacion()
  }

  // ─── Resumen de cobertura ────────────────────────────────────────────────────

  const lineasCompletas = computed(
    () => lineas.value.filter((linea) => estadoLinea(linea) === ESTADO_LINEA.COMPLETO).length,
  )

  const unidadesFaltantes = computed(() =>
    lineas.value.reduce((acc, linea) => acc + cantidadFaltante(linea), 0),
  )

  const todoAsignado = computed(
    () => lineas.value.length > 0 && lineas.value.every((linea) => cantidadFaltante(linea) === 0),
  )

  /**
   * Aplana las líneas a los detalles que espera POST /v1/orders/create:
   * una fila por combinación producto + lote + ubicación. El precio y el
   * descuento no se envían: el back los toma congelados de la cotización
   * de origen (congelarValores) cuando hay IdCotizacionOrigen.
   */
  function buildDetallesPayload() {
    return lineas.value.flatMap((linea) =>
      linea.Asignaciones.map((toma) => ({
        IdProducto: linea.IdProducto,
        Cantidad: Number(toma.Cantidad) || 0,
        IdUbicacion: toma.IdUbicacion,
        IdLote: toma.IdLote,
        ...(linea.Observacion ? { Observacion: linea.Observacion } : {}),
      })),
    )
  }

  return {
    lineas,
    asignacionDialog,
    lineaActual,
    hydrateLineas,
    resetLineas,
    abrirAsignacion,
    cerrarAsignacion,
    guardarAsignaciones,
    lineasCompletas,
    unidadesFaltantes,
    todoAsignado,
    buildDetallesPayload,
  }
}
