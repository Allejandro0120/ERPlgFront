<template>
  <!--
    Teletransporta su contenido al header del DefaultLayout.
    Usamos isMounted para asegurar que el target ya existe en el DOM.
  -->
  <Teleport v-if="isMounted" to="#page-header-actions-slot">
    <div :class="['d-flex flex-wrap align-center ga-2 w-100', $attrs.class]" v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>

<script setup>
  import { onMounted, ref } from 'vue'

  defineOptions({
    inheritAttrs: false,
  })

  const isMounted = ref(false)

  onMounted(() => {
    isMounted.value = true
  })
</script>
