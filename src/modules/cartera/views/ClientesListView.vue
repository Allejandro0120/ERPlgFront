<!-- src/modules/cartera/views/ClientesListView.vue -->
<template>
  <div>
    <app-bar title="Gestión de Clientes">
      <template #actions>
        <v-btn
          variant="tonal"
          color="brand-grey-2"
          prepend-icon="mdi-tray-arrow-down"
          size="small"
          class="font-weight-bold pa-4"
        >
          Exportar
        </v-btn>
      </template>
    </app-bar>

    <!-- Modal para cliente -->
    <cliente-dialog
      v-model="dialog.open"
      :mode="dialog.mode"
      :cliente="dialog.cliente"
      @submit="onSubmit"
    />

    <v-container fluid class="w-100 mx-auto">
      <div class="d-flex justify-end mb-3">
        <v-btn
          v-if="hasPermission('Clientes.ADD')"
          color="primary"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="abrirCrear()"
        >
          Añadir Cliente
        </v-btn>
      </div>
      <base-table
        ref="tableRef"
        title="Directorio de Clientes"
        :headers="headers"
        :items="clientes"
        item-key="IdCliente"
        :loading="loadingTable"
        :total-items="totalItems"
        :row-actions="rowActions"
        empty-text="No se encontraron clientes"
        searchable
        search-placeholder="Buscar por identificación, nombre o municipio..."
        @load="fetchData"
      >
        <!-- Filtros: cols="12" en móvil, cols="auto" en sm+ -->
        <template #filters>
          <v-col cols="12" md="2">
            <v-select
              v-model="estadoSeleccionado"
              :items="estados"
              item-title="Nombre"
              item-value="Id"
              label="Estado"
              density="compact"
              variant="outlined"
              :disabled="loadingTable"
              hide-details
              @update:model-value="onFilterChange"
            />
          </v-col>
        </template>

        <!-- Estado -->
        <template #item.Estado="{ item }">
          <v-chip
            :color="getEstadoColor(item.Estado)"
            size="small"
            class="font-weight-medium"
            variant="tonal"
          >
            <v-icon icon="mdi-circle" size="14" start></v-icon>
            {{ getEstadoNombre(item.Estado) }}
          </v-chip>
        </template>
      </base-table>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AppBar from "@/shared/ui/AppBar.vue";
import BaseTable from "@/shared/ui/BaseTable.vue";
import ClienteDialog from "@/modules/cartera/components/ClienteDialog.vue";
import { clienteService } from "@/api/services/clienteService";
import { useAuthStore } from "@/stores/auth.store";

const authStore = useAuthStore();
const hasPermission = (permiso) => authStore.hasPermission(permiso);
const tableRef = ref();

const headers = [
  {
    title: "Identificación",
    key: "NumeroIdentificacion",
    sortable: true,
    searchable: true,
  },
  { title: "Tipo Documento", key: "TipoDocumento", sortable: false },
  { title: "Nombre", key: "Nombre", sortable: true, searchable: true },
  { title: "Municipio", key: "Municipio", sortable: true, searchable: true },
  { title: "Estado", key: "Estado", sortable: false, align: "center" },
];

const rowActions = [
  {
    label: "Editar",
    icon: "mdi-pencil",
    action: (item) => editarCliente(item),
  },
  {
    label: "Ver detalle",
    icon: "mdi-eye",
    color: "amber-darken-2",
    action: (item) => verDetalle(item),
  },
];

const estados = ref([]);
const estadoSeleccionado = ref(null);

const getEstadoNombre = (estadoId) => {
  const estado = estados.value.find((e) => e.Id === estadoId);
  return estado ? estado.Nombre : "Desconocido";
};

const getEstadoColor = (estado) => {
  const map = { 0: "error", 1: "success", 2: "warning", 3: "grey" };
  return map[estado] ?? "grey";
};

const clientes = ref([]);
const totalItems = ref(0);
const loadingTable = ref(false);

const dialog = ref({ open: false, mode: "create", cliente: null });

async function cargarEstados() {
  try {
    const response = await clienteService.getEstados();
    if (response.data?.success) {
      estados.value = [{ Id: null, Nombre: "Todos" }, ...response.data.data];
    }
  } catch (error) {
    console.error("Error al obtener los estados:", error);
    estados.value = [{ Id: null, Nombre: "Todos" }];
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
      filters.IdEstado = estadoSeleccionado.value;
    }

    const response = await clienteService.getClientes(
      page,
      itemsPerPage,
      search,
      sortByField,
      sortOrder,
      filters,
    );

    if (response.data?.success) {
      const { items = [], totalItems: total = 0 } = response.data.data || {};
      clientes.value = items;
      totalItems.value = total;
    }
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    clientes.value = [];
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

function abrirCrear() {
  dialog.value = { open: true, mode: "create", cliente: null };
}

async function editarCliente(item) {
  $loading.show();
  try {
    const res = await clienteService.getClienteById(item.IdCliente);
    if (res.data?.success) {
      dialog.value = { open: true, mode: "edit", cliente: res.data.data };
    }
  } catch (e) {
    $toast.error("Error al obtener cliente: " + e.message);
  } finally {
    $loading.hide();
  }
}

async function verDetalle(item) {
  $loading.show();
  try {
    const res = await clienteService.getClienteById(item.IdCliente);
    if (res.data?.success) {
      dialog.value = { open: true, mode: "view", cliente: res.data.data };
    }
  } catch (e) {
    $toast.error("Error al obtener cliente: " + e.message);
  } finally {
    $loading.hide();
  }
}

// ─── Submit Cliente (captura datos y modo del diálogo) ───────────────────────
async function onSubmit({ payload, mode }) {
  $loading.show();
  try {
    if (mode === "create") {
      await clienteService.createCliente(payload);
      $toast.success("Cliente creado exitosamente");
    } else if (mode === "edit") {
      const updateData = {
        ...payload,
        IdCliente: dialog.value.cliente.IdCliente,
      };
      await clienteService.updateCliente(updateData);
      $toast.success("Cliente actualizado exitosamente");
    }
    dialog.value.open = false;
    refrescarTabla();
  } catch (error) {
    console.error("Error al guardar cliente:", error);
    $toast.error("Error al guardar cliente: " + error.message);
  } finally {
    $loading.hide();
  }
}
</script>
