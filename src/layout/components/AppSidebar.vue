<template>
  <v-navigation-drawer 
    v-model="drawer" 
    :rail="rail" 
    :temporary="isMobile"
    border="r"
    elevation="0"
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
import { useUiStore } from "@/stores/ui.store";
import SidebarNav from "./SidebarNav.vue";
import SidebarHeader from "./SidebarHeader.vue";
import SidebarFooter from "./SidebarFooter.vue";

const uiStore = useUiStore();
const { mobile } = useDisplay();

const isMobile = computed(() => mobile.value);
const version = __APP_VERSION__;

const currentUser = {
  name: "Alex Johnson",
  role: "Administrador",
  avatar: null,
};

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

function handleLogout() {
  // TODO: implementar logout
  console.log("logout");
}

function handleChangePassword() {
  // TODO: implementar cambio de contraseña
  console.log("change password");
}
</script>
