<template>
  <div class="mt-2">
    <div class="d-flex justify-end mb-3">
      <v-btn
        v-if="!isReadonly"
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="$plus"
        @click="emit('add')"
      >
        Agregar correo
      </v-btn>
    </div>

    <div
      v-if="correos.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="
        border: 2px dashed rgba(0, 0, 0, 0.1);
        background: rgba(0, 0, 0, 0.015);
      "
    >
      <v-icon size="44" color="grey-lighten-1" class="mb-3">mdi-email-off-outline</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin correos registrados</p>
      <p v-if="!isReadonly" class="text-caption text-grey">
        Haz clic en "Agregar correo" para añadir el primero
      </p>
    </div>

    <base-table-local
      v-else
      :headers="headers"
      :items="correos.map((c, idx) => ({ ...c, indice: idx + 1 }))"
      :row-actions="rowActions"
      empty-text="Sin correos registrados"
      :items-per-page="5"
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
import { computed, toRefs } from "vue";
import BaseTableLocal from "@/shared/ui/BaseTableLocal.vue";

const emit = defineEmits(["add"]);

const props = defineProps({
  correos: { type: Array, default: () => [] },
  headers: { type: Array, default: () => [] },
  rowActions: { type: Array, default: () => [] },
  isReadonly: { type: Boolean, default: false },
  tiposCorreos: { type: Array, default: () => [] },
});

const { correos, headers, rowActions, isReadonly, tiposCorreos } = toRefs(props);

const tiposMap = computed(() =>
  Object.fromEntries(
    (tiposCorreos.value || []).map((t) => [t.IdTipoCorreo, t.Descripcion]),
  ),
);

const tipoCorreoLabel = (idTipoCorreo) => {
  return tiposMap.value[idTipoCorreo] || "Tipo no definido";
};
</script>
