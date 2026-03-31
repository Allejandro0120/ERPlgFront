<template>
  <v-row class="mt-2">
    <v-col cols="12">
      <v-autocomplete
        v-model="ui.idDepartamento"
        name="idDepartamento"
        label="Departamento"
        :items="departamentos"
        item-title="NombreDepartamento"
        item-value="IdDepartamento"
        prepend-inner-icon="mdi-map-outline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        @update:model-value="onDepartamentoChange"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-autocomplete
        v-model="ui.idMunicipio"
        name="idMunicipio"
        label="Municipio"
        :items="municipios"
        item-title="NombreMunicipio"
        item-value="IdMunicipio"
        prepend-inner-icon="mdi-city-variant-outline"
        :disabled="!ui.idDepartamento"
        :loading="loadingMunicipios"
        :rules="[rules.required]"
        :readonly="isReadonly"
        @update:model-value="onMunicipioChange"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-autocomplete
        v-model="form.IdCentroPoblado"
        name="IdCentroPoblado"
        label="Centro Poblado"
        :items="centrosPoblados"
        item-title="NombreCentroPoblado"
        item-value="IdCentroPoblado"
        prepend-inner-icon="mdi-home-group"
        :disabled="!ui.idMunicipio"
        :loading="loadingCentrosPoblados"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="form.Direccion"
        name="Direccion"
        label="Dirección"
        prepend-inner-icon="mdi-map-marker-outline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { toRefs } from "vue";

const emit = defineEmits(["departamento-change", "municipio-change"]);

const props = defineProps({
  form: { type: Object, required: true },
  ui: { type: Object, required: true },
  departamentos: { type: Array, default: () => [] },
  municipios: { type: Array, default: () => [] },
  centrosPoblados: { type: Array, default: () => [] },
  rules: { type: Object, required: true },
  isReadonly: { type: Boolean, default: false },
  loadingMunicipios: { type: Boolean, default: false },
  loadingCentrosPoblados: { type: Boolean, default: false },
});

const {
  form,
  ui,
  departamentos,
  municipios,
  centrosPoblados,
  rules,
  isReadonly,
  loadingMunicipios,
  loadingCentrosPoblados,
} = toRefs(props);

const onDepartamentoChange = (value) => emit("departamento-change", value);
const onMunicipioChange = (value) => emit("municipio-change", value);
</script>
