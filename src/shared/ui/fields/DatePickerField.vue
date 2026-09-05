<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    min-width="auto"
    offset-y
    transition="scale-transition"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        :id="id"
        v-model="displayText"
        :class="isInteractive ? 'cursor-pointer' : ''"
        v-bind="menuProps"
        :clearable="clearable && !readonly && !!modelValue"
        :disabled="disabled"
        :hide-details="hideDetails"
        :label="label"
        :name="id"
        :prepend-inner-icon="prependInnerIcon"
        :readonly="true"
        :required="required"
        :rules="rules"
        variant="outlined"
        @click:clear="onClear"
      />
    </template>

    <v-card v-if="isInteractive" class="mx-auto" width="328">
      <v-date-picker
        v-model="tempValue"
        color="primary"
        :first-day-of-week="1"
        locale="es"
        :max="max"
        :min="min"
        :title="pickerTitle || `Seleccionar ${label?.toLowerCase() || 'fecha'}`"
        width="328"
      />
      <v-card-actions class="justify-end pa-2">
        <v-btn variant="text" @click="onCancel">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="onConfirm">Aceptar</v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { formatDate } from '@/shared/utils/dateFormatter'

  const props = defineProps({
    // v-model de la fecha (Date, string ISO, o null)
    modelValue: { type: [Date, String, null], default: null },

    // Identificadores / etiquetas
    id: { type: String, default: 'date-picker-field' },
    label: { type: String, default: 'Fecha' },
    prependInnerIcon: { type: String, default: 'mdi-calendar' },
    pickerTitle: { type: String, default: '' },

    // Estados
    readonly: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    hideDetails: { type: [Boolean, String], default: false },

    // Validaciones y límites
    rules: { type: Array, default: () => [] },
    min: { type: [Date, String, null], default: null },
    max: { type: [Date, String, null], default: null },
    required: { type: Boolean, default: false },
  })

  const emit = defineEmits(['update:modelValue', 'change', 'cancel'])

  const menu = ref(false)
  const tempValue = ref(null)

  // El picker con acciones (aceptar/cancelar) solo aplica si no es readonly/disabled
  const isInteractive = computed(() => !props.readonly && !props.disabled)

  const displayText = computed(() => {
    if (!props.modelValue) return ''
    try {
      const v = props.modelValue
      return typeof v === 'string' ? formatDate(v) : formatDate(new Date(v).toISOString())
    } catch {
      return ''
    }
  })

  // Al abrir el menú, carga el valor actual como temporal
  watch(menu, (val) => {
    if (val && isInteractive.value) {
      tempValue.value = props.modelValue || null
    }
    if (val && !isInteractive.value) {
      // Si es readonly/disabled, no debe abrirse el picker
      menu.value = false
    }
  })

  function onCancel() {
    menu.value = false
    tempValue.value = props.modelValue || null
    emit('cancel')
  }

  function onConfirm() {
    emit('update:modelValue', tempValue.value)
    emit('change', tempValue.value)
    menu.value = false
  }

  function onClear() {
    emit('update:modelValue', null)
    emit('change', null)
  }
</script>
