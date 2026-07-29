<template>
  <v-row class="mt-2">
    <v-col cols="12" sm="5">
      <v-select
        id="IdTipoIdentificacion"
        v-model="form.IdTipoIdentificacion"
        :clearable="!isReadonly && !isEditing"
        item-title="display"
        item-value="IdTipoIdentificacion"
        :items="tipoIdentificaciones"
        label="Tipo de Identificación"
        name="IdTipoIdentificacion"
        prepend-inner-icon="mdi-card-account-details-outline"
        :readonly="isReadonly || isEditing"
        required
        :rules="[rules.required]"
      />
    </v-col>
    <v-col cols="12" sm="7">
      <v-text-field
        id="NumeroIdentificacion"
        v-model="form.NumeroIdentificacion"
        :clearable="!isReadonly && !isEditing"
        label="Número de Identificación"
        name="NumeroIdentificacion"
        prepend-inner-icon="mdi-numeric"
        :readonly="isReadonly || isEditing"
        required
        :rules="[rules.required, rules.onlyDigitsGuion]"
        @keydown="blockKey($event, allow.numericWithDash)"
        @paste="blockPaste($event, allow.numericWithDash)"
      />
    </v-col>
    <v-col cols="12">
      <v-text-field
        id="Nombre"
        v-model="form.Nombre"
        :clearable="!isReadonly"
        label="Nombre o Razón Social"
        name="Nombre"
        prepend-inner-icon="mdi-domain"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
      />
    </v-col>
    <v-col cols="12">
      <v-autocomplete
        id="CIIU"
        v-model="form.IdCiiu"
        :clearable="!isReadonly"
        item-title="display"
        item-value="IdCiiu"
        :items="ciuuConNa"
        label="Actividad CIIU"
        name="CIIU"
        prepend-inner-icon="mdi-briefcase-outline"
        :readonly="isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        id="CorreoGeneral"
        v-model="form.CorreoGeneral"
        :clearable="!isReadonly"
        label="Correo Electrónico"
        name="CorreoGeneral"
        prepend-inner-icon="mdi-email-outline"
        :readonly="isReadonly"
        required
        :rules="[rules.required, rules.email]"
        type="email"
        @update:model-value="(val) => (form.CorreoGeneral = val?.toLowerCase())"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        id="Telefono"
        v-model="form.Telefono"
        :clearable="!isReadonly"
        label="Teléfono"
        maxlength="15"
        name="Telefono"
        prepend-inner-icon="mdi-phone-outline"
        :readonly="isReadonly"
        required
        :rules="[
          rules.required,
          rules.numeric,
          rules.minLength(6, 'El teléfono'),
          rules.maxLength(15, 'El teléfono'),
        ]"
        @keydown="blockKey($event, allow.onlyDigits)"
        @paste="blockPaste($event, allow.onlyDigits)"
      />
    </v-col>
    <v-col v-if="showEstado" cols="12" sm="6">
      <v-select
        id="Estado"
        v-model="form.Estado"
        :clearable="!isReadonly"
        item-title="Nombre"
        item-value="IdClienteEstado"
        :items="estadosConColor"
        label="Estado"
        name="Estado"
        prepend-inner-icon="mdi-account-badge-outline"
        :readonly="isReadonly"
        required
        :rules="[rules.required]"
      >
        <template #selection="{ item }">
          <v-chip class="estado-chip" :color="item.color" label variant="tonal">
            <v-icon class="ml-1" :color="item.color" icon="$circle" size="10" start />
            {{ item.Nombre }}
          </v-chip>
        </template>

        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps" title="">
            <v-chip :color="item.color" label variant="tonal">
              <v-icon class="ml-1" :color="item.color" icon="$circle" size="10" start />
              {{ item.Nombre }}
            </v-chip>
          </v-list-item>
        </template>
      </v-select>
    </v-col>
  </v-row>
</template>

<script setup>
  import { computed, toRefs } from 'vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    tipoIdentificaciones: { type: Array, default: () => [] },
    ciuuConNa: { type: Array, default: () => [] },
    estadosCatalogo: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
    isEditing: { type: Boolean, default: false },
    showEstado: { type: Boolean, default: false },
  })
  const {
    form,
    tipoIdentificaciones,
    ciuuConNa,
    estadosCatalogo,
    isReadonly,
    isEditing,
    showEstado,
  } = toRefs(props)

  const estadosConColor = computed(() =>
    (estadosCatalogo.value || []).map((estado) => ({
      ...estado,
      color: getEstadoColor(estado.Nombre, DOMINIOS_ESTADO.CLIENTE),
    })),
  )
</script>
