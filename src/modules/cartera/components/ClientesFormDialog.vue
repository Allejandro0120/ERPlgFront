<template>
  <base-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="dialogIcon"
    color="primary"
    :label-confirm="labelConfirm"
    :show-actions="!isReadonly"
    max-width="1000"
    @update:model-value="emit('update:modelValue', $event)"
    @accept="submitForm"
  >
    <template #content>
      <v-form ref="formRef">
        <!-- ── Tabs ──────────────────────────────────────────── -->
        <v-tabs v-model="ui.tab" color="primary" class="mb-6">
          <v-tab value="identificacion">
            <v-icon start icon="mdi-card-account-details-outline" />
            Identificación
            <v-badge
              v-if="tabErrors.identificacion"
              color="error"
              dot
              inline
              class="ml-2"
            />
          </v-tab>
          <v-tab value="ubicacion">
            <v-icon start icon="mdi-map-marker-outline" />
            Ubicación
            <v-badge
              v-if="tabErrors.ubicacion"
              color="error"
              dot
              inline
              class="ml-2"
            />
          </v-tab>
          <v-tab value="comercial">
            <v-icon start icon="mdi-tag-outline" />
            Comercial
            <v-badge
              v-if="tabErrors.comercial"
              color="error"
              dot
              inline
              class="ml-2"
            />
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <!-- ── Tab 1: Identificación ─────────────────────── -->
          <v-tabs-window-item value="identificacion" eager>
            <v-row class="mt-2">
              <v-col cols="12" sm="5">
                <v-select
                  v-model="form.IdTipoDocumento"
                  name="IdTipoDocumento"
                  label="Tipo de Documento"
                  :items="tipoDocumentos"
                  item-title="display"
                  item-value="Id"
                  prepend-inner-icon="mdi-card-account-details-outline"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
                />
              </v-col>

              <v-col cols="12" sm="7">
                <!-- Tecla a tecla: solo dígitos y guion. Si pega: rule valida -->
                <v-text-field
                  v-model="form.NumeroIdentificacion"
                  name="NumeroIdentificacion"
                  label="Número de Identificación"
                  prepend-inner-icon="mdi-numeric"
                  :rules="[rules.required, rules.soloDigitosGuion]"
                  :readonly="isReadonly"
                  @keydown="bloquear($event, allow.idGuion)"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="form.Nombre"
                  name="Nombre"
                  label="Nombre o Razón Social"
                  prepend-inner-icon="mdi-domain"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
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
                  prepend-inner-icon="mdi-briefcase-outline"
                  clearable
                  :readonly="isReadonly"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.CorreoGeneral"
                  name="CorreoGeneral"
                  label="Correo Electrónico"
                  type="email"
                  prepend-inner-icon="mdi-email-outline"
                  :rules="[rules.required, rules.email]"
                  :readonly="isReadonly"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <!-- Solo dígitos -->
                <v-text-field
                  v-model="form.Telefono"
                  name="Telefono"
                  label="Teléfono"
                  prepend-inner-icon="mdi-phone-outline"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
                  @keydown="bloquear($event, allow.soloDigitos)"
                />
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <!-- ── Tab 2: Ubicación ───────────────────────────── -->
          <v-tabs-window-item value="ubicacion" eager>
            <v-row class="mt-2">
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
                  @update:model-value="onDepartamentoChange"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="ui.idMunicipio"
                  name="idMunicipio"
                  label="Municipio"
                  :items="municipios"
                  item-title="NombreMunicipio"
                  item-value="IdMunicipio"
                  prepend-inner-icon="mdi-city-variant-outline"
                  :disabled="!ui.idDepartamento || isReadonly"
                  :loading="loadingMunicipios"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
                  @update:model-value="onMunicipioChange"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-autocomplete
                  v-model="form.IdCentroPoblado"
                  name="IdCentroPoblado"
                  label="Centro Poblado"
                  :items="centrosPoblados"
                  item-title="NombreCentroPoblado"
                  item-value="IdCentroPoblado"
                  prepend-inner-icon="mdi-home-group"
                  :disabled="!ui.idMunicipio || isReadonly"
                  :loading="loadingCentrosPoblados"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="form.Direccion"
                  name="Direccion"
                  label="Dirección"
                  prepend-inner-icon="mdi-map-marker-outline"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
                />
              </v-col>
            </v-row>
          </v-tabs-window-item>

          <!-- ── Tab 3: Comercial ───────────────────────────── -->
          <v-tabs-window-item value="comercial" eager>
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
                />
              </v-col>

              <v-col cols="12" sm="4">
                <!-- Solo dígitos -->
                <v-text-field
                  v-model.number="form.Plazo"
                  name="Plazo"
                  label="Plazo (días)"
                  prepend-inner-icon="mdi-calendar-clock-outline"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
                  @keydown="bloquear($event, allow.soloDigitos)"
                />
              </v-col>

              <v-col cols="12">
                <!-- Dígitos, punto decimal y coma -->
                <v-text-field
                  v-model="form.CupoCredito"
                  name="CupoCredito"
                  label="Cupo Crédito"
                  prepend-inner-icon="mdi-currency-usd"
                  @keydown="bloquear($event, allow.decimal)"
                  :rules="[rules.required]"
                  :readonly="isReadonly"
                />
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import { globalService } from "@/api/services/globalService";
import { formatCOP, parseCOP } from "@/shared/utils/currency";

