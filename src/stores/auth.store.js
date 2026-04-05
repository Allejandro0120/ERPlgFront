import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ACCESS_TOKEN_HINT_KEY = 'erp_access_token_present'

function setAccessTokenHint(isPresent) {
  if (typeof window === 'undefined') return

  try {
    if (isPresent) {
      window.localStorage.setItem(ACCESS_TOKEN_HINT_KEY, '1')
      return
    }

    window.localStorage.removeItem(ACCESS_TOKEN_HINT_KEY)
  } catch {
    // Ignorar errores de storage (modo privado, permisos, etc.)
  }
}

function hasAccessTokenHint() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(ACCESS_TOKEN_HINT_KEY) === '1'
  } catch {
    return false
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const menu = ref([])
  const permisos = ref([])
  const accessTokenHint = ref(hasAccessTokenHint())

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

  // Obtiene la primera ruta del menú del usuario
  const firstRoute = computed(() => {
    const firstGroup = orderedMenu.value[0]
    if (!firstGroup || !firstGroup.secciones || firstGroup.secciones.length === 0) {
      return null
    }
    const firstSection = firstGroup.secciones[0]
    return {
      path: `/${firstGroup.Alias}${firstSection.Ruta}`,
      module: firstGroup.Alias,
      moduleNombre: firstGroup.Nombre,
      section: firstSection.Ruta,
      sectionNombre: firstSection.Nombre
    }
  })

  const setAuth = (userData) => {
    user.value = userData
    accessTokenHint.value = true
    setAccessTokenHint(true)
  }

  const setProfile = (profileData) => {
    menu.value = profileData.menu || []
    permisos.value = profileData.permisos || []
  }

  const clearAuth = () => {
    user.value = null
    menu.value = []
    permisos.value = []
    accessTokenHint.value = false
    setAccessTokenHint(false)
  }

  const hasPermission = (permission) => {
    return permisos.value.includes(permission)
  }

  return {
    user,
    menu,
    permisos,
    accessTokenHint,
    isAuthenticated,
    orderedMenu,
    firstRoute,
    setAuth,
    setProfile,
    clearAuth,
    hasPermission,
  }
})
