<template>
  <base-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="dialogIcon"
    color="primary"
    :label-confirm="labelConfirm"
    :show-actions="!isReadonly"
    max-width="800"
    @update:model-value="onRequestClose"
    @accept="submitForm"
    :disable-confirm="isEditing && !hasChanges"
  >
    <template #content>
      <v-form ref="formRef">
        <v-row class="mt-1">
          <!-- Nombre -->
          <v-col cols="12">
            <v-text-field
              v-model="form.NombreSucursal"
              name="NombreSucursal"
              label="Nombre de la Sucursal"
              prepend-inner-icon="mdi-store-outline"
              :rules="[rules.required]"
              :readonly="isReadonly"
              :clearable="!isReadonly"
            />
          </v-col>

          <!-- Teléfono -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.Telefono"
              name="Telefono"
              label="Teléfono"
              prepend-inner-icon="mdi-phone-outline"
              :rules="[rules.required]"
              :readonly="isReadonly"
              :clearable="!isReadonly"
              @keydown="bloquear($event, allow.soloDigitos)"
            />
          </v-col>

          <!-- Correo -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.CorreoGeneral"
              name="CorreoGeneral"
              label="Correo Electrónico"
              type="email"
              prepend-inner-icon="mdi-email-outline"
              :rules="[rules.required, rules.email]"
              :readonly="isReadonly"
              :clearable="!isReadonly"
            />
          </v-col>

          <!-- Departamento -->
          <v-col cols="12">
            <v-autocomplete
              v-model="ui.idDepartamento"
              name="idDepartamento"
              label="Departamento"
              :items="departamentos"
              item-title="NombreDepartamento"
              item-value="IdDepartamento"
              prepend-inner-icon="mdi-map-outline"
              :rules="[rules.required]"
              :readonly="isReadonly"
              :clearable="!isReadonly"
              @update:model-value="onDepartamentoChange"
            />
          </v-col>

          <!-- Municipio -->
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="ui.idMunicipio"
              name="idMunicipio"
              label="Municipio"
              :items="municipios"
              item-title="NombreMunicipio"
              item-value="IdMunicipio"
              prepend-inner-icon="mdi-city-variant-outline"
              :disabled="!ui.idDepartamento"
              :loading="loadingMunicipios"
              :rules="[rules.required]"
              :readonly="isReadonly"
              :clearable="!isReadonly"
              @update:model-value="onMunicipioChange"
            />
          </v-col>

          <!-- Centro Poblado -->
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="form.IdCentroPoblado"
              name="IdCentroPoblado"
              label="Centro Poblado"
              :items="centrosPoblados"
              item-title="NombreCentroPoblado"
              item-value="IdCentroPoblado"
              prepend-inner-icon="mdi-home-group"
              :disabled="!ui.idMunicipio"
              :loading="loadingCentrosPoblados"
              :rules="[rules.required]"
              :readonly="isReadonly"
              :clearable="!isReadonly"
            />
          </v-col>

          <!-- Dirección -->
          <v-col cols="12">
            <v-text-field
              v-model="form.Direccion"
              name="Direccion"
              label="Dirección"
              prepend-inner-icon="mdi-map-marker-outline"
              :rules="[rules.required]"
              :readonly="isReadonly"
              :clearable="!isReadonly"
            />
          </v-col>
          <!-- Estado (solo edición / vista) -->
          <v-col v-if="isEditing || isReadonly" cols="12" sm="6">
            <v-select
              v-model="form.Habilitada"
              name="Habilitada"
              label="Estado"
              :items="opcionesEstado"
              item-title="label"
              item-value="value"
              prepend-inner-icon="mdi-domain"
              :readonly="isReadonly"
            >
              <template #selection="{ item }">
                <v-chip
                  label
                  class="estado-chip"
                  :color="item.color"
                  variant="tonal"
                >
                  <v-icon
                    icon="$circle"
                    :color="item.color"
                    start
                    size="10"
                    class="ml-1"
                  />
                  {{ item.label }}
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
                    {{ item.label }}
                  </v-chip>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import { globalService } from "@/api/services/globalService";
import { $confirm } from "@/plugins/confirm/confirm.js";
import { useConfirmRequestClose } from "@/shared/composables/useConfirmRequestClose";
import { useLocationCascade } from "@/shared/composables/useLocationCascade";
import { getEstadoColor, DOMINIOS_ESTADO } from "@/shared/utils/estadoColors";
import { rules } from "@/shared/utils/formRules";
import { allow, bloquear } from "@/shared/utils/inputHelpers";

