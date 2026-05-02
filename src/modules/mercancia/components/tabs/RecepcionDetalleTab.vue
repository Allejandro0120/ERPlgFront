<template>
  <div>
    <div class="text-subtitle-1 font-weight-bold mb-3">Detalle</div>
    <base-table-local
      class="rounded-lg border"
      :headers="detalleHeaders"
      item-key="IdProducto"
      :items="form.Detalles"
      :loading="false"
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

  const props = defineProps({
    form: { type: Object, required: true },
    detalleHeaders: { type: Array, default: () => [] },
  })

  const estadoProductoLabel = aceptado => (aceptado ? 'Aceptado' : 'Rechazado')
  const estadoProductoColor = nombre => getEstadoColor(nombre, DOMINIOS_ESTADO.PRODCUTO_ACTA)
</script>

<style scoped></style>