// ─── Props & Emits ────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: 'create',
    validator: (v) => ['create', 'edit', 'view'].includes(v)
  },
  cliente: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(["update:modelValue", "submit"]);

// ─── Computed del Modal ───────────────────────────────────────────────────────
const isReadonly = computed(() => props.mode === 'view');
const isEditing  = computed(() => props.mode === 'edit');
const isCreating = computed(() => props.mode === 'create');

const dialogTitle = computed(() => ({
  create: 'Crear Cliente',
  edit:   'Editar Cliente',
  view:   'Detalle del Cliente',
}[props.mode]));

const dialogIcon = computed(() => ({
  create: 'mdi-account-plus',
  edit:   'mdi-account-edit',
  view:   'mdi-card-account-details-outline',
}[props.mode]));

const labelConfirm = computed(() => ({
  create: 'Crear Cliente',
  edit:   'Guardar Cambios',
  view:   '',
}[props.mode]));

// ─── Estado ───────────────────────────────────────────────────────────────────
const formRef = ref(null);
const tipoDocumentos = ref([]);
const listaPrecios = ref([]);
const actividadesCiiu = ref([]);
const departamentos = ref([]);
const municipios = ref([]);
const centrosPoblados = ref([]);

const loadingMunicipios = ref(false);
const loadingCentrosPoblados = ref(false);


const formInitial = {
  IdTipoDocumento: null,
  NumeroIdentificacion: "",
  Nombre: "",
  CorreoGeneral: "",
  Telefono: "",
  IdListaPrecio: null,
  Plazo: null,
  CupoCredito: null,
  Direccion: "",
  CIIU: null,
  IdCentroPoblado: null,
};

const uiInitial = {
  tab: "identificacion",
  idDepartamento: null,
  idMunicipio: null,
};

const form = ref({ ...formInitial });
const ui = ref({ ...uiInitial });

// ─── Bloqueo de teclas
const CONTROL_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Escape",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

const allow = {
  soloDigitos: /^[0-9]$/, // Teléfono, Plazo
  idGuion: /^[0-9\-]$/, // Número de identificación: dígitos y guion
  decimal: /^[0-9.,]$/, // Cupo crédito: dígitos, punto y coma
};

const bloquear = (event, pattern) => {
  if (CONTROL_KEYS.has(event.key) || event.ctrlKey || event.metaKey) return;
  if (!pattern.test(event.key)) event.preventDefault();
};

// ─── Mapa campo → tab ─────────────────────────────────────────────────────────
const campoATab = {
  IdTipoDocumento: "identificacion",
  NumeroIdentificacion: "identificacion",
  Nombre: "identificacion",
  CorreoGeneral: "identificacion",
  Telefono: "identificacion",
  idDepartamento: "ubicacion",
  idMunicipio: "ubicacion",
  IdCentroPoblado: "ubicacion",
  Direccion: "ubicacion",
  IdListaPrecio: "comercial",
  Plazo: "comercial",
  CupoCredito: "comercial",
};

// ─── tabErrors: computed reactivo sobre formRef.value.errors ──────────────────
const tabErrors = computed(() => {
  const result = { identificacion: false, ubicacion: false, comercial: false };
  if (!formRef.value) return result;
  for (const { id } of formRef.value.errors ?? []) {
    const tab = campoATab[id];
    if (tab) result[tab] = true;
  }
  return result;
});

// ─── CIIU con opción N/A ──────────────────────────────────────────────────────
const ciuuConNa = computed(() => [
  { display: "N/A", Codigo: null },
  ...actividadesCiiu.value,
]);

// ─── Reglas de validación ─────────────────────────────────────────────────────
const rules = {
  required: (v) => {
    if (typeof v === "string")
      return (v && v.trim().length > 0) || "Este campo es obligatorio";
    return (
      (v !== null && v !== undefined && v !== "") || "Este campo es obligatorio"
    );
  },
  email: (v) => /.+@.+\..+/.test(v) || "Correo no válido",

  // Valida que el valor solo contenga dígitos y guion.
  // Se activa cuando el usuario pega texto con caracteres no permitidos.
  soloDigitosGuion: (v) =>
    !v || /^[0-9\-]+$/.test(v) || "Solo se permiten números y guion ( - )",
};

// ─── Cargar datos iniciales ───────────────────────────────────────────────────
const cargarTiposDocumentos = async () => {
  const response = await globalService.getTiposDocumentos();
  if (response.data?.success) {
    tipoDocumentos.value = (response.data.data || []).map((item) => ({
      ...item,
      display: `${item.Codigo} - ${item.Nombre}`,
    }));
  }
};

const cargarListaPrecios = async () => {
  const response = await globalService.getListasPrecios();
  if (response.data?.success) {
    listaPrecios.value = (response.data.data || []).map((item) => ({
      ...item,
      display: item.NombreLista,
    }));
  }
};

