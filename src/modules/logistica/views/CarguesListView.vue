<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto">
          <v-btn class="text-none w-100" color="primary" prepend-icon="$plus" @click="abrirCrear">
            Añadir Cargue
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>

    <base-table
      ref="tableRef"
      empty-text="No se encontraron actas"
      :headers="headers"
      item-key="IdActaCargue"
      :items="cargues"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por acta"
      searchable
      title="Actas de Cargue"
      :total-items="totalItems"
      @load="fetchData"
    >
      <template #filters>
        <v-col cols="12" md="4">
          <date-range-filter
            v-model="dateRange"
            :disabled="loadingTable"
            end-label="Hasta"
            preset-value="30days"
            :show-preset-select="false"
            start-label="Desde"
          />
        </v-col>
      </template>
      <template #item.FechaActaCargue="{ item }">
        {{ formatDateTime(item.FechaActaCargue) }}
      </template>
      <template #item.FechaActaRecepcion="{ item }">
        {{ formatDateTime(item.FechaActaRecepcion) }}
      </template>
    </base-table>

    <cargue-dialog
      v-model="dialog.open"
      :acta="dialog.acta"
      :mode="dialog.mode"
      @submit="refrescarTabla"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { cargueService } from '@/api/services/cargueService'
  import CargueDialog from '@/modules/logistica/components/cargue/CargueDialog.vue'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import BaseTable from '@/shared/ui/BaseTable.vue'
  import DateRangeFilter from '@/shared/ui/DateRangeFilter.vue'
  import PageHeaderActions from '@/shared/ui/PageHeaderActions.vue'
  import { formatDateTime } from '@/shared/utils/dateFormatter'
  import { downloadPdfResponse } from '@/shared/utils/fileDownload'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const _hasPermission = (permiso) => authStore.hasPermission(permiso)
  const tableRef = ref()

  const headers = [
    { title: 'Nro Acta', key: 'ActaCargue', sortable: true, searchable: true },
    {
      title: 'Acta de recepción',
      key: 'ActaRecepcion',
      sortable: false,
      searchable: true,
    },
    {
      title: 'Fecha Acta de cargue',
      key: 'FechaActaCargue',
      sortable: true,
      searchable: true,
    },
    {
      title: 'Fecha Acta de recepción',
      key: 'FechaActaRecepcion',
      sortable: true,
      searchable: true,
    },
    {
      title: 'Usuario',
      key: 'Usuario',
      sortable: true,
      searchable: true,
    },
  ]

  const rowActions = [
    {
      label: 'Ver detalle',
      icon: '$eye',
      color: 'blue-darken-3',
      action: (item) => verDetalle(item),
    },

    {
      label: 'Descargar PDF',
      icon: '$pdf',
      color: 'red-darken-3',
      action: (item) => descargarPdf(item),
    },
  ]

  const dateRange = ref({ start: null, end: null })
  const dialog = ref({ open: false, mode: 'view', acta: null })
  const cargues = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)

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
      const response = await cargueService.getCargues(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )

      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        cargues.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener cargues:', error)
      cargues.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }

  function refrescarTabla() {
    tableRef.value?.reset()
  }
  function abrirCrear() {
    dialog.value = { open: true, mode: 'create', acta: null }
  }

  async function verDetalle(item) {
    $loading.show()
    try {
      const res = await cargueService.getCargueById(item.IdActaCargue)
      if (res.data?.success) {
        dialog.value = { open: true, mode: 'view', acta: res.data.data }
      }
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar el acta')
      }
    } finally {
      $loading.hide()
    }
  }
  async function descargarPdf(item) {
    $loading.show()
    try {
      const res = await cargueService.getCarguePDF(item.IdActaCargue)
      downloadPdfResponse(res, `Acta_Cargue_${item.ActaCargue}`)
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al descargar el PDF')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
