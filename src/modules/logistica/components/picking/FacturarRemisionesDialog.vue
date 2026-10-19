<!-- src/modules/logistica/components/picking/FacturarRemisionesDialog.vue -->
<template>
  <base-dialog
    color="purple-darken-3"
    icon="mdi-file-document-multiple-outline"
    label-confirm="Sí, facturar"
    max-width="650"
    :model-value="modelValue"
    :title="dialogTitle"
    @accept="onAccept"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <p class="text-body-medium text-brand-grey-2 mb-3">
        Se generará <strong>una sola factura</strong> con los productos de todas las remisiones
        seleccionadas, sumando las cantidades de los productos repetidos. Esta acción no se puede
        deshacer.
      </p>

      <v-alert class="mb-4" density="compact" type="info" variant="tonal">
        Cliente: <strong>{{ cliente }}</strong>
      </v-alert>

      <div class="d-flex flex-wrap ga-2 mb-4">
        <v-chip v-for="item in remisiones" :key="item.Id" label size="small" variant="tonal">
          {{ item.Remision }}
          <span v-if="item.PedidoOrigen" class="text-medium-emphasis ml-1">
            ({{ item.PedidoOrigen }})
          </span>
        </v-chip>
      </div>

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
    // Filas seleccionadas en la tabla de "Remisiones" (Id, Remision, PedidoOrigen, Cliente, ...)
    remisiones: { type: Array, default: () => [] },
  })

  const emit = defineEmits(['update:modelValue', 'confirm'])

  const observacion = ref('')

  const dialogTitle = computed(
    () => `Facturar ${props.remisiones.length} remisiones en una factura`,
  )
  const cliente = computed(() => props.remisiones[0]?.Cliente || '—')

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
