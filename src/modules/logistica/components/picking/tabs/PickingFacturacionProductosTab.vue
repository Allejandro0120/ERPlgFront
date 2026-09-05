<!-- src/modules/logistica/components/picking/tabs/PickingFacturacionProductosTab.vue -->
<template>
  <v-row class="mt-2" density="comfortable">
    <v-col cols="12">
      <base-table-local
        class="rounded-lg border"
        :headers="headers"
        :items="detalles"
        :loading="false"
        search-placeholder="Buscar producto..."
        searchable
        title="Productos"
      >
        <template #chip>
          <v-chip color="primary" size="small" variant="tonal">{{ detalles.length }}</v-chip>
        </template>

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
      <totales-resumen-card
        :descuento-total="descuentoTotal"
        :subtotal="subtotal"
        :total="total"
        :valor-iva="valorIva"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import TotalesResumenCard from '@/shared/ui/common/TotalesResumenCard.vue'
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'
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
