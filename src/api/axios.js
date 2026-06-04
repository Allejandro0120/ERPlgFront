import axios from 'axios'
import { closeSession, getAbortSignal, isSessionClosing, tryRefresh } from '@/api/authSession'
import { AUTH_CODES } from '@/api/handlers/authCodes'
import { $toast } from '@/plugins/toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://sanamosapi.alejoperezbernal.com/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  config.signal = getAbortSignal()
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error._handled || axios.isCancel(error)) {
      throw error
    }
    if (isSessionClosing()) {
      error._handled = true
      throw error
    }
    error._handled = true

    if (!error.response) {
      $toast.error('No se pudo conectar con el servidor.')
      error._toastShown = true
      throw error
    }
    const status = error.response?.status
    const code = error.response?.data?.code ?? error.response?.data?.error
    const message = error.response?.data?.message

    if (status === 401) {
      const action = AUTH_CODES[code]?.action ?? 'logout'

      if (action === 'refresh') {
        const refreshed = await tryRefresh()

        if (refreshed) {
          // Reintentar la request original, sin volver a pasar por este interceptor
          error._handled = false
          return api.request(error.config)
        }
        // Si el refresh falló, closeSession ya fue llamado dentro de tryRefresh
        throw error
      }

      if (action === 'logout') {
        $toast.error(message)
        error._toastShown = true
        await closeSession({
          code,
          skipServerLogout: code === 'SESSION_REVOKED' || code === 'SESSION_CLOSED',
        })
        throw error
      }

      // action === "none": solo mostrar el error
      $toast.error(message)
      error._toastShown = true
      throw error
    }

    $toast.error(message)
    error._toastShown = true
    throw error
  },
)

export default api
