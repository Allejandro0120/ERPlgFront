// Composables
import { createVuetify } from "vuetify";

// Theme and defaults
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";
import {
  mdiPlus,
  mdiPencil,
  mdiEye,
  mdiDelete,
  mdiMagnify,
  mdiAccount,
  mdiClose,
  mdiCheck,
  mdiCircle
} from "@mdi/js";

import { LIGHT_THEME } from "@/theme/theme";
import { VUETIFY_DEFAULTS } from "@/theme/defaults";

// Styles
import "vuetify/styles";
import "@/styles/global.css";

export default createVuetify({
  defaults: VUETIFY_DEFAULTS,
  icons: {
    defaultSet: "mdi",
    aliases: {
      ...aliases,
      // Aquí agregas los íconos globales o más usados que quieras
      plus: mdiPlus,
      pencil: mdiPencil,
      eye: mdiEye,
      delete: mdiDelete,
      search: mdiMagnify,
      account: mdiAccount,
      close: mdiClose,
      check: mdiCheck,
      circle: mdiCircle,
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
