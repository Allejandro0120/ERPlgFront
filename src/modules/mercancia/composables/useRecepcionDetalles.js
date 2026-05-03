import { computed, ref } from 'vue'
import {
  getChangedCollectionPayload,
  hasCollectionChanges,
} from '@/shared/composables/useChangePayload'

// CAMPOS PARA LA API
const PRODUCTO_PATCH_FIELDS = [
  'IdProducto',
  'Idlote',
  'IdUbicacion',
  'CantidadFacturada',
  'CantidadRecibida',
  'CantidadMuestra',
  'Aceptado',
  'ObservacionesProducto',
]

// CAMPOS DE DISPLAY (solo para mostrar, no van en payloads ni snapshots)
const PRODUCTO_DISPLAY_FIELDS = [
  'CodigoProducto',
  'NombreProducto',
  'CodLote',
  'CodZona',
  'CodUbicacion',
  'CodPasillo',
  'CodEstante',
]
// CAMPOS PARA SNAPSHOT (incluye IDs de ubicación para detectar cambios aunque no vayan al patch)
const PRODUCTO_SNAPSHOT_FIELDS = [
  'IdDetalle',
  ...PRODUCTO_PATCH_FIELDS,
  'IdZona',
  'IdPasillo',
  'IdEstante',
]

function pickFields(source, fields, defaults = {}) {
  return Object.fromEntries(fields.map((key) => [key, source[key] ?? defaults[key] ?? null]))
}

const PRODUCTO_DEFAULTS = {
  IdProducto: null,
  Idlote: null,
  IdUbicacion: null,
  CantidadFacturada: 0,
  CantidadRecibida: 0,
  CantidadMuestra: 0,
  Aceptado: false,
  ObservacionesProducto: '',
}

export function useRecepcionDetalles({ isReadonly }) {
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

  const detallerowActions = computed(() => [
    {
      label: 'Editar',
      icon: '$pencil',
      visible: !isReadonly.value,
      action: (item) => abrirPorLocalId(item.LocalId, 'edit'),
    },
    {
      label: 'Ver detalle',
      icon: '$eye',
      visible: isReadonly.value,
      action: (item) => abrirPorLocalId(item.LocalId, 'view'),
    },
  ])

  // ─── Mutaciones de lista  ───────────────────────────────────────────────────
  function onDetalleSubmit({ payload, mode }) {
    const localFields = {
      ...pickFields(payload, PRODUCTO_PATCH_FIELDS, PRODUCTO_DEFAULTS),
      IdZona: payload.IdZona ?? null,
      IdPasillo: payload.IdPasillo ?? null,
      IdEstante: payload.IdEstante ?? null,
    }

    if (mode === 'create') {
      detalles.value.push({
        LocalId: ++localDetalleCounter,
        IdDetalle: null,
        ...localFields,
      })
    } else if (mode === 'edit' && detalleDialog.value.editIdx !== null) {
      const idx = detalleDialog.value.editIdx
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
    return getChangedCollectionPayload({
      currentList: detalles.value,
      snapshotList: detallesSnapshot.value,
      idKey: 'IdDetalle',
      patchFields: PRODUCTO_PATCH_FIELDS,
      toCreatePlayload: (item) => localDetalleToApi(item, false),
      toFallbackPayload: (item) => localDetalleToApi(item, true),
    })
  }

  return {
    detalles,
    detallesSnapshot,
    detalleDialog,
    detalleHeaders,
    detallerowActions,
    abrirAgregarDetalle,
    onDetalleSubmit,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
  }
}
