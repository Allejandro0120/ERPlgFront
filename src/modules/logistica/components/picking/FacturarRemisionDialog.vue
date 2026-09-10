<!-- src/modules/logistica/components/picking/FacturarRemisionDialog.vue -->
<template>
  <base-dialog
    color="purple-darken-3"
    icon="mdi-file-document-check-outline"
    label-confirm="Sí, facturar"
    max-width="600"
    :model-value="modelValue"
    :title="dialogTitle"
    @accept="onAccept"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <p class="text-body-medium text-brand-grey-2 mb-4">
        Se generará la factura correspondiente a esta remisión. Esta acción no se puede deshacer.
      </p>
      <v-textarea
        v-model="observacion"
        auto-grow
        label="Observación de facturación (opcional)"
        prepend-inner-icon="mdi-text-box-outline"
        rows="2"
        variant="outlined"
      />
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'

  const props = defineProps({
    modelValue: Boolean,
    // Fila de la remisión seleccionada en la tabla de "Remisiones" (Id, Remision, PedidoOrigen, ...)
    remision: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  const observacion = ref('')

  const dialogTitle = computed(() =>
    props.remision?.Remision ? `Facturar: ${props.remision.Remision}` : 'Facturar remisión',
  )

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) observacion.value = ''
    },
  )

  function onAccept() {
    const observacionTrimmed = observacion.value?.trim()
    emit('confirm', observacionTrimmed ? { ObservacionFacturacion: observacionTrimmed } : {})
  }
</script>

<style scoped></style>
