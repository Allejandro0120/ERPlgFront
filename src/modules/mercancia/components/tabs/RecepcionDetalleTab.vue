<template>
  <div>
    <div class="text-subtitle-1 font-weight-bold mb-3">Detalle</div>
    <base-table-local
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
          {{ estadoProductoLabel(item.Aceptado) }}
        </v-chip>
      </template>
    </base-table-local>
  </div>
</template>

<script setup>
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'

  const { detalles, headers, rowActions, isReadonly } = defineProps({
    detalles: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    rowActions: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
  })

  const estadoProductoLabel = (aceptado) => (aceptado ? 'Aceptado' : 'Rechazado')
  function estadoProductoColor(nombre) {
    return getEstadoColor(nombre, DOMINIOS_ESTADO.PRODCUTO_ACTA)
  }
</script>

<style scoped></style>
