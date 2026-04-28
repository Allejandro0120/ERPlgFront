<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto">
          <v-btn
            color="primary"
            prepend-icon="$plus"
            class="text-none w-100"
            @click="abrirCrear"
          >
            Añadir Acta
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>

    <base-table
      ref="tableRef"
      title="Actas de Recepción"
      :headers="headers"
      :items="recepciones"
      item-key="IdActa"
      :loading="loadingTable"
      :total-items="totalItems"
      :row-actions="rowActions"
      empty-text="No se encontraron actas"
      searchable
      search-placeholder="Buscar por acta, proveedor o factura..."
      @load="fetchData"
    >
      <template #filters>
        <v-col cols="12" md="2">
          <v-select
            v-model="estadoSeleccionado"
            :items="estados"
            item-title="Nombre"
            item-value="IdEstado"
            label="Estado"
            density="compact"
            variant="outlined"
            :disabled="loadingTable"
            hide-details
            id="filtro-estado"
            name="estadoFiltro"
            @update:model-value="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="5">
          <date-range-filter
            v-model="dateRange"
            @change="onDateRangeChange"
            :showPresetSelect="false"
            presetValue="30days"
           
          />
        </v-col>
      </template>
      <template #item.Estado="{ item }">
        <v-chip
          :color="getEstadoColor(getEstadoNombre(item.IdEstadoActa), DOMINIOS_ESTADO.ACTA)"
          variant="tonal"
          size="small"
          class="font-weight-medium"
        >
          <v-icon icon="mdi-tag" start size="14" />
          {{ getEstadoNombre(item.IdEstadoActa) }}
        </v-chip>
      </template>
      <template #item.FechaActa="{ item }">
        {{ formatDateTime(item.FechaActa) }}
      </template>
    </base-table>

    <recepcion-dialog
      v-model="dialog.open"
      :mode="dialog.mode"
      :acta="dialog.acta"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PageHeaderActions from "@/shared/ui/PageHeaderActions.vue";
import BaseTable from "@/shared/ui/BaseTable.vue";
import RecepcionDialog from "@/modules/mercancia/components/RecepcionDialog.vue";
import { useAuthStore } from "@/stores/auth.store";
import { getEstadoColor, DOMINIOS_ESTADO } from "@/shared/utils/statusColors";
import { $toast } from "@/plugins/toast";
import { $loading } from "@/plugins/loading/loading";
import { recepcionService } from "@/api/services/recepcionService";
import { formatDateTime } from "@/shared/utils/dateFormatter";
import { proveedorService } from "../../../api/services/proveedorService";
import DateRangeFilter from '@/shared/ui/DateRangeFilter.vue';

const authStore = useAuthStore();
const hasPermission = (permiso) => authStore.hasPermission(permiso);
const tableRef = ref();
 
const headers = [
  { title: "Nro Acta", key: "Acta", sortable: true, searchable: true },
  {
    title: "Factura",
    key: "NumeroFacturaRecibida",
    sortable: false,
    searchable: true,
  },
  {
    title: "Doc. Proveedor",
    key: "NumeroIdentificacionProveedor",
    sortable: true,
    searchable: true,
  },
  {
    title: "Proveedor",
    key: "NombreProveedor",
    sortable: true,
    searchable: true,
  },
  {
    title: "Fecha Acta",
    key: "FechaActa",
    sortable: true,
  },

  {
    title: "Estado",
    key: "Estado",
    align: "center",
    sortable: false,
  },
];

const rowActions = [
  {
    label: "Ver detalle",
    icon: "$eye",
    color: "blue-darken-3",
    action: (item) => abrirDialog("view", item),
  },
  {
    label: "Editar",
    icon: "$pencil",
    color: "purple-darken-3",
    action: (item) => abrirDialog("edit", item),
  },
];
const estados = ref([]);
const estadoSeleccionado = ref(null);
const dateRange = ref({ start: null, end: null });

const onDateRangeChange = (range) => {
  // Only update local state; do not trigger table reload immediately.
  dateRange.value = { start: range.start, end: range.end };
};

const proveedores = ref([]);
const proveedorSeleccionado = ref(null);

const getEstadoNombre = (estadoId) => {
  const estado = estados.value.find((e) => e.IdEstado === estadoId);
  return estado ? estado.Nombre : "Desconocido";
};

const recepciones = ref([]);
const totalItems = ref(0);
const loadingTable = ref(false);

async function cargarEstados() {
  try {
    const response = await recepcionService.getRecepcionEstados();
    if (response.data?.success) {
      estados.value = [
        { IdEstado: null, Nombre: "Todos" },
        ...response.data.data,
      ];
    }
  } catch (error) {
    console.error("Error al obtener los estados:", error);
    estados.value = [{ IdEstado: null, Nombre: "Todos" }];
  }
}

async function cargarProveedores() {
  try {
    const response = await proveedorService.getProveedores();
    if (response.data?.success) {
      proveedores.value = [
        { IdProveedor: null, Nombre: "Todos" },
        ...response.data.data,
      ];
    }
  } catch (error) {
    console.error("Error al obtener los proveedores:", error);
    proveedores.value = [{ IdProveedor: null, Nombre: "Todos" }];
  }
}
onMounted(() => {
  cargarEstados();
});

async function fetchData({
  page,
  itemsPerPage,
  sortByField,
  sortOrder,
  search,
}) {
  loadingTable.value = true;
  try {
    const filters = {};
    if (estadoSeleccionado.value !== null) {
      filters.IdEstadoActa = estadoSeleccionado.value;
    }
    if (dateRange.value && (dateRange.value.start || dateRange.value.end)) {
      if (dateRange.value.start) filters.startDate = new Date(dateRange.value.start).toISOString().slice(0,10);
      if (dateRange.value.end) filters.endDate = new Date(dateRange.value.end).toISOString().slice(0,10);
    }
    const response = await recepcionService.getRecepciones(
      page,
      itemsPerPage,
      search,
      sortByField,
      sortOrder,
      filters,
    );

    if (response.data?.success) {
      const { items = [], totalItems: total = 0 } = response.data.data || {};
      recepciones.value = items;
      totalItems.value = total;
    }
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    recepciones.value = [];
    totalItems.value = 0;
  } finally {
    loadingTable.value = false;
  }
}

function onFilterChange() {
  tableRef.value?.reset();
}

function refrescarTabla() {
  tableRef.value?.reset();
}
const dialog = ref({ open: false, mode: "view", acta: null });

function abrirCrear() {
  dialog.value = { open: true, mode: "create", acta: null };
}

function abrirDialog(mode, acta) {
  dialog.value = { open: true, mode, acta };
}

function onSubmit(payload) {
  // Refrescar tabla después de guardar
  refrescarTabla();
  dialog.value.open = false;
  $toast.success(
    dialog.value.mode === "create"
      ? "Acta creada exitosamente"
      : "Acta actualizada exitosamente",
  );
}
</script>
