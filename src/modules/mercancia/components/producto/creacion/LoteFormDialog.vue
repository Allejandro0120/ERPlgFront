<template>
  <base-dialog
    color="primary"
    icon="mdi-package-variant-plus"
    label-confirm="Agregar Lote"
    max-width="600"
    :model-value="modelValue"
    show-actions
    title="Agregar Lote"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row class="mt-1" density="compact">
          <v-col cols="12">
            <v-text-field
              v-model="form.CodLote"
              clearable
              label="Código de Lote"
              maxlength="20"
              prepend-inner-icon="mdi-identifier"
              required
              :rules="[rules.required]"
              variant="outlined"
              @keydown="blockKey($event, allow.alphanumericDashNoAccents)"
              @paste="blockPaste($event, allow.alphanumericDashNoAccents)"
            />
          </v-col>
          <v-col cols="12">
            <DatePickerField
              id="FechaFabricacion"
              v-model="form.FechaFabricacion"
              label="Fecha de Fabricación"
              :max="today"
              required
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12">
            <DatePickerField
              id="FechaVencimiento"
              v-model="form.FechaVencimiento"
              label="Fecha de Vencimiento"
              :min="form.FechaFabricacion || today"
              required
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12">
            <v-switch
              v-model="form.Activo"
              base-color="grey-lighten-1"
              color="primary"
              false-icon="mdi-close"
              hide-details
              label="Lote activo"
              true-icon="mdi-check"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { $confirm } from '@/plugins/confirm/confirm.js'
  import { $toast } from '@/plugins/toast'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import DatePickerField from '@/shared/ui/fields/DatePickerField.vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
  })
  const isReadonly = computed(() => false)

  const emit = defineEmits(['update:modelValue', 'submit'])

  const formRef = ref(null)
  const today = new Date().toISOString().slice(0, 10)
  const formInitial = { CodLote: '', FechaVencimiento: '', FechaFabricacion: '', Activo: true }
  const form = ref({ ...formInitial })

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        form.value = { ...formInitial }
        formRef.value?.resetValidation()
      }
    },
  )
  // ── Cerrar con confirmación si hay datos ingresados ───────────────────────
  const hasChanges = computed(
    () =>
      !!form.value.CodLote?.trim() ||
      !!form.value.FechaVencimiento ||
      !!form.value.FechaFabricacion,
  )

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: $confirm.warning,
    title: 'Cancelar creación',
    message: '¿Deseas salir? Los datos ingresados se perderán.',
    labelConfirm: 'Sí, salir',
    labelCancel: 'Continuar editando',
  })

  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores en los campos marcados')

      return
    }

    const payload = {
      CodLote: form.value.CodLote,
      FechaVencimiento: form.value.FechaVencimiento,
      FechaFabricacion: form.value.FechaFabricacion,
      Activo: form.value.Activo,
    }

    emit('submit', { payload })
  }
</script>
