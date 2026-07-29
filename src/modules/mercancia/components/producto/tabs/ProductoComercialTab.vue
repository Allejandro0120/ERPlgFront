<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="8">
      <v-text-field
        id="NombreComercial"
        v-model="form.NombreComercial"
        :clearable="!isReadonly"
        label="Nombre Comercial"
        maxlength="200"
        name="NombreComercial"
        prepend-inner-icon="mdi-storefront-outline"
        :readonly="isReadonly"
      />
    </v-col>

    <v-col cols="12" sm="4">
      <div class="d-flex align-start ga-2">
        <v-autocomplete
          id="IdTarifaIVA"
          v-model="form.IdTarifaIVA"
          :clearable="!isReadonly && !isEditing"
          item-title="display"
          item-value="IdTarifaIVA"
          :items="tarifasIVA"
          label="Tarifa IVA"
          name="IdTarifaIVA"
          prepend-inner-icon="mdi-percent"
          :readonly="isReadonly || isEditing"
          required
          :rules="[rules.required]"
          style="flex: 1"
        />
        <v-tooltip v-if="!isReadonly" location="top" text="Agregar tarifa IVA">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              density="comfortable"
              icon="mdi-plus"
              style="margin-top: 4px; flex-shrink: 0"
              variant="tonal"
              @click="dialogTarifaIVA = true"
            />
          </template>
        </v-tooltip>
      </div>
    </v-col>

    <v-col cols="12" sm="3">
      <v-text-field
        v-model="form.CantidadEmbalaje"
        :clearable="!isReadonly"
        label="Cantidad Embalaje"
        min="0"
        prepend-inner-icon="mdi-package-variant"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
        @keydown="blockKey($event, allow.onlyDigits)"
        @paste="blockPaste($event, allow.onlyDigits)"
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-text-field
        v-model="form.FactorConversion"
        :clearable="!isReadonly"
        label="Factor Conversión"
        min="0"
        prepend-inner-icon="mdi-arrow-left-right"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
        @keydown="blockKey($event, allow.onlyDigits)"
        @paste="blockPaste($event, allow.onlyDigits)"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <div class="d-flex align-start ga-2">
        <v-autocomplete
          id="IdPresentacion"
          v-model="form.IdPresentacion"
          :clearable="!isReadonly && !isEditing"
          item-title="display"
          item-value="IdPresentacion"
          :items="presentaciones"
          label="Presentación"
          name="IdPresentacion"
          prepend-inner-icon="mdi-package-variant-closed"
          :readonly="isReadonly || isEditing"
          required
          :rules="[rules.required]"
          style="flex: 1"
        />
        <v-tooltip v-if="!isReadonly" location="top" text="Agregar presentación">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              density="comfortable"
              icon="mdi-plus"
              style="margin-top: 4px; flex-shrink: 0"
              variant="tonal"
              @click="dialogPresentacion = true"
            />
          </template>
        </v-tooltip>
      </div>
    </v-col>

    <v-col cols="12" sm="3">
      <v-switch
        v-model="form.HabilitadoCompras"
        base-color="grey-lighten-1"
        color="primary"
        density="comfortable"
        false-icon="mdi-close"
        inset
        label="Habilitado Compras"
        :readonly="isReadonly || isEditing"
        true-icon="mdi-check"
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-switch
        v-model="form.HabilitadoVentas"
        base-color="grey-lighten-1"
        color="primary"
        density="comfortable"
        false-icon="mdi-close"
        inset
        label="Habilitado Ventas"
        :readonly="isReadonly || isEditing"
        true-icon="mdi-check"
      />
    </v-col>
    <presentacion-form-dialog v-model="dialogPresentacion" @created="emit('reload-presentacion')" />
    <tarifa-i-v-a-form-dialog v-model="dialogTarifaIVA" @created="emit('reload-tarifa-iva')" />
  </v-row>
</template>

<script setup>
  import { ref, toRefs } from 'vue'
  import PresentacionFormDialog from '@/modules/mercancia/components/producto/creacion/PresentacionFormDialog.vue'
  import TarifaIVAFormDialog from '@/modules/mercancia/components/producto/creacion/TarifaIVAFormDialog.vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
    isEditing: { type: Boolean, default: false },
    tarifasIVA: { type: Array, default: () => [] },
    presentaciones: { type: Array, default: () => [] },
  })

  const { form } = toRefs(props)
  const dialogPresentacion = ref(false)
  const dialogTarifaIVA = ref(false)
  const emit = defineEmits(['reload-presentacion', 'reload-tarifa-iva'])
</script>