const cargarActividadCiiu = async () => {
  const response = await globalService.getActividadesCiiu();
  if (response.data?.success) {
    actividadesCiiu.value = (response.data.data || []).map((item) => ({
      ...item,
      display: `${item.Codigo} - ${item.Descripcion}`,
    }));
  }
};

const cargarDepartamentos = async () => {
  const response = await globalService.getDepartamentos();
  if (response.data?.success) {
    departamentos.value = response.data.data || [];
  }
};

// ─── Handlers de ubicación en cascada ────────────────────────────────────────
const onDepartamentoChange = async (idDepartamento) => {
  ui.value.idMunicipio = null;
  form.value.IdCentroPoblado = null;
  municipios.value = [];
  centrosPoblados.value = [];

  if (!idDepartamento) return;

  loadingMunicipios.value = true;
  try {
    const response =
      await globalService.getMunicipiosByDepartamento(idDepartamento);
    if (response.data?.success) municipios.value = response.data.data || [];
  } catch (error) {
    console.error("Error al cargar municipios:", error);
  } finally {
    loadingMunicipios.value = false;
  }
};

const onMunicipioChange = async (idMunicipio) => {
  form.value.IdCentroPoblado = null;
  centrosPoblados.value = [];

  if (!idMunicipio) return;

  loadingCentrosPoblados.value = true;
  try {
    const response =
      await globalService.getCentrosPobladosByMunicipio(idMunicipio);
    if (response.data?.success) {
      const data = response.data.data || [];
      centrosPoblados.value = data;
      if (data.length === 1)
        form.value.IdCentroPoblado = data[0].IdCentroPoblado;
    }
  } catch (error) {
    console.error("Error al cargar centros poblados:", error);
  } finally {
    loadingCentrosPoblados.value = false;
  }
};

// ─── Watch: cargar datos cuando el modal abre, resetear cuando cierra ─────────
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      resetForm();
      return;
    }

    $loading.show();
    try {
      await Promise.all([
        cargarTiposDocumentos(),
        cargarListaPrecios(),
        cargarActividadCiiu(),
        cargarDepartamentos(),
      ]);

      if (props.cliente && !isCreating.value) {
        await precargarCliente(props.cliente);
      }
    } catch (error) {
      console.error("Error al cargar datos del formulario:", error);
    } finally {
      $loading.hide();
    }
  },
);

async function precargarCliente(cliente) {
  // Primero cargar cascada de ubicación si es que el cliente tiene departamento.
  // Suponiendo que el cliente viene con IdDepartamento e IdMunicipio
  if (cliente.IdDepartamento) {
    ui.value.idDepartamento = cliente.IdDepartamento;
    await onDepartamentoChange(cliente.IdDepartamento);
  }
  if (cliente.IdMunicipio) {
    ui.value.idMunicipio = cliente.IdMunicipio;
    await onMunicipioChange(cliente.IdMunicipio);
  }

  // Luego asignar el resto del form
  form.value = {
    IdTipoDocumento:      cliente.IdTipoDocumento,
    NumeroIdentificacion: cliente.NumeroIdentificacion,
    Nombre:               cliente.Nombre,
    CorreoGeneral:        cliente.CorreoGeneral,
    Telefono:             cliente.Telefono,
    IdListaPrecio:        cliente.IdListaPrecio,
    Plazo:                cliente.Plazo,
    CupoCredito:          formatCOP(cliente.CupoCredito),
    Direccion:            cliente.Direccion,
    CIIU:                 cliente.CIIU,
    IdCentroPoblado:      cliente.IdCentroPoblado,
  };
}

// ─── Reset ────────────────────────────────────────────────────────────────────
const resetForm = () => {
  form.value = { ...formInitial };
  ui.value = { ...uiInitial };
  municipios.value = [];
  centrosPoblados.value = [];
  formRef.value?.resetValidation();
};

// ─── Validación: una sola pasada ──────────────────────────────────────────────
const validarTodosLosTabs = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid) {
    const primerTabConError = Object.keys(tabErrors.value).find(
      (k) => tabErrors.value[k],
    );
    if (primerTabConError) ui.value.tab = primerTabConError;
  }

  return valid;
};

// ─── Watch para formatear CupoCredito moneda ──────────────────────────────
watch(
  () => form.value.CupoCredito,
  (val) => {
    const formatted = formatCOP(val);
    if (val !== formatted) {
      form.value.CupoCredito = formatted;
    }
  }
);

// ─── Submit ───────────────────────────────────────────────────────────────────
const submitForm = async () => {
  const esValido = await validarTodosLosTabs();

  if (!esValido) {
    $toast.error("Por favor corrige los errores en los campos marcados");
    return;
  }

  // Preparar payload: convertir formato moneda a número
  const payload = { ...form.value };
  if (payload.CupoCredito) {
    payload.CupoCredito = parseCOP(payload.CupoCredito);
  }

  emit("submit", { payload, mode: props.mode });
};
</script>
