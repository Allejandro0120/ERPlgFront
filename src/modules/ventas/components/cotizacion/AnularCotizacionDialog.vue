<!-- src/modules/ventas/components/cotizacion/AnularCotizacionDialog.vue -->
<template>
  <base-dialog
    color="error"
    :disable-confirm="!isValid"
    icon="mdi-cancel"
    label-confirm="Anular Cotización"
    max-width="500"
    :model-value="modelValue"
    :title="dialogTitle"
    @accept="onAccept"
    @update:model-value="onUpdateModelValue"
  >
    <template #content>
      <v-alert
        class="mb-6 text-body-medium"
        color="error"
        density="comfortable"
        type="warning"
        variant="tonal"
      >
        Esta acción es irreversible. Una vez anulada, la cotización no podrá editarse ni volver a
        anularse.
      </v-alert>

      <v-form ref="formRef">
        <v-textarea
          v-model="observacion"
          autofocus
          counter="300"
          label="Observación de anulación"
          maxlength="300"
          prepend-inner-icon="mdi-text-box-outline"
          required
          :rules="[rules.required]"
          variant="outlined"
        />
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: Boolean,
    cotizacion: { type: String, default: '' },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  const observacion = ref('')
  const formRef = ref(null)

  const isValid = computed(() => observacion.value.trim().length > 0)
  const dialogTitle = computed(() =>
    props.cotizacion ? `Anular Cotización: ${props.cotizacion}` : 'Anular Cotización',
  )

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        observacion.value = ''
        formRef.value?.resetValidation()
      }
    },
  )

  function onUpdateModelValue(value) {
    emit('update:modelValue', value)
  }

  async function onAccept() {
    const { valid } = await formRef.value.validate()
    if (!valid) return
    emit('confirm', observacion.value.trim())
  }
</script>

<style scoped></style>
