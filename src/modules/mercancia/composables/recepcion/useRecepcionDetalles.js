import { computed, ref } from 'vue'
import { $confirm } from '@/plugins/confirm/confirm.js'
import {
  getChangedCollectionPayload,
  hasCollectionChanges,
} from '@/shared/composables/useChangePayload'
import { pickFields } from '@/shared/utils/objectUtils'

// CAMPOS PARA LA API
const PRODUCTO_PATCH_FIELDS = [
  'IdProducto',
  'IdLote',
  'CantidadFacturada',
  'CantidadRecibida',
  'CantidadMuestra',
  'Aceptado',
  'ObservacionesProducto',
]

// CAMPOS DE DISPLAY (solo para mostrar, no van en payloads ni snapshots)
const PRODUCTO_DISPLAY_FIELDS = ['CodigoProducto', 'NombreProducto', 'CodLote']
// CAMPOS PARA SNAPSHOT (incluye IDs de ubicación para detectar cambios aunque no vayan al patch)
const PRODUCTO_SNAPSHOT_FIELDS = ['IdDetalle', ...PRODUCTO_PATCH_FIELDS]

const PRODUCTO_DEFAULTS = {
  IdProducto: null,
  IdLote: null,
  CantidadFacturada: 0,
  CantidadRecibida: 0,
  CantidadMuestra: 0,
  Aceptado: true,
  ObservacionesProducto: '',
}

