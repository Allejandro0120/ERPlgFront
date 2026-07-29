import { computed, ref } from 'vue'

import { $toast } from '@/plugins/toast'
import { hasCollectionChanges } from '@/shared/composables/useChangePayload'
import { pickFields } from '@/shared/utils/objectUtils'

const LOTE_PATCH_FIELDS = ['CodLote', 'FechaVencimiento', 'FechaFabricacion', 'Activo']

const LOTE_DEFAULTS = {
  CodLote: '',
  FechaVencimiento: null,
  FechaFabricacion: null,
  Activo: true,
}

function normalizeCodLote(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}

export function useProductoLotes() {
  let localLoteCounter = 0

  // ─── Estado ─────────────────────────────────────────────────────────────────
  const lotes = ref([])
  const lotesSnapshot = ref([])
  const loteDialog = ref({
    open: false,
    mode: 'create',
  })

  // ─── Transformadores ─────────────────────────────────────────────────────────

  function apiLoteToLocal(apiLote) {
    return {
      LocalId: ++localLoteCounter,
      IdLote: apiLote.IdLote ?? null,
      ...pickFields(apiLote, LOTE_PATCH_FIELDS, LOTE_DEFAULTS),
    }
  }

  function loteSerializable(lote) {
    return {
      IdLote: lote.IdLote ?? null,
      ...pickFields(lote, LOTE_PATCH_FIELDS, LOTE_DEFAULTS),
    }
  }

  function localLoteToApi(lote) {
    // Los lotes solo se crean, nunca se envía IdLote
    return pickFields(lote, LOTE_PATCH_FIELDS, LOTE_DEFAULTS)
  }

  // ─── Validación ──────────────────────────────────────────────────────────────

  function isDuplicateLote({ CodLote }) {
    const targetCod = normalizeCodLote(CodLote)

    return lotes.value.some((lote) => normalizeCodLote(lote.CodLote) === targetCod)
  }

  // ─── Diálogo ─────────────────────────────────────────────────────────────────

  function abrirLoteDialog() {
    loteDialog.value = {
      open: true,
      mode: 'create',
    }
  }

  function abrirAgregarLote() {
    abrirLoteDialog()
  }

  // ─── Tabla ──────────────────────────────────────────────────────────────────

  const lotesHeaders = computed(() => [
    { title: '#', key: 'indice', sortable: false, align: 'left' },
    { title: 'Código', key: 'CodLote', sortable: false },
    { title: 'Fecha de Fabricación', key: 'FechaFabricacion', sortable: false },
    { title: 'Fecha de Vencimiento', key: 'FechaVencimiento', sortable: false },
    { title: 'Activo', key: 'Activo', sortable: false },
  ])

  // Los lotes no se editan ni eliminan como fila completa: lo único editable
  // es el estado (Activo), que se alterna directamente desde el switch de la tabla.
  function toggleLoteActivo(localId, activo) {
    const lote = lotes.value.find((l) => l.LocalId === localId)
    if (!lote) return
    lote.Activo = !!activo
  }

  // ─── Mutaciones de lista ──────────────────────────────────────────────────────

  function onLoteSubmit({ payload }) {
    if (isDuplicateLote(payload)) {
      $toast.error('Ya existe un lote con ese código para este producto')
      return
    }

    const local = {
      ...pickFields(payload, LOTE_PATCH_FIELDS, LOTE_DEFAULTS),
      CodLote: String(payload.CodLote ?? '').trim(),
    }

    lotes.value.push({
      LocalId: ++localLoteCounter,
      IdLote: null,
      ...local,
    })

    loteDialog.value.open = false
  }

  // ─── Hidratación y snapshot ───────────────────────────────────────────────────

  function hydrateLotes(apiLotes = []) {
    const locales = Array.isArray(apiLotes) ? apiLotes.map((l) => apiLoteToLocal(l)) : []
    lotes.value = locales
    lotesSnapshot.value = locales.map((l) => loteSerializable(l))
  }

  function setLotesSnapshot(snapshot = []) {
    lotesSnapshot.value = snapshot
  }

  function resetLotes() {
    lotes.value = []
    lotesSnapshot.value = []
    loteDialog.value = {
      open: false,
      mode: 'create',
    }
  }

  // ─── Detección y construcción de cambios ─────────────────────────────────────

  function hasLotesChanges() {
    return hasCollectionChanges(lotes.value, lotesSnapshot.value, loteSerializable)
  }

  function buildLotesChangesPayload() {
    // Altas: cualquier lote sin IdLote es nuevo, se manda completo (sin IdLote)
    const nuevos = lotes.value.filter((lote) => !lote.IdLote).map((lote) => localLoteToApi(lote))

    // Actualizaciones: lotes existentes cuyo estado (Activo) cambió respecto al snapshot.
    // Lo único editable de un lote existente es su estado; la API identifica la
    // actualización porque el objeto trae IdLote.
    const existentes = lotes.value
      .filter((lote) => lote.IdLote)
      .filter((lote) => {
        const snapshot = lotesSnapshot.value.find((s) => s.IdLote === lote.IdLote)
        return snapshot && snapshot.Activo !== lote.Activo
      })
      .map((lote) => ({ IdLote: lote.IdLote, Activo: lote.Activo }))

    return [...nuevos, ...existentes]
  }

  function getLotesChanges() {
    if (!hasLotesChanges()) {
      return null
    }
    const payload = buildLotesChangesPayload()
    return payload.length > 0 ? payload : null
  }

  // ─── API pública ──────────────────────────────────────────────────────────────
  return {
    lotes,
    lotesSnapshot,
    loteDialog,
    lotesHeaders,
    abrirAgregarLote,
    onLoteSubmit,
    toggleLoteActivo,
    hydrateLotes,
    setLotesSnapshot,
    resetLotes,
    hasLotesChanges,
    getLotesChanges,
  }
}
