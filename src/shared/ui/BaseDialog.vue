<template>
  <v-dialog
    :max-width="maxWidth"
    :model-value="modelValue"
    :persistent="persistent"
    transition="dialog-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="pa-4">
      <!-- Header -->
      <div v-if="title || icon" class="d-flex align-center ga-3 mb-4">
        <v-avatar v-if="icon" :color="color" rounded="lg" size="30" variant="tonal">
          <v-icon :color="color" :icon="icon" size="20" />
        </v-avatar>

        <div class="flex-grow-1">
          <v-card-title v-if="title" class="pa-0" style="word-break: break-word">
            <slot name="title">
              <span class="text-body-large font-weight-semibold">{{ title }}</span>
            </slot>
          </v-card-title>
        </div>

        <!-- Botón cerrar -->
        <v-btn
          v-if="!persistent"
          color="brand-grey-3"
          density="comfortable"
          icon="$close"
          size="small"
          variant="text"
          @click="cancel"
        />
      </div>

      <v-divider class="mb-5" style="opacity: 0.5" />

      <!-- Contenido -->
      <v-card-text class="pa-0 pb-4">
        <slot name="content">
          <p class="text-body-medium text-brand-grey-2 mb-0">{{ message }}</p>
        </slot>
      </v-card-text>

      <!-- Acciones -->
      <v-card-actions v-if="showActions" class="pa-0 justify-end gap-2">
        <slot :accept="accept" :cancel="cancel" name="actions">
          <v-btn v-if="showCancel" color="outline" variant="outlined" @click="cancel">
            <span style="color: rgb(var(--v-theme-brand-grey-2))">
              {{ labelCancel }}
            </span>
          </v-btn>
          <v-btn :color="color" :disabled="disableConfirm" variant="flat" @click="accept">
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
    icon: { type: String, default: '' },
    persistent: { type: Boolean, default: false },
    maxWidth: { type: String, default: '600' },
    showActions: { type: Boolean, default: true },
    showCancel: { type: Boolean, default: true },
    labelConfirm: { type: String, default: 'Confirmar' },
    labelCancel: { type: String, default: 'Cancelar' },
    disableConfirm: { type: Boolean, default: false },
  })

  const emit = defineEmits(['update:modelValue', 'accept', 'cancel'])

  const accept = () => emit('accept')
  function cancel() {
    emit('update:modelValue', false)
    emit('cancel')
  }
</script>
