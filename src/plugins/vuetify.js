import { createVuetify } from "vuetify";

import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { LIGHT_THEME } from "../theme/theme";
import { VUETIFY_DEFAULTS } from "../theme/defaults";
import "@/styles/global.css"; 

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light: LIGHT_THEME,
    },
  },
  defaults: VUETIFY_DEFAULTS,
  display: {
    mobileBreakpoint: "md",
  },
});
