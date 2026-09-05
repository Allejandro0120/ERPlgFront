<!-- src/modules/ventas/views/FacturasListView.vue -->
<template>
  <div class="w-100">
    <base-table
      ref="tableRef"
      empty-text="No se encontraron facturas"
      :headers="headers"
      item-key="Id"
      :items="facturas"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por factura, cliente o identificación..."
      searchable
      title="Facturas"
      :total-items="totalItems"
      @load="fetchData"
    >
      <template #filters>
        <v-col cols="12" md="4">
          <date-range-filter
            v-model="dateRange"
            :disabled="loadingTable"
            end-label="Hasta"
            :show-preset-select="false"
            start-label="Desde"
          />
        </v-col>
      </template>

      <!-- Fecha Documento -->
      <template #item.FechaDocumento="{ item }">
        {{ formatDate(item.FechaDocumento) }}
      </template>

      <!-- Subtotal -->
      <template #item.Subtotal="{ item }"> {{ formatCurrencyCOP(item.Subtotal) }} </template>

      <!-- Descuento -->
      <template #item.DescuentoTotal="{ item }">
        {{ formatCurrencyCOP(item.DescuentoTotal) }}
      </template>

      <!-- IVA -->
      <template #item.ValorIva="{ item }"> {{ formatCurrencyCOP(item.ValorIva) }} </template>

      <!-- Total -->
      <template #item.Total="{ item }"> {{ formatCurrencyCOP(item.Total) }} </template>
    </base-table>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { facturaService } from '@/api/services/facturaService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import DateRangeFilter from '@/shared/ui/fields/DateRangeFilter.vue'
  import BaseTable from '@/shared/ui/table/BaseTable.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { downloadPdfResponse } from '@/shared/utils/fileDownload'

  const tableRef = ref()
  const facturas = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)
  const dateRange = ref({ start: null, end: null })

  const headers = [
    { title: 'Factura', key: 'Factura', sortable: true, searchable: true },
    { title: 'Cliente', key: 'Cliente', sortable: true, searchable: true },
    {
      title: 'Identificación',
      key: 'NumeroIdentificacionCliente',
      sortable: false,
      searchable: true,
    },
    { title: 'Fecha Documento', key: 'FechaDocumento', sortable: true, align: 'center' },
    { title: 'Subtotal', key: 'Subtotal', sortable: false, align: 'center' },
    { title: 'Descuento', key: 'DescuentoTotal', sortable: false, align: 'center' },
    { title: 'IVA', key: 'ValorIva', sortable: false, align: 'center' },
    { title: 'Total', key: 'Total', sortable: true, align: 'center' },
  ]

  const rowActions = [
    {
      label: 'Descargar PDF',
      icon: '$pdf',
      color: 'red-darken-3',
      action: (item) => descargarPdf(item),
    },
  ]

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    loadingTable.value = true
    try {
      const filters = {}
      if (dateRange.value && (dateRange.value.start || dateRange.value.end)) {
        if (dateRange.value.start)
          filters.startDate = new Date(dateRange.value.start).toISOString().slice(0, 10)
        if (dateRange.value.end)
          filters.endDate = new Date(dateRange.value.end).toISOString().slice(0, 10)
      }
      const response = await facturaService.getFacturas(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )
      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        facturas.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener las facturas:', error)
      facturas.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }

  async function descargarPdf(item) {
    $loading.show()
    try {
      const res = await facturaService.getFacturaPDF(item.Id)
      downloadPdfResponse(res, `Factura_${item.Factura}`)
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al descargar el PDF')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
