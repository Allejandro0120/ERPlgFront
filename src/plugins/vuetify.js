/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com
 */

// Composables
import { createVuetify } from 'vuetify'

// Theme and defaults
import { LIGHT_THEME } from '@/theme/theme'
import { VUETIFY_DEFAULTS } from '@/theme/defaults'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import "@/styles/global.css"; 


// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  defaults: VUETIFY_DEFAULTS,
  
  theme: {
    defaultTheme: 'light',
    themes: {
      light: LIGHT_THEME,
    },
  },
})
