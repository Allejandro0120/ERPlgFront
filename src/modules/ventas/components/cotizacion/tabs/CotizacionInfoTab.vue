<template>
  <v-row class="mt-2" density="compact">
    <!-- Estado / pedido generado a partir de esta cotización -->
    <v-col v-if="form.Estado || form.Pedido" class="mb-4 d-flex flex-wrap ga-2" cols="12">
      <v-chip
        v-if="form.Estado"
        class="font-weight-medium"
        :color="getEstadoColor(form.Estado, DOMINIOS_ESTADO.COTIZACION)"
        size="small"
        variant="tonal"
      >
        <v-icon icon="mdi-tag" size="14" start />
        Estado: {{ form.Estado }}
      </v-chip>
      <v-chip
        v-if="form.Pedido"
        class="font-weight-medium"
        color="success"
        size="small"
        variant="tonal"
      >
        <v-icon icon="mdi-clipboard-check-outline" size="14" start />
        Pedido generado: {{ form.Pedido }}
      </v-chip>
    </v-col>

    <!-- Cliente -->
    <v-col cols="12" sm="6">
      <v-text-field
        label="Cliente"
        :model-value="form.Cliente"
        prepend-inner-icon="mdi-account"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-text-field
        label="Identificación"
        :model-value="form.NumeroIdentificacionCliente"
        prepend-inner-icon="mdi-card-account-details"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="3">
      <v-text-field
        label="Fecha Documento"
        :model-value="formatDate(form.FechaDocumento)"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- Vigencia / tipo de venta / método de pago -->
    <v-col cols="12" sm="4">
      <date-picker-field
        id="VigenciaHasta"
        v-model="form.VigenciaHasta"
        label="Vigencia Hasta"
        :min="form.FechaDocumento"
        :readonly="isReadonly"
        required
        :rules="isReadonly ? [] : [rules.required]"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-select
        id="IdTipoVenta"
        v-model="form.IdTipoVenta"
        item-title="Nombre"
        item-value="IdTipoVenta"
        :items="tiposVenta"
        label="Tipo de Venta"
        prepend-inner-icon="mdi-cash-check"
        :readonly="isReadonly"
        required
        :rules="isReadonly ? [] : [rules.required]"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-select
        id="IdMetodoPago"
        v-model="form.IdMetodoPago"
        item-title="Nombre"
        item-value="IdMetodoPago"
        :items="metodosPago"
        label="Método de Pago"
        prepend-inner-icon="mdi-credit-card-outline"
        :readonly="isReadonly"
        required
        :rules="isReadonly ? [] : [rules.required]"
        variant="outlined"
      />
    </v-col>

    <!-- Lista de precios / usuario / sucursal / cedi -->
    <v-col cols="12" sm="4">
      <v-text-field
        label="Lista de Precios"
        :model-value="nombreListaPrecio"
        prepend-inner-icon="mdi-tag-text"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        label="Usuario"
        :model-value="form.Usuario"
        prepend-inner-icon="mdi-account-circle"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col v-if="form.NombreCedi" cols="12" sm="4">
      <v-text-field
        label="Cedi"
        :model-value="form.NombreCedi"
        prepend-inner-icon="mdi-warehouse"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- Sucursal: a todo el ancho para que no se corte la dirección -->
    <v-col v-if="form.NombreSucursal" cols="12">
      <v-text-field
        label="Sucursal"
        :model-value="form.NombreSucursal"
        prepend-inner-icon="mdi-store"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- Condiciones / observaciones -->
    <v-col cols="12">
      <v-textarea
        id="CondicionesEntrega"
        v-model="form.CondicionesEntrega"
        counter="250"
        label="Condiciones de Entrega"
        maxlength="250"
        persistent-counter
        prepend-inner-icon="mdi-truck-outline"
        :readonly="isReadonly"
        required
        :rules="isReadonly ? [] : [rules.required]"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12">
      <v-textarea
        id="Observaciones"
        v-model="form.Observaciones"
        counter="400"
        label="Observaciones"
        maxlength="400"
        persistent-counter
        prepend-inner-icon="mdi-text-box-outline"
        :readonly="isReadonly"
        variant="outlined"
      />
    </v-col>

    <!-- Anulación (solo si ya se tomó una decisión sobre la cotización) -->
    <template v-if="form.FechaDecision || form.ObservacionCierre">
      <v-col cols="12">
        <v-divider class="mb-2" />
        <p class="text-caption text-grey-darken-1 mb-2">Anulación de la cotización</p>
      </v-col>
      <v-col v-if="form.FechaDecision" cols="12" sm="3">
        <v-text-field
          label="Fecha de Decisión"
          :model-value="formatDate(form.FechaDecision)"
          prepend-inner-icon="mdi-calendar-check"
          readonly
          variant="outlined"
        />
      </v-col>
      <v-col v-if="form.ObservacionCierre" cols="12">
        <v-textarea
          label="Observación de Anulación"
          :model-value="form.ObservacionCierre"
          prepend-inner-icon="mdi-text-box-check-outline"
          readonly
          variant="outlined"
        />
      </v-col>
    </template>
  </v-row>
</template>

<script setup>
  import { toRefs } from 'vue'
  import DatePickerField from '@/shared/ui/fields/DatePickerField.vue'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
    tiposVenta: { type: Array, default: () => [] },
    metodosPago: { type: Array, default: () => [] },
    nombreListaPrecio: { type: String, default: '' },
  })

  const { form } = toRefs(props)
</script>

<style scoped></style>
