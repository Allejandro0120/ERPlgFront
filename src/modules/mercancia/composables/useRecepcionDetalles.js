import { ref } from 'vue'
import {
  getChangedCollectionPayload,
  hasCollectionChanges,
} from '@/shared/composables/useChangePayload'

const productopatchFields = ['CantidadRecibida', 'CantidadMuestra', 'Aceptado']

export function useRecepcionDetalles () {
  let localDetalleCounter = 0

  const detalles = ref([])
  const detallesSnapshot = ref([])
  const productoDialog = ref({
    open: false,
    mode: 'create',
    producto: null,
    editIdx: null,
  })
  function apiDetalleToLocal (api) {
    return {
      LocalId: ++localDetalleCounter,
      IdDetalle: api.IdDetalle,
      CodigoProducto: api.CodigoProducto,
      CodLote: api.CodLote,
      CantidadFacturada: api.CantidadFacturada,
      CantidadRecibida: api.CantidadRecibida,
      CantidadMuestra: api.CantidadMuestra,
      Aceptado: !!api.Aceptado,
    }
  }

  function detalleSerializable (d) {
    return {
      IdDetalle: d.IdDetalle ?? null,
      CantidadRecibida: d.CantidadRecibida ?? 0,
      CantidadMuestra: d.CantidadMuestra ?? 0,
      Aceptado: !!d.Aceptado,
    }
  }

  function toDialogProducto (producto) {
    return {
      CodigoProducto: producto.CodigoProducto,
      CodLote: producto.CodLote,
      CantidadFacturada: producto.CantidadFacturada,
      CantidadRecibida: producto.CantidadRecibida,
      CantidadMuestra: producto.CantidadMuestra,
      Aceptado: producto.Aceptado,
      Observaciones: producto.Observaciones ?? '',
    }
  }
  function abrirVerProducto (idx) {
    const producto = detalles.value[idx]
    productoDialog.value = {
      open: true,
      mode: 'view',
      producto: toDialogProducto(producto),
      editIdx: idx,
    }
  }
  function handleVerProducto (item) {
    const idx = sucursales.value.findIndex(s => s.LocalId === item.LocalId)
    if (idx !== -1) {
      abrirVerSucursal(idx)
    }
  }

  function hydrateDetalles (apiDetalles = []) {
    const locales = Array.isArray(apiDetalles)
      ? apiDetalles.map(apiDetalleToLocal)
      : []

    detalles.value = locales
    detallesSnapshot.value = locales.map(detalleSerializable)
  }

  function setDetallesSnapshot (snapshot = []) {
    detallesSnapshot.value = snapshot
  }

  function resetDetalles () {
    detalles.value = []
    detallesSnapshot.value = []
  }

  function hasDetallesChanges () {
    return hasCollectionChanges(
      detalles.value,
      detallesSnapshot.value,
      detalleSerializable,
    )
  }

  function getDetallesChanges () {
    const payload = getChangedCollectionPayload({
      currentList: detalles.value,
      snapshotList: detallesSnapshot.value,
      idKey: 'IdDetalle',
      patchFields: productopatchFields,
      toCreatePayload: d => ({
        CodigoProducto: d.CodigoProducto,
        CodLote: d.CodLote,
        CantidadFacturada: d.CantidadFacturada,
        CantidadRecibida: d.CantidadRecibida,
        CantidadMuestra: d.CantidadMuestra,
        Aceptado: d.Aceptado,
      }),
      toFallbackPayload: d => ({
        IdDetalle: d.IdDetalle,
        CodigoProducto: d.CodigoProducto,
        CodLote: d.CodLote,
        CantidadFacturada: d.CantidadFacturada,
        CantidadRecibida: d.CantidadRecibida,
        CantidadMuestra: d.CantidadMuestra,
        Aceptado: d.Aceptado,
      }),
    })

    return payload && payload.length > 0 ? payload : null
  }

  return {
    detalles,
    detallesSnapshot,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
  }
}
