<template>
  <base-dialog
    v-model="internalValue"
    max-width="1200"
    title="Historial de Movimientos"
    icon="$history"
    color="blue-darken-3"
    :show-actions="false"
  >
    <template #content>
      <div class="pa-4 pt-0">
        <div class="d-flex flex-wrap align-start justify-space-between ga-4 mb-4">
          <div class="d-flex flex-column ga-1">
            <span class="text-h6 font-weight-bold text-black mb-0">
              {{ product?.NombreProducto || 'Producto' }}
            </span>
            <div class="d-flex align-center ga-2 mt-1">
              <span
                v-if="product?.CodigoProducto"
                class="text-body-2 text-grey-darken-1 font-weight-medium d-flex align-center"
              >
                <v-icon size="16" class="mr-1">mdi-barcode</v-icon>
                {{ product.CodigoProducto }}
              </span>

              <template v-if="product?.CodLote || product?.Lote">
                <span class="text-grey-lighten-1" v-if="product?.CodigoProducto">|</span>
                <span class="text-body-2 text-grey-darken-1 font-weight-medium d-flex align-center">
                  <v-icon size="16" class="mr-1">mdi-tag-multiple</v-icon>
                  Lote: {{ product.CodLote || product.Lote }}
                </span>
              </template>

              <template v-if="product?.CodUbicacion || product?.NombreUbicacion">
                <span
                  class="text-grey-lighten-1"
                  v-if="product?.CodigoProducto || product?.CodLote || product?.Lote"
                  >|</span
                >
                <span class="text-body-2 text-grey-darken-1 font-weight-medium d-flex align-center">
                  <v-icon size="16" class="mr-1">mdi-map-marker</v-icon>
                  {{ product.CodUbicacion || product.NombreUbicacion }}
                </span>
              </template>

              <span
                class="text-grey-lighten-1"
                v-if="
                  product?.CodigoProducto ||
                  product?.CodLote ||
                  product?.Lote ||
                  product?.Ubicacion ||
                  product?.NombreUbicacion
                "
                >|</span
              >
              <span class="text-body-2 text-blue-darken-3 font-weight-bold d-flex align-center">
                <v-icon size="16" class="mr-1">mdi-package-variant-closed</v-icon>
                Stock: {{ product?.CantidadDisponible || 0 }}
              </span>
            </div>
          </div>

          <div class="d-flex ga-6 text-right">
            <div>
              <div class="text-caption text-grey-darken-1 mb-1">Último Mov.</div>
              <div class="text-subtitle-1 font-weight-medium">
                {{
                  product?.UltimaActualizacion
                    ? formatDateTime(product.UltimaActualizacion)
                    : lastMovementDate || 'Sin movimientos recientes'
                }}
              </div>
            </div>
            <div class="d-flex align-end">
              <v-btn color="primary" prepend-icon="$swap" @click="showAjusteDialog = true">
                Ajuste
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Controles y Tabla -->
        <base-table
          ref="tableRef"
          :headers="headers"
          :items="movimientos"
          :loading="loadingTable"
          :total-items="totalItems"
          :items-per-page="5"
          empty-text="No se encontraron movimientos"
          class="rounded-lg"
          elevation="0"
          show-search-button
          @load="fetchData"
        >
          <!-- Filtros de Fecha -->
          <template #filters>
            <v-col cols="12" sm="5" md="4" lg="4">
              <date-range-filter
                v-model="dateRange"
                preset-value="30days"
                :show-preset-select="false"
                @change="handleDateRangeChange"
              />
            </v-col>
          </template>

          <template #item.FechaRegistro="{ item }">
            {{ formatDateTime(item.FechaRegistro) }}
          </template>

          <template #item.DescripcionMovimiento="{ item }">
            <v-chip
              :color="getDescColor(item.DescripcionMovimiento)"
              size="small"
              variant="tonal"
              class="font-weight-medium"
            >
              {{ item.DescripcionMovimiento }}
            </v-chip>
          </template>

          <template #item.Observaciones="{ item }">
            {{ item.Observaciones || '-' }}
          </template>

          <template #item.DocumentoReferencia="{ item }">
            {{ item.DocumentoReferencia || '-' }}
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
        :product="product"
        @saved="handleAjusteSaved"
      />
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { mercanciaService } from '@/api/services/mercanciaService'
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
  })

  const emit = defineEmits(['update:modelValue'])

  const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
  })

  const tableRef = ref(null)
  const movimientos = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)
  const showAjusteDialog = ref(false)

  const lastMovementDate = computed(() => {
    if (movimientos.value && movimientos.value.length > 0) {
      return formatDateTime(movimientos.value[0].FechaRegistro)
    }
    return null
  })

  const handleAjusteSaved = () => {
    tableRef.value?.reset()
    emit('update:modelValue', false) // Emitimos el evento para cerrar el modal
  }

  const headers = [
    { title: 'Fecha', key: 'FechaRegistro', sortable: true },
    { title: 'Descripción', key: 'DescripcionMovimiento', sortable: false },
    { title: 'Doc. Referencia', key: 'DocumentoReferencia', sortable: false },
    { title: 'Observación', key: 'Observaciones', sortable: false },
    { title: 'Usuario', key: 'CodigoUsuario', sortable: false },
    { title: 'Cantidad', key: 'Cantidad', sortable: true, align: 'end' },
  ]

  const getDescColor = (desc) => {
    const text = (desc || '').toLowerCase()
    if (text.includes('negativo') || text.includes('salida')) return 'red'
    if (text.includes('positivo') || text.includes('entrada') || text.includes('devolución'))
      return 'blue-darken-1'
    if (text.includes('transferencia')) return 'teal'
    return 'grey'
  }

  const getCantidadColor = (item) => {
    const isNegative = isNegativeAmount(item)
    return isNegative ? 'text-red font-weight-bold' : 'text-blue-darken-3 font-weight-bold'
  }

  const isNegativeAmount = (item) => {
    const text = (item.DescripcionMovimiento || '').toLowerCase()
    return text.includes('negativo') || text.includes('salida') || item.Cantidad < 0
  }

  const formatCantidad = (item) => {
    const prefix = isNegativeAmount(item) ? '-' : '+'
    return `${prefix} ${Math.abs(item.Cantidad)}`
  }

  const dateRange = ref({})

  const handleDateRangeChange = () => {
    tableRef.value?.reset()
  }

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    if (!props.product?.IdProducto) return

    loadingTable.value = true
    try {
      const filters = {}
      if (dateRange.value?.start) filters.startDate = dateRange.value.start
      if (dateRange.value?.end) filters.endDate = dateRange.value.end

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