export function useRecepcionDetalles({ isReadonly, permisos }) {
  let localDetalleCounter = 0

  const detalles = ref([])
  const detallesSnapshot = ref([])
  const detalleDialog = ref({
    open: false,
    mode: 'create',
    detalle: null,
    editIdx: null,
  })

  // ─── Transformadores ─────────────────────────────────────────────────────────
  //  agregar localID y campos de display (nombres legibles, solo para mostrar)
  function apiDetalleToLocal(api) {
    return {
      LocalId: ++localDetalleCounter,
      ...pickFields(api, PRODUCTO_SNAPSHOT_FIELDS, PRODUCTO_DEFAULTS),
      ...pickFields(api, PRODUCTO_DISPLAY_FIELDS),
    }
  }
  // Solo los campos que van al patch, sin campos de display ni IDs de ubicación
  function detalleSerializable(detalle) {
    return pickFields(detalle, PRODUCTO_SNAPSHOT_FIELDS, PRODUCTO_DEFAULTS)
  }
  // Estado local → payload para API: solo campos del patch, con ID si se incluye
  function localDetalleToApi(detalle, includeId = false) {
    const payload = pickFields(detalle, PRODUCTO_PATCH_FIELDS, PRODUCTO_DEFAULTS)
    if (includeId && detalle.IdDetalle) {
      payload.IdDetalle = detalle.IdDetalle
    }
    return payload
  }

  // Solo para mostrar en el diálogo, incluye campos de display pero no IDs ni LocalId
  function toDialogDetalle(detalle) {
    return {
      LocalId: detalle.LocalId,
      ...pickFields(detalle, PRODUCTO_SNAPSHOT_FIELDS, PRODUCTO_DEFAULTS),
      ...pickFields(detalle, PRODUCTO_DISPLAY_FIELDS),
    }
  }
  // ─── Dialog ─────────────────────────────────────────────────────────────

  function abrirDetalleDialog(mode, idx = null) {
    detalleDialog.value = {
      open: true,
      mode,
      editIdx: idx,
      detalle: idx === null ? null : toDialogDetalle(detalles.value[idx]),
    }
  }

  function abrirPorLocalId(LocalId, mode) {
    const idx = detalles.value.findIndex((d) => d.LocalId === LocalId)
    if (idx !== -1) {
      abrirDetalleDialog(mode, idx)
    }
  }

  function abrirAgregarDetalle() {
    abrirDetalleDialog('create')
  }
  function eliminarDetalle(LocalId) {
    const detalle = detalles.value.find((d) => d.LocalId === LocalId)
    const nombre = detalle?.CodigoProducto || 'este producto'

    $confirm
      .warning({
        title: '¿Eliminar producto?',
        message: `Se eliminará el producto <strong>${nombre}</strong> del acta. Esta acción no se puede deshacer.`,
        labelConfirm: 'Sí, eliminar',
        labelCancel: 'Cancelar',
      })
      .then((confirmado) => {
        if (confirmado) {
          detalles.value = detalles.value.filter((d) => d.LocalId !== LocalId)
        }
      })
  }

  // ─── Acciones de tabla  ─────────────────────────────────────────────────────

  const detalleHeaders = computed(() => [
    { title: 'Producto', key: 'CodigoProducto', sortable: false },
    { title: 'Lote', key: 'CodLote', sortable: false },
    {
      title: 'Facturado',
      key: 'CantidadFacturada',
      align: 'center',
      sortable: false,
    },
    {
      title: 'Recibido',
      key: 'CantidadRecibida',
      align: 'center',
      sortable: false,
    },
    {
      title: 'Muestra',
      key: 'CantidadMuestra',
      align: 'center',
      sortable: false,
    },
    { title: 'Estado', key: 'Aceptado', align: 'center', sortable: false },
    { title: 'Obs.', key: 'ObservacionesProducto', sortable: false },
  ])

  const detalleRowActions = computed(() => [
    {
      label: 'Editar',
      icon: '$pencil',
      visible: !isReadonly.value && permisos.value.puedeEditarDetalle,
      action: (item) => abrirPorLocalId(item.LocalId, 'edit'),
    },
    {
      label: 'Eliminar',
      icon: '$delete',
      color: 'error',
      visible: !isReadonly.value && permisos.value.puedeEliminarDetalle,
      action: (item) => eliminarDetalle(item.LocalId),
    },
    {
      label: 'Ver detalle',
      icon: '$eye',
      visible: isReadonly.value || !permisos?.value?.puedeEditarDetalle,
      action: (item) => abrirPorLocalId(item.LocalId, 'view'),
    },
  ])

  // ─── Mutaciones de lista  ───────────────────────────────────────────────────
  function onDetalleSubmit({ payload, mode }) {
    // En modo edit, payload solo contiene los campos que realmente cambiaron.
    // En modo create, payload contiene los campos necesarios para crear.
    const localFields = {
      ...payload,
      // Asegurar campos de display siempre presentes
      CodigoProducto: payload.CodigoProducto ?? '',
      NombreProducto: payload.NombreProducto ?? '',
      CodLote: payload.CodLote ?? '',
    }

    if (mode === 'create') {
      detalles.value.push({
        LocalId: ++localDetalleCounter,
        IdDetalle: null,
        ...pickFields(localFields, PRODUCTO_PATCH_FIELDS, PRODUCTO_DEFAULTS),
        ...pickFields(localFields, PRODUCTO_DISPLAY_FIELDS),
      })
    } else if (mode === 'edit' && detalleDialog.value.editIdx !== null) {
      const idx = detalleDialog.value.editIdx
      // En edit, solo mergear los campos que vinieron en el payload (los que realmente cambiaron)
      detalles.value[idx] = { ...detalles.value[idx], ...localFields }
    }

    detalleDialog.value.open = false
  }

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
    detalleDialog.value = {
      open: false,
      mode: 'create',
      detalle: null,
      editIdx: null,
    }
  }

  function hasDetallesChanges() {
    return hasCollectionChanges(detalles.value, detallesSnapshot.value, detalleSerializable)
  }
  function getDetallesChanges() {
    const currentIds = new Set(detalles.value.filter((d) => d.IdDetalle).map((d) => d.IdDetalle))

    // Elementos eliminados (presentes en snapshot pero no en current)
    const deleted = (detallesSnapshot.value || [])
      .filter((item) => item.IdDetalle && !currentIds.has(item.IdDetalle))
      .map((item) => ({ IdDetalle: item.IdDetalle, Eliminar: true }))

    // Elementos creados/modificados (lógica existente)
    const changes = getChangedCollectionPayload({
      currentList: detalles.value,
      snapshotList: detallesSnapshot.value,
      idKey: 'IdDetalle',
      patchFields: PRODUCTO_PATCH_FIELDS,
      toCreatePayload: (item) => localDetalleToApi(item, false),
      toFallbackPayload: (item) => localDetalleToApi(item, true),
    })

    return [...changes, ...deleted]
  }

  return {
    detalles,
    detallesSnapshot,
    detalleDialog,
    detalleHeaders,
    detalleRowActions,
    abrirAgregarDetalle,
    onDetalleSubmit,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
    localDetalleToApi,
  }
}
