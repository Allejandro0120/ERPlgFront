<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="6">
      <v-text-field
        id="ATC"
        v-model="form.ATC"
        :clearable="!isReadonly"
        label="ATC"
        maxlength="50"
        name="ATC"
        prepend-inner-icon="mdi-file-tree"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
        @input="form.ATC = sanitizeInput(form.ATC, allow.alphanumericDashNoAccents)"
        @keydown="blockKey($event, allow.alphanumericDashNoAccents)"
        @paste="blockPaste($event, allow.alphanumericDashNoAccents)"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        id="CUM"
        v-model="form.CUM"
        :clearable="!isReadonly"
        label="CUM"
        maxlength="50"
        name="CUM"
        prepend-inner-icon="mdi-card-text-outline"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
        @input="form.CUM = sanitizeInput(form.CUM, allow.numericWithDash)"
        @keydown="blockKey($event, allow.numericWithDash)"
        @paste="blockPaste($event, allow.numericWithDash)"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        id="INVIMA"
        v-model="form.Invima"
        :clearable="!isReadonly"
        label="INVIMA"
        maxlength="100"
        name="INVIMA"
        prepend-inner-icon="mdi-certificate"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
        @input="form.Invima = sanitizeInput(form.Invima, allow.alphanumericDashNoAccents)"
        @keydown="blockKey($event, allow.alphanumericDashNoAccents)"
        @paste="blockPaste($event, allow.alphanumericDashNoAccents)"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <DatePickerField
        id="VigenciaInvima"
        v-model="form.VigenciaInvima"
        label="Fecha Invima"
        :min="today"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
      />
    </v-col>

    <v-col cols="12" sm="3">
      <v-switch
        v-model="form.Regulado"
        base-color="grey-lighten-1"
        color="orange"
        density="comfortable"
        false-icon="mdi-close"
        inset
        label="Regulado"
        :readonly="isReadonly || isEditing"
        true-icon="mdi-check"
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-switch
        v-model="form.CadenaFrio"
        base-color="grey-lighten-1"
        color="info"
        density="comfortable"
        false-icon="mdi-close"
        inset
        label="Cadena Frío"
        :readonly="isReadonly || isEditing"
        true-icon="mdi-check"
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-switch
        v-model="form.Controlado"
        base-color="grey-lighten-1"
        color="deep-purple"
        density="comfortable"
        false-icon="mdi-close"
        inset
        label="Controlado"
        :readonly="isReadonly || isEditing"
        true-icon="mdi-check"
      />
    </v-col>

    <template v-if="form.Regulado">
      <v-col cols="12" sm="6">
        <v-text-field
          id="ValorTopeRegulado"
          v-model="form.ValorTopeRegulado"
          :clearable="!isReadonly"
          label="Valor Tope Regulación"
          name="ValorTopeRegulado"
          prepend-inner-icon="mdi-currency-usd"
          :readonly="isReadonly"
          required
          :rules="[rules.required, rules.maxCOP(100_000_000_000, 'Valor Tope Regulación')]"
          @input="
            form.ValorTopeRegulado = sanitizeInput(form.ValorTopeRegulado, allow.numericWithDash)
          "
          @keydown="blockKey($event, allow.numericWithDash)"
          @paste="blockPaste($event, allow.numericWithDash)"
        />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          id="ResolucionRegulado"
          v-model="form.ResolucionRegulado"
          :clearable="!isReadonly"
          label="Resolución"
          maxlength="100"
          name="ResolucionRegulado"
          prepend-inner-icon="mdi-file-certificate"
          :readonly="isReadonly"
          required
          :rules="[rules.required, rules.maxLength(100, 'Resolución')]"
          @input="
            form.ResolucionRegulado = sanitizeInput(
              form.ResolucionRegulado,
              allow.alphanumericDashNoAccents,
            )
          "
          @keydown="blockKey($event, allow.alphanumericDashNoAccents)"
          @paste="blockPaste($event, allow.alphanumericDashNoAccents)"
        />
      </v-col>
    </template>
  </v-row>
</template>

<script setup>
  import { computed, toRefs, watch } from 'vue'
  import DatePickerField from '@/shared/ui/fields/DatePickerField.vue'
  import { formatCOP } from '@/shared/utils/currencyFormatter'
  import { allow, blockKey, blockPaste, sanitizeInput } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
    isEditing: { type: Boolean, default: false },
  })
  const { form } = toRefs(props)
  const today = computed(() => new Date())

  watch(
    () => form.value.Regulado,
    (regulado) => {
      if (!regulado) {
        form.value.ValorTopeRegulado = null
        form.value.Resolucion = ''
      }
    },
  )

  watch(
    () => form.value.ValorTopeRegulado,
    (val) => {
      const formatted = formatCOP(val)
      if (val !== formatted) form.value.ValorTopeRegulado = formatted
    },
  )
</script>
