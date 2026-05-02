<template>
  <v-navigation-drawer
    v-model="drawer"
    border="r"
    elevation="0"
    :rail="rail"
    style="background-color: #0d2a46"
    :temporary="isMobile"
    @click="uiStore.rail = false"
  >
    <SidebarHeader :rail="rail" />
    <SidebarNav :rail="rail" />

    <template #append>
      <SidebarFooter :rail="rail" :version="version" />
    </template>
  </v-navigation-drawer>
</template>

<script setup>
  import { computed, onMounted, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useUiStore } from '@/stores/ui.store'
  import SidebarFooter from './SidebarFooter.vue'
  import SidebarHeader from './SidebarHeader.vue'
  import SidebarNav from './SidebarNav.vue'

  const uiStore = useUiStore()
  const { mobile } = useDisplay()

  const isMobile = computed(() => mobile.value)
  const version = __APP_VERSION__

  const drawer = computed({
    get: () => uiStore.drawer,
    set: (val) => {
      uiStore.drawer = val
    },
  })

  const rail = computed(() => !isMobile.value && uiStore.rail)

  onMounted(() => {
    uiStore.drawer = !mobile.value
  })

  watch(isMobile, (nowMobile) => {
    uiStore.drawer = !nowMobile
  })
</script>
