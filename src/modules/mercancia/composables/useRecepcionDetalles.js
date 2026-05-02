import { ref } from 'vue'
import {
  getChangedCollectionPayload,
  hasCollectionChanges,
} from '@/shared/composables/useChangePayload'

const productopatchFields = ['CantidadRecibida', 'CantidadMuestra', 'Aceptado']

export function useRecepcionDetalles() {
  let localDetalleCounter = 0

  const detalles = ref([])
  const detallesSnapshot = ref([])
  function apiDetalleToLocal(api) {
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

  function detalleSerializable(d) {
    return {
      IdDetalle: d.IdDetalle ?? null,
      CantidadRecibida: d.CantidadRecibida ?? 0,
      CantidadMuestra: d.CantidadMuestra ?? 0,
      Aceptado: !!d.Aceptado,
    }
  }

  // helper functions for dialog were removed as not used by current UI
  // Viewing helpers were removed because not used in current UI

  function hydrateDetalles(apiDetalles = []) {
    const locales = Array.isArray(apiDetalles) ? apiDetalles.map((d) => apiDetalleToLocal(d)) : []

    detalles.value = locales
    detallesSnapshot.value = locales.map((d) => detalleSerializable(d))
  }

  function setDetallesSnapshot(snapshot = []) {
    detallesSnapshot.value = snapshot
  }

  function resetDetalles() {
    detalles.value = []
    detallesSnapshot.value = []
  }

  function hasDetallesChanges() {
    return hasCollectionChanges(detalles.value, detallesSnapshot.value, detalleSerializable)
  }

  function getDetallesChanges() {
    const payload = getChangedCollectionPayload({
      currentList: detalles.value,
      snapshotList: detallesSnapshot.value,
      idKey: 'IdDetalle',
      patchFields: productopatchFields,
      toCreatePayload: (d) => ({
        CodigoProducto: d.CodigoProducto,
        CodLote: d.CodLote,
        CantidadFacturada: d.CantidadFacturada,
        CantidadRecibida: d.CantidadRecibida,
        CantidadMuestra: d.CantidadMuestra,
        Aceptado: d.Aceptado,
      }),
      toFallbackPayload: (d) => ({
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
