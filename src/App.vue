<template>
  <Toaster position="top-right" rich-colors />
  <v-app>
    <GlobalLoading />
    <GlobalConfirm />
    <router-view />
  </v-app>
</template>

<script setup>
  import { Toaster } from 'vue-sonner'
  import GlobalConfirm from '@/plugins/confirm/GlobalConfirm.vue'
  import GlobalLoading from '@/plugins/loading/GlobalLoading.vue'
</script>
