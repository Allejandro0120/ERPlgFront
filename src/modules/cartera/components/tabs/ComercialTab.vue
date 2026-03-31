<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="8">
      <v-select
        v-model="form.IdListaPrecio"
        name="IdListaPrecio"
        label="Lista de Precios"
        :items="listaPrecios"
        item-title="display"
        item-value="IdListaPrecio"
        prepend-inner-icon="mdi-tag-outline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        v-model.number="form.Plazo"
        name="Plazo"
        label="Plazo (días)"
        prepend-inner-icon="mdi-calendar-clock-outline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        @keydown="bloquear($event, allow.soloDigitos)"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="form.CupoCredito"
        name="CupoCredito"
        label="Cupo Crédito"
        prepend-inner-icon="mdi-currency-usd"
        @keydown="bloquear($event, allow.decimal)"
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
  listaPrecios: { type: Array, default: () => [] },
  rules: { type: Object, required: true },
  isReadonly: { type: Boolean, default: false },
  allow: { type: Object, required: true },
  bloquear: { type: Function, required: true },
});

const { form, listaPrecios, rules, isReadonly, allow, bloquear } = toRefs(props);
</script>
