import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import Vue from "@vitejs/plugin-vue";
import Fonts from "unplugin-fonts/vite";
import { defineConfig } from "vite";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import vueDevTools from "vite-plugin-vue-devtools";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
export default defineConfig({
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    vueDevTools(),
    Vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss",
      },
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: "Poppins",
            weights: [100, 300, 400, 500, 700, 900],
            styles: ["normal", "italic"],
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
