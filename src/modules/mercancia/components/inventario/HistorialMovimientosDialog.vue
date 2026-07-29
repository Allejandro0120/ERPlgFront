<template>
  <base-dialog
    v-model="internalValue"
    color="blue-darken-3"
    icon="$history"
    max-width="1200"
    :show-actions="false"
    title="Historial de Movimientos"
  >
    <template #content>
      <div class="pa-1 pt-0">
        <div class="d-flex flex-column flex-md-row align-start justify-space-between ga-4 mb-4">
          <div class="d-flex flex-column ga-1">
            <span class="text-subtitle-1 text-sm-h6 font-weight-bold text-black mb-0">
              {{ product?.NombreProducto || 'Producto' }}
            </span>
            <div class="d-flex flex-wrap align-center ga-2 mt-1">
              <span
                v-if="product?.CodigoProducto"
                class="text-body-2 text-grey-darken-1 font-weight-medium d-flex align-center"
              >
                <v-icon class="mr-1" size="16">mdi-barcode</v-icon>
                {{ product.CodigoProducto }}
              </span>

              <template v-if="product?.CodLote || product?.Lote">
                <span v-if="product?.CodigoProducto" class="text-grey-lighten-1">|</span>
                <span class="text-body-2 text-grey-darken-1 font-weight-medium d-flex align-center">
                  <v-icon class="mr-1" size="16">mdi-tag-multiple</v-icon>
                  Lote: {{ product.CodLote || product.Lote }}
                </span>
              </template>

              <template v-if="product?.CodUbicacion || product?.NombreUbicacion">
                <span
                  v-if="product?.CodigoProducto || product?.CodLote || product?.Lote"
                  class="text-grey-lighten-1"
                  >|</span
                >
                <span class="text-body-2 text-grey-darken-1 font-weight-medium d-flex align-center">
                  <v-icon class="mr-1" size="16">mdi-map-marker</v-icon>
                  {{ product.CodUbicacion || product.NombreUbicacion }}
                </span>
              </template>

              <span
                v-if="
                  product?.CodigoProducto ||
                  product?.CodLote ||
                  product?.Lote ||
                  product?.Ubicacion ||
                  product?.NombreUbicacion
                "
                class="text-grey-lighten-1"
                >|</span
              >
              <span class="text-body-2 text-blue-darken-3 font-weight-bold d-flex align-center">
                <v-icon class="mr-1" size="16">mdi-package-variant-closed</v-icon>
                Stock: {{ product?.CantidadDisponible || 0 }}
              </span>
            </div>
          </div>

          <div
            class="d-flex flex-column flex-sm-row ga-3 ga-sm-6 w-100 w-md-auto text-left text-sm-right"
          >
            <div class="w-100 w-sm-auto">
              <div class="text-caption text-grey-darken-1 mb-1">Último Mov.</div>
              <div class="text-subtitle-1 font-weight-medium">
                {{
                  product?.UltimaActualizacion
                    ? formatDateTime(product.UltimaActualizacion)
                    : lastMovementDate || 'Sin movimientos recientes'
                }}
              </div>
            </div>
            <div class="d-flex align-end justify-start justify-sm-end">
              <v-btn
                class="w-100 w-sm-auto"
                color="primary"
                prepend-icon="$swap"
                @click="showAjusteDialog = true"
              >
                Ajuste
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Controles y Tabla -->
        <base-table
          ref="tableRef"
          class="rounded-lg"
          elevation="0"
          empty-text="No se encontraron movimientos para el rango de fechas seleccionado."
          :headers="headers"
          :items="movimientos"
          :items-per-page="5"
          :loading="loadingTable"
          show-search-button
          :total-items="totalItems"
          @load="fetchData"
        >
          <!-- Filtros de Fecha -->
          <template #filters>
            <v-col cols="12" lg="4" md="5" sm="12">
              <date-range-filter
                v-model="dateRange"
                :disabled="loadingTable"
                end-label="Hasta"
                preset-value="30days"
                :show-preset-select="false"
                start-label="Desde"
                @change="handleDateRangeChange"
              />
            </v-col>
            <v-col cols="12" lg="4" md="5" sm="12">
              <v-autocomplete
                v-model="selectedTipoAjuste"
                :clearable="true"
                density="compact"
                :disabled="loadingTable"
                hide-details
                item-title="Descripcion"
                item-value="IdTipoMovimiento"
                :items="tiposAjuste"
                label="Tipo de ajuste"
                :loading="loadingTiposAjuste"
                variant="outlined"
                @update:model-value="handleTipoAjusteChange"
              />
            </v-col>
          </template>

          <template #item.FechaRegistro="{ item }">
            <span class="text-body-2 text-sm-body-1">
              {{ formatDateTime(item.FechaRegistro) }}
            </span>
          </template>

          <template #item.DescripcionMovimiento="{ item }">
            <v-tooltip
              v-if="hasDocumentoReferencia(item)"
              location="top"
              :text="getDocumentoReferenciaText(item)"
            >
              <template #activator="{ props: tooltipProps }">
                <v-chip
                  v-bind="tooltipProps"
                  class="font-weight-medium text-wrap"
                  :color="getDescColor(item.DescripcionMovimiento)"
                  size="small"
                  variant="tonal"
                >
                  {{ item.DescripcionMovimiento }}
                </v-chip>
              </template>
            </v-tooltip>

            <v-chip
              v-else
              class="font-weight-medium text-wrap"
              :color="getDescColor(item.DescripcionMovimiento)"
              size="small"
              variant="tonal"
            >
              {{ item.DescripcionMovimiento }}
            </v-chip>
          </template>

          <template #item.UbicacionOrigen="{ item }">
            <span class="text-body-2">{{ item.UbicacionOrigen || '-' }}</span>
          </template>

          <template #item.UbicacionDestino="{ item }">
            <span class="text-body-2">{{ item.UbicacionDestino || '-' }}</span>
          </template>

          <template #item.Observaciones="{ item }">
            <span v-if="!item.Observaciones">-</span>
            <v-tooltip v-else location="top" max-width="400" :text="item.Observaciones">
              <template #activator="{ props: tooltipProps }">
                <span v-bind="tooltipProps" class="d-inline-block text-body-2">
                  {{ item.Observaciones }}
                </span>
              </template>
            </v-tooltip>
          </template>

          <template #item.Cantidad="{ item }">
            <span :class="getCantidadColor(item)">
              {{ formatCantidad(item) }}
            </span>
          </template>
        </base-table>
      </div>

      <ajuste-inventario-dialog
        v-model="showAjusteDialog"
        :cedi="cedi"
        :product="product"
        @saved="handleAjusteSaved"
      />
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { mercanciaService } from '@/api/services/mercanciaService'
  import { useTiposAjusteInventario } from '@/modules/mercancia/composables/inventario/useTiposAjusteInventario'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import BaseTable from '@/shared/ui/BaseTable.vue'
  import DateRangeFilter from '@/shared/ui/DateRangeFilter.vue'
  import { formatDateTime } from '@/shared/utils/dateFormatter'
  import AjusteInventarioDialog from './AjusteInventarioDialog.vue'

  const props = defineProps({
    modelValue: Boolean,
    product: {
      type: Object,
      default: null,
    },
    cedi: {
      type: Number,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'saved'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
  })

  const tableRef = ref(null)
  const movimientos = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)
  const showAjusteDialog = ref(false)
  const { tiposAjuste, loadTiposAjusteInventario, loadingTiposAjuste } = useTiposAjusteInventario()
  const selectedTipoAjuste = ref(null)

  onMounted(async () => {
    try {
      await loadTiposAjusteInventario()
    } catch (error) {
      console.error('Error cargando tipos de ajuste:', error)
    }
  })

  const lastMovementDate = computed(() => {
    if (movimientos.value && movimientos.value.length > 0) {
      return formatDateTime(movimientos.value[0].FechaRegistro)
    }
    return null
  })

  function handleAjusteSaved() {
    tableRef.value?.reset()
    emit('saved')
    emit('update:modelValue', false) // Emitimos el evento para cerrar el modal
  }

  const headers = [
    { title: 'Fecha', key: 'FechaRegistro', sortable: true },
    { title: 'Tipo', key: 'DescripcionMovimiento', sortable: false },
    { title: 'Ubicación Origen', key: 'UbicacionOrigen', sortable: false },
    { title: 'Ubicación Destino', key: 'UbicacionDestino', sortable: false },
    { title: 'Observación', key: 'Observaciones', sortable: false },
    { title: 'Usuario', key: 'CodigoUsuario', sortable: false },
    { title: 'Cantidad', key: 'Cantidad', sortable: true, align: 'end' },
  ]

  function getDescColor(desc) {
    const text = (desc || '').toLowerCase()
    if (text.includes('negativo') || text.includes('salida')) return 'red'
    if (text.includes('positivo') || text.includes('entrada') || text.includes('devolución'))
      return 'blue-darken-1'
    if (text.includes('transferencia')) return 'teal'
    return 'grey'
  }

  function hasDocumentoReferencia(item) {
    const text = (item?.DescripcionMovimiento || '').toLowerCase()
    return (text.includes('entrada') || text.includes('salida')) && !!item?.DocumentoReferencia
  }

  function getDocumentoReferenciaText(item) {
    return `Documento referencia: ${item.DocumentoReferencia || '-'}`
  }

  function getCantidadColor(item) {
    const isNegative = isNegativeAmount(item)
    return isNegative ? 'text-red font-weight-bold' : 'text-blue-darken-3 font-weight-bold'
  }

  function isNegativeAmount(item) {
    return Number(item.FactorConversion) < 0
  }

  function formatCantidad(item) {
    const prefix = isNegativeAmount(item) ? '-' : '+'
    return `${prefix} ${Math.abs(item.Cantidad)}`
  }

  const dateRange = ref({})

  function handleDateRangeChange() {
    tableRef.value?.reset()
  }

  function handleTipoAjusteChange() {
    tableRef.value?.reset()
  }

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    if (!props.product?.IdProducto) return

    loadingTable.value = true
    try {
      const filters = {}
      if (dateRange.value?.start) filters.startDate = dateRange.value.start
      if (dateRange.value?.end) filters.endDate = dateRange.value.end
      if (selectedTipoAjuste.value) filters.IdTipoMovimiento = selectedTipoAjuste.value

      const response = await mercanciaService.getKardex(
        props.product.IdProducto,
        props.product.IdLote || null,
        props.product.IdUbicacion || null,
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )

      if (response.data?.success) {
        movimientos.value = response.data.data.data || []
        totalItems.value = response.data.data.totalRecords || 0
      }
    } catch (error) {
      console.error('Error al obtener movimientos:', error)
      movimientos.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen && tableRef.value) {
        tableRef.value.reset()
      }
    },
  )
</script>
