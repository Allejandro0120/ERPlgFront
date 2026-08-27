<!-- src/modules/logistica/components/picking/PickingFacturacionDialog.vue -->
<template>
  <base-dialog
    color="primary"
    icon="mdi-file-document-check-outline"
    max-width="1200"
    :model-value="modelValue"
    :show-actions="false"
    :title="dialogTitle"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #content>
      <v-tabs v-model="tab" class="mb-4" color="primary">
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
          <picking-facturacion-info-tab :facturacion="facturacion" />
        </v-tabs-window-item>

        <v-tabs-window-item eager value="productos">
          <picking-facturacion-productos-tab
            :descuento-total="facturacion?.DescuentoTotal"
            :detalles="detalles"
            :subtotal="facturacion?.Subtotal"
            :total="facturacion?.Total"
            :valor-iva="facturacion?.ValorIva"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import PickingFacturacionInfoTab from './tabs/PickingFacturacionInfoTab.vue'
  import PickingFacturacionProductosTab from './tabs/PickingFacturacionProductosTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    // GET /order-settlements/unique/:IdTransaccion → data
    facturacion: { type: Object, default: null },
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
    props.facturacion?.OrderSettlement
      ? `Facturación: ${props.facturacion.OrderSettlement}`
      : 'Detalle de Facturación',
  )

  const detalles = computed(() =>
    (props.facturacion?.Detalles ?? []).map((detalle) => ({
      ...detalle,
      CodigoNombreProducto:
        detalle.CodigoNombreProducto ??
        [detalle.CodigoProducto, detalle.NombreProducto].filter(Boolean).join(' - '),
      Subtotal:
        detalle.Subtotal ?? (Number(detalle.Cantidad) || 0) * (Number(detalle.PrecioUnitario) || 0),
    })),
  )
</script>

<style scoped></style>
