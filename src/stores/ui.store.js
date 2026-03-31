// src/stores/ui.store.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Controla si el drawer está visible (importante en mobile)
 const drawer = ref(null)

  // Controla el modo "solo iconos" en desktop
  const rail = ref(true)

  // Rastrear el módulo actual activo (el grupo del sidebar que debe estar expandido)
  const activeModule = ref(null)

  // Acciones opcionales a la derecha del encabezado de página
  const headerActions = ref([])

  function toggleDrawer() {
    drawer.value = !drawer.value
  }

  function toggleRail() {
    rail.value = !rail.value
  }

  function setActiveModule(module) {
    activeModule.value = module
  }

  function setHeaderActions(actions) {
    headerActions.value = actions || []
  }

  function clearHeaderActions() {
    headerActions.value = []
  }

  return { drawer, rail, activeModule, headerActions, toggleDrawer, toggleRail, setActiveModule, setHeaderActions, clearHeaderActions }
})