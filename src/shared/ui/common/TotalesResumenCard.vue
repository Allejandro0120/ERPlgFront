<template>
  <v-card class="pa-3" rounded="lg" variant="tonal">
    <div class="d-flex justify-space-between align-center py-1">
      <span class="text-body-2 text-grey-darken-1">Subtotal</span>
      <span class="text-body-2 font-weight-medium">{{ formatCurrencyCOP(subtotal) }}</span>
    </div>
    <div class="d-flex justify-space-between align-center py-1">
      <span class="text-body-2 text-grey-darken-1">Descuento</span>
      <span class="text-body-2 font-weight-medium">
        - {{ formatCurrencyCOP(descuentoTotal) }}
      </span>
    </div>
    <div class="d-flex justify-space-between align-center py-1">
      <span class="text-body-2 text-grey-darken-1">IVA</span>
      <span class="text-body-2 font-weight-medium">{{ formatCurrencyCOP(valorIva) }}</span>
    </div>
    <div v-if="otrosImpuestos" class="d-flex justify-space-between align-center py-1">
      <span class="text-body-2 text-grey-darken-1">Otros Impuestos</span>
      <span class="text-body-2 font-weight-medium">{{ formatCurrencyCOP(otrosImpuestos) }}</span>
    </div>
    <v-divider class="my-1" />
    <div class="d-flex justify-space-between align-center pt-1">
      <span class="text-body-1 font-weight-bold text-primary">Total</span>
      <span class="text-body-1 font-weight-bold text-primary">
        {{ formatCurrencyCOP(totalCalculado) }}
      </span>
    </div>
  </v-card>
</template>

<script setup>
  import { computed } from 'vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'

  const props = defineProps({
    subtotal: { type: [Number, String], default: 0 },
    descuentoTotal: { type: [Number, String], default: 0 },
    valorIva: { type: [Number, String], default: 0 },
    otrosImpuestos: { type: [Number, String], default: 0 },
    // Si no se pasa, se calcula como subtotal + valorIva + otrosImpuestos
    total: { type: [Number, String], default: null },
  })

  const totalCalculado = computed(() =>
    props.total === null
      ? Number(props.subtotal) + Number(props.valorIva) + Number(props.otrosImpuestos)
      : Number(props.total),
  )
</script>

<style scoped></style>
