<template>
  <v-row class="mt-2" density="compact">
    <v-col v-if="estadoActual" class="mb-4" cols="12">
      <div class="d-flex align-center ga-2">
        <v-chip
          class="font-weight-medium"
          :color="getEstadoColor(estadoActual.Nombre, DOMINIOS_ESTADO.ACTA)"
          variant="tonal"
        >
          <v-icon icon="mdi-tag" size="14" start />
          Estado: {{ estadoActual.Nombre }}
        </v-chip>
      </div>
    </v-col>
    <v-col v-if="form.FechaActa" cols="12" sm="4">
      <v-text-field
        label="Fecha Acta"
        :model-value="fechaActaDisplay"
        prepend-inner-icon="mdi-calendar"
        readonly
        variant="outlined"
      />
    </v-col>

    <!-- Proveedor + botón agregar -->
    <v-col cols="12" :sm="form.FechaActa ? 8 : 12">
      <div class="d-flex align-start ga-2">
        <v-autocomplete
          id="IdProveedor"
          v-model="form.IdProveedor"
          :clearable="canEdit('IdProveedor')"
          item-title="Nombre"
          item-value="IdProveedor"
          :items="proveedores"
          label="Proveedor"
          name="IdProveedor"
          prepend-inner-icon="mdi-truck"
          :readonly="!canEdit('IdProveedor')"
          required
          :rules="[rules.required]"
          style="flex: 1"
        />
        <v-tooltip v-if="canEdit('IdProveedor')" location="top" text="Agregar proveedor">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              color="primary"
              density="comfortable"
              icon="mdi-plus"
              style="margin-top: 4px; flex-shrink: 0"
              variant="tonal"
              @click="dialogProveedor = true"
            />
          </template>
        </v-tooltip>
      </div>
    </v-col>

    <v-col cols="12" :sm="isCreating ? 6 : 4">
      <v-autocomplete
        id="IdCedi"
        v-model="form.IdCedi"
        item-title="NombreCedi"
        item-value="IdCedi"
        :items="cedis"
        label="Cedi"
        prepend-inner-icon="mdi-warehouse"
        :readonly="!canEdit('IdCedi')"
        required
        :rules="[rules.required]"
        variant="outlined"
        @update:model-value="emit('cedi-change', $event)"
      />
    </v-col>
    <v-col cols="12" :sm="isCreating ? 6 : 4">
      <v-autocomplete
        id="IdBodega"
        v-model="form.IdBodega"
        item-title="NombreBodega"
        item-value="IdBodega"
        :items="bodegas"
        label="Bodega"
        prepend-inner-icon="mdi-door-open"
        :readonly="!canEdit('IdBodega')"
        required
        :rules="[rules.required]"
        variant="outlined"
      />
    </v-col>
    <v-col v-if="!isCreating" cols="12" sm="4">
      <v-text-field
        id="ValorMercanciaRecibida"
        label="Valor Mercancia"
        :model-value="valorMercanciaDisplay"
        prepend-inner-icon="mdi-currency-usd"
        readonly
        variant="outlined"
      />
    </v-col>

    <v-col cols="12" sm="3">
      <v-text-field
        id="PrefijoFacturaRecibida"
        v-model="form.PrefijoFacturaRecibida"
        :clearable="!isReadonly"
        label="Prefijo Factura"
        prepend-inner-icon="mdi-invoice-outline"
        :readonly="!canEdit('PrefijoFacturaRecibida')"
        required
        :rules="[rules.required]"
        variant="outlined"
        @keydown="blockKey($event, allow.onlyLetters)"
        @paste="blockPaste($event, allow.onlyLetters)"
      />
    </v-col>
    <v-col cols="12" sm="5">
      <v-text-field
        id="NumeroFacturaRecibida"
        v-model="form.NumeroFacturaRecibida"
        :clearable="!isReadonly"
        label="Número Factura"
        maxlength="20"
        prepend-inner-icon="mdi-invoice-text-outline"
        :readonly="!canEdit('NumeroFacturaRecibida')"
        required
        :rules="[rules.required, rules.numeric]"
        variant="outlined"
        @keydown="blockKey($event, allow.onlyDigits)"
        @paste="blockPaste($event, allow.onlyDigits)"
      />
    </v-col>
    <v-col cols="12" sm="4">
      <date-picker-field
        id="FechaFacturaRecibida"
        v-model="form.FechaFacturaRecibida"
        label="Fecha Factura"
        :max="today"
        :readonly="!canEdit('FechaFacturaRecibida')"
        required
        :rules="[rules.required]"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        v-model="form.Observaciones"
        counter="400"
        label="Observaciones / Orden de compra"
        maxlength="400"
        persistent-counter
        :readonly="!canEdit('Observaciones')"
        variant="outlined"
      />
    </v-col>

    <!-- Modal agregar proveedor -->
    <recepcion-proveedor-form-dialog v-model="dialogProveedor" @created="onProveedorCreado" />
  </v-row>
</template>

<script setup>
  import { computed, ref, toRefs } from 'vue'
  import DatePickerField from '@/shared/ui/fields/DatePickerField.vue'
  import { formatCOP } from '@/shared/utils/currencyFormatter'
  import { formatDateTime } from '@/shared/utils/dateFormatter'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { rules } from '@/shared/utils/validationRules'
  import RecepcionProveedorFormDialog from '../RecepcionProveedorFormDialog.vue'

  const props = defineProps({
    form: { type: Object, required: true },
    isReadonly: { type: Boolean, default: false },
    permisos: { type: Object, default: () => ({}) },
    estadosCatalogo: { type: Array, default: () => [] },
    proveedores: { type: Array, default: () => [] },
    cedis: { type: Array, default: () => [] },
    bodegas: { type: Array, default: () => [] },
  })

  const emit = defineEmits(['cedi-change', 'reload-proveedores'])
  const { form } = toRefs(props)

  const canEdit = (campo) => !props.isReadonly && (props.permisos[campo] ?? false)

  const estadoActual = computed(() =>
    props.form.IdEstado
      ? (props.estadosCatalogo.find((e) => e.IdEstado === props.form.IdEstado) ?? null)
      : null,
  )

  const isCreating = computed(() => !props.isReadonly && !props.form.IdEstado)

  const dialogProveedor = ref(false)

  const fechaActaDisplay = computed(() => {
    return props.form.FechaActa ? formatDateTime(props.form.FechaActa) : ''
  })

  const today = computed(() => new Date())

  function onProveedorCreado() {
    emit('reload-proveedores')
  }
  const valorMercanciaDisplay = computed(() => {
    const valor = props.form.ValorMercanciaRecibida
    return valor ? formatCOP(valor) : ''
  })
</script>

<style scoped></style>
