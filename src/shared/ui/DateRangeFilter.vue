<template>
  <div class="date-range-filter">
    <v-row class="align-center" density="comfortable">
      <v-col v-if="showPresetSelect" cols="12" sm="6">
        <v-select
          v-model="preset"
          :items="presets"
          label="Rango"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="onPresetChange"
        />
      </v-col>

      <v-col cols="6" sm="3">
        <v-menu
          v-model="menuStart"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="startText"
              v-bind="props"
              label="Desde"
              density="compact"
              variant="outlined"
              readonly
              hide-details
              prepend-inner-icon="mdi-calendar"
            />
          </template>
          <v-date-picker
            v-model="localStart"
            @input="onStartPick"
            :max="localEnd"
            color="primary"
            locale="es"
            :first-day-of-week="1"
          />
        </v-menu>
      </v-col>

      <v-col cols="6" sm="3">
        <v-menu
          v-model="menuEnd"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="endText"
              v-bind="props"
              label="Hasta"
              density="compact"
              variant="outlined"
              readonly
              hide-details
              prepend-inner-icon="mdi-calendar"
            />
          </template>
          <v-date-picker
            v-model="localEnd"
            @input="onEndPick"
            :min="localStart"
            color="primary"
            locale="es"
            :first-day-of-week="1"
          />
        </v-menu>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { formatDate } from '@/shared/utils/dateFormatter';

const props = defineProps({
  modelValue: { type: Object, default: () => ({ start: null, end: null }) },
  presetsList: {
    type: Array,
    default: () => [
      { label: "Hoy", value: "today" },
      { label: "7 días", value: "7days" },
      { label: "30 días", value: "30days" },
      { label: "Todos", value: "all" },
    ],
  },
  // If false, the preset selector is hidden and `presetValue` will be applied on mount
  showPresetSelect: { type: Boolean, default: true },
  presetValue: { type: String, default: "7days" },
});

const emit = defineEmits(["update:modelValue", "change"]);

const presets = props.presetsList.map((p) => p.label);
const presetMap = props.presetsList.reduce((acc, p) => {
  acc[p.label] = p.value;
  return acc;
}, {});

const preset = ref("7 días");
const localStart = ref(
  props.modelValue.start ? props.modelValue.start : new Date(),
);
const localEnd = ref(props.modelValue.end ? props.modelValue.end : new Date());

const menuStart = ref(false);
const menuEnd = ref(false);

const startText = computed(() => {
  const v = localStart.value;
  if (!v) return "";
  try {
    if (typeof v === 'string') return formatDate(v);
    return formatDate(new Date(v).toISOString());
  } catch (e) {
    return "";
  }
});
const endText = computed(() => {
  const v = localEnd.value;
  if (!v) return "";
  try {
    if (typeof v === 'string') return formatDate(v);
    return formatDate(new Date(v).toISOString());
  } catch (e) {
    return "";
  }
});

watch([localStart, localEnd], () => {
  emit("update:modelValue", { start: localStart.value, end: localEnd.value });
});

function applyPreset(value) {
  const today = new Date();
  let start = new Date();
  let end = new Date();
  if (value === "today") {
    start = new Date();
    end = new Date();
  } else if (value === "7days") {
    start = new Date();
    start.setDate(today.getDate() - 6);
    end = new Date();
  } else if (value === "30days") {
    start = new Date();
    start.setDate(today.getDate() - 29);
    end = new Date();
  } else if (value === "all") {
    start = null;
    end = null;
  }

  localStart.value = start;
  localEnd.value = end;
  const label = props.presetsList.find((p) => p.value === value)?.label;
  if (label) preset.value = label;
}

function onPresetChange(label) {
  const value = presetMap[label] || "today";
  applyPreset(value);
}

function onStartPick(value) {
  localStart.value = value;
  menuStart.value = false;
}

function onEndPick(value) {
  localEnd.value = value;
  menuEnd.value = false;
}

// Initialize with default preset: 7 days
// Apply preset depending on whether the selector is visible or a presetValue is provided
if (props.showPresetSelect) {
  // set label to match default value
  const defaultLabel =
    props.presetsList.find((p) => p.value === props.presetValue)?.label ||
    "7 días";
  preset.value = defaultLabel;
  applyPreset(props.presetValue || "7days");
} else {
  applyPreset(props.presetValue || "7days");
}
</script>

<style scoped>
.date-range-filter {
  width: 100%;
}
</style>
