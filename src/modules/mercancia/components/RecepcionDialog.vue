<template>
  <base-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    :icon="dialogIcon"
    color="primary"
    :label-confirm="labelConfirm"
    :show-actions="!isReadonly"
    max-width="1200"
    @update:model-value="onClose"
    @accept="emitSubmit"
  >
    <template #content>
      <v-form ref="formRef">
        <v-row density="compact">
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.NroActa"
              label="Número de Acta"
              density="compact"
              variant="outlined"
              :readonly="isReadonly"
              :prepend-inner-icon="mdiFile"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.EstadoActa"
              :items="estados"
              item-title="label"
              item-value="value"
              label="Estado"
              density="compact"
              variant="outlined"
              :readonly="isReadonly"
              :prepend-inner-icon="mdiNoteCheck"
            >
              <template #selection="{ item }">
                <v-chip
                  label
                  class="estado-chip"
                  variant="tonal"
                  :color="estadoColor(item.value)"
                >
                  <v-icon
                    :icon="mdiTag"
                    :color="estadoColor(item.value)"
                    start
                    size="12"
                    class="ml-1"
                  />
                  {{ item.title || item.label }}
                </v-chip>
              </template>
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon
                      :icon="mdiTag"
                      :color="estadoColor(item.value)"
                      size="12"
                      class="ml-1"
                    />
                  </template>
                  <v-list-item-title>{{
                    item.title || item.label
                  }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.ProveedorNombre"
              label="Proveedor"
              density="compact"
              variant="outlined"
              :readonly="isReadonly"
              :prepend-inner-icon="mdiTruck"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.PrefijoFacturaRecibida"
              label="Prefijo Factura"
              density="compact"
              variant="outlined"
              :readonly="isReadonly"
              :prepend-inner-icon="mdiInvoiceOutline"

            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.NumeroFacturaRecibida"
              label="Número Factura"
              density="compact"
              variant="outlined"
              :readonly="isReadonly"
             :prepend-inner-icon="mdiInvoiceTextOutline"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.FechaFacturaRecibida"
              label="Fecha Factura"
              type="date"
              density="compact"
              variant="outlined"
              :readonly="isReadonly"
              :prepend-inner-icon="mdiCalendar"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.FechaActa"
              label="Fecha Acta"
              type="date"
              density="compact"
              variant="outlined"
              :prepend-inner-icon="mdiCalendar"
              :readonly="isReadonly"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.Observaciones"
              label="Observaciones / Orden de compra"
              density="compact"
              variant="outlined"
              :readonly="isReadonly"
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="text-subtitle-1 font-weight-bold mb-3">Detalle</div>
        <base-table-local
          :headers="detalleHeaders"
          :items="form.Detalles"
          :loading="false"
          item-key="IdProducto"
          class="rounded-lg border"
          :searchable="false"
        >
          <template #item.Aceptado="{ item }">
            <v-chip
              :color="estadoProductoColor(estadoProductoLabel(item.Aceptado))"
              size="small"
              variant="tonal"
            >
              {{ estadoProductoLabel(item.Aceptado) }}
            </v-chip>
          </template>
        </base-table-local>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
import { mdiFile, mdiNoteCheck, mdiTag, mdiTruck, mdiInvoiceOutline, mdiInvoiceTextOutline, mdiCalendar, mdiFilePlus, mdiFileEdit, mdiFileEye } from "@mdi/js";
import { reactive, computed, watch, ref } from "vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import BaseTableLocal from "@/shared/ui/BaseTableLocal.vue";
import { getEstadoColor, DOMINIOS_ESTADO } from "@/shared/utils/estadoColors";

const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: "create",
    validator: (v) => ["create", "edit", "view"].includes(v),
  },
  acta: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const estados = [
  { label: "Borrador", value: "Borrador" },
  { label: "Pendiente", value: "Pendiente" },
  { label: "Cerrada", value: "Cerrada" },
];
const formRef = ref(null);

const blankActa = () => ({
  IdActa: null,
  NroActa: "",
  IdProveedor: null,
  ProveedorNombre: "",
  Observaciones: "",
  PrefijoFacturaRecibida: "",
  NumeroFacturaRecibida: "",
  FechaFacturaRecibida: "",
  FechaActa: "",
  EstadoActa: "Borrador",
  Detalles: [],
});

const form = reactive(blankActa());

const detalleHeaders = [
  { title: "Producto", key: "NombreProducto", sortable: false },
  { title: "Lote", key: "IdLote", sortable: false },
  {
    title: "Facturado",
    key: "CantidadFacturada",
    align: "center",
    sortable: false,
  },
  {
    title: "Recibido",
    key: "CantidadRecibida",
    align: "center",
    sortable: false,
  },
  {
    title: "Muestra",
    key: "CantidadMuestra",
    align: "center",
    sortable: false,
  },
  { title: "Estado", key: "Aceptado", align: "center", sortable: false },
  { title: "Obs.", key: "ObservacionesProducto", sortable: false },
];

const isReadonly = computed(() => props.mode === "view");
const dialogTitle = computed(
  () =>
    ({
      create: "Crear Acta",
      edit: "Editar Acta",
      view: "Detalle del Acta",
    })[props.mode],
);
const dialogIcon = computed(
  () =>
    ({
      create: mdiFilePlus,
      edit: mdiFileEdit,
      view: mdiFileEye,
    })[props.mode],
);
const labelConfirm = computed(
  () =>
    ({
      create: "Crear Acta",
      edit: "Guardar Cambios",
      view: "",
    })[props.mode],
);

watch(
  () => props.acta,
  (val) => {
    Object.assign(form, blankActa(), val || {});
  },
  { immediate: true },
);

function onClose(value) {
  emit("update:modelValue", value);
}

function emitSubmit() {
  emit("submit", { ...form, Detalles: [...form.Detalles] });
}

const estadoColor = (estado) => getEstadoColor(estado, DOMINIOS_ESTADO.ACTA);
const estadoProductoColor = (estado) =>
  getEstadoColor(estado, DOMINIOS_ESTADO.PRODCUTO_ACTA);
const estadoProductoLabel = (aceptado) => (aceptado ? "Aceptado" : "Rechazado");
</script>
