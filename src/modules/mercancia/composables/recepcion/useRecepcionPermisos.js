// composables/recepcion/useRecepcionPermisos.js
import { computed } from 'vue'

export const ESTADOS_ACTA = {
  BORRADOR: 'Borrador',
  PENDIENTE: 'Pendiente',
  CERRADA: 'Cerrada',
}

export function useRecepcionPermisos(estadoActaNombre) {
  const esBorrador = computed(() => estadoActaNombre.value === ESTADOS_ACTA.BORRADOR)
  const esPendiente = computed(() => estadoActaNombre.value === ESTADOS_ACTA.PENDIENTE)

  const permisos = computed(() => ({
    // Info tab
    NroActa:                false,
    FechaActa:              false,
    IdEstado:               esBorrador.value || esPendiente.value,
    IdProveedor:            esBorrador.value || esPendiente.value,
    IdCedi:                 esBorrador.value,
    IdBodega:               esBorrador.value,
    PrefijoFacturaRecibida: esBorrador.value || esPendiente.value,
    NumeroFacturaRecibida:  esBorrador.value || esPendiente.value,
    FechaFacturaRecibida:   esBorrador.value || esPendiente.value,
    Observaciones:          esBorrador.value || esPendiente.value,
    // Detalle tab
    puedeAgregarDetalle:    esBorrador.value || esPendiente.value,
    puedeEliminarDetalle:   esBorrador.value,
    puedeEditarDetalle:     esBorrador.value || esPendiente.value,
  }))

  return { esBorrador, esPendiente, permisos }
}