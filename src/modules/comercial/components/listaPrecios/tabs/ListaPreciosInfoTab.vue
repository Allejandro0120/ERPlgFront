<template>
  <v-row class="mt-2" density="compact">
    <v-col cols="12" sm="4">
      <v-text-field
        id="Codigo"
        v-model="form.Codigo"
        :clearable="!isReadonly"
        label="Código"
        maxlength="20"
        name="Codigo"
        prepend-inner-icon="mdi-barcode"
        :readonly="isReadonly"
        required
        :rules="isReadonly ? [] : [rules.required, rules.maxLength(20, 'El código')]"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="8">
      <v-text-field
        id="NombreLista"
        v-model="form.NombreLista"
        :clearable="!isReadonly"
        label="Nombre de la Lista"
        maxlength="100"
        name="NombreLista"
        prepend-inner-icon="mdi-tag-text"
        :readonly="isReadonly"
        required
        :rules="isReadonly ? [] : [rules.required, rules.maxLength(100, 'El nombre')]"
        variant="outlined"
      />
    </v-col>

    <v-col v-if="!isCreating" cols="12" sm="8">
      <v-text-field
        label="Fecha de Creación"
        :model-value="fechaCreacionDisplay"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" :sm="isCreating ? 12 : 4">
      <v-switch
        v-model="form.Habilitado"
        base-color="grey-lighten-1"
        class="ml-4"
        color="success"
        density="comfortable"
        false-icon="mdi-close"
        :false-value="false"
        hide-details
        inset
        :label="form.Habilitado ? 'Habilitado' : 'Deshabilitado'"
        :readonly="isReadonly"
        true-icon="mdi-check"
        :true-value="true"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { computed, toRefs } from 'vue'
  import { formatDateTime } from '@/shared/utils/dateFormatter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    isCreating: { type: Boolean, default: false },
    isReadonly: { type: Boolean, default: false },
  })

  const { form } = toRefs(props)

  const fechaCreacionDisplay = computed(() =>
    props.form.FechaCreacion ? formatDateTime(props.form.FechaCreacion) : '',
  )
</script>

<style scoped></style>
