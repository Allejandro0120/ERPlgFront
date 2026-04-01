<template>
  <BaseConfirmDialog
    :model-value="state.active"
    :title="state.title"
    :message="state.message"
    :color="state.color"
    icon="state.icon"
    :actions="state.actions"
    :persistent="state.persistent"
    :label-confirm="state.labelConfirm"
    :label-cancel="state.labelCancel"
    @accept="$confirm.accept()"
    @cancel="$confirm.cancel()"
    @update:model-value="onModelUpdate"
  />
</template>

<script setup>
import { $confirm } from "@/plugins/confirm/confirm.js";
import BaseConfirmDialog from "@/shared/ui/BaseConfirmDialog.vue"

const state = $confirm.state;
const onModelUpdate = (value) => {
  if (value) { state.active = true; return; }
  if (state.active) $confirm.cancel();
};
</script>