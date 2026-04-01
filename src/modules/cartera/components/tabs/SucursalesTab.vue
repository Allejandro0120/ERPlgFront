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
        Agregar sucursal
      </v-btn>
    </div>

    <div
      v-if="sucursales.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="
        border: 2px dashed rgba(0, 0, 0, 0.1);
        background: rgba(0, 0, 0, 0.015);
      "
    >
      <v-icon size="44" color="grey-lighten-1" class="mb-3">{{
        'mdi-store-off-outline'
      }}</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">
        Sin sucursales registradas
      </p>
      <p v-if="!isReadonly" class="text-caption text-grey">
        Haz clic en "Agregar sucursal" para añadir la primera
      </p>
    </div>

    <base-table-local
      v-else
      :headers="headers"
      :items="sucursales.map((s, idx) => ({ ...s, indice: idx + 1 }))"
      :row-actions="rowActions"
      empty-text="Sin sucursales registradas"
      :items-per-page="5"
    >
      <template #[`item.Direccion`]="{ item }">
        <div class="py-1">
          <div class="text-body-2 text-truncate" style="max-width: 250px">
            {{ item.Direccion || "—" }}
          </div>
          <div class="text-caption text-grey">
            {{ departamentoLabel(item._idDepartamento) }}
          </div>
        </div>
      </template>

      <template #[`item.Habilitada`]="{ item }">
        <v-chip
          :color="getEstadoColor(item.Habilitada, DOMINIOS_ESTADO.SUCURSAL)"
          size="small"
          variant="tonal"
        >
          <v-icon icon="$circle" size="14" start></v-icon>
          {{ item.Habilitada ? "Habilitada" : "Deshabilitada" }}
        </v-chip>
      </template>
    </base-table-local>
  </div>
</template>

<script setup>
import { computed, toRefs } from "vue";
import BaseTableLocal from "@/shared/ui/BaseTableLocal.vue";
import { getEstadoColor, DOMINIOS_ESTADO } from "@/shared/utils/estadoColors";

const emit = defineEmits(["add"]);

const props = defineProps({
  sucursales: { type: Array, default: () => [] },
  headers: { type: Array, default: () => [] },
  rowActions: { type: Array, default: () => [] },
  isReadonly: { type: Boolean, default: false },
  departamentos: { type: Array, default: () => [] },
});

const { sucursales, headers, rowActions, isReadonly, departamentos } =
  toRefs(props);

const deptoMap = computed(() =>
  Object.fromEntries(
    (departamentos.value || []).map((d) => [
      d.IdDepartamento,
      d.NombreDepartamento,
    ]),
  ),
);

const departamentoLabel = (id) => {
  const nombre = deptoMap.value[id];
  return nombre ? `Depto: ${nombre}` : "Depto: —";
};
</script>
