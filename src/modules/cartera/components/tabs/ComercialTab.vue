<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="8">
      <v-select
        v-model="form.IdListaPrecio"
        name="IdListaPrecio"
        id="IdListaPrecio"
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
        id="Plazo"
        label="Plazo (días)"
        prepend-inner-icon="mdi-calendar-clock-outline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        @keydown="blockKey ($event, allow.onlyDigits)"
        :clearable="!isReadonly"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="form.CupoCredito"
        name="CupoCredito"
        id="CupoCredito"
        label="Cupo Crédito"
        prepend-inner-icon="mdi-currency-usd"
        @keydown="blockKey ($event, allow.decimal)"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { toRefs, watch } from "vue";
import { formatCOP } from "@/shared/utils/formatCurrency";
import { rules } from "@/shared/utils/validationRules";
import { allow, blockKey  } from "@/shared/utils/inputKeyFilter";

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
  },
);
</script>
