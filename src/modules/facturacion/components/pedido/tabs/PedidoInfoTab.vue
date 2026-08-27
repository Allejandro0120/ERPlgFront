<template>
  <v-row class="mt-2" density="compact">
    <!-- Estado del pedido (solo disponible al ver un pedido ya creado) -->
    <v-col v-if="origen.Estado" class="mb-4 d-flex flex-wrap ga-2" cols="12">
      <v-chip
        class="font-weight-medium"
        :color="getEstadoColor(origen.Estado, DOMINIOS_ESTADO.PEDIDO)"
        size="small"
        variant="tonal"
      >
        <v-icon icon="mdi-tag" size="14" start />
        Estado: {{ formatEstadoTexto(origen.Estado) }}
      </v-chip>
    </v-col>

    <!-- Valor pedido/despachado/pendiente: solo disponible al ver un pedido ya creado -->
    <v-col v-if="origen.ValorPedido !== null && origen.ValorPedido !== undefined" cols="12">
      <v-card class="pa-3 mb-2" rounded="lg" variant="tonal">
        <v-row density="compact">
          <v-col class="text-center" cols="12" sm="4">
            <div class="text-caption text-grey-darken-1">Valor Pedido</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatCurrencyCOP(origen.ValorPedido) }}
            </div>
          </v-col>
          <v-col class="text-center" cols="12" sm="4">
            <div class="text-caption text-grey-darken-1">Valor Despachado</div>
            <div class="text-body-1 font-weight-bold text-purple-darken-3">
              {{ formatCurrencyCOP(origen.ValorDespachado) }}
            </div>
          </v-col>
          <v-col class="text-center" cols="12" sm="4">
            <div class="text-caption text-grey-darken-1">Valor Pendiente</div>
            <div class="text-body-1 font-weight-bold text-orange-darken-2">
              {{ formatCurrencyCOP(origen.ValorPendiente) }}
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-col>

    <!-- Datos heredados de la cotización: el back los resuelve desde el origen -->
    <v-col v-if="origen.Cliente" cols="12" sm="8">
      <v-text-field
        label="Cliente"
        :model-value="origen.Cliente"
        prepend-inner-icon="mdi-account"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col v-if="origen.Cliente" cols="12" sm="4">
      <v-text-field
        label="Identificación"
        :model-value="origen.NumeroIdentificacionCliente"
        prepend-inner-icon="mdi-card-account-details-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- Fila 2: vigencia (al pasar cotización a pedido) o cotización de origen (al ver un
         pedido ya creado) + condiciones comerciales -->
    <v-col v-if="modo === 'cotizacion'" cols="12" :sm="colCondiciones">
      <v-text-field
        label="Vigencia Hasta"
        :model-value="formatDate(origen.VigenciaHasta)"
        prepend-inner-icon="mdi-calendar-clock-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col v-else-if="origen.Cotizacion" cols="12" :sm="colCondiciones">
      <v-text-field
        label="Cotización origen"
        :model-value="origen.Cotizacion"
        prepend-inner-icon="mdi-file-document-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" :sm="colCondiciones">
      <v-select
        v-if="modo === 'libre' || modo === 'edit'"
        id="IdTipoVenta"
        v-model="form.IdTipoVenta"
        item-title="Nombre"
        item-value="IdTipoVenta"
        :items="tiposVenta"
        label="Tipo de Venta"
        prepend-inner-icon="mdi-cash-check"
        required
        :rules="[rules.required]"
        variant="outlined"
      />
      <v-text-field
        v-else
        label="Tipo de Venta"
        :model-value="origen.TipoVenta"
        prepend-inner-icon="mdi-cash-check"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" :sm="colCondiciones">
      <v-select
        v-if="modo === 'libre' || modo === 'edit'"
        id="IdMetodoPago"
        v-model="form.IdMetodoPago"
        item-title="Nombre"
        item-value="IdMetodoPago"
        :items="metodosPago"
        label="Método de Pago"
        prepend-inner-icon="mdi-credit-card-outline"
        required
        :rules="[rules.required]"
        variant="outlined"
      />
      <v-text-field
        v-else
        label="Método de Pago"
        :model-value="origen.MetodoPago"
        prepend-inner-icon="mdi-credit-card-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- Fila 3: lista de precios + usuario que creó el pedido (si aplica) + cedi -->
    <v-col cols="12" :sm="colListaUsuarioCedi">
      <v-text-field
        label="Lista de Precios"
        :model-value="origen.NombreListaPrecio"
        prepend-inner-icon="mdi-tag-text"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col v-if="origen.Usuario" cols="12" :sm="colListaUsuarioCedi">
      <v-text-field
        label="Usuario"
        :model-value="origen.Usuario"
        prepend-inner-icon="mdi-account-circle-outline"
        readonly
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" :sm="colListaUsuarioCedi">
      <v-text-field
        label="CEDI"
        :model-value="origen.NombreCedi"
        prepend-inner-icon="mdi-warehouse"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col v-if="origen.DireccionEntrega" cols="12">
      <v-text-field
        label="Dirección de entrega"
        :model-value="origen.DireccionEntrega"
        prepend-inner-icon="mdi-map-marker-outline"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- Datos propios del pedido -->
    <v-col cols="12" sm="4">
      <v-text-field
        id="ContactoRecepcion"
        v-model="form.ContactoRecepcion"
        :clearable="!isReadonly"
        label="Contacto de recepción"
        maxlength="120"
        prepend-inner-icon="mdi-account-box-outline"
        :readonly="isReadonly"
        variant="outlined"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        id="TelefonoContacto"
        v-model="form.TelefonoContacto"
        :clearable="!isReadonly"
        label="Teléfono de contacto"
        maxlength="11"
        prepend-inner-icon="mdi-phone"
        :readonly="isReadonly"
        :rules="[rules.onlyDigitsGuion]"
        variant="outlined"
        @keydown="blockKey($event, allow.numericWithDash)"
        @paste="blockPaste($event, allow.numericWithDash)"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        id="Observaciones"
        v-model="form.Observaciones"
        counter="500"
        label="Observaciones"
        maxlength="500"
        persistent-counter
        placeholder="Indicaciones de entrega, horarios, etc. (opcional)"
        :readonly="isReadonly"
        rows="3"
        variant="outlined"
      />
    </v-col>

    <!-- Cadena de frío: si se activa, las temperaturas son obligatorias (lo valida también el back) -->
    <v-col cols="12" sm="4">
      <v-switch
        id="RequiereCadenaFrio"
        v-model="form.RequiereCadenaFrio"
        base-color="grey-lighten-1"
        color="info"
        density="comfortable"
        hide-details
        label="Requiere cadena de frío"
        :readonly="isReadonly"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        id="TemperaturaMinimaC"
        ref="temperaturaMinimaRef"
        v-model="form.TemperaturaMinimaC"
        :disabled="!form.RequiereCadenaFrio"
        label="Temperatura mínima (°C)"
        prepend-inner-icon="mdi-thermometer-low"
        :readonly="isReadonly"
        :required="form.RequiereCadenaFrio"
        :rules="reglasTemperaturaMinima"
        variant="outlined"
        @keydown="blockKey($event, allow.decimal)"
        @paste="blockPaste($event, allow.decimal)"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <v-text-field
        id="TemperaturaMaximaC"
        ref="temperaturaMaximaRef"
        v-model="form.TemperaturaMaximaC"
        :disabled="!form.RequiereCadenaFrio"
        label="Temperatura máxima (°C)"
        prepend-inner-icon="mdi-thermometer-high"
        :readonly="isReadonly"
        :required="form.RequiereCadenaFrio"
        :rules="reglasTemperaturaMaxima"
        variant="outlined"
        @keydown="blockKey($event, allow.decimal)"
        @paste="blockPaste($event, allow.decimal)"
      />
    </v-col>

    <!-- Historial de facturaciones: solo disponible al ver un pedido ya creado -->
    <template v-if="origen.Facturaciones && origen.Facturaciones.length > 0">
      <v-col cols="12">
        <v-divider class="mb-3" />
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon color="purple-darken-3" icon="mdi-file-document-multiple-outline" size="20" />
          <span class="text-subtitle-1 font-weight-bold">Facturaciones emitidas</span>
          <v-chip color="purple-darken-3" density="comfortable" label size="small" variant="tonal">
            {{ origen.Facturaciones.length }}
          </v-chip>
        </div>
      </v-col>
      <v-col
        v-for="facturacion in origen.Facturaciones"
        :key="facturacion.Id"
        cols="12"
        md="4"
        sm="6"
      >
        <v-card class="pa-3 h-100 rounded-lg border" elevation="0">
          <div class="d-flex align-center ga-2 mb-2">
            <v-avatar color="purple-darken-3" size="36" variant="tonal">
              <v-icon icon="mdi-file-document-check-outline" size="20" />
            </v-avatar>
            <div class="flex-grow-1" style="min-width: 0">
              <div class="text-body-2 font-weight-bold text-truncate">
                {{ facturacion.OrderSettlement }}
              </div>
              <div class="text-caption text-grey-darken-1">
                {{ formatDate(facturacion.FechaDocumento) }}
              </div>
            </div>
          </div>
          <v-divider class="mb-2" />
          <div class="d-flex justify-space-between align-center">
            <span class="text-caption text-grey-darken-1">Total</span>
            <span class="text-body-2 font-weight-bold text-purple-darken-3">
              {{ formatCurrencyCOP(facturacion.Total) }}
            </span>
          </div>
        </v-card>
      </v-col>
    </template>

    <!-- Anulación: solo aplica cuando el pedido ya quedó en estado Anulado -->
    <template v-if="origen.Estado === 'Anulado'">
      <v-col cols="12">
        <v-divider class="mb-2" />
        <p class="text-caption text-grey-darken-1 mb-2">Anulación del pedido</p>
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          label="Fecha de Decisión"
          :model-value="formatDate(origen.FechaDecision)"
          prepend-inner-icon="mdi-calendar-check"
          readonly
          variant="outlined"
        />
      </v-col>
      <v-col cols="12">
        <v-textarea
          label="Observación de Anulación"
          :model-value="origen.ObservacionCierre"
          prepend-inner-icon="mdi-text-box-check-outline"
          readonly
          variant="outlined"
        />
      </v-col>
    </template>

    <!-- Cierre con faltante: solo aplica cuando el pedido quedó en estado Cerrado_Con_Faltante -->
    <template v-if="origen.Estado === 'Cerrado_Con_Faltante'">
      <v-col cols="12">
        <v-divider class="mb-2" />
        <p class="text-caption text-grey-darken-1 mb-2">Cierre con faltante</p>
      </v-col>
      <v-col cols="12" sm="3">
        <v-text-field
          label="Fecha de Decisión"
          :model-value="formatDate(origen.FechaDecision)"
          prepend-inner-icon="mdi-calendar-check"
          readonly
          variant="outlined"
        />
      </v-col>
      <v-col cols="12">
        <v-textarea
          label="Observación de Cierre"
          :model-value="origen.ObservacionCierre"
          prepend-inner-icon="mdi-text-box-check-outline"
          readonly
          variant="outlined"
        />
      </v-col>
    </template>
  </v-row>
