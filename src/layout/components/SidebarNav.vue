<template>
  <v-list density="compact" nav class="sidebar-nav" :opened="openedGroups" role="listbox" aria-label="Menú principal">
    <template v-for="group in menu" :key="getGroupAlias(group)">
      <v-list-group :value="getGroupAlias(group)">
        <template #activator="{ props, isOpen }">
          <v-tooltip :text="group.Nombre" location="end" :aria-label="group.Nombre">
            <template #activator="{ props: tooltipProps }">
              <v-list-item
                v-bind="{ ...props, ...tooltipProps }"
                :title="group.Nombre"
                :prepend-icon="group.Icono"
                :color="isGroupActive(group) ? 'white' : ''"
                :active="isGroupActive(group)"
                slim
                base-color="#DDD8D8"
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
            :aria-label="seccion.Nombre"
          >
            <template #activator="{ props: tooltipProps }">
              <v-list-item
                v-bind="tooltipProps"
                :title="seccion.Nombre"
                :prepend-icon="seccion.Icono"
                :to="`/${getGroupAlias(group)}${seccion.Ruta}`"
                color="white"
                slim
                base-color="#DDD8D8"
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
import { computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";


const uiStore = useUiStore();
const authStore = useAuthStore();
const route = useRoute();
const rail = computed(() => uiStore.rail);
const menu = computed(() => authStore.orderedMenu);

// Array de grupos que deben estar abiertos (expandidos)
const openedGroups = computed(() => {
  // Si hay un módulo activo establecido, ese debe estar abierto
  if (uiStore.activeModule) {
    return [uiStore.activeModule];
  }
  // Si no hay módulo activo pero hay menú, abrir el primero
  if (menu.value.length > 0) {
    return [getGroupAlias(menu.value[0])];
  }
  return [];
});

function getGroupAlias(group) {
  return group.Alias || group.Nombre?.toLowerCase();
}



function isGroupActive(group) {
  const groupAlias = getGroupAlias(group);
  return group.secciones.some((seccion) =>
    route.path.startsWith(`/${groupAlias}${seccion.Ruta}`),
  );
}

// Actualizar el módulo activo cuando cambia la ruta
watch(
  () => route.path,
  (newPath) => {
    // Encontrar qué grupo contiene la ruta actual
    const activeGroup = menu.value.find((group) => {
      const groupAlias = getGroupAlias(group);
      return group.secciones.some((seccion) =>
        newPath.startsWith(`/${groupAlias}${seccion.Ruta}`),
      );
    });

    if (activeGroup) {
      uiStore.setActiveModule(getGroupAlias(activeGroup));
    } else if (menu.value.length > 0 && !newPath.startsWith("/auth")) {
      // Si no se encuentra grupo activo pero hay menú y no estamos en auth
      // No cambiar el módulo activo - el router se encargará de redirigir
      // Esto evita seleccionar un módulo incorrecto cuando se pierde acceso
    }
  },
  { immediate: true },
);

// Verificar módulo activo cuando cambia el menú (por cambios de permisos)
watch(
  () => menu.value,
  (newMenu) => {
    if (newMenu.length === 0) {
      // Si el menú se vacía, limpiar el módulo activo
      uiStore.setActiveModule(null);
      return;
    }

    // Verificar si el módulo activo actual existe en el nuevo menú
    const currentModuleExists = newMenu.some(
      (group) => getGroupAlias(group) === uiStore.activeModule,
    );

    // Verificar si la ruta actual existe en el nuevo menú
    const currentRouteInMenu = newMenu.some((group) => {
      const groupAlias = getGroupAlias(group);
      return group.secciones.some((seccion) =>
        route.path.startsWith(`/${groupAlias}${seccion.Ruta}`),
      );
    });

    // Si el módulo activo ya no existe O la ruta actual no está en el menú
    if (!currentModuleExists || !currentRouteInMenu) {
      // El router se encargará de redirigir, solo actualizar el módulo
      const firstGroup = newMenu[0];
      if (firstGroup) {
        uiStore.setActiveModule(getGroupAlias(firstGroup));
      }
    }
  },
  { deep: true },
);

// Al montar el componente, establecer el primer módulo como activo si no hay uno
onMounted(() => {
  if (!uiStore.activeModule && menu.value.length > 0) {
    uiStore.setActiveModule(getGroupAlias(menu.value[0]));
  }
});
</script>
