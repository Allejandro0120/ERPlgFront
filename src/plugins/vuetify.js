// Composables
import { createVuetify } from "vuetify";

// Theme and defaults
import { aliases, mdi } from "vuetify/iconsets/mdi";

import { LIGHT_THEME } from "@/theme/theme";
import { VUETIFY_DEFAULTS } from "@/theme/defaults";

// Styles
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import "@/styles/global.css";

export default createVuetify({
  defaults: VUETIFY_DEFAULTS,
  icons: {
    defaultSet: "mdi",
    aliases: {
      ...aliases,
      plus: "mdi-plus",
      pencil: "mdi-pencil",
      eye: "mdi-eye",
      delete: "mdi-delete",
      search: "mdi-magnify",
      account: "mdi-account",
      close: "mdi-close",
      check: "mdi-check",
      circle: "mdi-circle",
      warning: "mdi-alert-outline",
      info: "mdi-information-outline",
      help: "mdi-help-circle-outline",
      alert: "mdi-alert-circle-outline",
    },
    sets: { mdi },
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light: LIGHT_THEME,
    },
  },
});
