import { computed, ref } from 'vue'
import { $confirm } from '@/plugins/confirm/confirm.js'
import { pickFields } from '@/shared/utils/objectUtils'

// ─── Campos para los detalles de RECEPCIÓN (solo lectura, vienen del acta) ───
const RECEPCION_DISPLAY_FIELDS = [
  'IdDetalleRecepcion',
  'CodigoProducto',
  'NombreProducto',
  'CodLote',
  'CantidadRecibida',
  'ObservacionesProducto',
]

// ─── Campos para los detalles de CARGUE (los que el usuario va asignando) ────
const CARGUE_PATCH_FIELDS = [
  'IdDetalleRecepcion',
  'CodigoProducto',
  'CodLote',
  'CantidadAsignada',
  'IdZona',
  'IdPasillo',
  'IdEstante',
  'IdUbicacion',
  'Observaciones',
]

// Campos de display del cargue (vienen de la API al ver detalle)
const CARGUE_DISPLAY_FIELDS = [
  'CodigoUbicacion',
  'CodigoEstante',
  'CodigoPasillo',
  'CodigoZona',
  'NombreProducto',
  'CantidadRecibida',
]

const CARGUE_DEFAULTS = {
  IdDetalleRecepcion: null,
  CodigoProducto: '',
  CodLote: '',
  CantidadAsignada: 0,
  IdZona: null,
  IdPasillo: null,
  IdEstante: null,
  IdUbicacion: null,
  Observaciones: '',
}

