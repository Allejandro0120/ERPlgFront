<template>
  <v-dialog v-model="state.active" persistent width="300">
    <v-card class="pa-6">
      <div class="d-flex flex-column align-center justify-center">
        <v-progress-circular class="mb-4" color="primary" indeterminate size="64" width="4" />
        <div class="text-h6 text-center">
          {{ state.text }}
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { $loading } from '@/plugins/loading/loading.js'

  const state = $loading.state
</script>
