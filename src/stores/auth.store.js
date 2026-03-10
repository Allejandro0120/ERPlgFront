import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  const setAuth = (userData, userToken) => {
    user.value = userData
    token.value = userToken
  }

  const clearAuth = () => {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isAuthenticated,
    setAuth,
    clearAuth,
  }
})
