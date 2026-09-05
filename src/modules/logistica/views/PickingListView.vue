<!-- src/modules/logistica/views/PickingListView.vue -->
<template>
  <div class="w-100">
    <page-header-actions />

    <picking-dialog
      v-model="pickingDialogOpen"
      :pedido="pickingPedido"
      @created="onPickingCreated"
    />

    <!-- Modal para ver el detalle de una facturación (PF-xxxxx) ya emitida -->
    <picking-facturacion-dialog
      v-model="facturacionDialog.open"
      :facturacion="facturacionDialog.facturacion"
    />

    <v-tabs v-model="activeTab" class="mb-4" color="primary">
      <v-tab value="pendientes">
        <v-icon icon="mdi-clipboard-list-outline" start />
        Pendientes
      </v-tab>
      <v-tab value="facturados">
        <v-icon icon="mdi-file-document-check-outline" start />
        Facturados
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">
      <!-- ── Pedidos pendientes por pickear ─────────────────────────────────── -->
      <v-tabs-window-item value="pendientes">
        <base-table
          ref="pendientesTableRef"
          empty-text="No hay pedidos pendientes por pickear"
          :headers="headersPendientes"
          item-key="Id"
          :items="pedidosPendientes"
          :loading="loadingPendientes"
          :row-actions="rowActionsPendientes"
          search-placeholder="Buscar por pedido, cliente o identificación..."
          searchable
          title="Pedidos pendientes"
          :total-items="totalItemsPendientes"
          @load="fetchPedidosPendientes"
        >
          <template #filters>
            <v-col cols="12" md="4">
              <date-range-filter
                v-model="dateRangePendientes"
                :disabled="loadingPendientes"
                end-label="Hasta"
                :show-preset-select="false"
                start-label="Desde"
              />
            </v-col>
          </template>

          <template #item.FechaDocumento="{ item }">
            {{ item.FechaDocumento ? formatDate(item.FechaDocumento) : '-' }}
          </template>
          <template #item.Total="{ item }"> {{ formatCurrencyCOP(item.Total) }} </template>
          <template #item.Estado="{ item }">
            <v-chip
              class="font-weight-medium"
              :color="getEstadoColor(item.Estado, DOMINIOS_ESTADO.PEDIDO)"
              size="small"
              variant="tonal"
            >
              <v-icon icon="mdi-tag" size="14" start />
              {{ formatEstadoTexto(item.Estado) }}
            </v-chip>
          </template>
        </base-table>
      </v-tabs-window-item>

      <!-- ── Facturaciones (picking) ya emitidas ────────────────────────────── -->
      <v-tabs-window-item value="facturados">
        <base-table
          ref="facturadosTableRef"
          empty-text="No se encontraron facturaciones"
          :headers="headersFacturados"
          item-key="Id"
          :items="pickings"
          :loading="loadingTable"
          :row-actions="rowActionsFacturados"
          search-placeholder="Buscar por facturación, pedido o cliente..."
          searchable
          title="Picking"
          :total-items="totalItems"
          @load="fetchData"
        >
          <template #filters>
            <v-col cols="12" md="4">
              <date-range-filter
                v-model="dateRangeFacturados"
                :disabled="loadingTable"
                end-label="Hasta"
                :show-preset-select="false"
                start-label="Desde"
              />
            </v-col>
          </template>

          <!-- Fecha -->
          <template #item.FechaDocumento="{ item }">
            {{ item.FechaDocumento ? formatDate(item.FechaDocumento) : '-' }}
          </template>

          <!-- Fecha entrega real -->
          <template #item.FechaEntregaReal="{ item }">
            {{ item.FechaEntregaReal ? formatDate(item.FechaEntregaReal) : '-' }}
          </template>

          <!-- Total -->
          <template #item.Total="{ item }"> {{ formatCurrencyCOP(item.Total) }} </template>
        </base-table>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { pedidoService } from '@/api/services/pedidoService'
  import { pickingService } from '@/api/services/pickingService'
  import PickingDialog from '@/modules/logistica/components/picking/PickingDialog.vue'
  import PickingFacturacionDialog from '@/modules/logistica/components/picking/PickingFacturacionDialog.vue'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import DateRangeFilter from '@/shared/ui/fields/DateRangeFilter.vue'
  import PageHeaderActions from '@/shared/ui/layout/PageHeaderActions.vue'
  import BaseTable from '@/shared/ui/table/BaseTable.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { downloadPdfResponse } from '@/shared/utils/fileDownload'
  import { DOMINIOS_ESTADO, formatEstadoTexto, getEstadoColor } from '@/shared/utils/statusColors'

  const activeTab = ref('pendientes')

  // ─── Pendientes por pickear (v1/order-settlements/settleable-orders) ──────
  const pendientesTableRef = ref()
  const pedidosPendientes = ref([])
  const totalItemsPendientes = ref(0)
  const loadingPendientes = ref(false)
  const dateRangePendientes = ref({ start: null, end: null })

  const pickingDialogOpen = ref(false)
  const pickingPedido = ref(null)

  const rowActionsPendientes = [
    {
      label: 'Pickear',
      icon: 'mdi-barcode-scan',
      color: 'primary',
      action: (item) => abrirPickear(item),
    },
    {
      label: 'Descargar PDF',
      icon: '$pdf',
      color: 'red-darken-3',
      action: (item) => descargarPdf(item),
    },
  ]

  const headersPendientes = [
    { title: 'Pedido', key: 'Pedido', sortable: true, searchable: true },
    { title: 'Cliente', key: 'Cliente', sortable: true, searchable: true },
    {
      title: 'Identificación',
      key: 'NumeroIdentificacionCliente',
      sortable: false,
      searchable: true,
    },
    { title: 'Fecha', key: 'FechaDocumento', sortable: true, align: 'center' },
    { title: 'Total', key: 'Total', sortable: true, align: 'center' },
    { title: 'Estado', key: 'Estado', sortable: false, align: 'center' },
  ]

  async function fetchPedidosPendientes({ page, itemsPerPage, sortByField, sortOrder, search }) {
    loadingPendientes.value = true
    try {
      const filters = {}
      if (
        dateRangePendientes.value &&
        (dateRangePendientes.value.start || dateRangePendientes.value.end)
      ) {
        if (dateRangePendientes.value.start)
          filters.startDate = new Date(dateRangePendientes.value.start).toISOString().slice(0, 10)
        if (dateRangePendientes.value.end)
          filters.endDate = new Date(dateRangePendientes.value.end).toISOString().slice(0, 10)
      }
      const response = await pickingService.getPedidosPendientes(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )
      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        pedidosPendientes.value = items
        totalItemsPendientes.value = total
      }
    } catch (error) {
      console.error('Error al obtener los pedidos pendientes:', error)
      pedidosPendientes.value = []
      totalItemsPendientes.value = 0
    } finally {
      loadingPendientes.value = false
    }
  }

  function abrirPickear(item) {
    pickingPedido.value = item
    pickingDialogOpen.value = true
  }

  async function descargarPdf(item) {
    $loading.show()
    try {
      const res = await pedidoService.getPedidoPDF(item.Id)
      downloadPdfResponse(res, `Pedido_${item.Pedido}`)
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al descargar el PDF')
      }
    } finally {
      $loading.hide()
    }
  }

  function onPickingCreated() {
    pendientesTableRef.value?.reset()
    facturadosTableRef.value?.reset()
  }

  // ─── Facturaciones (picking) ya emitidas ──────────────────────────────────
  const facturadosTableRef = ref()
  const pickings = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)
  const dateRangeFacturados = ref({ start: null, end: null })
  const facturacionDialog = ref({ open: false, facturacion: null })

  const rowActionsFacturados = [
    {
      label: 'Ver detalle',
      icon: '$eye',
      color: 'blue-darken-3',
      action: (item) => verDetalle(item),
    },
  ]

  const headersFacturados = [
    { title: 'Picking', key: 'OrderSettlement', sortable: true, searchable: true },
    { title: 'Pedido', key: 'PedidoOrigen', sortable: false, searchable: true },
    { title: 'Cliente', key: 'Cliente', sortable: true, searchable: true },
    { title: 'Fecha', key: 'FechaDocumento', sortable: true, align: 'center' },
    { title: 'Total', key: 'Total', sortable: true, align: 'center' },
  ]

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    loadingTable.value = true
    try {
      const filters = {}
      if (
        dateRangeFacturados.value &&
        (dateRangeFacturados.value.start || dateRangeFacturados.value.end)
      ) {
        if (dateRangeFacturados.value.start)
          filters.startDate = new Date(dateRangeFacturados.value.start).toISOString().slice(0, 10)
        if (dateRangeFacturados.value.end)
          filters.endDate = new Date(dateRangeFacturados.value.end).toISOString().slice(0, 10)
      }
      const response = await pickingService.getFacturaciones(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )
      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        pickings.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener las facturaciones:', error)
      pickings.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }

  async function verDetalle(item) {
    $loading.show()
    try {
      const res = await pickingService.getFacturacionById(item.Id)
      if (res.data?.success) {
        facturacionDialog.value = { open: true, facturacion: res.data.data }
      }
    } catch (error) {
      console.error('Error al obtener la facturación:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar la facturación')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
