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
        item-key="nit"
        :loading="loading"
        :total-items="totalItems"
        :row-actions="rowActions"
        empty-text="No se encontraron clientes"
        searchable
        search-placeholder="Buscar por NIT, nombre o ciudad..."
        @load="fetchData"
      >
        <!-- Filtros desktop -->
        <template #filters>
          <v-select
            v-model="categoriaSeleccionada"
            :items="categorias"
            label="Categoría"
            density="compact"
            variant="outlined"
            hide-details
            style="min-width: 160px; max-width: 200px"
            @update:model-value="onFilterChange"
          />
          <v-select
            v-model="estadoSeleccionado"
            :items="estados"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
            style="min-width: 130px; max-width: 160px"
            @update:model-value="onFilterChange"
          />
        </template>

        <!-- Filtros móvil -->
        <template #filters-mobile>
          <v-select
            v-model="categoriaSeleccionada"
            :items="categorias"
            label="Categoría"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="onFilterChange"
          />
          <v-select
            v-model="estadoSeleccionado"
            :items="estados"
            label="Estado"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="onFilterChange"
          />
        </template>

        <template #item.activo="{ item }">
          <v-chip
            :color="item.activo ? 'success' : 'error'"
            size="small"
            class="font-weight-medium"
            variant="tonal"
          >
            {{ item.activo ? "Activo" : "Inactivo" }}
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

const tableRef = ref();

// ── Headers — sin columna acciones, BaseTable la agrega automáticamente ───────
const headers = [
  { title: "NIT", key: "nit", sortable: true },
  { title: "Nombre", key: "nombre", sortable: true },
  { title: "Ciudad", key: "ciudad", sortable: true },
  { title: "Teléfono", key: "telefono", sortable: false },
  { title: "Estado", key: "activo", sortable: false, align: "center" },
];

// ── Acciones por fila ─────────────────────────────────────────────────────────
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
    action: (item) => verDetalle(item)
  },
  {
    label: "Eliminar",
    icon: "mdi-delete",
    color: "error",
    action: (item) => eliminarCliente(item),
  },
];

// ── Filtros ───────────────────────────────────────────────────────────────────
const categorias = ["Todas", "Nuevos", "Frecuentes"];
const estados = ["Todos", "Activo", "Inactivo"];
const categoriaSeleccionada = ref("Todas");
const estadoSeleccionado = ref("Todos");

// ── Estado de la tabla ────────────────────────────────────────────────────────
const clientes = ref([]);
const totalItems = ref(0);
const loading = ref(false);

const DATA = [
  {
    nit: "900.123.456-1",
    nombre: "Clínica San Rafael",
    ciudad: "Bucaramanga",
    telefono: "316 800 0001",
    activo: true,
  },
  {
    nit: "800.234.567-2",
    nombre: "Droguería Central",
    ciudad: "Medellín",
    telefono: "300 900 0002",
    activo: true,
  },
  {
    nit: "700.345.678-3",
    nombre: "Hospital Universitario",
    ciudad: "Bogotá",
    telefono: "321 700 0003",
    activo: false,
  },
  {
    nit: "600.456.789-4",
    nombre: "Farmacia del Norte",
    ciudad: "Barranquilla",
    telefono: "314 600 0004",
    activo: true,
  },
  {
    nit: "500.567.890-5",
    nombre: "IPS Salud Total",
    ciudad: "Cali",
    telefono: "318 500 0005",
    activo: true,
  },
  {
    nit: "500.567.890-5",
    nombre: "IPS Salud Total",
    ciudad: "Cali",
    telefono: "318 500 0005",
    activo: true,
  },
];

async function fetchData({ page, itemsPerPage, sortBy, search }) {
  loading.value = true;
  await new Promise((r) => setTimeout(r, 400));

  let resultado = [...DATA];

  if (search) {
    const q = search.toLowerCase();
    resultado = resultado.filter(
      (c) =>
        c.nit.toLowerCase().includes(q) ||
        c.nombre.toLowerCase().includes(q) ||
        c.ciudad.toLowerCase().includes(q),
    );
  }

  if (categoriaSeleccionada.value === "Nuevos")
    resultado = resultado.slice(0, 2);
  if (categoriaSeleccionada.value === "Frecuentes")
    resultado = resultado.slice(2);
  if (estadoSeleccionado.value === "Activo")
    resultado = resultado.filter((c) => c.activo);
  if (estadoSeleccionado.value === "Inactivo")
    resultado = resultado.filter((c) => !c.activo);

  if (sortBy?.key) {
    resultado.sort((a, b) => {
      const cmp =
        typeof a[sortBy.key] === "string"
          ? a[sortBy.key].localeCompare(b[sortBy.key], "es")
          : a[sortBy.key] - b[sortBy.key];
      return sortBy.order === "asc" ? cmp : -cmp;
    });
  }

  const start = (page - 1) * itemsPerPage;
  clientes.value = resultado.slice(start, start + itemsPerPage);
  totalItems.value = resultado.length;
  loading.value = false;
}

function onFilterChange() {
  tableRef.value?.reset();
}

// ── Handlers de acciones ──────────────────────────────────────────────────────
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
