<!-- src/modules/logistica/components/picking/RemisionDialog.vue -->
<template>
  <base-dialog
    color="teal-darken-2"
    icon="mdi-truck-fast-outline"
    max-width="1200"
    :model-value="modelValue"
    :show-actions="false"
    :title="dialogTitle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <v-tabs v-model="tab" class="mb-4" color="teal-darken-2">
        <v-tab value="info">
          <v-icon icon="mdi-file" start />
          Información
        </v-tab>
        <v-tab value="productos">
          <v-icon icon="mdi-format-list-bulleted" start />
          Productos
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="tab">
        <v-tabs-window-item eager value="info">
          <remision-info-tab :remision="remision" />
        </v-tabs-window-item>

        <v-tabs-window-item eager value="productos">
          <remision-productos-tab :detalles="detalles" />
        </v-tabs-window-item>
      </v-tabs-window>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import RemisionInfoTab from './tabs/RemisionInfoTab.vue'
  import RemisionProductosTab from './tabs/RemisionProductosTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    // GET /remissions/unique/:IdTransaccion → data
    remision: { type: Object, default: null },
  })

  defineEmits(['update:modelValue'])

  const tab = ref('info')

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) tab.value = 'info'
    },
  )

  const dialogTitle = computed(() =>
    props.remision?.Remision
      ? `Remisión: ${props.remision.Remision}`
      : props.remision?.PedidoOrigen
        ? `Remisión del pedido: ${props.remision.PedidoOrigen}`
        : 'Detalle de Remisión',
  )

  const detalles = computed(() =>
    (props.remision?.Detalles ?? []).map((detalle) => ({
      ...detalle,
      CodigoNombreProducto:
        detalle.CodigoNombreProducto ??
        [detalle.CodigoProducto, detalle.NombreProducto].filter(Boolean).join(' - '),
    })),
  )
</script>

<style scoped></style>
