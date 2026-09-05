<template>
  <div>
    <div
      v-if="detalles.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">{{
        'mdi-package-variant-closed'
      }}</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin productos registrados</p>
      <template v-if="puedeAgregar">
        <p class="text-caption text-grey mb-3">
          Haz clic en "Agregar producto" para añadir el primero
        </p>
        <v-btn color="primary" prepend-icon="mdi-plus" variant="tonal" @click="emit('add')">
          Agregar Producto
        </v-btn>
      </template>
    </div>

    <base-table-local
      v-else
      class="rounded-lg border"
      :headers="headers"
      :items="detalles"
      :loading="false"
      :row-actions="rowActions"
      :searchable="false"
      title="Productos"
      :title-button="titleButton"
    >
      <template #chip>
        <v-chip color="primary" size="small" variant="tonal">{{ detalles.length }}</v-chip>
      </template>

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
  import { computed } from 'vue'
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'

  const { detalles, headers, rowActions, puedeAgregar } = defineProps({
    detalles: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    rowActions: { type: Array, default: () => [] },
    puedeAgregar: { type: Boolean, default: false },
  })

  const emit = defineEmits(['add'])

  const titleButton = computed(() =>
    puedeAgregar
      ? { label: 'Agregar Producto', icon: 'mdi-plus', variant: 'tonal', action: () => emit('add') }
      : null,
  )
  const estadoProductoLabel = (aceptado) => (aceptado ? 'Aceptado' : 'Rechazado')
  function estadoProductoColor(nombre) {
    return getEstadoColor(nombre, DOMINIOS_ESTADO.PRODUCTO_ACTA)
  }
</script>

<style scoped></style>
