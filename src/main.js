
// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-400-italic.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

