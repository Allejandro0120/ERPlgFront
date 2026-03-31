<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="5">
      <v-select
        v-model="form.IdTipoDocumento"
        name="IdTipoDocumento"
        label="Tipo de Documento"
        :items="tipoDocumentos"
        item-title="display"
        item-value="IdTipoDocumento"
        prepend-inner-icon="mdi-card-account-details-outline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="7">
      <v-text-field
        v-model="form.NumeroIdentificacion"
        name="NumeroIdentificacion"
        label="Número de Identificación"
        prepend-inner-icon="mdi-numeric"
        :rules="[rules.required, rules.soloDigitosGuion]"
        :readonly="isReadonly"
        @keydown="bloquear($event, allow.idGuion)"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="form.Nombre"
        name="Nombre"
        label="Nombre o Razón Social"
        prepend-inner-icon="mdi-domain"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12">
      <v-autocomplete
        v-model="form.CIIU"
        name="CIIU"
        label="Actividad CIIU"
        :items="ciuuConNa"
        item-title="display"
        item-value="Codigo"
        prepend-inner-icon="mdi-briefcase-outline"
        :clearable="!isReadonly"
        :readonly="isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="form.CorreoGeneral"
        name="CorreoGeneral"
        label="Correo Electrónico"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        :rules="[rules.required, rules.email]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="form.Telefono"
        name="Telefono"
        label="Teléfono"
        prepend-inner-icon="mdi-phone-outline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        @keydown="bloquear($event, allow.soloDigitos)"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col v-if="showEstado" cols="12" sm="6">
      <v-select
        v-model="form.Estado"
        name="Estado"
        label="Estado"
        :items="estadosCatalogo"
        item-title="Nombre"
        item-value="Id"
        prepend-inner-icon="mdi-circle"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { toRefs } from "vue";

const props = defineProps({
  form: { type: Object, required: true },
  tipoDocumentos: { type: Array, default: () => [] },
  ciuuConNa: { type: Array, default: () => [] },
  estadosCatalogo: { type: Array, default: () => [] },
  rules: { type: Object, required: true },
  isReadonly: { type: Boolean, default: false },
  showEstado: { type: Boolean, default: false },
  allow: { type: Object, required: true },
  bloquear: { type: Function, required: true },
});

const { form, tipoDocumentos, ciuuConNa, estadosCatalogo, rules, isReadonly, showEstado, allow, bloquear } =
  toRefs(props);
</script>
