import { useAuthStore } from '@/stores/auth.store'
import router from '@/router'

/**
 * Maneja errores de autenticación (401)
 */
export async function handleAuthError(error) {
  const authStore = useAuthStore()
  
  const message = error.response?.data?.message || 'La sesión ha expirado'
  window.$toast.error(message)
  
  // Limpiar autenticación y redirigir al login
  authStore.clearAuth()
  
  if (router.currentRoute.value.name !== 'login') {
    await router.push('/auth/login')
  }
}

/**
 * Maneja errores de permisos (403)
 */
export async function handlePermissionError(error) {
  const message = error.response?.data?.message || 'No tienes permisos para realizar esta acción'
  window.$toast.error(message)
}

/**
 * Maneja errores genéricos
 */
export function handleError(error, defaultMessage = 'Error en la operación') {
  let message = defaultMessage
  
  if (error.response?.data?.message) {
    message = error.response.data.message
  } else if (error.message) {
    message = error.message
  }
  
  window.$toast.error(message)
  console.error('Error:', error)
}
