import api from '@/plugins/axios'

/**
 * API de autenticación
 */
export const authApi = {
  /**
   * Login de usuario
   * @param {Object} credentials - Credenciales { email, password }
   * @returns {Promise}
   */
  login: (credentials) => api.post('/users/login', credentials),

  /**
   * Logout de usuario
   * @returns {Promise}
   */
  logout: () => api.post('/users/logout'),

  /**
   * Verificar sesión actual
   * @returns {Promise}
   */
  verifySession: () => api.get('/users/me'),
}
