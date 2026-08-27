<template>
  <base-dialog
    color="primary"
    :disable-confirm="isCreating && cargueDetalles.length === 0"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    max-width="1200"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <!-- Modal de asignación de ubicación -->
      <cargue-detalle-form-dialog
        v-model="asignarDialog.open"
        :cargue-detalles="cargueDetalles"
        :id-bodega="form.IdBodega"
        :recepcion-item="asignarDialog.recepcionItem"
        @submit="onAsignarSubmit"
      />

      <!-- Modal de vista de detalle (readonly) -->
      <cargue-detalle-form-dialog
        v-model="verDetalleDialog.open"
        :readonly="true"
        :recepcion-item="verDetalleDialog.cargueItem"
      />

      <v-form ref="formRef">
        <v-tabs v-model="ui.tab" class="mb-4" color="primary">
          <v-tab value="info">
            <v-icon icon="mdi-file" start />
            Información
          </v-tab>
          <v-tab value="detalle">
            <v-icon icon="mdi-format-list-bulleted" start />
            Detalle
            <v-badge
              v-if="isCreating && recepcionDetalles.length > 0"
              class="ml-2"
              color="warning"
              :content="recepcionDetalles.length"
              inline
            />
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <v-tabs-window-item eager value="info">
            <cargue-info-tab
              :form="form"
              :is-readonly="isReadonly"
              @acta-cargada="onActaCargada"
              @update:form="form = $event"
            />
          </v-tabs-window-item>

          <v-tabs-window-item eager value="detalle">
            <cargue-detalle-tab
              :cargue-detalles="cargueDetalles"
              :cargue-headers="cargueHeaders"
              :cargue-row-actions="cargueRowActions"
              :is-readonly="isReadonly"
              :recepcion-acta-cargada="!!form.ActaRecepcion"
              :recepcion-detalles="recepcionDetalles"
              :recepcion-headers="recepcionHeaders"
              :recepcion-row-actions="recepcionRowActions"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { cargueService } from '@/api/services/cargueService'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { useCargueDetalles } from '../../composables/cargue/useCargueDetalles.js'
  import CargueDetalleFormDialog from './CargueDetalleFormDialog.vue'
  import CargueDetalleTab from './tabs/CargueDetalleTab.vue'
  import CargueInfoTab from './tabs/CargueInfoTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'view'].includes(v),
    },
    acta: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const formRef = ref(null)

  const isReadonly = computed(() => props.mode === 'view')
  const isCreating = computed(() => props.mode === 'create')

  const isSaving = ref(false)

  // ─── Composable de detalles ───────────────────────────────────────────────
  const {
    recepcionDetalles,
    cargueDetalles,
    asignarDialog,
    verDetalleDialog,
    recepcionHeaders,
    cargueHeaders,
    recepcionRowActions,
    cargueRowActions,
    onAsignarSubmit,
    hydrateRecepcionDetalles,
    hydrateCargueDetalles,
    resetDetalles,
    getCargueCreatePayload,
    hayRecepcionPendiente,
    hayUnidadesPendientes,
  } = useCargueDetalles({ isReadonly })

  // ─── Form ─────────────────────────────────────────────────────────────────
  const formInitial = {
    ActaRecepcion: '',
    FechaActaRecepcion: '',
    FechaActaCargue: '',
    NombreCedi: '',
    NombreBodega: '',
    IdCedi: null,
    IdBodega: null,
    Observaciones: '',
    Usuario: '',
  }

  const form = ref({ ...formInitial })
  const ui = ref({ tab: 'info' })

  const hasChanges = computed(
    () =>
      cargueDetalles.value.length > 0 || !!form.value.ActaRecepcion || !!form.value.Observaciones,
  )

  // ─── Títulos ──────────────────────────────────────────────────────────────
  const actaDisplayName = computed(() => props.acta?.ActaCargue ?? '')

  const dialogTitle = computed(() => {
    const base = { create: 'Crear Acta de Cargue', view: 'Detalle del Acta' }[props.mode] ?? 'Acta'
    return props.mode === 'create' || !actaDisplayName.value
      ? base
      : `${base}: ${actaDisplayName.value}`
  })

  const dialogIcon = computed(
    () =>
      ({ create: 'mdi-package-variant-closed-plus', view: 'mdi-package-variant-closed' })[
        props.mode
      ],
  )

  const labelConfirm = computed(() => ({ create: 'Guardar y enviar', view: '' })[props.mode])

  // ─── Evento del autocomplete de acta ──────────────────────────────────────
  function onActaCargada(actaData) {
    if (!actaData) {
      resetDetalles()
      return
    }
    hydrateRecepcionDetalles(actaData.detalles ?? [])
  }

  // ─── Hidratación en modo view ─────────────────────────────────────────────
  watch(
    () => props.acta,
    (acta) => {
      if (acta) {
        form.value = {
          IdActaRecepcion: acta.IdActaRecepcion ?? null,
          ActaRecepcion: acta.ActaRecepcion ?? '',
          FechaActaRecepcion: acta.FechaActaRecepcion ?? '',
          FechaActaCargue: acta.FechaActaCargue ?? '',
          NombreCedi: acta.NombreCedi ?? '',
          NombreBodega: acta.NombreBodega ?? '',
          IdCedi: null,
          IdBodega: null,
          Observaciones: acta.Observaciones ?? '',
          Usuario: acta.Usuario ?? '',
        }
        if (isReadonly.value) {
          hydrateCargueDetalles(acta.Detalles ?? [])
        }
      } else {
        form.value = { ...formInitial }
        resetDetalles()
      }
    },
    { immediate: true },
  )

  // ─── Reset al cerrar ──────────────────────────────────────────────────────
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) {
        form.value = { ...formInitial }
        ui.value = { tab: 'info' }
        resetDetalles()
      }
    },
  )

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function submitForm() {
    if (!form.value.ActaRecepcion) {
      $toast.warning('Debes seleccionar un acta de recepción')
      ui.value.tab = 'info'
      return
    }

    if (cargueDetalles.value.length === 0) {
      $toast.warning('Debes asignar al menos un producto al cargue')
      ui.value.tab = 'detalle'
      return
    }

    if (hayRecepcionPendiente.value || hayUnidadesPendientes.value) {
      $toast.error(`Debes asignar todos los productos y unidades antes de continuar.`)
      ui.value.tab = 'detalle'
      return
    }

    const payload = getCargueCreatePayload({
      IdActaRecepcion: form.value.IdActaRecepcion,
      Observaciones: form.value.Observaciones,
    })
    isSaving.value = true
    $loading.show()
    try {
      const response = await cargueService.createCargue(payload)
      $toast.success('Acta de cargue creada correctamente')
      emit('submit', response?.data ?? null)
      emit('update:modelValue', false)
    } finally {
      $loading.hide()
      isSaving.value = false
    }

    emit('submit', payload)
  }

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
  })
</script>
