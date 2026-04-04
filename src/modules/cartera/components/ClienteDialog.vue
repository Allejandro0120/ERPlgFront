<template>
  <base-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="dialogIcon"
    color="primary"
    :label-confirm="labelConfirm"
    :show-actions="!isReadonly"
    max-width="1300"
    @update:model-value="onRequestClose"
    @accept="submitForm"
    :disable-confirm="isEditing && !hasChanges"
  >
    <template #content>
      <!-- ── Dialog hijo: agregar / editar sucursal ────────────── -->
      <sucursal-form-dialog
        v-model="sucursalDialog.open"
        :mode="sucursalDialog.mode"
        :sucursal="sucursalDialog.sucursal"
        :departamentos="departamentos"
        @submit="onSucursalSubmit"
      />

      <v-form ref="formRef">
        <!-- ── Tabs ──────────────────────────────────────────────── -->
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
          <v-tab value="sucursales">
            <v-icon start icon="mdi-store-outline" />
            Sucursales
            <v-chip
              v-if="sucursales.length"
              size="x-small"
              color="primary"
              class="ml-2"
              variant="tonal"
            >
              {{ sucursales.length }}
            </v-chip>
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <!-- ── Tab 1: Identificación ─────────────────────────── -->
          <v-tabs-window-item value="identificacion" eager>
            <identificacion-tab
              :form="form"
              :tipo-documentos="tipoDocumentos"
              :ciuu-con-na="ciuuConNa"
              :estados-catalogo="estadosCatalogo"
              :is-readonly="isReadonly"
              :show-estado="isEditing || isReadonly"
            />
          </v-tabs-window-item>

          <!-- ── Tab 2: Ubicación ───────────────────────────────── -->
          <v-tabs-window-item value="ubicacion" eager>
            <ubicacion-tab
              :form="form"
              :ui="ui"
              :departamentos="departamentos"
              :municipios="municipios"
              :centros-poblados="centrosPoblados"
              :is-readonly="isReadonly"
              :loading-municipios="loadingMunicipios"
              :loading-centros-poblados="loadingCentrosPoblados"
              @departamento-change="onDepartamentoChange"
              @municipio-change="onMunicipioChange"
            />
          </v-tabs-window-item>

          <!-- ── Tab 3: Comercial ───────────────────────────────── -->
          <v-tabs-window-item value="comercial" eager>
            <comercial-tab
              :form="form"
              :lista-precios="listaPrecios"
              :is-readonly="isReadonly"
            />
          </v-tabs-window-item>

          <!-- ── Tab 4: Sucursales ──────────────────────────────── -->
          <v-tabs-window-item value="sucursales" eager>
            <sucursales-tab
              :sucursales="sucursales"
              :is-readonly="isReadonly"
              :headers="sucursalesHeaders"
              :row-actions="sucursalRowActions"
              :departamentos="departamentos"
              @add="abrirAgregarSucursal"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import SucursalFormDialog from "./SucursalFormDialog.vue";
import { globalService } from "@/api/services/globalService";
import { clienteService } from "@/api/services/clienteService";
import { formatCOP, parseCOP } from "@/shared/utils/currency";
import { $confirm } from "@/plugins/confirm/confirm.js";
import IdentificacionTab from "./tabs/IdentificacionTab.vue";
import UbicacionTab from "./tabs/UbicacionTab.vue";
import ComercialTab from "./tabs/ComercialTab.vue";
import SucursalesTab from "./tabs/SucursalesTab.vue";

// ─── Props & Emits ────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: "create",
    validator: (v) => ["create", "edit", "view"].includes(v),
  },
  cliente: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "submit"]);

// ─── Computed modo ────────────────────────────────────────────────────────────
const isReadonly = computed(() => props.mode === "view");
const isEditing = computed(() => props.mode === "edit");
const isCreating = computed(() => props.mode === "create");

