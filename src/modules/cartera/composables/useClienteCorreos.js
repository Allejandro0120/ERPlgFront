import { computed, ref } from 'vue'
import { $confirm } from '@/plugins/confirm/confirm.js'
import { $toast } from '@/plugins/toast'
import { hasCollectionChanges } from '@/shared/composables/useChangePayload'

const CORREO_PATCH_FIELDS = ['IdTipoCorreo', 'Email']

const CORREO_DEFAULTS = {
  IdTipoCorreo: null,
  Email: '',
}

function pickFields (source, fields, defaults = {}) {
  return Object.fromEntries(
    fields.map(key => [key, source[key] ?? defaults[key] ?? null]),
  )
}

function normalizeEmail (value) {
  return String(value ?? '').trim().toLowerCase()
}

export function useClienteCorreos ({ isReadonly }) {
  let localCorreoCounter = 0

  // ─── Estado ─────────────────────────────────────────────────────────────────
  const correos = ref([])
  const correosSnapshot = ref([])
  const correoDialog = ref({
    open: false,
    mode: 'create',
    correo: null,
    editIdx: null,
  })

  // ─── Transformadores ─────────────────────────────────────────────────────────

  function apiCorreoToLocal (apiCorreo) {
    return {
      LocalId: ++localCorreoCounter,
      IdCorreo: apiCorreo.IdCorreo ?? null,
      NombreTipoCorreo: apiCorreo.TipoCorreo || apiCorreo.NombreTipoCorreo,
      ...pickFields(apiCorreo, CORREO_PATCH_FIELDS, CORREO_DEFAULTS),
    }
  }

  function correoSerializable (correo) {
    return {
      IdCorreo: correo.IdCorreo ?? null,
      ...pickFields(correo, CORREO_PATCH_FIELDS, CORREO_DEFAULTS),
    }
  }

  function localCorreoToApi (correo, includeId = false) {
    const payload = pickFields(correo, CORREO_PATCH_FIELDS, CORREO_DEFAULTS)
    if (includeId && correo.IdCorreo) {
      payload.IdCorreo = correo.IdCorreo
    }
    return payload
  }

  // ─── Validación ──────────────────────────────────────────────────────────────

  function isDuplicateCorreo ({ IdTipoCorreo, Email }, mode) {
    const targetTipo = Number(IdTipoCorreo)
    const targetEmail = normalizeEmail(Email)
    const skipIdx = mode === 'edit' ? correoDialog.value.editIdx : null

    return correos.value.some((correo, idx) => {
      if (skipIdx !== null && idx === skipIdx) {
        return false
      }
      return (
        Number(correo.IdTipoCorreo) === targetTipo
        && normalizeEmail(correo.Email) === targetEmail
      )
    })
  }

  // ─── Diálogo ─────────────────────────────────────────────────────────────────

  function abrirCorreoDialog (mode, idx = null) {
    const correo = idx === null ? null : correos.value[idx]
    correoDialog.value = {
      open: true,
      mode,
      editIdx: idx,
      correo: correo
        ? {
            IdCorreo: correo.IdCorreo,
            NombreTipoCorreo: correo.NombreTipoCorreo,
            ...pickFields(correo, CORREO_PATCH_FIELDS, CORREO_DEFAULTS),
          }
        : null,
    }
  }

  function abrirAgregarCorreo () {
    abrirCorreoDialog('create')
  }

  // ─── Acciones de tabla ────────────────────────────────────────────────────────

  const correosHeaders = computed(() => [
    { title: '#', key: 'indice', sortable: false, align: 'left' },
    { title: 'Tipo', key: 'IdTipoCorreo', sortable: false },
    { title: 'Correo', key: 'Email', sortable: false },
  ])

  const correoRowActions = computed(() => [
    {
      label: 'Editar',
      icon: '$pencil',
      visible: !isReadonly.value,
      action: item => {
        const idx = correos.value.findIndex(c => c.LocalId === item.LocalId)
        if (idx !== -1) {
          abrirCorreoDialog('edit', idx)
        }
      },
    },
    {
      label: 'Eliminar',
      icon: '$delete',
      color: 'error',
      visible: !isReadonly.value,
      action: item => handleEliminarCorreo(item),
    },
  ])

  // ─── Mutaciones de lista ──────────────────────────────────────────────────────

  function onCorreoSubmit ({ payload, mode }) {
    if (isDuplicateCorreo(payload, mode)) {
      $toast.error('Ya existe ese correo para el tipo seleccionado')
      return
    }

    const local = {
      ...pickFields(payload, CORREO_PATCH_FIELDS, CORREO_DEFAULTS),
      Email: String(payload.Email ?? '').trim(),
    }

    if (mode === 'create') {
      correos.value.push({ LocalId: ++localCorreoCounter, IdCorreo: null, ...local })
    } else if (mode === 'edit' && correoDialog.value.editIdx !== null) {
      const idx = correoDialog.value.editIdx
      correos.value[idx] = { ...correos.value[idx], ...local }
    }

    correoDialog.value.open = false
  }

  async function handleEliminarCorreo (item) {
    const idx = correos.value.findIndex(c => c.LocalId === item.LocalId)
    if (idx === -1) {
      return
    }

    const confirmed = await $confirm.warning({
      title: '¿Eliminar correo?',
      message: `Se eliminará el correo ${item.Email || '(sin correo)'} del cliente.`,
      labelConfirm: 'Sí, eliminar',
      labelCancel: 'Cancelar',
    })

    if (confirmed) {
      correos.value.splice(idx, 1)
    }
  }

  // ─── Hidratación y snapshot ───────────────────────────────────────────────────

  function hydrateCorreos (apiCorreos = []) {
    const locales = Array.isArray(apiCorreos)
      ? apiCorreos.map(apiCorreoToLocal)
      : []
    correos.value = locales
    correosSnapshot.value = locales.map(correoSerializable)
  }

  function setCorreosSnapshot (snapshot = []) {
    correosSnapshot.value = snapshot
  }

  function resetCorreos () {
    correos.value = []
    correosSnapshot.value = []
    correoDialog.value = { open: false, mode: 'create', correo: null, editIdx: null }
  }

  // ─── Detección y construcción de cambios ─────────────────────────────────────

  function hasCorreosChanges () {
    return hasCollectionChanges(correos.value, correosSnapshot.value, correoSerializable)
  }

  function buildCorreosChangesPayload () {
    const snapshotById = new Map(
      correosSnapshot.value
        .filter(c => c.IdCorreo)
        .map(c => [c.IdCorreo, c]),
    )

    const idsActuales = new Set(
      correos.value.filter(c => c.IdCorreo).map(c => c.IdCorreo),
    )

    const eliminados = Array.from(snapshotById.keys())
      .filter(id => !idsActuales.has(id))
      .map(id => ({ IdCorreo: id, Eliminar: true }))

    const upserts = correos.value
      .map(correo => {
        if (!correo.IdCorreo) {
          return localCorreoToApi(correo, false)
        }

        const original = snapshotById.get(correo.IdCorreo)
        if (!original) {
          return localCorreoToApi(correo, true)
        }

        // Construye patch solo con los campos que cambiaron
        const patch = CORREO_PATCH_FIELDS.reduce((acc, key) => {
          if (correo[key] !== original[key]) {
            acc[key] = correo[key]
          }
          return acc
        }, {})

        if (Object.keys(patch).length === 0) {
          return null
        }
        return { IdCorreo: correo.IdCorreo, ...patch }
      })
      .filter(Boolean)

    // Eliminaciones primero para evitar conflictos de duplicado en el mismo submit
    return [...eliminados, ...upserts]
  }

  function getCorreosChanges () {
    if (!hasCorreosChanges()) {
      return null
    }
    const payload = buildCorreosChangesPayload()
    return payload.length > 0 ? payload : null
  }

  // ─── API pública ──────────────────────────────────────────────────────────────
  return {
    correos,
    correosSnapshot,
    correoDialog,
    correosHeaders,
    correoRowActions,
    abrirAgregarCorreo,
    onCorreoSubmit,
    hydrateCorreos,
    setCorreosSnapshot,
    resetCorreos,
    hasCorreosChanges,
    getCorreosChanges,
  }
}
