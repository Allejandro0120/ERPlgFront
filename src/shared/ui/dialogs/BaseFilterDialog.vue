<template>
  <div class="w-100">
    <v-badge
      class="w-100"
      color="primary"
      :content="selectedCount"
      :model-value="selectedCount > 0"
    >
      <v-btn
        block
        class="w-100 text-none"
        color="primary"
        prepend-icon="mdi-filter-variant"
        variant="outlined"
        @click="isOpen = true"
      >
        {{ buttonLabel }}
      </v-btn>
    </v-badge>
  </div>

  <BaseDialog
    v-model="isOpen"
    :color="color"
    :disable-confirm="!hasFilters"
    :disable-secondary="!hasFilters"
    :icon="icon"
    :label-cancel="labelCancel"
    :label-confirm="labelConfirm"
    :label-secondary="labelSecondary"
    :max-width="maxWidth"
    :persistent="persistent"
    :title="title"
    @accept="handleAccept"
    @cancel="handleCancel"
    @secondary="handleClear"
  >
    <template #content>
      <v-row class="mt-1" density="comfortable">
        <slot />
      </v-row>
    </template>
  </BaseDialog>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import BaseDialog from './BaseDialog.vue'

  const props = defineProps({
    buttonLabel: { type: String, default: 'Más filtros' },
    title: { type: String, default: 'Opciones de Filtrado' },
    icon: { type: String, default: 'mdi-filter-cog' },
    color: { type: String, default: 'primary' },
    maxWidth: { type: String, default: '700' },
    persistent: { type: Boolean, default: false },
    labelConfirm: { type: String, default: 'Aplicar Filtros' },
    labelCancel: { type: String, default: 'Cancelar' },
    labelSecondary: { type: String, default: 'Limpiar filtros' },
    selectedCount: { type: Number, default: 0 },
  })

  const emit = defineEmits(['apply', 'cancel', 'clear'])

  const isOpen = ref(false)

  // Computed para saber si hay filtros seleccionados
  const hasFilters = computed(() => props.selectedCount > 0)

  function handleAccept() {
    isOpen.value = false
    emit('apply')
  }

  function handleCancel() {
    isOpen.value = false
    emit('cancel')
  }

  function handleClear() {
    isOpen.value = false
    emit('clear')
  }
</script>