const dialogTitle = computed(
  () =>
    ({
      create: "Crear Cliente",
      edit: "Editar Cliente",
      view: "Detalle del Cliente",
    })[props.mode],
);
const dialogIcon = computed(
  () =>
    ({
      create: 'mdi-account-plus',
      edit: 'mdi-account-edit',
      view: 'mdi-card-account-details-outline',
    })[props.mode],
);
const labelConfirm = computed(
  () =>
    ({ create: "Crear Cliente", edit: "Guardar Cambios", view: "" })[
      props.mode
    ],
);

// ─── Estado global ────────────────────────────────────────────────────────────
const formRef = ref(null);
const tipoDocumentos = ref([]);
const listaPrecios = ref([]);
const actividadesCiiu = ref([]);
const departamentos = ref([]);
const municipios = ref([]);
const centrosPoblados = ref([]);
const estadosCatalogo = ref([]);
const loadingMunicipios = ref(false);
const loadingCentrosPoblados = ref(false);

// ─── Sucursales locales ───────────────────────────────────────────────────────
let localSucursalCounter = 0;

function apiSucursalToLocal(apiSuc) {
  return {
    LocalId: ++localSucursalCounter,
    IdDepartamento: apiSuc.IdDepartamento ?? null,
    IdMunicipio: apiSuc.IdMunicipio ?? null,
    IdSucursal: apiSuc.IdSucursal,
    NombreSucursal: apiSuc.NombreSucursal ?? "",
    Telefono: apiSuc.Telefono ?? "",
    CorreoGeneral: apiSuc.CorreoGeneral ?? "",
    Direccion: apiSuc.Direccion ?? "",
    IdCentroPoblado: apiSuc.IdCentroPoblado ?? null,
    Habilitada: apiSuc.Habilitada ?? true,
  };
}

function localSucursalToApi(suc, includeId = true) {
  const payload = {
    NombreSucursal: suc.NombreSucursal,
    Telefono: suc.Telefono,
    CorreoGeneral: suc.CorreoGeneral,
    Direccion: suc.Direccion,
    IdCentroPoblado: suc.IdCentroPoblado,
    Habilitada: suc.Habilitada,
  };
  if (includeId && suc.IdSucursal) payload.IdSucursal = suc.IdSucursal;
  return payload;
}

// Serializa los campos relevantes para detectar cambios reales.
function sucursalSerializable(s) {
  return {
    IdSucursal: s.IdSucursal ?? null,
    NombreSucursal: s.NombreSucursal ?? "",
    Telefono: s.Telefono ?? "",
    CorreoGeneral: s.CorreoGeneral ?? "",
    Direccion: s.Direccion ?? "",
    IdCentroPoblado: s.IdCentroPoblado ?? null,
    Habilitada: s.Habilitada ?? true,
    IdDepartamento: s.IdDepartamento ?? null,
    IdMunicipio: s.IdMunicipio ?? null,
  };
}

const sucursalPatchFields = [
  "NombreSucursal",
  "Telefono",
  "CorreoGeneral",
  "Direccion",
  "IdCentroPoblado",
  "Habilitada",
];

function buildSucursalPatch(current, snapshotById) {
  if (!current.IdSucursal) {
    return localSucursalToApi(current, false);
  }

  const original = snapshotById.get(current.IdSucursal);
  if (!original) {
    return localSucursalToApi(current, true);
  }

  const patch = { IdSucursal: current.IdSucursal };
  for (const field of sucursalPatchFields) {
    if (JSON.stringify(current[field]) !== JSON.stringify(original[field])) {
      patch[field] = current[field];
    }
  }

  return Object.keys(patch).length > 1 ? patch : null;
}

function getChangedSucursales(snapshotList, currentList) {
  const snapshotById = new Map(
    (snapshotList || [])
      .filter((s) => !!s.IdSucursal)
      .map((s) => [s.IdSucursal, s]),
  );

  return currentList
    .map((current) => buildSucursalPatch(current, snapshotById))
    .filter(Boolean);
}

const sucursales = ref([]);

function handleEditarSucursal(item) {
  const idx = sucursales.value.findIndex((s) => s.LocalId === item.LocalId);
  if (idx !== -1) {
    abrirEditarSucursal(idx);
  }
}

