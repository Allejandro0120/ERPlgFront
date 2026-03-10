<template>
  <Toaster position="top-right" richColors />
  <v-app>
    <GlobalLoading />
    <GlobalConfirm />
    <router-view />
  </v-app>
</template>

<script setup>
import { Toaster } from 'vue-sonner'
import GlobalLoading from '@/plugins/loading/GlobalLoading.vue'
import GlobalConfirm from '@/plugins/confirm/GlobalConfirm.vue'
</script>