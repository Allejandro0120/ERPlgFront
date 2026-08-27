<template>
  <base-dialog
    color="primary"
    :disable-confirm="isReadonly || !hasChanges"
    icon="mdi-warehouse"
    label-confirm="Guardar y volver a productos"
    max-width="1100"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <div class="pa-1 pt-0">
        <!-- Resumen de cobertura: el nombre del producto y el CEDI ya están visibles fuera de este modal -->
        <v-card class="rounded-lg border mb-6" elevation="0">
          <v-card-text class="pa-4 d-flex justify-center">
            <div class="d-flex flex-wrap justify-center text-center" style="gap: 48px">
              <div>
                <div class="text-body-2 text-grey-darken-1 mb-1">Cotizado</div>
                <v-chip
                  class="font-weight-bold justify-center"
                  color="grey-darken-1"
                  style="min-width: 72px"
                  variant="tonal"
                >
                  {{ cantidadRequerida }}
                </v-chip>
              </div>
              <div>
                <div class="text-body-2 text-grey-darken-1 mb-1">Tomado</div>
                <v-chip
                  class="font-weight-bold justify-center"
                  color="success"
                  style="min-width: 72px"
                  variant="tonal"
                >
                  {{ totalTomado }}
                </v-chip>
              </div>
              <div>
                <div class="text-body-2 text-grey-darken-1 mb-1">Faltante</div>
                <v-chip
                  class="font-weight-bold justify-center"
                  :color="faltante > 0 ? 'primary' : 'success'"
                  style="min-width: 72px"
                  variant="tonal"
                >
                  {{ faltante }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Precio y condiciones comerciales heredadas de la cotización: solo lectura, ya
             quedaron fijas al cotizar y no se pueden modificar en el pedido -->
        <v-row class="mb-2" density="compact">
          <v-col cols="12" sm="4">
            <v-text-field
              label="Precio Unitario"
              :model-value="formatCOP(linea?.PrecioUnitario)"
              prepend-inner-icon="mdi-currency-usd"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              label="% IVA"
              :model-value="linea?.PorcentajeIva ?? 0"
              prepend-inner-icon="mdi-percent"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              label="% Desc. Máximo"
              :model-value="linea?.PorcentajeDescuentoMaximo ?? 0"
              prepend-inner-icon="mdi-sale"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-text-field
              label="% Descuento Aplicado"
              :model-value="linea?.PorcentajeDescuento ?? 0"
              prepend-inner-icon="mdi-label-percent-outline"
              readonly
              variant="outlined"
            />
          </v-col>
        </v-row>

        <!-- Disponibilidad en el cedi (ya viene ordenada por vencimiento) -->
        <div class="text-subtitle-1 font-weight-bold d-flex align-center gap-2 mb-3">
          <v-icon color="primary" icon="mdi-warehouse mx-1" size="20" />
          Disponible
        </div>

        <div
          v-if="!cargando && ubicaciones.length === 0"
          class="d-flex flex-column align-center justify-center py-8 rounded-lg mb-6"
          style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
        >
          <v-icon class="mb-2" color="grey-lighten-1" size="36">mdi-package-variant-closed</v-icon>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Este producto no tiene stock disponible en el CEDI de la cotización
          </p>
        </div>

        <base-table-local
          v-else
          class="rounded-lg border mb-8"
          :headers="headers"
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
                :disabled="isReadonly || item.Restante <= 0"
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
                :disabled="isReadonly || item.Restante <= 0"
                size="small"
                variant="tonal"
                @click="tomar(item)"
              >
                Tomar
              </v-btn>
            </div>
          </template>
        </base-table-local>

        <!-- Tomas ya registradas para esta línea -->
        <div class="text-subtitle-1 font-weight-bold d-flex align-center gap-2 mb-3">
          <v-icon color="success" icon="mdi-clipboard-check-outline mx-1" size="20" />
          Tomas realizadas
          <v-chip
            v-if="tomas.length > 0"
            class="ml-2"
            color="success"
            density="comfortable"
            label
            size="small"
            variant="tonal"
          >
            {{ tomas.length }}
          </v-chip>
        </div>

        <div
          v-if="tomas.length === 0"
          class="d-flex flex-column align-center justify-center py-8 rounded-lg"
          style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
        >
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Aún no has tomado unidades de ningún lote.
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

        <!-- Observación y cálculo del total, igual patrón que en cotizaciones -->
        <v-row align="stretch" density="compact">
          <v-col cols="12" md="8">
            <v-textarea
              v-model="observacion"
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
            </v-card>
          </v-col>
        </v-row>
      </div>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $toast } from '@/plugins/toast'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import { formatCOP, formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { calcularLinea } from '../../utils/calculoLinea'

  const props = defineProps({
    modelValue: Boolean,
    // Línea del pedido en curso (producto, cantidad requerida y tomas ya guardadas)
    linea: { type: Object, default: null },
    // Disponibilidad del producto en el cedi: lotes + ubicaciones con saldo
    ubicaciones: { type: Array, default: () => [] },
    cargando: { type: Boolean, default: false },
    isReadonly: { type: Boolean, default: false },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const tomas = ref([])
  const cantidadesInput = ref({})
  const observacion = ref('')

  const dialogTitle = computed(() => props.linea?.CodigoNombreProducto || 'Asignar producto')
  const cantidadRequerida = computed(() => Number(props.linea?.Cantidad) || 0)

  const totalTomado = computed(() =>
    tomas.value.reduce((acc, toma) => acc + (Number(toma.Cantidad) || 0), 0),
  )
  const faltante = computed(() => Math.max(0, cantidadRequerida.value - totalTomado.value))

  // Previsualización del total ya tomado (el faltante de cotización no se factura hasta
  // que se toma: no hay un "extra" facturable aquí, a diferencia del flujo de pedido libre).
  const preview = computed(() =>
    calcularLinea({
      Cantidad: totalTomado.value,
      PrecioUnitario: props.linea?.PrecioUnitario,
      PorcentajeDescuento: props.linea?.PorcentajeDescuento,
      PorcentajeIva: props.linea?.PorcentajeIva,
    }),
  )

  // Clave estable de una fila de inventario: un mismo producto puede estar en varias
  // ubicaciones con el mismo lote y en una misma ubicación con lotes distintos.
  const claveFila = (fila) => `${fila.IdLote ?? 'null'}-${fila.IdUbicacion}`

  // Lo disponible por fila se descuenta con lo que ya se tomó de esa misma combinación
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

  const headers = [
    { title: 'Lote', key: 'CodLote', sortable: false, searchable: true },
    { title: 'Ubicación', key: 'CodigoUbicacion', sortable: false, searchable: true },
    { title: 'Vence', key: 'Vence', sortable: false },
    { title: 'Disponible', key: 'Restante', sortable: false, align: 'center' },
    { title: 'Cantidad', key: 'acciones', sortable: false, align: 'end', width: '220px' },
  ]

  const headersTomas = [
    { title: '#', key: 'indice', sortable: false, width: '60px' },
    { title: 'Lote', key: 'CodLote', sortable: false },
    { title: 'Ubicación', key: 'Ubicacion', sortable: false },
    { title: 'Cantidad', key: 'Cantidad', sortable: false, align: 'center' },
  ]

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
      visible: !props.isReadonly,
      action: (item) => quitarToma(item.indice - 1),
    },
  ])

  const hasChanges = computed(() => {
    if ((props.linea?.Observacion ?? '') !== observacion.value) return true
    const originales = props.linea?.Asignaciones ?? []
    if (originales.length !== tomas.value.length) return true
    return tomas.value.some((toma, index) => {
      const original = originales[index]
      return (
        !original ||
        original.IdLote !== toma.IdLote ||
        original.IdUbicacion !== toma.IdUbicacion ||
        Number(original.Cantidad) !== Number(toma.Cantidad)
      )
    })
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly: computed(() => props.isReadonly),
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes tomas sin guardar para este producto. ¿Deseas salir de todas formas?',
  })

  watch(
    () => props.modelValue,
    (isOpen) => {
      cantidadesInput.value = {}
      tomas.value = isOpen ? (props.linea?.Asignaciones ?? []).map((toma) => ({ ...toma })) : []
      observacion.value = isOpen ? (props.linea?.Observacion ?? '') : ''
    },
  )

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
    if (cantidad > faltante.value) {
      $toast.warning(`Solo faltan ${faltante.value} unidades por cubrir de este producto.`)
      return
    }

    // Si ya se había tomado de la misma combinación lote + ubicación, se acumula
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

  function submitForm() {
    if (props.isReadonly) return
    emit('submit', {
      localId: props.linea?.LocalId,
      asignaciones: tomas.value,
      observacion: observacion.value,
    })
  }
</script>

<style scoped></style>
