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
        :prepend-inner-icon="mdiMapOutline"
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
        :prepend-inner-icon="mdiCityVariantOutline"
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
        :prepend-inner-icon="mdiHomeGroup"
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
        :prepend-inner-icon="mdiMapMarkerOutline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { mdiMapOutline, mdiCityVariantOutline, mdiHomeGroup, mdiMapMarkerOutline } from "@mdi/js";
import { toRefs } from "vue";
import { rules } from "@/shared/utils/formRules";

const emit = defineEmits(["departamento-change", "municipio-change"]);

const props = defineProps({
  form: { type: Object, required: true },
  ui: { type: Object, required: true },
  departamentos: { type: Array, default: () => [] },
  municipios: { type: Array, default: () => [] },
  centrosPoblados: { type: Array, default: () => [] },
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
  isReadonly,
  loadingMunicipios,
  loadingCentrosPoblados,
} = toRefs(props);

const onDepartamentoChange = (value) => emit("departamento-change", value);
const onMunicipioChange = (value) => emit("municipio-change", value);
</script>
