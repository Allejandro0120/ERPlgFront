// src/stores/ui.store.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // Controla si el drawer está visible (importante en mobile)
 const drawer = ref(null)

  // Controla el modo "solo iconos" en desktop
  const rail = ref(true)

  function toggleDrawer() {
    drawer.value = !drawer.value
  }

  function toggleRail() {
    rail.value = !rail.value
  }

  return { drawer, rail, toggleDrawer, toggleRail }
})