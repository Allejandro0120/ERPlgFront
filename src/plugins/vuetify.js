// Composables
import { createVuetify } from 'vuetify'
// Theme and defaults
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { es } from 'vuetify/locale'

import { VUETIFY_DEFAULTS } from '@/theme/defaults'
import { LIGHT_THEME } from '@/theme/theme'

// Styles
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import '@/styles/global.css'

export default createVuetify({
  locale: {
    locale: 'es',
    messages: { es },
  },
  defaults: VUETIFY_DEFAULTS,
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      plus: 'mdi-plus',
      pencil: 'mdi-pencil',
      eye: 'mdi-eye',
      delete: 'mdi-delete',
      search: 'mdi-magnify',
      account: 'mdi-account',
      close: 'mdi-close',
      check: 'mdi-check',
      circle: 'mdi-circle',
      warning: 'mdi-alert-outline',
      info: 'mdi-information-outline',
      help: 'mdi-help-circle-outline',
      alert: 'mdi-alert-circle-outline',
      pdf: 'mdi-file-pdf-box',
    },
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: LIGHT_THEME,
    },
  },
})
