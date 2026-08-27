<!-- src/modules/logistica/components/picking/tabs/PickingFacturacionInfoTab.vue -->
<template>
  <v-row class="mt-1" density="comfortable">
    <v-col cols="12" sm="6">
      <v-text-field
        label="Pedido Origen"
        :model-value="facturacion?.PedidoOrigen"
        prepend-inner-icon="mdi-clipboard-text-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        label="CEDI"
        :model-value="facturacion?.NombreCedi"
        prepend-inner-icon="mdi-warehouse"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="7">
      <v-text-field
        label="Cliente"
        :model-value="facturacion?.Cliente"
        prepend-inner-icon="mdi-account"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="5">
      <v-text-field
        label="Identificación"
        :model-value="facturacion?.NumeroIdentificacionCliente"
        prepend-inner-icon="mdi-card-account-details-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12">
      <v-text-field
        label="Dirección de entrega"
        :model-value="facturacion?.DireccionEntrega"
        prepend-inner-icon="mdi-map-marker-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-text-field
        label="Fecha documento"
        :model-value="formatDate(facturacion?.FechaDocumento)"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        label="Usuario"
        :model-value="facturacion?.Usuario"
        prepend-inner-icon="mdi-account-circle-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col v-if="facturacion?.ContactoRecepcion" cols="12" sm="6">
      <v-text-field
        label="Contacto de recepción"
        :model-value="facturacion?.ContactoRecepcion"
        prepend-inner-icon="mdi-account-box-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col v-if="facturacion?.TelefonoContacto" cols="12" sm="6">
      <v-text-field
        label="Teléfono de contacto"
        :model-value="facturacion?.TelefonoContacto"
        prepend-inner-icon="mdi-phone"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        label="Observación de facturación"
        :model-value="facturacion?.ObservacionFacturacion"
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
    // GET /order-settlements/unique/:IdTransaccion → data
    facturacion: { type: Object, default: null },
  })
</script>

<style scoped></style>
