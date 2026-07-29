<template>
  <div class="mt-2">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-1 font-weight-bold">Lotes</div>
      <v-btn
        v-if="!isReadonly"
        color="primary"
        prepend-icon="$plus"
        variant="tonal"
        @click="emit('add')"
      >
        Agregar Lote
      </v-btn>
    </div>

    <div
      v-if="lotes.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">{{ 'mdi-store-off-outline' }}</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin lotes registrados</p>
      <p v-if="!isReadonly" class="text-caption text-grey">
        Haz clic en "Agregar Lote" para añadir el primero
      </p>
    </div>

    <base-table-local
      v-else
      class="rounded-lg border"
      empty-text="Sin lotes registrados"
      :headers="headers"
      :items="lotesConIndice"
      :items-per-page="5"
    >
      <template #item.FechaVencimiento="{ item }">
        {{ formatDate(item.FechaVencimiento) }}
      </template>
      <template #item.FechaFabricacion="{ item }">
        {{ formatDate(item.FechaFabricacion) }}
      </template>
      <template #item.Activo="{ item }">
        <v-switch
          base-color="grey-lighten-1"
          color="primary"
          density="comfortable"
          hide-details
          inset
          :model-value="item.Activo"
          :readonly="isReadonly"
          @update:model-value="
            (val) => emit('toggle-activo', { localId: item.LocalId, activo: val })
          "
        />
      </template>
    </base-table-local>
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import { formatDate } from '@/shared/utils/dateFormatter'

  const props = defineProps({
    lotes: { type: Array, required: true },
    headers: { type: Array, required: true },
    isReadonly: { type: Boolean, default: false },
  })

  const emit = defineEmits(['add', 'toggle-activo'])

  const lotesConIndice = computed(() =>
    props.lotes.map((lote, idx) => ({ ...lote, indice: idx + 1 })),
  )
</script>
