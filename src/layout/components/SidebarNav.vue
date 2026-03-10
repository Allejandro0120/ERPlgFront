<template>
  <v-list density="compact" nav class="sidebar-nav">
    <template v-for="group in menu" :key="group.Alias">
      <v-list-group :value="group.Alias">
        <template #activator="{ props, isOpen }">
          <v-tooltip
            :text="group.Nombre"
            location="end"
            content-class="sidebar-tooltip"
          >
            <template #activator="{ props: tooltipProps }">
              <v-list-item
                v-bind="{ ...props, ...tooltipProps }"
                :title="group.Nombre"
                :prepend-icon="group.Icono"
                :color="isGroupActive(group) ? 'primary' : ''"
                :active="isGroupActive(group)"
                slim
              />
            </template>
          </v-tooltip>
        </template>
        <!-- aparecen los hijos solo cuando esta expandida -->
        <template v-if="!rail">
          <v-tooltip
            v-for="seccion in group.secciones"
            :key="seccion.Ruta"
            :text="seccion.Nombre"
            location="end"
            :disabled="rail"
            content-class="sidebar-tooltip"
          >
            <template #activator="{ props: tooltipProps }">
              <v-list-item
                v-bind="tooltipProps"
                :title="seccion.Nombre"
                :prepend-icon="seccion.Icono"
                :to="`/${group.Alias}${seccion.Ruta}`"
                color="primary"
                slim
              />
            </template>
          </v-tooltip>
        </template>
      </v-list-group>
    </template>
  </v-list>
</template>
<script setup>
import { useUiStore } from "@/stores/ui.store";
import { computed } from "vue";
import { getOrderedMenu } from "./menu.mock";
import { useRoute } from "vue-router";

const uiStore = useUiStore();
const route = useRoute();
const rail = computed(() => uiStore.rail);
const menu = computed(() => getOrderedMenu());

function isGroupActive(group) {
  return group.secciones.some((seccion) =>
    route.path.startsWith(`/${group.Alias}${seccion.Ruta}`),
  );
}
</script>
