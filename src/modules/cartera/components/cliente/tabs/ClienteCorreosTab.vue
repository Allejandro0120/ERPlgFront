<template>
  <div class="mt-2">
    <div
      v-if="correos.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">mdi-email-off-outline</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin correos registrados</p>
      <template v-if="!isReadonly">
        <p class="text-caption text-grey mb-3">
          Haz clic en "Agregar correo" para añadir el primero
        </p>
        <v-btn
          color="primary"
          prepend-icon="$plus"
          size="small"
          variant="tonal"
          @click="emit('add')"
        >
          Agregar correo
        </v-btn>
      </template>
    </div>

    <base-table-local
      v-else
      empty-text="Sin correos registrados"
      :headers="headers"
      :items="correos.map((c, idx) => ({ ...c, indice: idx + 1 }))"
      :items-per-page="5"
      :row-actions="rowActions"
      title="Correos"
      :title-button="titleButton"
    >
      <template #[`item.IdTipoCorreo`]="{ item }">
        <div class="text-body-2">
          {{ tipoCorreoLabel(item.IdTipoCorreo) }}
        </div>
      </template>
    </base-table-local>
  </div>
</template>

<script setup>
  import { computed, toRefs } from 'vue'
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'

  const emit = defineEmits(['add'])

  const props = defineProps({
    correos: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    rowActions: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
    tiposCorreos: { type: Array, default: () => [] },
  })

  const { correos, headers, rowActions, isReadonly, tiposCorreos } = toRefs(props)

  const titleButton = computed(() =>
    isReadonly.value
      ? null
      : { label: 'Agregar correo', icon: '$plus', variant: 'tonal', action: () => emit('add') },
  )

  const tiposMap = computed(() =>
    Object.fromEntries((tiposCorreos.value || []).map((t) => [t.IdTipoCorreo, t.Descripcion])),
  )

  function tipoCorreoLabel(idTipoCorreo) {
    return tiposMap.value[idTipoCorreo] || 'Tipo no definido'
  }
</script>
