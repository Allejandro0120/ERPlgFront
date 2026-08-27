<!-- src/modules/logistica/components/picking/tabs/PickingFacturacionProductosTab.vue -->
<template>
  <v-row class="mt-2" density="comfortable">
    <v-col cols="12">
      <div class="d-flex align-center ga-2">
        <div class="text-subtitle-1 font-weight-bold">Productos</div>
        <v-chip color="primary" size="small" variant="tonal">{{ detalles.length }}</v-chip>
      </div>
      <base-table-local
        class="rounded-lg border"
        :headers="headers"
        :items="detalles"
        :loading="false"
        search-placeholder="Buscar producto..."
        searchable
      >
        <template #item.CodigoUbicacion="{ item }">{{ item.CodigoUbicacion || '-' }}</template>
        <template #item.CodLote="{ item }">{{ item.CodLote || '-' }}</template>
        <template #item.PrecioUnitario="{ item }">
          {{ formatCurrencyCOP(item.PrecioUnitario) }}
        </template>
        <template #item.Subtotal="{ item }">
          <strong>{{ formatCurrencyCOP(item.Subtotal) }}</strong>
        </template>
      </base-table-local>
    </v-col>

    <v-col cols="12" md="5" offset-md="7" offset-sm="5" sm="7">
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
        <v-divider class="my-1" />
        <div class="d-flex justify-space-between align-center pt-1">
          <span class="text-body-1 font-weight-bold text-primary">Total</span>
          <span class="text-body-1 font-weight-bold text-primary">
            {{ formatCurrencyCOP(total) }}
          </span>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'

  defineProps({
    detalles: { type: Array, default: () => [] },
    subtotal: { type: [Number, String], default: 0 },
    descuentoTotal: { type: [Number, String], default: 0 },
    valorIva: { type: [Number, String], default: 0 },
    total: { type: [Number, String], default: 0 },
  })

  const headers = [
    {
      title: 'Producto',
      key: 'CodigoNombreProducto',
      sortable: false,
      searchable: true,
      minWidth: '220px',
    },
    { title: 'Cantidad', key: 'Cantidad', sortable: false, align: 'center' },
    { title: 'Ubicación', key: 'CodigoUbicacion', sortable: false, align: 'center' },
    { title: 'Lote', key: 'CodLote', sortable: false, align: 'center' },
    { title: 'Precio Unit.', key: 'PrecioUnitario', align: 'end', sortable: false },
    { title: 'Total Línea', key: 'Subtotal', align: 'end', sortable: false },
  ]
</script>

<style scoped></style>
