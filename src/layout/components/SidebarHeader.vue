<!-- src/layout/components/SidebarHeader.vue -->
<template>
  <div class="d-flex align-center px-3 mb-5 mt-2" style="height: 72px; overflow: hidden">
    <v-avatar
      class="flex-shrink-0"
      :size="rail ? 36 : 44"
      style="
        transition:
          width 0.2s,
          height 0.2s;
      "
    >
      <v-img alt="Logicpharma logo" cover height="36" :src="logo" width="36" />
    </v-avatar>

    <Transition name="header-text">
      <div v-if="!rail" class="ml-3 overflow-hidden" style="white-space: nowrap">
        <p class="mb-0 font-weight-bold text-white text-title-medium" style="line-height: 1.3">
          Logicpharma
        </p>
        <p class="mb-0 mt-1 text-white font-weight-medium text-body-small">Sistema de Gestión</p>
      </div>
    </Transition>
  </div>

  <v-divider />
</template>

<script setup>
  import logo from '@/assets/logicpharma_logo.png'

  defineProps({
    rail: { type: Boolean, default: false },
  })
</script>

<style scoped>
  /*
  Transición del texto al entrar/salir.
  enter: viene desde la izquierda y aparece.
  leave: sale hacia la izquierda y desaparece.
  La duración es corta (150ms)
*/
  .header-text-enter-active,
  .header-text-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .header-text-enter-from,
  .header-text-leave-to {
    opacity: 0;
    transform: translateX(-8px);
  }
</style>
