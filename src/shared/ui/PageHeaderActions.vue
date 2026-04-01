<template>
  <!-- 
    Teletransporta su contenido al header del DefaultLayout.
    Usamos isMounted para asegurar que el target ya existe en el DOM.
  -->
  <Teleport to="#page-header-actions-slot" v-if="isMounted">
    <div
      :class="['d-flex flex-wrap align-center ga-2 w-100', $attrs.class]"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineOptions({
  inheritAttrs: false
})

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})
</script>
