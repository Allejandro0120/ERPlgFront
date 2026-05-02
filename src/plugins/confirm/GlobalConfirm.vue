<template>
  <BaseConfirmDialog
    :actions="state.actions"
    :color="state.color"
    :icon="state.icon"
    :label-cancel="state.labelCancel"
    :label-confirm="state.labelConfirm"
    :message="state.message"
    :model-value="state.active"
    :persistent="state.persistent"
    :title="state.title"
    @accept="$confirm.accept()"
    @cancel="$confirm.cancel()"
    @update:model-value="onModelUpdate"
  />
</template>

<script setup>
  import { $confirm } from '@/plugins/confirm/confirm.js'
  import BaseConfirmDialog from '@/shared/ui/BaseConfirmDialog.vue'

  const state = $confirm.state
  function onModelUpdate(value) {
    if (value) {
      state.active = true
      return
    }
    if (state.active) $confirm.cancel()
  }
</script>
