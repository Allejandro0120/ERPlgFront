<template>
  <div class="date-range-filter">
    <v-row class="align-center" density="comfortable">
      <v-col v-if="showPresetSelect" cols="12" sm="6">
        <v-select
          v-model="preset"
          density="compact"
          :disabled="disabled"
          hide-details
          :items="presets"
          label="Rango"
          variant="outlined"
          @update:model-value="onPresetChange"
        />
      </v-col>

      <!-- Fecha inicio -->
      <v-col cols="6" :sm="showPresetSelect ? 3 : 6">
        <v-menu
          v-model="menuStart"
          :close-on-content-click="false"
          min-width="auto"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props: menuStartProps }">
            <v-text-field
              v-model="startText"
              :class="disabled ? '' : 'cursor-pointer'"
              v-bind="menuStartProps"
              density="compact"
              :disabled="disabled"
              hide-details
              :label="startLabel"
              prepend-inner-icon="mdi-calendar"
              readonly
              variant="outlined"
            />
          </template>
          <v-card>
            <v-date-picker
              v-model="tempStart"
              color="primary"
              :first-day-of-week="1"
              locale="es"
              :max="localEnd"
              :title="`Seleccionar fecha ${startLabel.toLowerCase()}`"
            />
            <v-card-actions class="justify-end pa-2 gap-2">
              <v-btn variant="text" @click="cancelStart"> Cancelar </v-btn>
              <v-btn color="primary" variant="flat" @click="confirmStart"> Aceptar </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-col>

      <!-- Fecha fin -->
      <v-col cols="6" :sm="showPresetSelect ? 3 : 6">
        <v-menu
          v-model="menuEnd"
          :close-on-content-click="false"
          min-width="auto"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props: menuEndProps }">
            <v-text-field
              v-model="endText"
              :class="disabled ? '' : 'cursor-pointer'"
              v-bind="menuEndProps"
              density="compact"
              :disabled="disabled"
              hide-details
              :label="endLabel"
              prepend-inner-icon="mdi-calendar"
              readonly
              variant="outlined"
            />
          </template>
          <v-card>
            <v-date-picker
              v-model="tempEnd"
              color="primary"
              :first-day-of-week="1"
              locale="es"
              :max="today"
              :min="localStart"
              :title="`Seleccionar fecha ${endLabel.toLowerCase()}`"
            />
            <v-card-actions class="justify-end pa-2 gap-2">
              <v-btn variant="text" @click="cancelEnd"> Cancelar </v-btn>
              <v-btn color="primary" variant="flat" @click="confirmEnd"> Aceptar </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { formatDate } from '@/shared/utils/dateFormatter'

  const props = defineProps({
    modelValue: { type: Object, default: () => ({ start: null, end: null }) },
    presetsList: {
      type: Array,
      default: () => [
        { label: 'Hoy', value: 'today' },
        { label: '7 días', value: '7days' },
        { label: '30 días', value: '30days' },
        { label: 'Todos', value: 'all' },
      ],
    },
    // Si es false, el selector de preset se oculta y se aplica `presetValue` al montar
    showPresetSelect: { type: Boolean, default: true },
    presetValue: { type: String, default: '7days' },
    // Deshabilitar ambos campos
    disabled: { type: Boolean, default: false },
    // Etiquetas personalizables para cada campo
    startLabel: { type: String, default: 'Desde' },
    endLabel: { type: String, default: 'Hasta' },
  })

  const emit = defineEmits(['update:modelValue', 'change'])

  const presets = props.presetsList.map((p) => p.label)
  const presetMap = props.presetsList.reduce((acc, p) => {
    acc[p.label] = p.value
    return acc
  }, {})

  const preset = ref('7 días')
  const localStart = ref(props.modelValue.start || new Date())
  const localEnd = ref(props.modelValue.end || new Date())

  // Valores temporales que se muestran en el picker antes de confirmar
  const tempStart = ref(null)
  const tempEnd = ref(null)

  const menuStart = ref(false)
  const menuEnd = ref(false)

  // Cuando el menú de inicio se abre, carga el valor actual como temporal
  watch(menuStart, (val) => {
    if (val) tempStart.value = localStart.value
  })

  // Cuando el menú de fin se abre, carga el valor actual como temporal
  watch(menuEnd, (val) => {
    if (val) tempEnd.value = localEnd.value
  })

  const today = computed(() => new Date())
  const startText = computed(() => {
    const v = localStart.value
    if (!v) return ''
    try {
      if (typeof v === 'string') return formatDate(v)
      return formatDate(new Date(v).toISOString())
    } catch {
      return ''
    }
  })

  const endText = computed(() => {
    const v = localEnd.value
    if (!v) return ''
    try {
      if (typeof v === 'string') return formatDate(v)
      return formatDate(new Date(v).toISOString())
    } catch {
      return ''
    }
  })

  watch([localStart, localEnd], () => {
    emit('update:modelValue', { start: localStart.value, end: localEnd.value })
  })

  // --- Acciones del picker de inicio ---
  function cancelStart() {
    menuStart.value = false
    tempStart.value = localStart.value // descarta cambios
  }

  function confirmStart() {
    if (tempStart.value) localStart.value = tempStart.value
    menuStart.value = false
  }

  // --- Acciones del picker de fin ---
  function cancelEnd() {
    menuEnd.value = false
    tempEnd.value = localEnd.value // descarta cambios
  }

  function confirmEnd() {
    if (tempEnd.value) localEnd.value = tempEnd.value
    menuEnd.value = false
  }

  function applyPreset(value) {
    const today = new Date()
    let start = new Date()
    let end = new Date()
    switch (value) {
      case 'today': {
        start = new Date()
        end = new Date()
        break
      }
      case '7days': {
        start = new Date()
        start.setDate(today.getDate() - 6)
        end = new Date()
        break
      }
      case '30days': {
        start = new Date()
        start.setDate(today.getDate() - 29)
        end = new Date()
        break
      }
      case 'all': {
        start = null
        end = null
        break
      }
      // No default
    }

    localStart.value = start
    localEnd.value = end
    const label = props.presetsList.find((p) => p.value === value)?.label
    if (label) preset.value = label
  }

  function onPresetChange(label) {
    const value = presetMap[label] || 'today'
    applyPreset(value)
  }

  // Inicializar con preset por defecto
  if (props.showPresetSelect) {
    const defaultLabel =
      props.presetsList.find((p) => p.value === props.presetValue)?.label || '7 días'
    preset.value = defaultLabel
    applyPreset(props.presetValue || '7days')
  } else {
    applyPreset(props.presetValue || '7days')
  }
</script>

<style scoped>
  .date-range-filter {
    width: 100%;
  }
</style>
