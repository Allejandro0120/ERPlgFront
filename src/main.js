// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'
import { $toast } from '@/plugins/toast'

// Components
import App from './App.vue'

// Styles
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-400-italic.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'

const app = createApp(App)

// Evita que un error no controlado en un componente deje la app en blanco sin rastro.
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue error]', err, info)
  $toast.error('Ocurrió un error inesperado. Intenta recargar la página.')
}

registerPlugins(app)

app.mount('#app')
