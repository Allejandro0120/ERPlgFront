<template>
  <base-dialog
    color="primary"
    :disable-confirm="disableConfirm"
    icon="mdi-package-variant"
    :label-confirm="labelConfirm"
    max-width="1300"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row density="compact">
          <v-col cols="12">
            <v-autocomplete
              v-if="isCreating"
              v-model="form.IdProducto"
              item-title="CodigoNombreProducto"
              item-value="IdProducto"
              :items="productosDisponibles"
              label="Producto"
              no-data-text="No hay productos disponibles en la lista de precios y cedi seleccionados"
              placeholder="Escribe código o nombre del producto"
              prepend-inner-icon="mdi-package-variant"
              required
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onProductoChange"
            />
            <v-text-field
              v-else
              label="Producto"
              :model-value="form.CodigoNombreProducto"
              prepend-inner-icon="mdi-package-variant"
              readonly
              variant="outlined"
            />
          </v-col>
        </v-row>

        <template v-if="form.IdProducto">
          <v-row density="compact">
            <v-col cols="12" :sm="isReadonly ? 6 : 4">
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
            <v-col cols="6" :sm="isReadonly ? 3 : 2">
              <v-text-field
                label="% IVA"
                :model-value="form.PorcentajeIva"
                prepend-inner-icon="mdi-percent"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col v-if="!isReadonly" cols="6" sm="3">
              <v-text-field
                label="% Desc. Máximo"
                :model-value="descuentoMaximoProducto ?? 0"
                prepend-inner-icon="mdi-sale"
                readonly
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="3">
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
          </v-row>

          <template v-if="!isReadonly">
            <v-divider class="my-4" />
            <div class="text-subtitle-1 font-weight-bold d-flex align-center gap-2 mb-3">
              <v-icon color="primary" icon="mdi-warehouse mx-1" size="20" />
              Disponible en el cedi
            </div>

            <div
              v-if="!cargando && ubicaciones.length === 0"
              class="d-flex flex-column align-center justify-center py-8 rounded-lg mb-6"
              style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
            >
              <v-icon class="mb-2" color="grey-lighten-1" size="36"
                >mdi-package-variant-closed</v-icon
              >
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Este producto no tiene stock disponible en el CEDI seleccionado
              </p>
            </div>

            <base-table-local
              v-else
              class="rounded-lg border mb-6"
              :headers="headersDisponible"
              :items="filasDisponibles"
              :items-per-page="5"
              :loading="cargando"
              search-placeholder="Buscar lote o ubicación..."
              searchable
            >
              <template #item.Vence="{ item }">
                {{ item.FechaVencimiento ? formatDate(item.FechaVencimiento) : 'Sin vencimiento' }}
              </template>

              <template #item.Restante="{ item }">
                <v-chip
                  :color="item.Restante > 0 ? 'info' : 'grey'"
                  density="comfortable"
                  label
                  size="small"
                  variant="tonal"
                >
                  {{ item.Restante }}
                </v-chip>
              </template>

              <template #item.acciones="{ item }">
                <div class="d-flex align-center justify-end ga-3 py-2">
                  <v-text-field
                    v-model="cantidadesInput[item.Key]"
                    density="compact"
                    :disabled="item.Restante <= 0"
                    hide-details
                    placeholder="0"
                    style="max-width: 90px"
                    variant="outlined"
                    @keydown="blockKey($event, allow.onlyDigits)"
                    @paste="blockPaste($event, allow.onlyDigits)"
                  />
                  <v-btn
                    class="text-none"
                    color="primary"
                    :disabled="item.Restante <= 0"
                    size="small"
                    variant="tonal"
                    @click="tomar(item)"
                  >
                    Tomar
                  </v-btn>
                </div>
              </template>
            </base-table-local>
          </template>

          <div class="text-subtitle-1 font-weight-bold d-flex align-center gap-2 mb-3">
            <v-icon color="success" icon="mdi-clipboard-check-outline mx-1" size="20" />
            Tomas realizadas
            <v-chip
              v-if="totalTomado > 0"
              class="ml-2"
              color="success"
              density="comfortable"
              label
              size="small"
              variant="tonal"
            >
              {{ totalTomado }}
            </v-chip>
          </div>

          <div
            v-if="tomas.length === 0"
            class="d-flex flex-column align-center justify-center py-8 rounded-lg"
            style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
          >
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Aún no se ha tomado unidades de ningún lote.
            </p>
          </div>

          <base-table-local
            v-else
            class="rounded-lg border"
            :headers="headersTomas"
            :items="tomasConIndice"
            :loading="false"
            :row-actions="tomasRowActions"
            :searchable="false"
          >
            <template #item.Ubicacion="{ item }">
              {{ item.CodigoUbicacion }}
            </template>
          </base-table-local>

          <v-divider class="my-8" />

          <!-- Faltante y Observación a la izquierda, cálculo del total a la derecha -->
          <v-row align="stretch" density="compact">
            <v-col cols="12" md="8">
              <v-row density="compact">
                <v-col cols="12">
                  <v-text-field
                    v-model="form.CantidadFaltante"
                    hint="Unidades que no se pudieron tomar por falta de existencias (puede ser 0)"
                    label="Cantidad Faltante"
                    persistent-hint
                    prepend-inner-icon="mdi-alert-circle-outline"
                    :readonly="isReadonly"
                    :rules="[cantidadFaltanteRule]"
                    variant="outlined"
                    @keydown="blockKey($event, allow.onlyDigits)"
                    @paste="blockPaste($event, allow.onlyDigits)"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.Observacion"
                    class="h-100"
                    counter="250"
                    label="Observación"
                    maxlength="250"
                    persistent-counter
                    placeholder="Observación del producto (opcional)"
                    :readonly="isReadonly"
                    rows="4"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-col>

            <v-col cols="12" md="4">
              <v-card class="pa-4 h-100" rounded="lg" variant="tonal">
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

                <div v-if="mostrarAvisoNoFactura" class="text-caption text-warning mt-3">
                  Este producto aún no tiene unidades tomadas: el faltante declarado no se factura
                  hasta que haya stock disponible.
                </div>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $toast } from '@/plugins/toast'
  import { hasCollectionChanges, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import { formatCOP, formatCurrencyCOP, parseCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'
  import { calcularTotalesProducto } from '../../composables/pedido/usePedidoProductosLibre'
  import { IVA_DEFAULT } from '../../utils/calculoLinea'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'edit', 'view'].includes(v),
    },
    // Producto agrupado existente a editar/ver (mode 'edit' | 'view')
    linea: { type: Object, default: null },
    // Productos disponibles según lista de precios + cedi, ya sin los que están agregados
    // al pedido (solo se usan en mode 'create')
    productosDisponibles: { type: Array, default: () => [] },
    // Disponibilidad por lote/ubicación del producto elegido
    ubicaciones: { type: Array, default: () => [] },
    cargando: { type: Boolean, default: false },
  })

  const emit = defineEmits(['update:modelValue', 'submit', 'producto-change'])

  const isReadonly = computed(() => props.mode === 'view')
  const isCreating = computed(() => props.mode === 'create')

  const dialogTitle = computed(() => {
    if (isReadonly.value) return 'Ver Producto del Pedido'
    if (isCreating.value) return 'Agregar Producto'
    return 'Editar Producto'
  })
  const labelConfirm = computed(
    () => ({ create: 'Agregar', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  const formRef = ref(null)
  const formInitial = {
    IdProducto: null,
    CodigoProducto: '',
    NombreProducto: '',
    CodigoNombreProducto: '',
    Controlado: false,
    CadenaFrio: false,
    Regulado: false,
    PrecioUnitario: 0,
    PorcentajeDescuento: 0,
    PorcentajeDescuentoMaximo: null,
    PorcentajeIva: IVA_DEFAULT,
    Observacion: '',
    CantidadFaltante: 0,
  }
  const form = ref({ ...formInitial })

  const tomas = ref([])
  const cantidadesInput = ref({})

  // Se guarda en la propia línea (no se vuelve a buscar en productosDisponibles) porque
  // un producto ya agregado deja de aparecer en ese catálogo (ver productosDisponiblesParaAgregar),
  // y en modo edición seguiría sin poder mostrar/validar su descuento máximo si dependiera de él.
  const descuentoMaximoProducto = computed(() => {
    const max = form.value.PorcentajeDescuentoMaximo
    return max === undefined || max === null ? null : Number(max)
  })

  const precioUnitarioDisplay = computed({
    get: () => formatCOP(form.value.PrecioUnitario),
    set: (val) => {
      form.value.PrecioUnitario = parseCOP(val) ?? 0
    },
  })

  const descuentoAplicadoReadonly = computed(
    () => isReadonly.value || descuentoMaximoProducto.value === 0,
  )

  watch(descuentoMaximoProducto, (max) => {
    if (max === 0) form.value.PorcentajeDescuento = 0
  })

  function descuentoMaximoRule(v) {
    if (descuentoMaximoProducto.value === null || !v) return true
    return (
      Number(v) <= descuentoMaximoProducto.value ||
      `El descuento no puede superar ${descuentoMaximoProducto.value}% para este producto`
    )
  }

  function cantidadFaltanteRule(v) {
    if (v === '' || v === null || v === undefined) return true
    return Number(v) >= 0 || 'La cantidad faltante no puede ser negativa'
  }

  function onProductoChange(idProducto) {
    tomas.value = []
    cantidadesInput.value = {}
    form.value.CantidadFaltante = 0
    const producto = props.productosDisponibles.find((p) => p.IdProducto === idProducto)
    if (!producto) return
    form.value.CodigoProducto = producto.CodigoProducto ?? ''
    form.value.NombreProducto = producto.NombreProducto ?? ''
    form.value.CodigoNombreProducto = producto.CodigoNombreProducto ?? ''
    form.value.Controlado = !!producto.Controlado
    form.value.CadenaFrio = !!producto.CadenaFrio
    form.value.Regulado = !!producto.Regulado
    form.value.PorcentajeIva = producto.PorcentajeIva ?? IVA_DEFAULT
    form.value.PrecioUnitario = Number(producto.PrecioBase) || 0
    form.value.PorcentajeDescuento = 0
    form.value.PorcentajeDescuentoMaximo =
      producto.PorcentajeDescuentoMaximo === undefined ||
      producto.PorcentajeDescuentoMaximo === null
        ? null
        : Number(producto.PorcentajeDescuentoMaximo)
    emit('producto-change', idProducto)
  }

  // Clave estable de una fila de inventario: un mismo producto puede estar en varias
  // ubicaciones con el mismo lote y en una misma ubicación con lotes distintos.
  const claveFila = (fila) => `${fila.IdLote ?? 'null'}-${fila.IdUbicacion}`

  const filasDisponibles = computed(() =>
    props.ubicaciones.map((fila) => {
      const key = claveFila(fila)
      const yaTomado = tomas.value
        .filter((toma) => claveFila(toma) === key)
        .reduce((acc, toma) => acc + (Number(toma.Cantidad) || 0), 0)
      const disponible = Number(fila.CantidadDisponible) || 0
      return {
        ...fila,
        Key: key,
        CantidadDisponible: disponible,
        Restante: disponible - yaTomado,
      }
    }),
  )

  const headersDisponible = [
    { title: 'Lote', key: 'CodLote', sortable: false, searchable: true },
    { title: 'Ubicación', key: 'CodigoUbicacion', sortable: false, searchable: true },
    { title: 'Vence', key: 'Vence', sortable: true },
    { title: 'Disponible', key: 'Restante', sortable: true, align: 'center' },
    { title: 'Cantidad', key: 'acciones', sortable: false, align: 'end', width: '220px' },
  ]

  const headersTomas = [
    { title: '#', key: 'indice', sortable: false, width: '60px' },
    { title: 'Lote', key: 'CodLote', sortable: false },
    { title: 'Ubicación', key: 'Ubicacion', sortable: false },
    { title: 'Cantidad', key: 'Cantidad', sortable: false, align: 'center' },
  ]

  const totalTomado = computed(() =>
    tomas.value.reduce((acc, toma) => acc + (Number(toma.Cantidad) || 0), 0),
  )

  const tomasConIndice = computed(() =>
    tomas.value.map((toma, idx) => ({
      ...toma,
      indice: idx + 1,
      CodLote: toma.CodLote || 'Sin lote',
    })),
  )

  const tomasRowActions = computed(() => [
    {
      label: 'Quitar',
      icon: '$delete',
      color: 'error',
      visible: !isReadonly.value,
      action: (item) => quitarToma(item.indice - 1),
    },
  ])

  function tomar(fila) {
    const cantidad = Number(cantidadesInput.value[fila.Key])

    if (!cantidad || cantidad <= 0) {
      $toast.warning('Indica una cantidad mayor a 0 para tomar de este lote.')
      return
    }
    if (cantidad > fila.Restante) {
      $toast.warning(`Solo hay ${fila.Restante} unidades disponibles en este lote y ubicación.`)
      return
    }

    const existente = tomas.value.find((toma) => claveFila(toma) === fila.Key)
    if (existente) {
      existente.Cantidad = Number(existente.Cantidad) + cantidad
    } else {
      tomas.value.push({
        IdLote: fila.IdLote,
        CodLote: fila.CodLote,
        IdUbicacion: fila.IdUbicacion,
        CodigoUbicacion: fila.CodigoUbicacion,
        Cantidad: cantidad,
      })
    }

    cantidadesInput.value[fila.Key] = ''
  }

  function quitarToma(index) {
    tomas.value.splice(index, 1)
  }

  // Previsualización en vivo del total del producto, con la misma regla de facturación
  // que usa el back: el faltante solo se factura cuando ya hay algo tomado.
  const preview = computed(() =>
    calcularTotalesProducto({
      Tomas: tomas.value,
      CantidadFaltante: form.value.CantidadFaltante,
      PrecioUnitario: form.value.PrecioUnitario,
      PorcentajeDescuento: form.value.PorcentajeDescuento,
      PorcentajeIva: form.value.PorcentajeIva,
    }),
  )

  const mostrarAvisoNoFactura = computed(
    () => totalTomado.value === 0 && Number(form.value.CantidadFaltante) > 0,
  )

  const formSnapshot = ref(null)
  const tomasSnapshot = ref([])

  const hasEditChanges = computed(() => {
    if (!formSnapshot.value) return false
    return (
      hasObjectChanges(form.value, formSnapshot.value) ||
      hasCollectionChanges(tomas.value, tomasSnapshot.value)
    )
  })

  const disableConfirm = computed(() => {
    if (isReadonly.value) return true
    if (!form.value.IdProducto) return true
    if (tomas.value.length === 0 && Number(form.value.CantidadFaltante) <= 0) return true
    return !isCreating.value && !hasEditChanges.value
  })

  const hasChanges = computed(() => {
    if (isCreating.value) return !!form.value.IdProducto || tomas.value.length > 0
    return hasEditChanges.value
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes datos sin guardar en este producto. ¿Deseas salir de todas formas?',
  })

  function precargarLinea(linea) {
    form.value = {
      ...formInitial,
      ...linea,
      PrecioUnitario: Number(linea.PrecioUnitario) || 0,
      CantidadFaltante: Number(linea.CantidadFaltante) || 0,
    }
    tomas.value = (linea.Tomas ?? []).map((toma) => ({ ...toma }))
    formSnapshot.value = { ...form.value }
    tomasSnapshot.value = tomas.value.map((toma) => ({ ...toma }))
  }

  function resetForm() {
    form.value = { ...formInitial }
    tomas.value = []
    cantidadesInput.value = {}
    formSnapshot.value = null
    tomasSnapshot.value = []
    formRef.value?.resetValidation()
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }
      if (props.linea) {
        precargarLinea(props.linea)
      } else {
        form.value = { ...formInitial }
        tomas.value = []
      }
    },
  )

  async function submitForm() {
    if (isReadonly.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    const cantidadFaltante = Number(form.value.CantidadFaltante) || 0
    if (tomas.value.length === 0 && cantidadFaltante <= 0) {
      $toast.warning(
        'Toma alguna cantidad de un lote o indica una Cantidad Faltante mayor a 0 para agregar el producto.',
      )
      return
    }

    const datosComunes = {
      IdProducto: form.value.IdProducto,
      CodigoProducto: form.value.CodigoProducto,
      NombreProducto: form.value.NombreProducto,
      CodigoNombreProducto: form.value.CodigoNombreProducto,
      Controlado: form.value.Controlado,
      CadenaFrio: form.value.CadenaFrio,
      Regulado: form.value.Regulado,
      PrecioUnitario: Number(form.value.PrecioUnitario) || 0,
      PorcentajeDescuento: Number(form.value.PorcentajeDescuento) || 0,
      PorcentajeDescuentoMaximo: descuentoMaximoProducto.value,
      PorcentajeIva: Number(form.value.PorcentajeIva) || 0,
      Observacion: form.value.Observacion,
      Tomas: tomas.value.map((toma) => ({ ...toma, Cantidad: Number(toma.Cantidad) || 0 })),
      CantidadFaltante: cantidadFaltante,
    }

    if (isCreating.value) {
      emit('submit', { mode: 'create', datos: datosComunes })
      return
    }

    emit('submit', {
      mode: 'edit',
      localId: props.linea?.LocalId,
      cambios: datosComunes,
    })
  }
</script>

<style scoped></style>
