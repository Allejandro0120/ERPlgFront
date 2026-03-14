import { createApp } from "vue";

import "vue-sonner/style.css";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import { createPinia } from "pinia";
import router from "./router/index";
import toast from "./plugins/toast";
import loadingPlugin from "@/plugins/loading/loading";
import confirmPlugin from "@/plugins/confirm/confirm";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { authService } from "@/modules/auth/services/authservice";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(vuetify);
app.use(toast);
app.use(loadingPlugin);
app.use(confirmPlugin);

// Verificar sesión antes de montar la app
const authStore = useAuthStore();
const uiStore = useUiStore();

async function initializeAuth() {
  try {
    // Intentar obtener el perfil si existe una sesión válida (cookie HTTP Only)
    const response = await authService.profile();
    const profileData = response.data.data;
    
    // Guardar usuario y menú en el store
    authStore.setAuth({
      Nombre: profileData.nombre,
      Rol: profileData.rol,
      authenticated: true
    });
    authStore.setProfile(profileData);
    
    // Establecer el primer módulo como activo
    const firstRoute = authStore.firstRoute;
    if (firstRoute) {
      uiStore.setActiveModule(firstRoute.module);
    }
  } catch (error) {
    // No hay sesión válida, limpiar el store
    authStore.clearAuth();
  }
}

// Inicializar autenticación primero, LUEGO configurar el router y montar
initializeAuth().finally(() => {
  app.use(router);
  app.mount("#app");
});
