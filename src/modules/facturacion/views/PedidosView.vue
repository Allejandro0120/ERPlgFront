<!-- src/modules/cartera/views/ClientesListView.vue -->
<template>
  <div>
    <app-bar title="Gestion de Pedidos">
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
          Crear Pedido
        </v-btn>
      </template>
    </app-bar>
    
  </div>
</template>

<script setup>
import AppBar from "@/shared/ui/AppBar.vue";

</script>
