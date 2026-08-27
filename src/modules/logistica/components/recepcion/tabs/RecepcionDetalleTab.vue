<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-1 font-weight-bold">Productos</div>
      <v-btn
        v-if="puedeAgregar"
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        @click="emit('add')"
      >
        Agregar Producto
      </v-btn>
    </div>
    <div
      v-if="detalles.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">{{
        'mdi-package-variant-closed'
      }}</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin productos registrados</p>
      <p v-if="puedeAgregar" class="text-caption text-grey">
        Haz clic en "Agregar producto" para añadir el primero
      </p>
    </div>

    <base-table-local
      v-else
      class="rounded-lg border"
      :headers="headers"
      :items="detalles"
      :loading="false"
      :row-actions="rowActions"
      :searchable="false"
    >
      <template #item.Aceptado="{ item }">
        <v-chip
          :color="estadoProductoColor(estadoProductoLabel(item.Aceptado))"
          size="small"
          variant="tonal"
        >
          <v-icon icon="$circle" size="12" start />
          {{ estadoProductoLabel(item.Aceptado) }}
        </v-chip>
      </template>
      <template #item.ObservacionesProducto="{ item }">
        <div class="text-body-2 text-truncate" style="max-width: 240px">
          {{ item.ObservacionesProducto || '—' }}
        </div>
      </template>
      <template #item.PrecioUnitario="{ item }"> $ {{ item.PrecioUnitario }} </template>
    </base-table-local>
  </div>
</template>

<script setup>
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'

  const { detalles, headers, rowActions } = defineProps({
    detalles: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    rowActions: { type: Array, default: () => [] },
    puedeAgregar: { type: Boolean, default: false },
  })

  const emit = defineEmits(['add'])
  const estadoProductoLabel = (aceptado) => (aceptado ? 'Aceptado' : 'Rechazado')
  function estadoProductoColor(nombre) {
    return getEstadoColor(nombre, DOMINIOS_ESTADO.PRODUCTO_ACTA)
  }
</script>

<style scoped></style>
