
import { createApp } from 'vue'

import 'vue-sonner/style.css'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'
import vuetify       from './plugins/vuetify'
import { createPinia } from 'pinia'
import router        from './router/index'
import toast         from './plugins/toast'
import loadingPlugin from '@/plugins/loading/loading'
import confirmPlugin from '@/plugins/confirm/confirm'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(vuetify)
app.use(router)
app.use(toast)
app.use(loadingPlugin)
app.use(confirmPlugin)

app.mount('#app')