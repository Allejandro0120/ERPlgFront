import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { handleAuthError, handleError, handlePermissionError } from '@/shared/utils/errorHandlers'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore()

    if (config.url.includes('/auth/')) return config

    if (!authStore.isAuthenticated) {
      const error = new Error('No autenticado')
      error.response = {
        status: 401,
        data: { message: 'La sesión ha expirado' },
      }
      error.handledByInterceptor = true
      // Cancelar la petición inmediatamente
      return Promise.reject(error)
    }

    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.handledByInterceptor) return Promise.reject(error)

    // Ignorar el manejo especial de 401 si estamos en la ruta de login
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      await handleAuthError(error)
      error.handledByInterceptor = true
      return Promise.reject(error)
    }

    if (error.response?.status === 403) {
      await handlePermissionError(error)
      error.handledByInterceptor = true
      return Promise.reject(error)
    }

    // Manejar errores 404 de manera consistente
    if (error.response?.status === 404) {
      const errorMessage = error.response.data?.message || 'Recurso no encontrado'
      error.handledByInterceptor = true
      window.$toast.error(errorMessage)
      return Promise.reject(error)
    }

    // Manejo de errores genéricos
    if (!error.handledByInterceptor) {
      handleError(error, 'Error en la petición')
      error.handledByInterceptor = true
    }

    return Promise.reject(error)
  },
)

export default api
