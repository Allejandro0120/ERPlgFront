import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const menu = ref([])
  const permisos = ref([])

  // Con cookies HTTP Only, la autenticación se verifica por la presencia de datos del usuario
  const isAuthenticated = computed(() => !!user.value)

  const orderedMenu = computed(() => {
    return menu.value
      .slice()
      .sort((a, b) => a.OrdenMenu - b.OrdenMenu)
      .map(group => ({
        ...group,
        Alias: group.Alias || group.Nombre?.toLowerCase(),
        secciones: group.secciones
          .slice()
          .sort((a, b) => a.OrdenMenu - b.OrdenMenu)
      }))
  })

  const setAuth = (userData) => {
    user.value = userData
  }

  const setProfile = (profileData) => {
    menu.value = profileData.menu || []
    permisos.value = profileData.permisos || []
  }

  const clearAuth = () => {
    user.value = null
    menu.value = []
    permisos.value = []
  }

  const hasPermission = (permission) => {
    return permisos.value.includes(permission)
  }

  return {
    user,
    menu,
    permisos,
    isAuthenticated,
    orderedMenu,
    setAuth,
    setProfile,
    clearAuth,
    hasPermission,
  }
})
