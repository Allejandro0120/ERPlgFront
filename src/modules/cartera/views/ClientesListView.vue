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
    
  </div>
</template>

<script setup>
import AppBar from "@/shared/ui/AppBar.vue";

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
