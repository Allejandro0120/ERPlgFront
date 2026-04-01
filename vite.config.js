import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import Vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import vueDevTools from "vite-plugin-vue-devtools";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

// Plugin to remove unwanted font preloads and ensure charset is early
function cleanHtmlPlugin() {
  return {
    name: 'clean-html',
    enforce: 'post',
    transformIndexHtml(html) {
      // 1. Elimina TODOS los preloads de fuentes MDI (cualquier extensión)
      let cleaned = html.replace(
        /<link rel="preload"[^>]*as="font"[^>]*href="[^"]*materialdesignicons[^"]*"[^>]*>\n?/gi,
        ''
      );

      // 2. Elimina preloads de fuentes que NO sean woff2 (ttf, eot, woff, otf)
      cleaned = cleaned.replace(
        /<link rel="preload"[^>]*as="font"[^>]*href="[^"]*\.(ttf|eot|otf|woff(?!2))"[^>]*>\n?/gi,
        ''
      );

      // 3. Elimina preloads de woff2 de Poppins que no se usan a tiempo
      //    (unplugin-fonts genera demasiados pesos que no se usan en el critical path)
      cleaned = cleaned.replace(
        /<link rel="preload"[^>]*as="font"[^>]*href="[^"]*[Pp]oppins[^"]*\.woff2"[^>]*>\n?/gi,
        ''
      );

      // 4. Charset al top
      const charsetRegex = /<meta\s+charset=["']UTF-8["']\s*\/?>/i;
      const charsetMatch = cleaned.match(charsetRegex);
      if (charsetMatch) {
        cleaned = cleaned.replace(charsetRegex, '');
        cleaned = cleaned.replace('<head>', '<head>\n    ' + charsetMatch[0]);
      }

      return cleaned;
    }
  };
}

export default defineConfig({
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    vueDevTools(),
    Vuetify({
      autoImport: true,
    }),
    cleanHtmlPlugin(),
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
  optimizeDeps: {
    entries: ["./src/**/*.vue"],
  },
  server: {
    hmr: {
      host: "localhost",
      port: 5173,
      protocol: "ws",
    },
  },
});
