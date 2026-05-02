import { createPinia } from 'pinia'
import router from '../router'
import confirm from './confirm/confirm'
import loading from './loading/loading'
import toast from './toast'
// Plugins
import vuetify from './vuetify'

export function registerPlugins(app) {
  app.use(vuetify)
  app.use(createPinia())
  app.use(router)
  app.use(toast)
  app.use(confirm)
  app.use(loading)
}