function handleVerSucursal(item) {
  const idx = sucursales.value.findIndex((s) => s.LocalId === item.LocalId);
  if (idx !== -1) {
    abrirVerSucursal(idx);
  }
}

// ─── Dialog hijo (sucursal) ───────────────────────────────────────────────────
const sucursalDialog = ref({
  open: false,
  mode: "create",
  sucursal: null,
  editIdx: null,
});

function abrirAgregarSucursal() {
  sucursalDialog.value = {
    open: true,
    mode: "create",
    sucursal: null,
    editIdx: null,
  };
}

function abrirEditarSucursal(idx) {
  const suc = sucursales.value[idx];
  sucursalDialog.value = {
    open: true,
    mode: "edit",
    editIdx: idx,
    sucursal: {
      IdSucursal: suc.IdSucursal,
      NombreSucursal: suc.NombreSucursal,
      Telefono: suc.Telefono,
      CorreoGeneral: suc.CorreoGeneral,
      Direccion: suc.Direccion,
      IdCentroPoblado: suc.IdCentroPoblado,
      Habilitada: suc.Habilitada,
      IdDepartamento: suc.IdDepartamento,
      IdMunicipio: suc.IdMunicipio,
    },
  };
}

function abrirVerSucursal(idx) {
  const suc = sucursales.value[idx];
  sucursalDialog.value = {
    open: true,
    mode: "view",
    editIdx: idx,
    sucursal: {
      IdSucursal: suc.IdSucursal,
      NombreSucursal: suc.NombreSucursal,
      Telefono: suc.Telefono,
      CorreoGeneral: suc.CorreoGeneral,
      Direccion: suc.Direccion,
      IdCentroPoblado: suc.IdCentroPoblado,
      Habilitada: suc.Habilitada,
      IdDepartamento: suc.IdDepartamento,
      IdMunicipio: suc.IdMunicipio,
    },
  };
}

/**
 * Callback del dialog hijo.
 * En create: agrega al array.
 * En edit: reemplaza el elemento en el índice.
 */
function onSucursalSubmit({ payload, mode }) {
  const local = {
    NombreSucursal: payload.NombreSucursal,
    Telefono: payload.Telefono,
    CorreoGeneral: payload.CorreoGeneral,
    Direccion: payload.Direccion,
    IdCentroPoblado: payload.IdCentroPoblado,
    Habilitada: payload.Habilitada,
    IdDepartamento: payload.IdDepartamento,
    IdMunicipio: payload.IdMunicipio,
  };

  if (mode === "create") {
    sucursales.value.push({
      LocalId: ++localSucursalCounter,
      IdSucursal: null,
      ...local,
    });
  } else if (mode === "edit" && sucursalDialog.value.editIdx !== null) {
    const idx = sucursalDialog.value.editIdx;
    sucursales.value[idx] = {
      ...sucursales.value[idx],
      ...local,
    };
  }

  sucursalDialog.value.open = false;
}

// ─── Headers y acciones para tabla de sucursales ────────────────────────────
const sucursalesHeaders = computed(() => [
  { title: "#", key: "indice", sortable: false, align: "left" },
  { title: "Nombre", key: "NombreSucursal", sortable: false },
  { title: "Dirección", key: "Direccion", sortable: false },
  { title: "Teléfono", key: "Telefono", sortable: false },
  { title: "Correo", key: "CorreoGeneral", sortable: false },
  { title: "Estado", key: "Habilitada", sortable: false, align: "center" },
]);

const sucursalRowActions = [
  {
    label: "Editar",
    icon: "$pencil",
    action: (item) => handleEditarSucursal(item),
    visible: () => !isReadonly.value,
  },
  {
    label: "Ver detalle",
    icon: "$eye",
    action: (item) => handleVerSucursal(item),
    visible: () => isReadonly.value,
  },
];
// ─── Form principal ───────────────────────────────────────────────────────────
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
  Estado: null,
};
const uiInitial = {
  tab: "identificacion",
  idDepartamento: null,
  idMunicipio: null,
};

const form = ref({ ...formInitial });
const ui = ref({ ...uiInitial });
const formSnapshot = ref(null);
const sucursalesSnapshot = ref(null);

