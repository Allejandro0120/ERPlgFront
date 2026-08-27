import { computed, ref } from 'vue'
import { $confirm } from '@/plugins/confirm/confirm'
import { hasCollectionChanges } from '@/shared/composables/useChangePayload'
import { pickFields } from '@/shared/utils/objectUtils'
import { IVA_DEFAULT } from '../../utils/calculoLinea'

export { IVA_DEFAULT } from '../../utils/calculoLinea'

// Campos que el backend permite modificar en un detalle existente (PUT /quotations/update).
// IdProducto queda fuera a propósito: el back conserva el producto original de la línea.
const DETALLE_PATCH_FIELDS = ['Cantidad', 'PrecioUnitario', 'PorcentajeDescuento', 'Observacion']

const DETALLE_FIELDS = [
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
  'ValorDescuento',
  'ValorIva',
  'Subtotal',
]

const DETALLE_DEFAULTS = {
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
  PorcentajeIva: IVA_DEFAULT,
  Observacion: '',
  ValorDescuento: 0,
  ValorIva: 0,
  Subtotal: 0,
}

export function useCotizacionDetalles() {
  let localDetalleCounter = 0

  const detalles = ref([])
  const detallesSnapshot = ref([])
  const detalleDialog = ref({ open: false, mode: 'create', detalle: null, editIdx: null })

  function detalleSerializable(detalle) {
    return {
      IdDetalle: detalle.IdDetalle ?? null,
      ...pickFields(detalle, DETALLE_PATCH_FIELDS, DETALLE_DEFAULTS),
    }
  }

  function apiDetalleToLocal(api) {
    const codigoNombre =
      api.CodigoNombreProducto ??
      [api.CodigoProducto, api.NombreProducto].filter(Boolean).join(' - ')
    return {
      LocalId: ++localDetalleCounter,
      ...pickFields(api, DETALLE_FIELDS, DETALLE_DEFAULTS),
      CodigoNombreProducto: codigoNombre,
    }
  }

  function hydrateDetalles(apiDetalles = []) {
    const locales = Array.isArray(apiDetalles)
      ? apiDetalles.map((detalle) => apiDetalleToLocal(detalle))
      : []
    detalles.value = locales
    detallesSnapshot.value = locales.map((d) => detalleSerializable(d))
  }

  function resetDetalles() {
    detalles.value = []
    detallesSnapshot.value = []
    detalleDialog.value = { open: false, mode: 'create', detalle: null, editIdx: null }
  }

  function toDialogDetalle(detalle) {
    return { LocalId: detalle.LocalId, ...pickFields(detalle, DETALLE_FIELDS, DETALLE_DEFAULTS) }
  }

  function abrirDetalleDialog(mode, idx = null) {
    detalleDialog.value = {
      open: true,
      mode,
      editIdx: idx,
      detalle: idx === null ? null : toDialogDetalle(detalles.value[idx]),
    }
  }

  function abrirPorLocalId(localId, mode) {
    const idx = detalles.value.findIndex((d) => d.LocalId === localId)
    if (idx !== -1) abrirDetalleDialog(mode, idx)
  }

  function abrirAgregarDetalle() {
    abrirDetalleDialog('create')
  }

  function eliminarDetalle(localId) {
    const detalle = detalles.value.find((d) => d.LocalId === localId)
    const nombre = detalle?.CodigoNombreProducto || 'este producto'

    $confirm
      .warning({
        title: '¿Eliminar producto?',
        message: `Se eliminará el producto <strong>${nombre}</strong> de la cotización.`,
        labelConfirm: 'Sí, eliminar',
        labelCancel: 'Cancelar',
      })
      .then((confirmado) => {
        if (confirmado) {
          detalles.value = detalles.value.filter((d) => d.LocalId !== localId)
        }
      })
  }

  // El modal de detalle ya entrega el payload con los valores calculados (ValorDescuento, Subtotal, ValorIva)
  function onDetalleSubmit({ payload, mode }) {
    if (mode === 'create') {
      detalles.value.push({
        LocalId: ++localDetalleCounter,
        ...pickFields(payload, DETALLE_FIELDS, DETALLE_DEFAULTS),
      })
    } else if (mode === 'edit' && detalleDialog.value.editIdx !== null) {
      const idx = detalleDialog.value.editIdx
      detalles.value[idx] = {
        ...detalles.value[idx],
        ...pickFields(payload, DETALLE_FIELDS, DETALLE_DEFAULTS),
      }
    }
    detalleDialog.value.open = false
  }

  const totales = computed(() =>
    detalles.value.reduce(
      (acc, item) => {
        acc.subtotal += Number(item.Subtotal) || 0
        acc.descuentoTotal += Number(item.ValorDescuento) || 0
        acc.valorIva += Number(item.ValorIva) || 0
        return acc
      },
      { subtotal: 0, descuentoTotal: 0, valorIva: 0 },
    ),
  )

  // ─── Detección y construcción de cambios (modo edición) ──────────────────────

  function hasDetallesChanges() {
    return hasCollectionChanges(detalles.value, detallesSnapshot.value, detalleSerializable)
  }

  function buildDetallesChangesPayload() {
    const snapshotById = new Map(
      detallesSnapshot.value.filter((d) => d.IdDetalle).map((d) => [d.IdDetalle, d]),
    )

    const idsActuales = new Set(detalles.value.filter((d) => d.IdDetalle).map((d) => d.IdDetalle))

    const eliminados = Array.from(snapshotById.keys())
      .filter((id) => !idsActuales.has(id))
      .map((id) => ({ IdDetalle: id, Eliminar: true }))

    const upserts = detalles.value
      .map((detalle) => {
        if (!detalle.IdDetalle) {
          // Producto nuevo: el back espera los campos base sin IdDetalle
          return {
            IdProducto: detalle.IdProducto,
            Cantidad: Number(detalle.Cantidad) || 0,
            PrecioUnitario: Number(detalle.PrecioUnitario) || 0,
            PorcentajeDescuento: Number(detalle.PorcentajeDescuento) || 0,
            Observacion: detalle.Observacion,
          }
        }

        const original = snapshotById.get(detalle.IdDetalle)
        if (!original) {
          return { IdDetalle: detalle.IdDetalle, ...detalleSerializable(detalle) }
        }

        // Construye patch solo con los campos que cambiaron
        const patch = DETALLE_PATCH_FIELDS.reduce((acc, key) => {
          if (detalle[key] !== original[key]) {
            acc[key] = detalle[key]
          }
          return acc
        }, {})

        if (Object.keys(patch).length === 0) {
          return null
        }
        return { IdDetalle: detalle.IdDetalle, ...patch }
      })
      .filter(Boolean)

    // Eliminaciones primero, igual que en el patrón de correos del cliente
    return [...eliminados, ...upserts]
  }

  function getDetallesChanges() {
    if (!hasDetallesChanges()) {
      return null
    }
    const payload = buildDetallesChangesPayload()
    return payload.length > 0 ? payload : null
  }

  return {
    detalles,
    detallesSnapshot,
    detalleDialog,
    hydrateDetalles,
    resetDetalles,
    abrirAgregarDetalle,
    abrirPorLocalId,
    eliminarDetalle,
    onDetalleSubmit,
    totales,
    hasDetallesChanges,
    getDetallesChanges,
  }
}
