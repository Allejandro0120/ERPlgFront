import { computed, ref } from 'vue'
import {
  getChangedCollectionPayload,
  hasCollectionChanges,
} from '@/shared/composables/useChangePayload'

// ─── Campos que se envían al API en un PATCH ──────────────────────────────────
const SUCURSAL_PATCH_FIELDS = [
  'NombreSucursal',
  'Telefono',
  'CorreoGeneral',
  'Direccion',
  'IdCentroPoblado',
  'Habilitada',
]

// ─── Campos de display (nombres legibles, solo para mostrar) ──────────────────
// No se incluyen en snapshots ni en payloads al API.
const SUCURSAL_DISPLAY_FIELDS = [
  'NombreDepartamento',
  'NombreMunicipio',
  'NombreCentroPoblado',
]

// ─── Campos que se guardan en el snapshot para comparar cambios ───────────────
// Incluye IDs de ubicación porque aunque no van al patch, sí indican un cambio.
const SUCURSAL_SNAPSHOT_FIELDS = [
  'IdSucursal',
  ...SUCURSAL_PATCH_FIELDS,
  'IdDepartamento',
  'IdMunicipio',
]

// Construye un objeto con solo los campos indicados, aplicando un valor por
// defecto cuando el campo es undefined o null (para comparaciones consistentes).
function pickFields (source, fields, defaults = {}) {
  return Object.fromEntries(
    fields.map(key => [key, source[key] ?? defaults[key] ?? null]),
  )
}

const SUCURSAL_DEFAULTS = {
  NombreSucursal: '',
  Telefono: '',
  CorreoGeneral: '',
  Direccion: '',
  Habilitada: true,
}

