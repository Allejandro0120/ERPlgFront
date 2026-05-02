<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="8">
      <v-select
        id="IdListaPrecio"
        v-model="form.IdListaPrecio"
        :clearable="!isReadonly"
        item-title="display"
        item-value="IdListaPrecio"
        :items="listaPrecios"
        label="Lista de Precios"
        name="IdListaPrecio"
        prepend-inner-icon="mdi-tag-outline"
        :readonly="isReadonly"
        :rules="[rules.required]"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        id="Plazo"
        v-model.number="form.Plazo"
        :clearable="!isReadonly"
        label="Plazo (días)"
        name="Plazo"
        prepend-inner-icon="mdi-calendar-clock-outline"
        :readonly="isReadonly"
        :rules="[rules.required]"
        @keydown="blockKey($event, allow.onlyDigits)"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
        id="CupoCredito"
        v-model="form.CupoCredito"
        :clearable="!isReadonly"
        label="Cupo Crédito"
        name="CupoCredito"
        prepend-inner-icon="mdi-currency-usd"
        :readonly="isReadonly"
        :rules="[rules.required]"
        @keydown="blockKey($event, allow.decimal)"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { toRefs, watch } from 'vue'
  import { formatCOP } from '@/shared/utils/formatCurrency'
  import { allow, blockKey } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    listaPrecios: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
  })

  const { form, listaPrecios, isReadonly } = toRefs(props)

  watch(
    () => form.value.CupoCredito,
    (val) => {
      const formatted = formatCOP(val)
      if (val !== formatted) form.value.CupoCredito = formatted
    },
  )
</script>
