<template>
  <v-row class="mt-2">
    <v-col cols="12">
      <v-text-field
        id="Nombre"
        v-model="form.Nombre"
        :hint="isReadonly ? '' : 'El nombre del producto se genera automáticamente.'"
        label="Nombre"
        name="Nombre"
        prepend-inner-icon="mdi-tag-text-outline"
        readonly
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-text-field
        id="CodigoProducto"
        v-model="form.CodigoProducto"
        :clearable="!isReadonly"
        label="Código"
        maxlength="50"
        name="CodigoProducto"
        prepend-inner-icon="mdi-identifier"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
        @keydown="blockKey($event, allow.alphanumericDash)"
        @paste="blockPaste($event, allow.alphanumericDash)"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-text-field
        id="CodigoBarras"
        v-model="form.CodigoBarras"
        :clearable="!isReadonly"
        label="Código de Barras"
        :max-length="100"
        name="CodigoBarras"
        prepend-inner-icon="mdi-barcode"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
        @keydown="blockKey($event, allow.alphanumericDash)"
        @paste="blockPaste($event, allow.alphanumericDash)"
      />
    </v-col>

    <v-col cols="12" sm="2">
      <v-switch
        v-model="form.Activo"
        base-color="grey-lighten-1"
        color="primary"
        density="comfortable"
        false-icon="mdi-close"
        hide-details
        inset
        label="Activo"
        :readonly="isReadonly || isEditing"
        true-icon="mdi-check"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { toRefs } from 'vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
    isEditing: { type: Boolean, default: false },
  })
  const { form } = toRefs(props)
</script>
