<template>
  <v-dialog
    :fullscreen="isFullscreen"
    :max-width="maxWidth"
    :model-value="modelValue"
    :persistent="persistent"
    :transition="isFullscreen ? 'dialog-bottom-transition' : 'dialog-transition'"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card
      class="pa-4"
      :class="{ 'd-flex flex-column': isFullscreen }"
      :rounded="isFullscreen ? 0 : undefined"
    >
      <!-- Header -->
      <div v-if="title || icon" class="d-flex align-center ga-3 mb-4" style="flex-wrap: nowrap">
        <v-avatar
          v-if="icon"
          :color="color"
          rounded="lg"
          size="30"
          style="flex-shrink: 0"
          variant="tonal"
        >
          <v-icon :color="color" :icon="icon" size="20" />
        </v-avatar>

        <div style="flex: 1 1 0; min-width: 0">
          <v-card-title
            v-if="title"
            class="pa-0"
            style="word-break: break-word; white-space: normal; line-height: 1.4"
          >
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
          style="flex-shrink: 0"
          variant="text"
          @click="cancel"
        />
      </div>

      <v-divider class="mb-5" style="opacity: 0.5" />

      <!-- Contenido -->
      <v-card-text class="pa-0 pb-4" :class="{ 'flex-grow-1 overflow-y-auto': isFullscreen }">
        <slot name="content">
          <p class="text-body-medium text-brand-grey-2 mb-0">{{ message }}</p>
        </slot>
      </v-card-text>

      <!-- Acciones -->
      <v-card-actions v-if="showActions" class="pa-0">
        <v-row align="center" class="ma-0" justify="end" no-gutters>
          <slot :accept="accept" :cancel="cancel" name="actions">
            <v-col class="pa-1" cols="12" sm="auto">
              <v-btn v-if="showCancel" block color="outline" variant="outlined" @click="cancel">
                <span style="color: rgb(var(--v-theme-brand-grey-2))">
                  {{ labelCancel }}
                </span>
              </v-btn>
            </v-col>

            <v-divider
              v-if="labelSecondary"
              class="my-1 d-none d-sm-flex"
              style="opacity: 0.5"
              vertical
            />
            <v-col v-if="labelSecondary" class="pa-1" cols="12" sm="auto">
              <v-btn
                block
                :color="color"
                :disabled="disableSecondary"
                variant="tonal"
                @click="$emit('secondary')"
              >
                {{ labelSecondary }}
              </v-btn>
            </v-col>

            <v-col class="pa-1" cols="12" sm="auto">
              <v-btn block :color="color" :disabled="disableConfirm" variant="flat" @click="accept">
                {{ labelConfirm }}
              </v-btn>
            </v-col>
          </slot>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
  import { computed } from 'vue'
  import { useDisplay } from 'vuetify'

  const props = defineProps({
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
    labelSecondary: { type: String, default: '' },
    disableConfirm: { type: Boolean, default: false },
    disableSecondary: { type: Boolean, default: false },
    mobileFullscreen: { type: Boolean, default: true },
  })

  const { mobile } = useDisplay()
  const isFullscreen = computed(() => mobile.value && props.mobileFullscreen)

  const emit = defineEmits(['update:modelValue', 'accept', 'cancel', 'secondary'])

  const accept = () => emit('accept')
  function cancel() {
    emit('update:modelValue', false)
    emit('cancel')
  }
</script>