// ─── Props & Emits ────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: "create",
    validator: (v) => ["create", "edit", "view"].includes(v),
  },
  sucursal: {
    type: Object,
    default: null,
  },
  departamentos: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

// ─── Computed modo ────────────────────────────────────────────────────────────
const isReadonly = computed(() => props.mode === "view");
const isEditing = computed(() => props.mode === "edit");

const dialogTitle = computed(
  () =>
    ({
      create: "Agregar Sucursal",
      edit: "Editar Sucursal",
      view: "Detalle de Sucursal",
    })[props.mode],
);
const dialogIcon = computed(
  () =>
    ({
      create: 'mdi-store-plus-outline',
      edit: 'mdi-store-edit-outline',
      view: 'mdi-store-outline',
    })[props.mode],
);
const labelConfirm = computed(
  () =>
    ({ create: "Agregar Sucursal", edit: "Guardar Cambios", view: "" })[
      props.mode
    ],
);

// ─── Estado ───────────────────────────────────────────────────────────────────
const formRef = ref(null);

const opcionesEstado = computed(() =>
  [
    { label: "Habilitada", value: true },
    { label: "Deshabilitada", value: false },
  ].map((op) => ({
    ...op,
    color: getEstadoColor(op.value, DOMINIOS_ESTADO.SUCURSAL),
  })),
);
const formInitial = {
  NombreSucursal: "",
  Telefono: "",
  CorreoGeneral: "",
  Direccion: "",
  IdCentroPoblado: null,
  Habilitada: true,
};

const uiInitial = {
  idDepartamento: null,
  idMunicipio: null,
};

const form = ref({ ...formInitial });
const ui = ref({ ...uiInitial });
const formSnapshot = ref(null);

const {
  municipios,
  centrosPoblados,
  loadingMunicipios,
  loadingCentrosPoblados,
  onDepartamentoChange,
  onMunicipioChange,
  preloadLocation,
  resetLocationState,
} = useLocationCascade({
  ui,
  form,
  fetchMunicipios: globalService.getMunicipiosByDepartamento,
  fetchCentrosPoblados: globalService.getCentrosPobladosByMunicipio,
  onError: (error, stage) => {
    console.error(`Error en sucursal (${stage}):`, error);
  },
});

const hasChanges = computed(() => {
  if (!formSnapshot.value) return false;
  return JSON.stringify(form.value) !== JSON.stringify(formSnapshot.value);
});

const { onRequestClose } = useConfirmRequestClose({
  emit,
  isReadonly,
  hasChanges,
  confirmClose: (options) => $confirm.warning(options),
  message:
    "Tienes cambios sin guardar en la sucursal. ¿Deseas salir de todas formas?",
});

// ─── Precarga al editar/ver ───────────────────────────────────────────────────
async function precargarSucursal(suc) {
  await preloadLocation({
    idDepartamento: suc.IdDepartamento ?? null,
    idMunicipio: suc.IdMunicipio ?? null,
    idCentroPoblado: suc.IdCentroPoblado ?? null,
  });

  form.value = {
    NombreSucursal: suc.NombreSucursal ?? "",
    Telefono: suc.Telefono ?? "",
    CorreoGeneral: suc.CorreoGeneral ?? "",
    Direccion: suc.Direccion ?? "",
    IdCentroPoblado: suc.IdCentroPoblado ?? null,
    Habilitada: suc.Habilitada ?? true,
  };

  formSnapshot.value = { ...form.value };
}

// ─── Reset ────────────────────────────────────────────────────────────────────
const resetForm = () => {
  form.value = { ...formInitial };
  ui.value = { ...uiInitial };
  resetLocationState();
  formSnapshot.value = null;
  formRef.value?.resetValidation();
};

// ─── Watch apertura ───────────────────────────────────────────────────────────
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (props.sucursal && props.mode !== "create") {
      $loading.show();
      try {
        await precargarSucursal(props.sucursal);
      } finally {
        $loading.hide();
      }
    } else {
      formSnapshot.value = { ...form.value };
    }
  },
);

// ─── Submit ───────────────────────────────────────────────────────────────────
const submitForm = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) {
    $toast.error("Por favor corrige los errores marcados");
    return;
  }

  // Solo pasamos lo que el padre necesita para construir el objeto local.
  const payload = {
    ...form.value,
    ...(props.sucursal?.IdSucursal ? { IdSucursal: props.sucursal.IdSucursal } : {}),
    IdDepartamento: ui.value.idDepartamento,
    IdMunicipio: ui.value.idMunicipio,
  };

  emit("submit", { payload, mode: props.mode });
};
</script>