</template>

<script setup>
  import { computed, ref, toRefs, watch } from 'vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { DOMINIOS_ESTADO, formatEstadoTexto, getEstadoColor } from '@/shared/utils/statusColors'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    form: { type: Object, required: true },
    // Datos de solo lectura resueltos según el origen del pedido (ver PedidoDialog.origenModo)
    origen: { type: Object, default: () => ({}) },
    // 'cotizacion' | 'libre' | 'view'
    modo: { type: String, default: 'libre' },
    isReadonly: { type: Boolean, default: false },
    tiposVenta: { type: Array, default: () => [] },
    metodosPago: { type: Array, default: () => [] },
  })

  const { form } = toRefs(props)

  const temperaturaMinimaRef = ref(null)
  const temperaturaMaximaRef = ref(null)

  // Cada fila reparte el ancho entre los campos que realmente se muestran, para no dejar
  // huecos cuando el primer campo no aplica (pedido libre / aún no creado).
  const colCondiciones = computed(() =>
    props.modo === 'cotizacion' || props.origen?.Cotizacion ? 4 : 6,
  )
  const colListaUsuarioCedi = computed(() => (props.origen?.Usuario ? 4 : 6))

  function temperaturaRule(v) {
    if (v === null || v === undefined || v === '') return true
    return !Number.isNaN(Number(String(v).replace(',', '.'))) || 'Ingresa una temperatura válida'
  }

  function rangoTemperaturaRule() {
    if (!form.value.RequiereCadenaFrio) return true
    const min = Number(String(form.value.TemperaturaMinimaC).replace(',', '.'))
    const max = Number(String(form.value.TemperaturaMaximaC).replace(',', '.'))
    if (Number.isNaN(min) || Number.isNaN(max)) return true
    return min < max || 'La temperatura mínima debe ser menor a la máxima'
  }

  const reglasTemperaturaMinima = computed(() =>
    form.value.RequiereCadenaFrio
      ? [rules.required, temperaturaRule, rangoTemperaturaRule]
      : [temperaturaRule],
  )
  const reglasTemperaturaMaxima = computed(() =>
    form.value.RequiereCadenaFrio
      ? [rules.required, temperaturaRule, rangoTemperaturaRule]
      : [temperaturaRule],
  )

  // Al desactivar la cadena de frío se limpian las temperaturas para no enviarlas al back
  watch(
    () => form.value.RequiereCadenaFrio,
    (requiere) => {
      if (!requiere) {
        form.value.TemperaturaMinimaC = ''
        form.value.TemperaturaMaximaC = ''
      }
    },
  )

  // rangoTemperaturaRule depende de ambos campos, pero Vuetify solo revalida el campo cuyo
  // valor cambió: si el error quedó en mínima y el usuario corrige máxima, el mensaje de
  // mínima no se limpia solo. Se fuerza la revalidación cruzada del campo contrario.
  watch(
    () => form.value.TemperaturaMaximaC,
    () => temperaturaMinimaRef.value?.validate(),
  )
  watch(
    () => form.value.TemperaturaMinimaC,
    () => temperaturaMaximaRef.value?.validate(),
  )
</script>

<style scoped></style>