const hasChanges = computed(() => {
  if (!formSnapshot.value) return false;
  const formChanged =
    JSON.stringify(form.value) !== JSON.stringify(formSnapshot.value);
  const sucChanged =
    JSON.stringify(sucursales.value.map(sucursalSerializable)) !==
    JSON.stringify(sucursalesSnapshot.value ?? []);
  return formChanged || sucChanged;
});

// ─── Tab errors ───────────────────────────────────────────────────────────────
const campoATab = {
  IdTipoDocumento: "identificacion",
  NumeroIdentificacion: "identificacion",
  Nombre: "identificacion",
  CorreoGeneral: "identificacion",
  Telefono: "identificacion",
  Estado: "identificacion",
  idDepartamento: "ubicacion",
  idMunicipio: "ubicacion",
  IdCentroPoblado: "ubicacion",
  Direccion: "ubicacion",
  IdListaPrecio: "comercial",
  Plazo: "comercial",
  CupoCredito: "comercial",
};

const tabErrors = computed(() => {
  const result = { identificacion: false, ubicacion: false, comercial: false };
  if (!formRef.value) return result;
  for (const { id } of formRef.value.errors ?? []) {
    const tab = campoATab[id];
    if (tab) result[tab] = true;
  }
  return result;
});

// ─── CIIU con N/A ─────────────────────────────────────────────────────────────
const ciuuConNa = computed(() => [
  { display: "N/A", Codigo: null },
  ...actividadesCiiu.value,
]);

// ─── Carga de catálogos ───────────────────────────────────────────────────────
const cargarTiposDocumentos = async () => {
  const r = await globalService.getTiposDocumentos();
  if (r.data?.success)
    tipoDocumentos.value = (r.data.data || []).map((i) => ({
      ...i,
      display: `${i.Codigo} - ${i.Nombre}`,
    }));
};
const cargarListaPrecios = async () => {
  const r = await globalService.getListasPrecios();
  if (r.data?.success)
    listaPrecios.value = (r.data.data || []).map((i) => ({
      ...i,
      display: i.NombreLista,
    }));
};
const cargarActividadCiiu = async () => {
  const r = await globalService.getActividadesCiiu();
  if (r.data?.success)
    actividadesCiiu.value = (r.data.data || []).map((i) => ({
      ...i,
      display: `${i.Codigo} - ${i.Descripcion}`,
    }));
};
const cargarDepartamentos = async () => {
  const r = await globalService.getDepartamentos();
  if (r.data?.success) departamentos.value = r.data.data || [];
};
const cargarEstados = async () => {
  try {
    const r = await clienteService.getEstados();
    if (r.data?.success) estadosCatalogo.value = r.data.data || [];
  } catch (e) {
    estadosCatalogo.value = [];
  }
};

// ─── Cascada ubicación principal ─────────────────────────────────────────────
const onDepartamentoChange = async (idDepartamento) => {
  ui.value.idMunicipio = null;
  form.value.IdCentroPoblado = null;
  municipios.value = [];
  centrosPoblados.value = [];
  if (!idDepartamento) return;
  loadingMunicipios.value = true;
  try {
    const r = await globalService.getMunicipiosByDepartamento(idDepartamento);
    if (r.data?.success) municipios.value = r.data.data || [];
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
    const r = await globalService.getCentrosPobladosByMunicipio(idMunicipio);
    if (r.data?.success) {
      const data = r.data.data || [];
      centrosPoblados.value = data;
      if (data.length === 1)
        form.value.IdCentroPoblado = data[0].IdCentroPoblado;
    }
  } finally {
    loadingCentrosPoblados.value = false;
  }
};

