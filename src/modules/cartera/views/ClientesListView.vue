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

    <!-- Modal para crear cliente -->
    <clientes-form-dialog v-model="dialogOpen" @submit="crearCliente" />

    <v-container fluid class="w-100 mx-auto">
      <div class="d-flex justify-end mb-3">
        <v-btn
          v-if="hasPermission('Clientes.ADD')"
          color="primary"
          prepend-icon="mdi-plus"
          variant="flat"
          @click="abrirDialogo ()"
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
        :loading="loading"
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
              label="Estado"
              density="compact"
              variant="outlined"
              :disabled="loading"
              hide-details
              @update:model-value="onFilterChange"
            />
          </v-col>
        </template>

        <!-- Estado -->
        <template #item.Habilitado="{ item }">
          <v-chip
            :color="item.Habilitado ? 'success' : 'error'"
            size="small"
            class="font-weight-medium"
            variant="tonal"
          >
            {{ item.Habilitado ? "Activo" : "Inactivo" }}
          </v-chip>
        </template>
      </base-table>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AppBar from "@/shared/ui/AppBar.vue";
import BaseTable from "@/shared/ui/BaseTable.vue";
import ClientesFormDialog from "@/modules/cartera/components/ClientesFormDialog.vue";
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
  { title: "Estado", key: "Habilitado", sortable: false, align: "center" },
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

const estados = ["Todos", "Activo", "Inactivo"];
const estadoSeleccionado = ref("Todos");

const clientes = ref([]);
const totalItems = ref(0);
const loading = ref(false);

const dialogOpen = ref(false);

async function fetchData({
  page,
  itemsPerPage,
  sortByField,
  sortOrder,
  search,
}) {
  loading.value = true;
  try {
    const filters = {};
    if (estadoSeleccionado.value !== "Todos") {
      filters.Habilitado = estadoSeleccionado.value === "Activo";
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
    loading.value = false;
  }
}

function onFilterChange() {
  tableRef.value?.reset();
}

function refrescarTabla() {
  tableRef.value?.reset();
}

function editarCliente(item) {
  console.log("Editar:", item);
}
function verDetalle(item) {
  console.log("Ver detalle:", item);
}
function abrirDialogo () {
  dialogOpen.value = true;
}

// ─── Crear Cliente (captura datos del diálogo) ───────────────────────────────
async function crearCliente(clienteData) {
  $loading.show();
  try {
    await clienteService.createCliente (clienteData);
    $toast.success("Cliente creado exitosamente");
    dialogOpen.value = false;
    refrescarTabla();
  } catch (error) {
    console.error("Error al crear cliente:", error);
    $toast.error("Error al crear cliente: " + error.message);
  } finally {
    $loading.hide();
  }
}
</script>
