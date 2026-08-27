<template>
  <base-dialog
    color="primary"
    :disable-confirm="isEditing && !hasChanges"
    icon="mdi-package-variant"
    :label-confirm="labelConfirm"
    max-width="1200"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row class="mt-2">
          <!-- Columna del formulario -->
          <v-col cols="12" md="8">
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="form.IdProducto"
                  item-title="CodigoNombreProducto"
                  item-value="IdProducto"
                  :items="itemsAutocomplete"
                  label="Producto"
                  no-data-text="No hay productos disponibles en la lista de precios"
                  placeholder="Escribe código o nombre del producto"
                  prepend-inner-icon="mdi-package-variant"
                  :readonly="!isCreating || isReadonly"
                  required
                  :rules="[rules.required]"
                  variant="outlined"
                  @update:model-value="onProductoChange"
                />
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.Cantidad"
                  label="Cantidad"
                  prepend-inner-icon="mdi-counter"
                  :readonly="isReadonly"
                  required
                  :rules="[rules.required, cantidadPositivaRule]"
                  variant="outlined"
                  @keydown="blockKey($event, allow.onlyDigits)"
                  @paste="blockPaste($event, allow.onlyDigits)"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="precioUnitarioDisplay"
                  label="Precio Unitario"
                  prepend-inner-icon="mdi-currency-usd"
                  :readonly="isReadonly"
                  required
                  :rules="[rules.required, rules.maxCOP(1_000_000_000, 'El precio unitario')]"
                  variant="outlined"
                  @keydown="blockKey($event, allow.decimal)"
                  @paste="blockPaste($event, allow.decimal)"
                />
              </v-col>

              <v-col cols="4">
                <v-text-field
                  label="% IVA"
                  :model-value="form.PorcentajeIva"
                  prepend-inner-icon="mdi-percent"
                  readonly
                  variant="outlined"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="% Descuento Máximo"
                  :model-value="descuentoMaximoProducto ?? 0"
                  prepend-inner-icon="mdi-sale"
                  readonly
                  variant="outlined"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="form.PorcentajeDescuento"
                  label="% Descuento Aplicado"
                  prepend-inner-icon="mdi-label-percent-outline"
                  :readonly="descuentoAplicadoReadonly"
                  :rules="[rules.numeric, descuentoMaximoRule]"
                  variant="outlined"
                  @keydown="blockKey($event, allow.onlyDigits)"
                  @paste="blockPaste($event, allow.onlyDigits)"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.Observacion"
                  counter="250"
                  label="Observación"
                  maxlength="250"
                  persistent-counter
                  placeholder="Observación del producto (opcional)"
                  :readonly="isReadonly"
                  rows="3"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-col>

          <!-- Columna del resumen -->
          <v-col cols="12" md="4">
            <v-card class="pa-4" rounded="lg" variant="tonal">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-grey-darken-1">Valor Bruto</span>
                <span class="text-body-2">{{ formatCurrencyCOP(preview.bruto) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-grey-darken-1">Valor Descuento</span>
                <span class="text-body-2">- {{ formatCurrencyCOP(preview.valorDescuento) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-grey-darken-1">Subtotal</span>
                <span class="text-body-2 font-weight-medium">
                  {{ formatCurrencyCOP(preview.subtotal) }}
                </span>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-grey-darken-1">Valor IVA</span>
                <span class="text-body-2">{{ formatCurrencyCOP(preview.valorIva) }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between">
                <span class="text-body-1 font-weight-bold text-primary">Total Línea</span>
                <span class="text-body-1 font-weight-bold text-primary">
                  {{ formatCurrencyCOP(preview.total) }}
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { formatCOP, formatCurrencyCOP, parseCOP } from '@/shared/utils/currencyFormatter'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'
  import { calcularLinea, IVA_DEFAULT } from '../../utils/calculoLinea'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'edit', 'view'].includes(v),
    },
    detalle: { type: Object, default: null },
    existingDetalles: { type: Array, default: () => [] },
    productosDisponibles: { type: Array, default: () => [] },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const dialogTitle = computed(() => {
    if (isReadonly.value) return 'Ver Producto de la Cotización'
    if (isEditing.value) return 'Editar Producto'
    return 'Agregar Producto'
  })
  const labelConfirm = computed(
    () => ({ create: 'Agregar', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  const formRef = ref(null)
  const formInitial = {
    IdDetalle: null,
    IdProducto: null,
    CodigoProducto: '',
    NombreProducto: '',
    CodigoNombreProducto: '',
    Controlado: false,
    CadenaFrio: false,
    Regulado: false,
    Cantidad: 1,
    PrecioUnitario: 0,
    PorcentajeDescuento: 0,
    PorcentajeDescuentoMaximo: null,
    PorcentajeIva: IVA_DEFAULT,
    Observacion: '',
  }
  const form = ref({ ...formInitial })
  const formSnapshot = ref(null)

  // Si el producto ya guardado en la línea no está en la lista de precios actual
  // (p. ej. fue retirado de la lista), se agrega igual para que el select lo muestre.
  const itemsAutocomplete = computed(() => {
    const items = props.productosDisponibles
    if (!form.value.IdProducto || items.some((p) => p.IdProducto === form.value.IdProducto)) {
      return items
    }
    return [
      {
        IdProducto: form.value.IdProducto,
        CodigoNombreProducto: form.value.CodigoNombreProducto,
        PrecioBase: 0,
        PorcentajeDescuentoMaximo: null,
      },
      ...items,
    ]
  })

  // Se guarda en el propio form (no se recalcula desde productosDisponibles) porque en modo
  // edición/vista el máximo real es el que quedó congelado en el detalle guardado de la
  // cotización, no el que tenga hoy el producto en la lista de precios (puede haber cambiado).
  const descuentoMaximoProducto = computed(() => {
    const max = form.value.PorcentajeDescuentoMaximo
    return max === undefined || max === null ? null : Number(max)
  })

  // Wrapper de solo-presentación: el modelo interno (form.PrecioUnitario) se mantiene
  // como número puro, igual que el resto de montos del submódulo; solo se formatea al mostrar.
  const precioUnitarioDisplay = computed({
    get: () => formatCOP(form.value.PrecioUnitario),
    set: (val) => {
      form.value.PrecioUnitario = parseCOP(val) ?? 0
    },
  })

  // Si el producto no admite descuento (máximo 0), el campo de descuento aplicado queda bloqueado
  const descuentoAplicadoReadonly = computed(
    () => isReadonly.value || descuentoMaximoProducto.value === 0,
  )

  watch(descuentoMaximoProducto, (max) => {
    if (max === 0) form.value.PorcentajeDescuento = 0
  })

  function cantidadPositivaRule(v) {
    return Number(v) > 0 || 'La cantidad debe ser mayor a 0'
  }

  function descuentoMaximoRule(v) {
    if (descuentoMaximoProducto.value === null || !v) return true
    return (
      Number(v) <= descuentoMaximoProducto.value ||
      `El descuento no puede superar ${descuentoMaximoProducto.value}% para este producto`
    )
  }

  // Duplicados: mismo producto ya agregado a la cotización
  const isDuplicate = computed(() => {
    if (isReadonly.value || !form.value.IdProducto) return false
    return props.existingDetalles.some((det) => {
      if (isEditing.value && det.LocalId === props.detalle?.LocalId) return false
      return det.IdProducto === form.value.IdProducto
    })
  })

  function onProductoChange(idProducto) {
    const producto = props.productosDisponibles.find((p) => p.IdProducto === idProducto)
    if (!producto) return
    form.value.CodigoProducto = producto.CodigoProducto ?? ''
    form.value.NombreProducto = producto.NombreProducto ?? ''
    form.value.CodigoNombreProducto = producto.CodigoNombreProducto ?? ''
    form.value.Controlado = !!producto.Controlado
    form.value.CadenaFrio = !!producto.CadenaFrio
    form.value.Regulado = !!producto.Regulado
    form.value.PorcentajeIva = producto.PorcentajeIva ?? IVA_DEFAULT
    if (isCreating.value) {
      form.value.PrecioUnitario = Number(producto.PrecioBase) || 0
      form.value.PorcentajeDescuento = 0
      form.value.PorcentajeDescuentoMaximo =
        producto.PorcentajeDescuentoMaximo === undefined ||
        producto.PorcentajeDescuentoMaximo === null
          ? null
          : Number(producto.PorcentajeDescuentoMaximo)
    }
  }

  // Previsualización en vivo de los valores calculados de la línea
  const preview = computed(() =>
    calcularLinea({
      Cantidad: form.value.Cantidad,
      PrecioUnitario: form.value.PrecioUnitario,
      PorcentajeDescuento: form.value.PorcentajeDescuento,
      PorcentajeIva: form.value.PorcentajeIva,
    }),
  )

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    return hasObjectChanges(form.value, formSnapshot.value)
  })
  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes cambios sin guardar en este producto. ¿Deseas salir de todas formas?',
  })

  function precargarDetalle(detalle) {
    form.value = {
      ...formInitial,
      ...detalle,
      PrecioUnitario: Number(detalle.PrecioUnitario) || 0,
    }
    formSnapshot.value = { ...form.value }
  }

  function resetForm() {
    form.value = { ...formInitial }
    formSnapshot.value = null
    formRef.value?.resetValidation()
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }
      if (props.detalle) {
        precargarDetalle(props.detalle)
      } else {
        form.value = { ...formInitial }
        formSnapshot.value = { ...form.value }
      }
    },
  )

  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    if (isDuplicate.value) {
      $toast.warning('Este producto ya fue agregado a la cotización.')
      return
    }

    const cambios = isEditing.value ? getChangedFields(form.value, formSnapshot.value ?? {}) : {}
    const valores = calcularLinea({
      Cantidad: form.value.Cantidad,
      PrecioUnitario: form.value.PrecioUnitario,
      PorcentajeDescuento: form.value.PorcentajeDescuento,
      PorcentajeIva: form.value.PorcentajeIva,
    })

    const payload = {
      ...(isEditing.value ? { IdDetalle: form.value.IdDetalle } : {}),
      IdProducto: form.value.IdProducto,
      CodigoProducto: form.value.CodigoProducto,
      NombreProducto: form.value.NombreProducto,
      CodigoNombreProducto: form.value.CodigoNombreProducto,
      Controlado: form.value.Controlado,
      CadenaFrio: form.value.CadenaFrio,
      Regulado: form.value.Regulado,
      Cantidad: Number(form.value.Cantidad) || 0,
      PrecioUnitario: Number(form.value.PrecioUnitario) || 0,
      PorcentajeDescuento: Number(form.value.PorcentajeDescuento) || 0,
      PorcentajeDescuentoMaximo: descuentoMaximoProducto.value,
      PorcentajeIva: Number(form.value.PorcentajeIva) || 0,
      Observacion: form.value.Observacion,
      ValorDescuento: valores.valorDescuento,
      ValorIva: valores.valorIva,
      Subtotal: valores.subtotal,
      ...cambios,
    }

    emit('submit', { payload, mode: props.mode })
  }
</script>

<style scoped></style>
