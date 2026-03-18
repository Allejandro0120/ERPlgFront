import router from '../router'
import { createPinia } from 'pinia'

// Plugins
import vuetify from './vuetify'
import toast from './toast'
import confirm from './confirm/confirm'
import loading from './loading/loading'

export function registerPlugins(app) {
  app.use(vuetify)
  app.use(createPinia())
  app.use(router)
  app.use(toast)
  app.use(confirm)
  app.use(loading)
}
