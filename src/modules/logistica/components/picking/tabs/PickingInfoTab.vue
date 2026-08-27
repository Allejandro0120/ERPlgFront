<!-- src/modules/logistica/components/picking/tabs/PickingInfoTab.vue -->
<template>
  <v-row class="mt-1" density="comfortable">
    <v-col cols="12" sm="4">
      <v-text-field
        label="Pedido"
        :model-value="pedido?.Pedido"
        prepend-inner-icon="mdi-clipboard-text-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        label="Cliente"
        :model-value="pedido?.Cliente"
        prepend-inner-icon="mdi-account"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        label="Fecha documento"
        :model-value="pedido?.FechaDocumento ? formatDate(pedido.FechaDocumento) : '-'"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="4">
      <v-text-field
        label="Cedi"
        :model-value="pedidoInfo?.NombreCedi"
        prepend-inner-icon="mdi-warehouse"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        label="Usuario"
        :model-value="pedidoInfo?.Usuario"
        prepend-inner-icon="mdi-account-circle-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        label="Total"
        :model-value="formatCurrencyCOP(pedido?.Total)"
        prepend-inner-icon="mdi-currency-usd"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        label="Observaciones"
        :model-value="pedidoInfo?.Observaciones || 'Sin observaciones'"
        prepend-inner-icon="mdi-text-box-outline"
        readonly
        rows="2"
        variant="outlined"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'

  defineProps({
    // Fila del pedido seleccionada en la tabla de "Pendientes" (Pedido, Cliente, Total, FechaDocumento, ...)
    pedido: { type: Object, default: null },
    // Respuesta de GET /orders/specific-info (Cedi, Usuario, Observaciones)
    pedidoInfo: { type: Object, default: null },
  })
</script>

<style scoped></style>
