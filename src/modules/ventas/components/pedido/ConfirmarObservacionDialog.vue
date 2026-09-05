<!-- src/modules/ventas/components/pedido/ConfirmarObservacionDialog.vue -->
<!-- Diálogo genérico para transiciones de pedido que exigen una observación
     obligatoria antes de confirmar (anular, cerrar con faltante, etc.). -->
<template>
  <base-dialog
    :color="color"
    :disable-confirm="!isValid"
    :icon="icon"
    :label-confirm="labelConfirm"
    max-width="500"
    :model-value="modelValue"
    :title="dialogTitle"
    @accept="onAccept"
    @update:model-value="onUpdateModelValue"
  >
    <template #content>
      <v-alert
        class="mb-6 text-body-medium"
        :color="color"
        density="comfortable"
        type="warning"
        variant="tonal"
      >
        {{ mensajeAlerta }}
      </v-alert>

      <v-form ref="formRef">
        <v-textarea
          v-model="observacion"
          autofocus
          counter="300"
          :label="labelObservacion"
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
    pedido: { type: String, default: '' },
    titulo: { type: String, required: true },
    mensajeAlerta: { type: String, required: true },
    labelConfirm: { type: String, default: 'Confirmar' },
    labelObservacion: { type: String, default: 'Observación' },
    color: { type: String, default: 'error' },
    icon: { type: String, default: 'mdi-text-box-outline' },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  const observacion = ref('')
  const formRef = ref(null)

  const isValid = computed(() => observacion.value.trim().length > 0)
  const dialogTitle = computed(() =>
    props.pedido ? `${props.titulo}: ${props.pedido}` : props.titulo,
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
