import api from '@/plugins/axios'


export const authService = {
  login: (params) => api.post('v1/auth/login', params),
  logout: () => api.post('v1/auth/logout'),
  profile: () => api.post('v1/auth/profile'),
}
