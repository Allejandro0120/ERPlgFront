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
        :prepend-inner-icon="mdiCardAccountDetailsOutline"
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
        :prepend-inner-icon="mdiNumeric"
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
        :prepend-inner-icon="mdiDomain"
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
        :prepend-inner-icon="mdiBriefcaseOutline"
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
        :prepend-inner-icon="mdiEmailOutline"
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
        :prepend-inner-icon="mdiPhoneOutline"
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
        :items="estadosConColor"
        item-title="Nombre"
        item-value="Id"
        :prepend-inner-icon="mdiAccountBadgeOutline"
        :rules="[rules.required]"
        :readonly="isReadonly"
        :clearable="!isReadonly"
      >
        <template #selection="{ item }">
          <v-chip label class="estado-chip" :color="item.color" variant="tonal">
            <v-icon
              icon="$circle"
              :color="item.color"
              start
              size="10"
              class="ml-1"
            />
            {{ item.Nombre }}
          </v-chip>
        </template>

        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps" title="">
            <v-chip label :color="item.color" variant="tonal">
              <v-icon
                icon="$circle"
                :color="item.color"
                start
                size="10"
                class="ml-1"
              />
              {{ item.Nombre }}
            </v-chip>
          </v-list-item>
        </template>
      </v-select>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, toRefs } from "vue";
import { getEstadoColor, DOMINIOS_ESTADO } from "@/shared/utils/estadoColors";
import { rules } from "@/shared/utils/formRules";
import { allow, bloquear } from "@/shared/utils/inputHelpers";
import { mdiCardAccountDetailsOutline, mdiNumeric, mdiDomain, mdiBriefcaseOutline, mdiEmailOutline, mdiPhoneOutline, mdiAccountBadgeOutline } from "@mdi/js";

const props = defineProps({
  form: { type: Object, required: true },
  tipoDocumentos: { type: Array, default: () => [] },
  ciuuConNa: { type: Array, default: () => [] },
  estadosCatalogo: { type: Array, default: () => [] },
  isReadonly: { type: Boolean, default: false },
  showEstado: { type: Boolean, default: false },
});
const {
  form,
  tipoDocumentos,
  ciuuConNa,
  estadosCatalogo,
  isReadonly,
  showEstado,
} = toRefs(props);

const estadosConColor = computed(() =>
  (estadosCatalogo.value || []).map((estado) => ({
    ...estado,
    color: getEstadoColor(estado.Nombre, DOMINIOS_ESTADO.CLIENTE),
  })),
);
</script>
