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
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          variant="flat"
          size="small"
          class="py-4"
        >
          Añadir Cliente
        </v-btn>
      </template>
    </app-bar>

    <v-container fluid class="w-100 mx-auto">
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
import { clienteService } from "@/api/services/clienteService";

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
function editarCliente(item) {
  console.log("Editar:", item);
}
function verDetalle(item) {
  console.log("Ver detalle:", item);
}
function eliminarCliente(item) {
  console.log("Eliminar:", item);
}
</script>
