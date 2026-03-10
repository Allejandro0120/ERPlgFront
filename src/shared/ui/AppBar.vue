<template>
  <v-app-bar flat border="b">
    <!-- icono de hamburguesa para abrir y cerrar -->
    <v-app-bar-nav-icon @click="handleMenuClick" />
    <v-app-bar-title class="font-weight-bold text-brand-grey-1">
      {{ title }}
    </v-app-bar-title>
    <!-- slot para botones en cada vista -->
    <template #append>
      <div class="d-flex align-center ga-2 pr-2">
        <slot name="actions" />
      </div>
    </template>
  </v-app-bar>
</template>
<script setup>
import { useUiStore } from "@/stores/ui.store";
import { useDisplay } from "vuetify/lib/composables/display";

defineProps({
  title: { type: String, default: "" },
});
const { mobile } = useDisplay();
const uiStore = useUiStore();

function handleMenuClick() {
  if (mobile.value) {
    uiStore.toggleDrawer(); // abre/cierra overlay en mobile
  } else {
    uiStore.toggleRail(); // colapsa/expande en desktop
  }
}
</script>
