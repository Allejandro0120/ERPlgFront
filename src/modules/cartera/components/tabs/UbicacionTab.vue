<template>
  <v-row class="mt-2">
    <v-col cols="12">
      <v-autocomplete
        id="idDepartamento"
        v-model="ui.idDepartamento"
        :clearable="!isReadonly"
        item-title="NombreDepartamento"
        item-value="IdDepartamento"
        :items="departamentos"
        label="Departamento"
        name="idDepartamento"
        prepend-inner-icon="mdi-map-outline"
        :readonly="isReadonly"
        :rules="[rules.required]"
        @update:model-value="onDepartamentoChange"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-autocomplete
        id="idMunicipio"
        v-model="ui.idMunicipio"
        :clearable="!isReadonly"
        :disabled="!ui.idDepartamento"
        item-title="NombreMunicipio"
        item-value="IdMunicipio"
        :items="municipios"
        label="Municipio"
        :loading="loadingMunicipios"
        name="idMunicipio"
        prepend-inner-icon="mdi-city-variant-outline"
        :readonly="isReadonly"
        :rules="[rules.required]"
        @update:model-value="onMunicipioChange"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-autocomplete
        id="IdCentroPoblado"
        v-model="form.IdCentroPoblado"
        :clearable="!isReadonly"
        :disabled="!ui.idMunicipio"
        item-title="NombreCentroPoblado"
        item-value="IdCentroPoblado"
        :items="centrosPoblados"
        label="Centro Poblado"
        :loading="loadingCentrosPoblados"
        name="IdCentroPoblado"
        prepend-inner-icon="mdi-home-group"
        :readonly="isReadonly"
        :rules="[rules.required]"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
        id="Direccion"
        v-model="form.Direccion"
        :clearable="!isReadonly"
        label="Dirección"
        name="Direccion"
        prepend-inner-icon="mdi-map-marker-outline"
        :readonly="isReadonly"
        :rules="[rules.required]"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { toRefs } from 'vue'
  import { rules } from '@/shared/utils/validationRules'

  const emit = defineEmits(['departamento-change', 'municipio-change'])

  const props = defineProps({
    form: { type: Object, required: true },
    ui: { type: Object, required: true },
    departamentos: { type: Array, default: () => [] },
    municipios: { type: Array, default: () => [] },
    centrosPoblados: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
    loadingMunicipios: { type: Boolean, default: false },
    loadingCentrosPoblados: { type: Boolean, default: false },
  })

  const {
    form,
    ui,
    departamentos,
    municipios,
    centrosPoblados,
    isReadonly,
    loadingMunicipios,
    loadingCentrosPoblados,
  } = toRefs(props)

  const onDepartamentoChange = (value) => emit('departamento-change', value)
  const onMunicipioChange = (value) => emit('municipio-change', value)
</script>
