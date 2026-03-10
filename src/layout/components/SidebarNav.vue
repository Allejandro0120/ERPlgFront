<template>
  <v-list density="compact" nav class="sidebar-nav">
    <template v-for="group in menu" :key="getGroupAlias(group)">
      <v-list-group :value="getGroupAlias(group)">
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
                :to="`/${getGroupAlias(group)}${seccion.Ruta}`"
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
import { useAuthStore } from "@/stores/auth.store";
import { computed } from "vue";
import { useRoute } from "vue-router";

const uiStore = useUiStore();
const authStore = useAuthStore();
const route = useRoute();
const rail = computed(() => uiStore.rail);
const menu = computed(() => authStore.orderedMenu);

function getGroupAlias(group) {
  return group.Alias || group.Nombre?.toLowerCase()
}

function isGroupActive(group) {
  const groupAlias = getGroupAlias(group)
  return group.secciones.some((seccion) =>
    route.path.startsWith(`/${groupAlias}${seccion.Ruta}`),
  );
}
</script>
