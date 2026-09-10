<!-- src/modules/logistica/components/picking/tabs/RemisionProductosTab.vue -->
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
        title="Productos despachados"
      >
        <template #chip>
          <v-chip color="primary" size="small" variant="tonal">{{ detalles.length }}</v-chip>
        </template>

        <template #item.CodigoUbicacion="{ item }">{{ item.CodigoUbicacion || '-' }}</template>
        <template #item.CodLote="{ item }">{{ item.CodLote || '-' }}</template>
      </base-table-local>
    </v-col>
  </v-row>
</template>

<script setup>
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'

  defineProps({
    detalles: { type: Array, default: () => [] },
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
  ]
</script>

<style scoped></style>
