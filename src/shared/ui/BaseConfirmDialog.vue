<template>
  <v-dialog
    max-width="440"
    :model-value="modelValue"
    :persistent="persistent"
    transition="dialog-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="pa-2">
      <div class="d-flex justify-center mt-6 mb-3">
        <v-avatar :color="color" size="64" variant="tonal">
          <v-icon :color="color" :icon="icon" size="32" />
        </v-avatar>
      </div>

      <v-card-title class="text-center px-4 pb-0" style="word-break: break-word">
        <slot name="title">
          <span class="text-title-medium font-weight-bold">{{ title }}</span>
        </slot>
      </v-card-title>

      <v-card-text class="text-center px-4 pt-0 pb-2">
        <slot name="content">
          <p class="text-body-medium mb-0 text-brand-grey-2" v-html="message" />
        </slot>
      </v-card-text>

      <v-card-actions class="justify-end mt-2">
        <slot :accept="accept" :cancel="cancel" name="actions">
          <template v-if="actions">
            <v-btn class="me-2 px-4" color="outline" height="40" variant="outlined" @click="cancel">
              <span style="color: rgb(var(--v-theme-brand-grey-2))">{{ labelCancel }}</span>
            </v-btn>
            <v-btn class="px-4" :color="color" height="40" variant="flat" @click="accept">
              {{ labelConfirm }}
            </v-btn>
          </template>
          <v-btn v-else block :color="color" height="44" variant="flat" @click="accept">
            {{ labelConfirm }}
          </v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  defineProps({
    modelValue: Boolean,
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    color: { type: String, default: 'primary' },
    icon: { type: String, default: 'mdi-help-circle-outline' },
    actions: { type: Boolean, default: true },
    persistent: { type: Boolean, default: false },
    labelConfirm: { type: String, default: 'Confirmar' },
    labelCancel: { type: String, default: 'Cancelar' },
  })

  const emit = defineEmits(['update:modelValue', 'accept', 'cancel'])
  const accept = () => emit('accept')
  const cancel = () => emit('cancel')
</script>
