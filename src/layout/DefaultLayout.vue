<!-- src/layouts/DefaultLayout.vue -->
<template>
  <AppSidebar />
  <v-main>
    <v-container fluid class="pa-6">
      <router-view />
    </v-container>
  </v-main>
</template>

<script setup>
import AppSidebar from "@/layout/components/AppSidebar.vue";
</script>
