<template>
  <div class="mt-2">
    <!-- <div class="d-flex justify-end mb-3">
      <v-btn
        v-if="!isReadonly"
        color="primary"
        prepend-icon="$plus"
        variant="tonal"
        @click="emit('add')"
      >
        Agregar sucursal
      </v-btn>
    </div> -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-1 font-weight-bold">Sucursales</div>
      <v-btn
        v-if="!isReadonly"
        color="primary"
        prepend-icon="$plus"
        variant="tonal"
        @click="emit('add')"
      >
        Agregar sucursal
      </v-btn>
    </div>
    <div
      v-if="sucursales.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">{{ 'mdi-store-off-outline' }}</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin sucursales registradas</p>
      <p v-if="!isReadonly" class="text-caption text-grey">
        Haz clic en "Agregar sucursal" para añadir la primera
      </p>
    </div>

    <base-table-local
      v-else
      class="rounded-lg border"
      empty-text="Sin sucursales registradas"
      :headers="headers"
      :items="sucursales.map((s, idx) => ({ ...s, indice: idx + 1 }))"
      :items-per-page="5"
      :row-actions="rowActions"
    >
      <template #[`item.Direccion`]="{ item }">
        <div class="py-1">
          <div class="text-body-2 text-truncate" style="max-width: 250px">
            {{ item.Direccion || '—' }}
          </div>
          <div class="text-caption text-grey">
            {{ item.NombreDepartamento ? `Depto: ${item.NombreDepartamento}` : 'Depto: —' }}
          </div>
        </div>
      </template>

      <template #[`item.Habilitada`]="{ item }">
        <v-chip
          :color="getEstadoColor(item.Habilitada, DOMINIOS_ESTADO.SUCURSAL)"
          size="small"
          variant="tonal"
        >
          <v-icon icon="$circle" size="14" start />
          {{ item.Habilitada ? 'Habilitada' : 'Deshabilitada' }}
        </v-chip>
      </template>
    </base-table-local>
  </div>
</template>

<script setup>
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'

  const emit = defineEmits(['add'])

  const { sucursales, headers, rowActions, isReadonly } = defineProps({
    sucursales: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    rowActions: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
  })
</script>
