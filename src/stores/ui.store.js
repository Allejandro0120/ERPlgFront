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

  // Modal para cambio de contraseña propia
  const changePasswordDialogOpen = ref(false)
  const changePasswordDialogForced = ref(false)

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

  function openChangePasswordDialog(options = {}) {
    changePasswordDialogOpen.value = true
    changePasswordDialogForced.value = Boolean(options.forced)
  }

  function closeChangePasswordDialog(options = {}) {
    if (changePasswordDialogForced.value && !options.force) return

    changePasswordDialogOpen.value = false
    changePasswordDialogForced.value = false
  }

  return {
    drawer,
    rail,
    activeModule,
    headerActions,
    changePasswordDialogOpen,
    changePasswordDialogForced,
    toggleDrawer,
    toggleRail,
    setActiveModule,
    setHeaderActions,
    clearHeaderActions,
    openChangePasswordDialog,
    closeChangePasswordDialog,
  }
})