export function useClienteSucursales ({ isReadonly }) {
  let localSucursalCounter = 0

  // ─── Estado ─────────────────────────────────────────────────────────────────
  const sucursales = ref([])
  const sucursalesSnapshot = ref([])
  const sucursalDialog = ref({
    open: false,
    mode: 'create',
    sucursal: null,
    editIdx: null,
  })

  // ─── Transformadores ─────────────────────────────────────────────────────────

  // API → estado local: agrega LocalId y campos de display
  function apiSucursalToLocal (apiSucursal) {
    return {
      LocalId: ++localSucursalCounter,
      ...pickFields(apiSucursal, SUCURSAL_SNAPSHOT_FIELDS, SUCURSAL_DEFAULTS),
      ...pickFields(apiSucursal, SUCURSAL_DISPLAY_FIELDS),
    }
  }

  // Estado local → snapshot: solo campos comparables, sin LocalId ni display
  function sucursalSerializable (sucursal) {
    return pickFields(sucursal, SUCURSAL_SNAPSHOT_FIELDS, SUCURSAL_DEFAULTS)
  }

  // Estado local → payload API
  function localSucursalToApi (sucursal, includeId = false) {
    const payload = pickFields(sucursal, SUCURSAL_PATCH_FIELDS, SUCURSAL_DEFAULTS)
    if (includeId && sucursal.IdSucursal) {
      payload.IdSucursal = sucursal.IdSucursal
    }
    return payload
  }

  // Estado local → objeto para el diálogo hijo (incluye display para precarga de ubicación)
  function toDialogSucursal (sucursal) {
    return {
      ...pickFields(sucursal, SUCURSAL_SNAPSHOT_FIELDS, SUCURSAL_DEFAULTS),
      ...pickFields(sucursal, SUCURSAL_DISPLAY_FIELDS),
    }
  }

  // ─── Diálogo ─────────────────────────────────────────────────────────────────

  function abrirSucursalDialog (mode, idx = null) {
    sucursalDialog.value = {
      open: true,
      mode,
      editIdx: idx,
      sucursal: idx === null ? null : toDialogSucursal(sucursales.value[idx]),
    }
  }

  // Busca por LocalId y delega a abrirSucursalDialog
  function abrirPorLocalId (localId, mode) {
    const idx = sucursales.value.findIndex(s => s.LocalId === localId)
    if (idx !== -1) {
      abrirSucursalDialog(mode, idx)
    }
  }

  function abrirAgregarSucursal () {
    abrirSucursalDialog('create')
  }

  // ─── Acciones de tabla ────────────────────────────────────────────────────────

  const sucursalesHeaders = computed(() => [
    { title: '#', key: 'indice', sortable: false, align: 'left' },
    { title: 'Nombre', key: 'NombreSucursal', sortable: false },
    { title: 'Dirección', key: 'Direccion', sortable: false },
    { title: 'Teléfono', key: 'Telefono', sortable: false },
    { title: 'Correo', key: 'CorreoGeneral', sortable: false },
    { title: 'Estado', key: 'Habilitada', sortable: false, align: 'center' },
  ])

  const sucursalRowActions = computed(() => [
    {
      label: 'Editar',
      icon: '$pencil',
      visible: !isReadonly.value,
      action: item => abrirPorLocalId(item.LocalId, 'edit'),
    },
    {
      label: 'Ver detalle',
      icon: '$eye',
      visible: isReadonly.value,
      action: item => abrirPorLocalId(item.LocalId, 'view'),
    },
  ])

  // ─── Mutaciones de lista ──────────────────────────────────────────────────────

  function onSucursalSubmit ({ payload, mode }) {
    const localFields = {
      ...pickFields(payload, SUCURSAL_PATCH_FIELDS, SUCURSAL_DEFAULTS),
      IdDepartamento: payload.IdDepartamento ?? null,
      IdMunicipio: payload.IdMunicipio ?? null,
    }

    if (mode === 'create') {
      sucursales.value.push({
        LocalId: ++localSucursalCounter,
        IdSucursal: null,
        ...localFields,
      })
    } else if (mode === 'edit' && sucursalDialog.value.editIdx !== null) {
      const idx = sucursalDialog.value.editIdx
      sucursales.value[idx] = { ...sucursales.value[idx], ...localFields }
    }

    sucursalDialog.value.open = false
  }

  // ─── Hidratación y snapshot ───────────────────────────────────────────────────

  function hydrateSucursales (apiSucursales = []) {
    const locales = Array.isArray(apiSucursales)
      ? apiSucursales.map(apiSucursalToLocal)
      : []
    sucursales.value = locales
    sucursalesSnapshot.value = locales.map(sucursalSerializable)
  }

  function setSucursalesSnapshot (snapshot = []) {
    sucursalesSnapshot.value = snapshot
  }

  function resetSucursales () {
    sucursales.value = []
    sucursalesSnapshot.value = []
    sucursalDialog.value = { open: false, mode: 'create', sucursal: null, editIdx: null }
  }

  // ─── Detección de cambios ─────────────────────────────────────────────────────

  function hasSucursalesChanges () {
    return hasCollectionChanges(
      sucursales.value,
      sucursalesSnapshot.value,
      sucursalSerializable,
    )
  }

  function getSucursalesChanges () {
    return getChangedCollectionPayload({
      currentList: sucursales.value,
      snapshotList: sucursalesSnapshot.value,
      idKey: 'IdSucursal',
      patchFields: SUCURSAL_PATCH_FIELDS,
      toCreatePayload: item => localSucursalToApi(item, false),
      toFallbackPayload: item => localSucursalToApi(item, true),
    })
  }

  // ─── API pública ──────────────────────────────────────────────────────────────
  return {
    sucursales,
    sucursalesSnapshot,
    sucursalDialog,
    sucursalesHeaders,
    sucursalRowActions,
    abrirAgregarSucursal,
    onSucursalSubmit,
    hydrateSucursales,
    setSucursalesSnapshot,
    resetSucursales,
    hasSucursalesChanges,
    getSucursalesChanges,
  }
}