// ─── Precarga del cliente ─────────────────────────────────────────────────────
async function precargarCliente(cliente) {
  if (cliente.IdDepartamento) {
    ui.value.idDepartamento = cliente.IdDepartamento;
    await onDepartamentoChange(cliente.IdDepartamento);
  }
  if (cliente.IdMunicipio) {
    ui.value.idMunicipio = cliente.IdMunicipio;
    await onMunicipioChange(cliente.IdMunicipio);
  }

  form.value = {
    IdTipoDocumento: cliente.IdTipoDocumento,
    NumeroIdentificacion: cliente.NumeroIdentificacion,
    Nombre: cliente.Nombre,
    CorreoGeneral: cliente.CorreoGeneral,
    Telefono: cliente.Telefono,
    IdListaPrecio: cliente.IdListaPrecio,
    Plazo: cliente.Plazo,
    CupoCredito: formatCOP(cliente.CupoCredito),
    Direccion: cliente.Direccion,
    CIIU: cliente.CIIU,
    IdCentroPoblado: cliente.IdCentroPoblado,
    Estado: cliente.IdEstado,
  };

  // Sucursales
  const locales = Array.isArray(cliente.sucursales)
    ? cliente.sucursales.map(apiSucursalToLocal)
    : [];
  sucursales.value = locales;

  formSnapshot.value = { ...form.value };
  sucursalesSnapshot.value = locales.map(sucursalSerializable);
}

// ─── Reset ────────────────────────────────────────────────────────────────────
const resetForm = () => {
  form.value = { ...formInitial };
  ui.value = { ...uiInitial };
  municipios.value = [];
  centrosPoblados.value = [];
  sucursales.value = [];
  formSnapshot.value = null;
  sucursalesSnapshot.value = null;
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

    $loading.show();
    try {
      await Promise.all([
        cargarTiposDocumentos(),
        cargarListaPrecios(),
        cargarActividadCiiu(),
        cargarDepartamentos(),
        cargarEstados(),
      ]);
      if (props.cliente && !isCreating.value) {
        await precargarCliente(props.cliente);
      } else {
        formSnapshot.value = { ...form.value };
        sucursalesSnapshot.value = [];
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      $loading.hide();
    }
  },
);

// ─── Cierre ───────────────────────────────────────────────────────────────────
async function onRequestClose(value) {
  if (!value && !isReadonly.value && hasChanges.value) {
    const confirmed = await $confirm.warning({
      title: "¿Descartar cambios?",
      message: "Tienes cambios sin guardar. ¿Deseas salir de todas formas?",
      labelConfirm: "Sí, salir",
      labelCancel: "Seguir editando",
    });
    if (!confirmed) return;
  }
  emit("update:modelValue", value);
}

// ─── Submit ───────────────────────────────────────────────────────────────────
const submitForm = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid) {
    const primerTabConError = Object.keys(tabErrors.value).find(
      (k) => tabErrors.value[k],
    );
    if (primerTabConError) ui.value.tab = primerTabConError;
    $toast.error("Por favor corrige los errores en los campos marcados");
    return;
  }

  const confirmado = await $confirm.confirm({
    title: isCreating.value ? "¿Crear cliente?" : "¿Guardar cambios?",
    message: isCreating.value
      ? "Se registrará un nuevo cliente con los datos ingresados."
      : `Se actualizará la información de <strong>${form.value.Nombre}</strong>.`,
    labelConfirm: isCreating.value ? "Sí, crear" : "Sí, guardar",
    labelCancel: "Cancelar",
  });
  if (!confirmado) return;

  const changes = {};

  // Cambios en el formulario principal
  for (const key in form.value) {
    const currentValue =
      key === "CupoCredito" ? parseCOP(form.value[key]) : form.value[key];
    const snapshotValue =
      key === "CupoCredito"
        ? parseCOP(formSnapshot.value[key])
        : formSnapshot.value[key];

    if (JSON.stringify(currentValue) !== JSON.stringify(snapshotValue)) {
      changes[key] = currentValue;
    }
  }

  // Sucursales: enviar solo cada sucursal que realmente cambió.
  const sucursalesCambios = getChangedSucursales(
    sucursalesSnapshot.value ?? [],
    sucursales.value,
  );
  if (sucursalesCambios.length > 0) {
    changes.sucursales = sucursalesCambios;
  }

  emit("submit", { payload: changes, mode: props.mode });
};
</script>

<style scoped></style>
