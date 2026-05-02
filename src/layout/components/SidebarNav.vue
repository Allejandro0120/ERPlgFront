<template>
  <v-list
    v-model:opened="openedGroups"
    aria-label="Menú principal"
    class="sidebar-nav"
    density="compact"
    nav
    role="listbox"
  >
    <template v-for="group in menu" :key="getGroupAlias(group)">
      <v-list-group :value="getGroupAlias(group)">
        <template #activator="{ props: groupActivatorProps }">
          <v-tooltip :aria-label="group.Nombre" location="end" :text="group.Nombre">
            <template #activator="{ props: tooltipProps }">
              <v-list-item
                v-bind="{ ...groupActivatorProps, ...tooltipProps }"
                :active="isGroupActive(group)"
                base-color="#DDD8D8"
                :color="isGroupActive(group) ? 'white' : ''"
                :prepend-icon="group.Icono"
                slim
                :title="group.Nombre"
              />
            </template>
          </v-tooltip>
        </template>
        <!-- aparecen los hijos solo cuando esta expandida -->
        <template v-if="!rail">
          <v-tooltip
            v-for="seccion in group.secciones"
            :key="seccion.Ruta"
            :aria-label="seccion.Nombre"
            :disabled="rail"
            location="end"
            :text="seccion.Nombre"
          >
            <template #activator="{ props: tooltipProps }">
              <v-list-item
                v-bind="tooltipProps"
                base-color="#DDD8D8"
                color="white"
                :prepend-icon="seccion.Icono"
                slim
                :title="seccion.Nombre"
                :to="`/${getGroupAlias(group)}${seccion.Ruta}`"
              />
            </template>
          </v-tooltip>
        </template>
      </v-list-group>
    </template>
  </v-list>
</template>
<script setup>
  import { computed, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth.store'
  import { useUiStore } from '@/stores/ui.store'

  const { rail } = defineProps({
    rail: { type: Boolean, default: false },
  })

  const uiStore = useUiStore()
  const authStore = useAuthStore()
  const route = useRoute()
  const menu = computed(() => authStore.orderedMenu)

  // Array de grupos que deben estar abiertos (expandidos)
  const openedGroups = computed({
    get: () => {
      // Si hay un módulo activo establecido, ese debe estar abierto
      if (uiStore.activeModule) {
        return [uiStore.activeModule]
      }
      // Si no hay módulo activo pero hay menú, abrir el primero
      if (menu.value.length > 0) {
        return [getGroupAlias(menu.value[0])]
      }
      return []
    },
    set: (val) => {
      if (val && val.length > 0) {
        uiStore.setActiveModule(val.at(-1))
      } else {
        uiStore.setActiveModule(null)
      }
    },
  })

  function getGroupAlias(group) {
    return group.Alias || group.Nombre?.toLowerCase()
  }

  function isGroupActive(group) {
    const groupAlias = getGroupAlias(group)
    return group.secciones.some((seccion) => route.path.startsWith(`/${groupAlias}${seccion.Ruta}`))
  }

  // Actualizar el módulo activo cuando cambia la ruta
  watch(
    () => route.path,
    (newPath) => {
      // Encontrar qué grupo contiene la ruta actual
      const activeGroup = menu.value.find((group) => {
        const groupAlias = getGroupAlias(group)
        return group.secciones.some((seccion) =>
          newPath.startsWith(`/${groupAlias}${seccion.Ruta}`),
        )
      })

      if (activeGroup) {
        uiStore.setActiveModule(getGroupAlias(activeGroup))
      } else if (menu.value.length > 0 && !newPath.startsWith('/auth')) {
        // Si no se encuentra grupo activo pero hay menú y no estamos en auth
        // No cambiar el módulo activo - el router se encargará de redirigir
        // Esto evita seleccionar un módulo incorrecto cuando se pierde acceso
      }
    },
    { immediate: true },
  )

  // Verificar módulo activo cuando cambia el menú (por cambios de permisos)
  watch(
    () => menu.value,
    (newMenu) => {
      if (newMenu.length === 0) {
        // Si el menú se vacía, limpiar el módulo activo
        uiStore.setActiveModule(null)
        return
      }

      // Verificar si el módulo activo actual existe en el nuevo menú
      const currentModuleExists = newMenu.some(
        (group) => getGroupAlias(group) === uiStore.activeModule,
      )

      // Verificar si la ruta actual existe en el nuevo menú
      const currentRouteInMenu = newMenu.some((group) => {
        const groupAlias = getGroupAlias(group)
        return group.secciones.some((seccion) =>
          route.path.startsWith(`/${groupAlias}${seccion.Ruta}`),
        )
      })

      // Si el módulo activo ya no existe O la ruta actual no está en el menú
      if (!currentModuleExists || !currentRouteInMenu) {
        // El router se encargará de redirigir, solo actualizar el módulo
        const firstGroup = newMenu[0]
        if (firstGroup) {
          uiStore.setActiveModule(getGroupAlias(firstGroup))
        }
      }
    },
    { deep: true },
  )

  // Al montar el componente, establecer el primer módulo como activo si no hay uno
  onMounted(() => {
    if (!uiStore.activeModule && menu.value.length > 0) {
      uiStore.setActiveModule(getGroupAlias(menu.value[0]))
    }
  })
</script>
