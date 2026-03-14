/**
 * api/axios.js
 *
 * Instancia de axios con interceptor de respuesta centralizado.
 *
 * Responsabilidades:
 *  - Adjuntar la señal de cancelación a cada request.
 *  - En 401: consultar AUTH_CODES para saber si debe cerrar sesión o no.
 *  - En cualquier otro error: mostrar el mensaje del servidor.
 *  - Evitar manejo duplicado con error._handled.
 */

import axios from 'axios'
import { AUTH_CODES }                from '@/api/handlers/authCodes'
import { closeSession, getAbortSignal } from '@/api/authSession'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  config.signal = getAbortSignal()
  return config
})

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (error._handled || axios.isCancel(error)) return Promise.reject(error)
    error._handled = true

    const status  = error.response?.status
    const code    = error.response?.data?.code ?? error.response?.data?.error
    const message = error.response?.data?.message

    if (status === 401) {
      window.$toast.error(message)

      // Busca el código en AUTH_CODES; si no existe o closeSession es true → cierra sesión
      const shouldClose = AUTH_CODES[code]?.closeSession ?? true
      if (shouldClose) await closeSession()

      return Promise.reject(error)
    }

    // Para cualquier otro error (403, 404, 500…), solo mostramos el mensaje del servidor
    window.$toast.error(message)
    return Promise.reject(error)
  },
)

export default api