export function useCargueDetalles({ isReadonly }) {
  let localCounter = 0

  // ─── Estado de recepciones (productos pendientes de asignar) ─────────────
  const recepcionDetalles = ref([]) // productos del acta de recepción aún no asignados

  // ─── Estado de cargue (productos ya asignados a ubicación) ───────────────
  const cargueDetalles = ref([])

  // ─── Dialog de asignación ────────────────────────────────────────────────
  const asignarDialog = ref({
    open: false,
    recepcionItem: null, // el ítem de recepción que se está asignando
  })

  // ─── Dialog de vista de detalle (readonly) ───────────────────────────────
  const verDetalleDialog = ref({
    open: false,
    cargueItem: null, // el ítem de cargue a visualizar
  })

  // ─── Transformadores ─────────────────────────────────────────────────────

  function apiRecepcionDetalleToLocal(item) {
    return {
      LocalId: ++localCounter,
      CantidadPendiente: item.CantidadRecibida, // cuánto queda por asignar
      ...pickFields(item, RECEPCION_DISPLAY_FIELDS),
    }
  }

  function apiCargueDetalleToLocal(item) {
    return {
      LocalId: ++localCounter,
      IdDetalleCargue: item.IdDetalleCargue ?? null,
      ...pickFields(item, CARGUE_PATCH_FIELDS, CARGUE_DEFAULTS),
      ...pickFields(item, CARGUE_DISPLAY_FIELDS),
    }
  }

  // ─── Cabeceras de tabla ───────────────────────────────────────────────────

  const recepcionHeaders = computed(() => [
    { title: 'Producto', key: 'CodigoProducto', sortable: false },
    { title: 'Lote', key: 'CodLote', sortable: false },
    { title: 'Pendiente', key: 'CantidadPendiente', align: 'center', sortable: false },
    { title: 'Obs.', key: 'ObservacionesProducto', sortable: false },
  ])

  const cargueHeaders = computed(() => [
    { title: 'Producto', key: 'CodigoProducto', sortable: false },
    { title: 'Lote', key: 'CodLote', sortable: false },
    { title: 'Asignado', key: 'CantidadAsignada', align: 'center', sortable: false },
    { title: 'Ubicación', key: 'CodigoUbicacion', sortable: false },
    { title: 'Obs.', key: 'Observaciones', sortable: false },
  ])

  // ─── Acciones de tabla de recepción ──────────────────────────────────────

  const recepcionRowActions = computed(() => [
    {
      label: 'Asignar ubicación',
      icon: 'mdi-map-marker-plus',
      visible: !isReadonly.value,
      action: (item) => abrirAsignarDialog(item),
    },
  ])

  // ─── Acciones de tabla de cargue ─────────────────────────────────────────

  const cargueRowActions = computed(() => [
    {
      label: 'Ver detalle',
      icon: 'mdi-eye',
      color: 'primary',
      visible: isReadonly.value,
      action: (item) => abrirVerDetalleDialog(item),
    },
    {
      label: 'Eliminar',
      icon: '$delete',
      color: 'error',
      visible: !isReadonly.value,
      action: (item) => eliminarCargueDetalle(item.LocalId),
    },
  ])

  // ─── Dialog ──────────────────────────────────────────────────────────────

  function abrirAsignarDialog(recepcionItem) {
    asignarDialog.value = {
      open: true,
      recepcionItem,
    }
  }

  function cerrarAsignarDialog() {
    asignarDialog.value = { open: false, recepcionItem: null }
  }

  function abrirVerDetalleDialog(cargueItem) {
    verDetalleDialog.value = { open: true, cargueItem }
  }

  function cerrarVerDetalleDialog() {
    verDetalleDialog.value = { open: false, cargueItem: null }
  }

  // ─── Mutaciones ──────────────────────────────────────────────────────────

  /**
   * Se llama cuando el usuario confirma la asignación en el modal.
   * payload: { CantidadAsignada, IdZona, IdPasillo, IdEstante, IdUbicacion, Observaciones,
   *            CodigoZona, CodigoPasillo, CodigoEstante, CodigoUbicacion }
   */
  function onAsignarSubmit({ payload, recepcionItem }) {
    const cantidadAsignada = Number(payload.CantidadAsignada)
    const cantidadPendiente = Number(recepcionItem.CantidadPendiente)

    // Agregar a la tabla de cargue
    cargueDetalles.value.push({
      LocalId: ++localCounter,
      IdDetalleCargue: null,
      IdDetalleRecepcion: recepcionItem.IdDetalleRecepcion ?? null,
      CodigoProducto: recepcionItem.CodigoProducto,
      NombreProducto: recepcionItem.NombreProducto ?? '',
      CodLote: recepcionItem.CodLote,
      CantidadAsignada: cantidadAsignada,

      // IDs para el payload a la API
      IdZona: payload.IdZona ?? null,
      IdPasillo: payload.IdPasillo ?? null,
      IdEstante: payload.IdEstante ?? null,
      IdUbicacion: payload.IdUbicacion ?? null,
      // Display
      CodigoZona: payload.CodigoZona ?? '',
      CodigoPasillo: payload.CodigoPasillo ?? '',
      CodigoEstante: payload.CodigoEstante ?? '',
      CodigoUbicacion: payload.CodigoUbicacion ?? '',
      Observaciones: payload.Observaciones ?? '',
    })

    // Actualizar tabla de recepción
    const restante = cantidadPendiente - cantidadAsignada
    if (restante <= 0) {
      // Producto completamente asignado → desaparece de recepción
      recepcionDetalles.value = recepcionDetalles.value.filter(
        (d) => d.LocalId !== recepcionItem.LocalId,
      )
    } else {
      // Asignación parcial → actualizar pendiente
      const idx = recepcionDetalles.value.findIndex((d) => d.LocalId === recepcionItem.LocalId)
      if (idx !== -1) {
        recepcionDetalles.value[idx] = {
          ...recepcionDetalles.value[idx],
          CantidadPendiente: restante,
        }
      }
    }

    cerrarAsignarDialog()
  }

  function eliminarCargueDetalle(localId) {
    const item = cargueDetalles.value.find((d) => d.LocalId === localId)
    const nombre = item?.CodigoProducto || 'este producto'

    $confirm
      .warning({
        title: '¿Eliminar asignación?',
        message: `Se eliminará la asignación del producto <strong>${nombre}</strong>. Si el producto tenía pendiente en recepción, la cantidad se devolverá.`,
        labelConfirm: 'Sí, eliminar',
        labelCancel: 'Cancelar',
      })
      .then((confirmado) => {
        if (!confirmado) return

        // Devolver cantidad a recepción si corresponde
        if (item) {
          const enRecepcion = recepcionDetalles.value.find(
            (d) => d.CodigoProducto === item.CodigoProducto && d.CodLote === item.CodLote,
          )
          if (enRecepcion) {
            enRecepcion.CantidadPendiente =
              Number(enRecepcion.CantidadPendiente) + Number(item.CantidadAsignada)
          } else {
            // El producto había desaparecido de recepción (asignación total), restaurarlo
            recepcionDetalles.value.push({
              LocalId: ++localCounter,
              IdDetalleRecepcion: item.IdDetalleRecepcion ?? null,
              CodigoProducto: item.CodigoProducto,
              NombreProducto: item.NombreProducto,
              CodLote: item.CodLote,
              CantidadPendiente: Number(item.CantidadAsignada),
              CantidadRecibida: Number(item.CantidadAsignada),
              ObservacionesProducto: '',
            })
          }
        }

        cargueDetalles.value = cargueDetalles.value.filter((d) => d.LocalId !== localId)
      })
  }

  // ─── Hidratación ─────────────────────────────────────────────────────────

  /**
   * Puebla la tabla de recepción a partir de los detalles del acta de recepción
   * (modo create: cuando el usuario selecciona un acta)
   */
  function hydrateRecepcionDetalles(apiDetalles = []) {
    recepcionDetalles.value = Array.isArray(apiDetalles)
      ? apiDetalles.map((d) => apiRecepcionDetalleToLocal(d))
      : []
    // Al cargar un nuevo acta, limpiar los cargues previos
    cargueDetalles.value = []
  }

  /**
   * Puebla la tabla de cargue a partir de los detalles del acta de cargue existente
   * (modo view: al abrir un acta ya guardada)
   */
  function hydrateCargueDetalles(apiDetalles = []) {
    cargueDetalles.value = Array.isArray(apiDetalles)
      ? apiDetalles.map((d) => apiCargueDetalleToLocal(d))
      : []
    // En modo view no hay tabla de recepción
    recepcionDetalles.value = []
  }

  function resetDetalles() {
    recepcionDetalles.value = []
    cargueDetalles.value = []
    asignarDialog.value = { open: false, recepcionItem: null }
    verDetalleDialog.value = { open: false, cargueItem: null }
  }

  // ─── Payload para API ─────────────────────────────────────────────────────

  /**
   * Genera el payload de detalles para enviar al crear el acta de cargue
   */
  function getCargueDetallesPayload() {
    return cargueDetalles.value.map((d) => ({
      IdDetalleRecepcion: d.IdDetalleRecepcion,
      IdUbicacion: d.IdUbicacion,
      CantidadAsignada: d.CantidadAsignada,
      Observaciones: d.Observaciones,
    }))
  }

  /**
   * Arma el body completo para el endpoint v1/load/create
   * @param {{ IdActaRecepcion: number, Observaciones?: string }} cabecera
   */
  function getCargueCreatePayload({ IdActaRecepcion, Observaciones = '' } = {}) {
    return {
      IdActaRecepcion,
      Observaciones,
      detalles: getCargueDetallesPayload(),
    }
  }

  /**
   * ¿Quedan productos completamente sin asignar en recepción?
   */
  const hayRecepcionPendiente = computed(() => recepcionDetalles.value.length > 0)

  /**
   * ¿Quedan unidades pendientes en algún producto (asignación parcial)?
   */
  const hayUnidadesPendientes = computed(() =>
    recepcionDetalles.value.some((d) => Number(d.CantidadPendiente) > 0),
  )

  return {
    recepcionDetalles,
    cargueDetalles,
    asignarDialog,
    verDetalleDialog,
    recepcionHeaders,
    cargueHeaders,
    recepcionRowActions,
    cargueRowActions,
    abrirAsignarDialog,
    cerrarAsignarDialog,
    abrirVerDetalleDialog,
    cerrarVerDetalleDialog,
    onAsignarSubmit,
    hydrateRecepcionDetalles,
    hydrateCargueDetalles,
    resetDetalles,
    getCargueDetallesPayload,
    getCargueCreatePayload,
    hayRecepcionPendiente,
    hayUnidadesPendientes,
  }
}
