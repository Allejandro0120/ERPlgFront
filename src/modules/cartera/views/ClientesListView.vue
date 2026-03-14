<!-- src/modules/cartera/views/ClientesListView.vue -->
<template>
  <div>
    <app-bar title="Gestion de Clientes">
      <template #actions>
        <v-btn
          variant="tonal"
          color="brand-grey-2 font-weight-bold"
          prepend-icon="mdi-tray-arrow-down"
          class="pa-4"
          size="small"
          
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
    <v-container fluid class=" w-100 mx-auto">
      <base-table
        title="Directorio de Clientes"
        :headers="headers"
        :items="clientes"
        itemKey="nit"
        :page="currentPage"
        :itemsPerPage="itemsPerPage"
        :totalItems="clientes.length"
        @update:page="currentPage = $event"
      >
        <template #actions>
          <div class="text-caption text-grey-darken-1 mr-2 d-none d-sm-block">Filtrar por categoría:</div>
          <v-select
            v-model="categoriaSeleccionada"
            :items="['Todas las categorías', 'Nuevos', 'Frecuentes']"
            density="compact"
            variant="outlined"
            hide-details
            class="bg-white"
            style="max-width: 200px;"
          ></v-select>
        </template>
        
        <!-- Columnas personalizadas -->
        <template #item.nit="{ item }">
          <span class="text-primary font-weight-medium">#{{ item.nit }}</span>
        </template>
        
        <template #item.nombre="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="grey-lighten-4" size="32" class="mr-3">
              <v-icon size="16" color="grey-darken-2">mdi-account</v-icon>
            </v-avatar>
            <span class="font-weight-bold text-grey-darken-4">{{ item.nombre }}</span>
          </div>
        </template>
        
        <template #item.ciudad="{ item }">
          <span class="text-grey-darken-2">{{ item.ciudad }}</span>
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
        
        <template #item.acciones>
          <v-btn icon="mdi-pencil" variant="text" size="small" color="grey-darken-1"></v-btn>
        </template>
      </base-table>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AppBar from "@/shared/ui/AppBar.vue";
import BaseTable from "@/shared/ui/BaseTable.vue";

const currentPage = ref(1);
const itemsPerPage = ref(1);
const categoriaSeleccionada = ref("Todas las categorías");

const headers = [
  { title: "NIT", key: "nit", align: "left" },
  { title: "NOMBRE", key: "nombre", align: "left" },
  { title: "CIUDAD", key: "ciudad", align: "left" },
  { title: "TELÉFONO", key: "telefono", align: "left" },
  { title: "ESTADO", key: "activo", align: "center" },
  { title: "ACCIONES", key: "acciones", align: "center" },
];

const stats = [
  {
    label: "Total Clientes",
    value: "248",
    icon: "mdi-account-group-outline",
    iconColor: "primary",
    color: "",
  },
  {
    label: "Activos",
    value: "231",
    icon: "mdi-account-check-outline",
    iconColor: "success",
    color: "text-success",
  },
  {
    label: "Inactivos",
    value: "17",
    icon: "mdi-account-off-outline",
    iconColor: "error",
    color: "text-error",
  },
  {
    label: "Nuevos este mes",
    value: "12",
    icon: "mdi-account-plus-outline",
    iconColor: "info",
    color: "",
  },
];

const clientes = [
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
];
</script>
