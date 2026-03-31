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
import { toRefs, watch } from "vue";
import { formatCOP } from "@/shared/utils/currency";
import { rules } from "@/shared/utils/formRules";
import { allow, bloquear } from "@/shared/utils/inputHelpers";

const props = defineProps({
  form: { type: Object, required: true },
  listaPrecios: { type: Array, default: () => [] },
  isReadonly: { type: Boolean, default: false },
});

const { form, listaPrecios, isReadonly } = toRefs(props);

watch(
  () => form.value.CupoCredito,
  (val) => {
    const formatted = formatCOP(val);
    if (val !== formatted) form.value.CupoCredito = formatted;
  }
);
</script>
