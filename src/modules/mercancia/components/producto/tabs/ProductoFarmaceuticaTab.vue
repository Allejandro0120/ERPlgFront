<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="6">
      <div class="d-flex align-start ga-2">
        <v-autocomplete
          id="IdMolecula"
          v-model="form.IdMolecula"
          :clearable="!isReadonly && !isEditing"
          item-title="display"
          item-value="IdMolecula"
          :items="moleculas"
          label="Molécula"
          name="IdMolecula"
          prepend-inner-icon="mdi-molecule"
          :readonly="isReadonly || isEditing"
          required
          :rules="[rules.required]"
          style="flex: 1"
        />
        <v-tooltip v-if="!isReadonly" location="top" text="Agregar molécula">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              density="comfortable"
              icon="mdi-plus"
              style="margin-top: 4px; flex-shrink: 0"
              variant="tonal"
              @click="dialogMolecula = true"
            />
          </template>
        </v-tooltip>
      </div>
    </v-col>
    <v-col cols="12" sm="6">
      <div class="d-flex align-start ga-2">
        <v-autocomplete
          id="IdConcentracion"
          v-model="form.IdConcentracion"
          :clearable="!isReadonly && !isEditing"
          item-title="display"
          item-value="IdConcentracion"
          :items="concentraciones"
          label="Concentración"
          name="IdConcentracion"
          prepend-inner-icon="mdi-beaker-outline"
          :readonly="isReadonly || isEditing"
          required
          :rules="[rules.required]"
          style="flex: 1"
        />
        <v-tooltip v-if="!isReadonly" location="top" text="Agregar concentración">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              density="comfortable"
              icon="mdi-plus"
              style="margin-top: 4px; flex-shrink: 0"
              variant="tonal"
              @click="dialogConcentracion = true"
            />
          </template>
        </v-tooltip>
      </div>
    </v-col>
    <v-col cols="12" sm="6">
      <div class="d-flex align-start ga-2">
        <v-autocomplete
          id="IdFormaFarmaceutica"
          v-model="form.IdFormaFarmaceutica"
          :clearable="!isReadonly && !isEditing"
          item-title="display"
          item-value="IdFormaFarmaceutica"
          :items="formasFarmaceuticas"
          label="Forma Farmacéutica"
          name="IdFormaFarmaceutica"
          prepend-inner-icon="mdi-pill"
          :readonly="isReadonly || isEditing"
          required
          :rules="[rules.required]"
          style="flex: 1"
        />
        <v-tooltip v-if="!isReadonly" location="top" text="Agregar forma farmacéutica">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              density="comfortable"
              icon="mdi-plus"
              style="margin-top: 4px; flex-shrink: 0"
              variant="tonal"
              @click="dialogFormaFarmaceutica = true"
            />
          </template>
        </v-tooltip>
      </div>
    </v-col>
    <v-col cols="12" sm="6">
      <div class="d-flex align-start ga-2">
        <v-autocomplete
          id="IdLaboratorio"
          v-model="form.IdLaboratorio"
          :clearable="!isReadonly && !isEditing"
          item-title="display"
          item-value="IdLaboratorio"
          :items="laboratorios"
          label="Laboratorio"
          name="IdLaboratorio"
          prepend-inner-icon="mdi-flask"
          :readonly="isReadonly || isEditing"
          required
          :rules="[rules.required]"
          style="flex: 1"
        />
        <v-tooltip v-if="!isReadonly" location="top" text="Agregar laboratorio">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              density="comfortable"
              icon="mdi-plus"
              style="margin-top: 4px; flex-shrink: 0"
              variant="tonal"
              @click="dialogLaboratorio = true"
            />
          </template>
        </v-tooltip>
      </div>
    </v-col>
    <laboratorio-form-dialog v-model="dialogLaboratorio" @created="emit('reload-laboratorio')" />
    <molecula-form-dialog v-model="dialogMolecula" @created="emit('reload-molecula')" />
    <forma-farmaceutica-form-dialog
      v-model="dialogFormaFarmaceutica"
      @created="emit('reload-forma-farmaceutica')"
    />
    <concentracion-form-dialog
      v-model="dialogConcentracion"
      @created="emit('reload-concentracion')"
    />
  </v-row>
</template>

<script setup>
  import { ref, toRefs } from 'vue'
  import ConcentracionFormDialog from '@/modules/mercancia/components/producto/creacion/ConcentracionFormDialog.vue'
  import FormaFarmaceuticaFormDialog from '@/modules/mercancia/components/producto/creacion/FormaFarmaceuticaFormDialog.vue'
  import LaboratorioFormDialog from '@/modules/mercancia/components/producto/creacion/LaboratorioFormDialog.vue'
  import MoleculaFormDialog from '@/modules/mercancia/components/producto/creacion/MoleculaFormDialog.vue'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
    isEditing: { type: Boolean, default: false },
    moleculas: { type: Array, default: () => [] },
    concentraciones: { type: Array, default: () => [] },
    formasFarmaceuticas: { type: Array, default: () => [] },
    laboratorios: { type: Array, default: () => [] },
  })

  const { form } = toRefs(props)
  const dialogLaboratorio = ref(false)
  const dialogMolecula = ref(false)
  const dialogConcentracion = ref(false)
  const dialogFormaFarmaceutica = ref(false)

  const emit = defineEmits([
    'reload-molecula',
    'reload-concentracion',
    'reload-forma-farmaceutica',
    'reload-laboratorio',
  ])
</script>
