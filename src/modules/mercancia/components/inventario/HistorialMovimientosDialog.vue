<template>
  <base-dialog
    v-model="internalValue"
    max-width="1200"
    persistent
    title="Historial de Movimientos"
    icon="$history"
    color="blue-darken-3"
  >
    <template #content>
      <div class="pa-4 pt-0">
        <!-- Resumen de Producto -->
        <v-card class="mb-4 bg-grey-lighten-4 rounded-lg" elevation="0" border>
          <v-card-text class="d-flex flex-wrap align-center justify-space-between ga-4 py-3">
            <div>
              <div class="text-caption text-grey-darken-1 font-weight-medium mb-1">PRODUCTO</div>
              <div class="d-flex align-center ga-2">
                <span class="text-h6 text-blue-darken-3 font-weight-bold mb-0">
                  {{ product?.NombreProducto || 'ACETAMINOFEN 20MG' }}
                </span>
                <v-chip
                  size="small"
                  variant="tonal"
                  color="blue-darken-3"
                  class="font-weight-medium"
                >
                  #{{ product?.CodigoProducto || '123456' }}
                </v-chip>
              </div>
            </div>

            <div class="d-flex ga-6 text-right">
              <div>
                <div class="text-caption text-grey-darken-1 mb-1">STOCK TOTAL</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ product?.CantidadDisponible || '1,240' }} Unidades
                </div>
              </div>
              <div>
                <div class="text-caption text-grey-darken-1 mb-1">ÚLTIMO MOV.</div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ lastMovementDate || '01/05/2026' }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Controles y Tabla -->
        <base-table-local
          :headers="headers"
          :items="mockData"
          empty-text="No se encontraron movimientos"
          class="border rounded-lg"
          elevation="0"
          show-search-button
          @search="handleSearch"
          @refresh="handleRefresh"
        >
          <!-- Filtros de Fecha -->
          <template #filters>
            <v-col cols="12" sm="7" md="8" lg="6" xl="5">
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

          <template #item.Ubicacion="{ item }">
            <div class="d-flex align-center">
              <template v-if="item.UbicacionOrigen && item.UbicacionDestino">
                <span class="text-grey-darken-1">{{ item.UbicacionOrigen }}</span>
                <v-icon size="small" class="mx-1 text-grey" icon="mdi-arrow-right"></v-icon>
                <span>{{ item.UbicacionDestino }}</span>
              </template>
              <template v-else-if="item.UbicacionOrigen">
                <span>{{ item.UbicacionOrigen }}</span>
              </template>
              <template v-else-if="item.UbicacionDestino">
                <span>{{ item.UbicacionDestino }}</span>
              </template>
              <template v-else>
                <span class="text-grey">-</span>
              </template>
            </div>
          </template>

          <template #item.Cantidad="{ item }">
            <span :class="getCantidadColor(item)">
              {{ formatCantidad(item) }}
            </span>
          </template>
        </base-table-local>
      </div>
    </template>

    <template #actions="{ cancel }">
      <v-btn variant="outlined" color="grey-darken-1" @click="cancel"> Cerrar </v-btn>
      <v-btn color="blue-darken-3" prepend-icon="mdi-printer"> Imprimir Reporte </v-btn>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import DateRangeFilter from '@/shared/ui/DateRangeFilter.vue'
  import { formatDateTime } from '@/shared/utils/dateFormatter'

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

  const headers = [
    { title: 'FECHA', key: 'FechaRegistro', sortable: true },
    { title: 'DESCRIPCIÓN', key: 'DescripcionMovimiento', sortable: true },
    { title: 'UBICACIÓN', key: 'Ubicacion', sortable: false },
    { title: 'LOTE', key: 'CodLote', sortable: true, searchable: true },
    { title: 'CANTIDAD', key: 'Cantidad', sortable: true, align: 'end' },
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
    // Aquí puedes asignar las fechas, y el botón Buscar ejecutará el filtrado final
  }

  const handleSearch = () => {
    // Lógica para realizar la búsqueda aplicando las fechas seleccionadas
  }

  const handleRefresh = () => {
    // Lógica para recargar/refrescar los datos
  }

  const lastMovementDate = computed(() => {
    if (mockData.length > 0) {
      // Tomamos el primero si asumimos orden descendente
      return new Date(mockData[0].FechaRegistro).toLocaleDateString('es-ES')
    }
    return null
  })

  // Hardcoded data provided
  const mockData = [
    {
      IdMovimiento: '19',
      Cantidad: 30,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T15:14:08.870Z',
      DescripcionMovimiento: 'Ajuste negativo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '18',
      Cantidad: 10,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T15:13:57.748Z',
      DescripcionMovimiento: 'Ajuste positivo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '17',
      Cantidad: 10,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T15:13:48.480Z',
      DescripcionMovimiento: 'Ajuste positivo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '16',
      Cantidad: 10,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T15:00:03.479Z',
      DescripcionMovimiento: 'Ajuste positivo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '15',
      Cantidad: 10,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T14:52:03.240Z',
      DescripcionMovimiento: 'Ajuste positivo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '14',
      Cantidad: 1,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T14:30:23.114Z',
      DescripcionMovimiento: 'Ajuste positivo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '13',
      Cantidad: 2,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T14:30:14.508Z',
      DescripcionMovimiento: 'Ajuste positivo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '12',
      Cantidad: 2,
      DocumentoReferencia: null,
      FechaRegistro: '2026-05-01T14:29:33.154Z',
      DescripcionMovimiento: 'Ajuste positivo',
      CodigoProducto: '123456',
      UbicacionOrigen: 'UB01',
      UbicacionDestino: null,
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '11',
      Cantidad: 50,
      DocumentoReferencia: 'AR-29',
      FechaRegistro: '2026-04-21T21:57:22.559Z',
      DescripcionMovimiento: 'Entrada',
      CodigoProducto: '123456',
      UbicacionOrigen: null,
      UbicacionDestino: 'UB01',
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
    {
      IdMovimiento: '10',
      Cantidad: 50,
      DocumentoReferencia: 'AR-28',
      FechaRegistro: '2026-04-21T21:56:56.233Z',
      DescripcionMovimiento: 'Entrada',
      CodigoProducto: '123456',
      UbicacionOrigen: null,
      UbicacionDestino: 'UB01',
      CodigoUsuario: 'BFJEREZ',
      CodLote: '00K-231',
    },
  ]
</script>
