<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    :temporary="isMobile"
    border="r"
    elevation="0"
    @click="uiStore.rail = false"
    style="background-color: #0d2a46"
  >
    <SidebarHeader :rail="rail" />
    <SidebarNav />

    <template #append>
      <SidebarFooter
        :rail="rail"
        :user="currentUser"
        :version="version"
        @logout="handleLogout"
        @change-password="handleChangePassword"
      />
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/api/services/authService";
import SidebarNav from "./SidebarNav.vue";
import SidebarHeader from "./SidebarHeader.vue";
import SidebarFooter from "./SidebarFooter.vue";

const uiStore = useUiStore();
const authStore = useAuthStore();
const router = useRouter();
const { mobile } = useDisplay();

const isMobile = computed(() => mobile.value);
const version = __APP_VERSION__;

const currentUser = computed(() => {
  const user = authStore.user;
  if (!user) {
    return {
      name: "Usuario",
      role: "Invitado",
      avatar: null,
    };
  }

  return {
    name: user.Nombre || user.name || "Usuario",
    role: user.Rol || user.role || "Usuario",
    avatar: user.avatar || null,
    gender: user.Genero?.toLowerCase() || user.gender || null,
  };
});

const drawer = computed({
  get: () => uiStore.drawer,
  set: (val) => {
    uiStore.drawer = val;
  },
});

const rail = computed(() => !isMobile.value && uiStore.rail);

onMounted(() => {
  uiStore.drawer = !mobile.value;
});

watch(isMobile, (nowMobile) => {
  uiStore.drawer = !nowMobile;
});

async function handleLogout() {
  try {
    $loading.show("Cerrando sesión...");
    await authService.logout();
    authStore.clearAuth();
    uiStore.setActiveModule(null);
    window.$toast.success("Sesión cerrada correctamente");
    router.push({ name: "login" });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    // Incluso si el backend falla, limpiamos la sesión local
    authStore.clearAuth();
    uiStore.setActiveModule(null);
    router.push({ name: "login" });
  } finally {
    $loading.hide();
  }
}

function handleChangePassword() {
  // TODO: implementar cambio de contraseña
  console.log("change password");
}
</script>
