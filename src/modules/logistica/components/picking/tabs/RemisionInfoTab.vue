<!-- src/modules/logistica/components/picking/tabs/RemisionInfoTab.vue -->
<template>
  <v-row class="mt-1" density="comfortable">
    <v-col cols="12" sm="6">
      <v-text-field
        label="Pedido Origen"
        :model-value="remision?.PedidoOrigen"
        prepend-inner-icon="mdi-clipboard-text-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        label="CEDI"
        :model-value="remision?.NombreCedi"
        prepend-inner-icon="mdi-warehouse"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="7">
      <v-text-field
        label="Cliente"
        :model-value="remision?.Cliente"
        prepend-inner-icon="mdi-account"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="5">
      <v-text-field
        label="Identificación"
        :model-value="remision?.NumeroIdentificacionCliente"
        prepend-inner-icon="mdi-card-account-details-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12">
      <v-text-field
        label="Dirección de entrega"
        :model-value="remision?.DireccionEntrega"
        prepend-inner-icon="mdi-map-marker-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-text-field
        label="Fecha documento"
        :model-value="formatDate(remision?.FechaDocumento)"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        label="Usuario"
        :model-value="remision?.Usuario"
        prepend-inner-icon="mdi-account-circle-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col v-if="remision?.ContactoRecepcion" cols="12" sm="6">
      <v-text-field
        label="Contacto de recepción"
        :model-value="remision?.ContactoRecepcion"
        prepend-inner-icon="mdi-account-box-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col v-if="remision?.TelefonoContacto" cols="12" sm="6">
      <v-text-field
        label="Teléfono de contacto"
        :model-value="remision?.TelefonoContacto"
        prepend-inner-icon="mdi-phone"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-text-field
        label="Estado de facturación"
        :model-value="remision?.Facturada ? 'Facturada' : 'Pendiente por facturar'"
        prepend-inner-icon="mdi-file-document-check-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        label="Observación de la remisión"
        :model-value="remision?.ObservacionRemision"
        prepend-inner-icon="mdi-text-box-check-outline"
        readonly
        rows="2"
        variant="outlined"
      />
    </v-col>
  </v-row>
</template>

<script setup>
  import { formatDate } from '@/shared/utils/dateFormatter'

  defineProps({
    // GET /remissions/unique/:IdTransaccion → data
    remision: { type: Object, default: null },
  })
</script>

<style scoped></style>
