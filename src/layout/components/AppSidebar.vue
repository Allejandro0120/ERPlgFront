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
      <SidebarFooter :rail="rail" :version="version" />
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
</script>
