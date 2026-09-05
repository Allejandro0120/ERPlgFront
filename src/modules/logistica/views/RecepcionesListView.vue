<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto">
          <v-btn class="text-none w-100" color="primary" prepend-icon="$plus" @click="abrirCrear">
            Añadir Acta
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>

    <base-table
      ref="tableRef"
      empty-text="No se encontraron actas"
      :headers="headers"
      item-key="IdActa"
      :items="recepciones"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por acta, proveedor o factura..."
      searchable
      title="Actas de Recepción"
      :total-items="totalItems"
      @load="fetchData"
    >
      <template #filters>
        <v-col cols="12" md="2">
          <v-select
            id="filtro-estado"
            v-model="estadoSeleccionado"
            density="compact"
            :disabled="loadingTable"
            hide-details
            item-title="Nombre"
            item-value="IdEstado"
            :items="estados"
            label="Estado"
            name="estadoFiltro"
            variant="outlined"
            @update:model-value="onFilterChange"
          />
        </v-col>
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
      <template #item.Estado="{ item }">
        <v-chip
          class="font-weight-medium"
          :color="getEstadoColor(getEstadoNombre(item.IdEstadoActa), DOMINIOS_ESTADO.ACTA)"
          size="small"
          variant="tonal"
        >
          <v-icon icon="mdi-tag" size="14" start />
          {{ getEstadoNombre(item.IdEstadoActa) }}
        </v-chip>
      </template>
      <template #item.FechaActa="{ item }">
        {{ formatDateTime(item.FechaActa) }}
      </template>
      <!-- ValorMercanciaRecibida -->
      <template #item.ValorMercanciaRecibida="{ item }">
        {{ formatCurrencyCOP(item.ValorMercanciaRecibida) }}
      </template>
    </base-table>

    <recepcion-dialog
      v-model="dialog.open"
      :acta="dialog.acta"
      :mode="dialog.mode"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { recepcionService } from '@/api/services/recepcionService'
  import RecepcionDialog from '@/modules/logistica/components/recepcion/RecepcionDialog.vue'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import DateRangeFilter from '@/shared/ui/fields/DateRangeFilter.vue'
  import PageHeaderActions from '@/shared/ui/layout/PageHeaderActions.vue'
  import BaseTable from '@/shared/ui/table/BaseTable.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDateTime } from '@/shared/utils/dateFormatter'
  import { downloadPdfResponse } from '@/shared/utils/fileDownload'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { useAuthStore } from '@/stores/authStore'
  import { proveedorService } from '../../../api/services/proveedorService'

  const authStore = useAuthStore()
  const _hasPermission = (permiso) => authStore.hasPermission(permiso)
  const tableRef = ref()

  const headers = [
    { title: 'Nro Acta', key: 'Acta', sortable: true, searchable: true },
    {
      title: 'Factura',
      key: 'NumeroFacturaRecibida',
      sortable: false,
      searchable: true,
    },
    {
      title: 'Doc. Proveedor',
      key: 'NumeroIdentificacionProveedor',
      sortable: true,
      searchable: true,
    },
    {
      title: 'Proveedor',
      key: 'NombreProveedor',
      sortable: true,
      searchable: true,
    },
    {
      title: 'Fecha Acta',
      key: 'FechaActa',
      sortable: true,
    },
    {
      title: 'Valor Mercancía',
      key: 'ValorMercanciaRecibida',
      sortable: true,
      align: 'center',
    },

    {
      title: 'Estado',
      key: 'Estado',
      align: 'center',
      sortable: false,
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
      label: 'Editar',
      icon: '$pencil',
      color: 'purple-darken-3',
      action: (item) => editarActa(item),
      visible: (item) => {
        const estadoNombre = getEstadoNombre(item.IdEstadoActa)
        // Editar solo si NO es Cerrada Y NO es Pendiente
        return estadoNombre !== 'Cerrada' && estadoNombre !== 'Pendiente'
      },
    },
    {
      label: 'Descargar PDF',
      icon: '$pdf',
      color: 'red-darken-3',
      action: (item) => descargarPdf(item),
      visible: (item) => {
        const estadoNombre = getEstadoNombre(item.IdEstadoActa)
        // PDF visible solo si NO es Borrador
        return estadoNombre !== 'Borrador'
      },
    },
  ]

  const estados = ref([])
  const estadoSeleccionado = ref(null)
  const dateRange = ref({ start: null, end: null })
  const dialog = ref({ open: false, mode: 'view', acta: null })
  const proveedores = ref([])
  const _proveedorSeleccionado = ref(null)
  const recepciones = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)

  function getEstadoNombre(estadoId) {
    const estado = estados.value.find((e) => e.IdEstado === estadoId)
    return estado ? estado.Nombre : 'Desconocido'
  }

  async function cargarEstados() {
    try {
      const response = await recepcionService.getRecepcionEstados()
      if (response.data?.success) {
        estados.value = [{ IdEstado: null, Nombre: 'Todos' }, ...response.data.data]
      }
    } catch (error) {
      console.error('Error al obtener los estados:', error)
      estados.value = [{ IdEstado: null, Nombre: 'Todos' }]
    }
  }

  async function _cargarProveedores() {
    try {
      const response = await proveedorService.getProveedores()
      if (response.data?.success) {
        proveedores.value = [{ IdProveedor: null, Nombre: 'Todos' }, ...response.data.data]
      }
    } catch (error) {
      console.error('Error al obtener los proveedores:', error)
      proveedores.value = [{ IdProveedor: null, Nombre: 'Todos' }]
    }
  }
  onMounted(() => {
    cargarEstados()
  })

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    loadingTable.value = true
    try {
      const filters = {}
      if (estadoSeleccionado.value !== null) {
        filters.IdEstadoActa = estadoSeleccionado.value
      }
      if (dateRange.value && (dateRange.value.start || dateRange.value.end)) {
        if (dateRange.value.start)
          filters.startDate = new Date(dateRange.value.start).toISOString().slice(0, 10)
        if (dateRange.value.end)
          filters.endDate = new Date(dateRange.value.end).toISOString().slice(0, 10)
      }
      const response = await recepcionService.getRecepciones(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )

      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        recepciones.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener recepciones:', error)
      recepciones.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }

  function onFilterChange() {
    tableRef.value?.reset()
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
      const res = await recepcionService.getRecepcionById(item.IdActa)
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

  async function editarActa(item) {
    $loading.show()
    try {
      const res = await recepcionService.getRecepcionById(item.IdActa)
      if (res.data?.success) {
        dialog.value = { open: true, mode: 'edit', acta: res.data.data }
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
      const res = await recepcionService.getRecepcionPDF(item.IdActa)
      downloadPdfResponse(res, `Acta_Recepcion_${item.Acta}`)
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al descargar el PDF')
      }
    } finally {
      $loading.hide()
    }
  }

  async function onSubmit({ payload, mode }) {
    if (mode === 'edit' && Object.keys(payload || {}).length === 0) {
      $toast.info('No hay cambios para guardar')
      dialog.value.open = false
      return
    }

    $loading.show()
    try {
      if (mode === 'create') {
        await recepcionService.createRecepcion(payload)
        $toast.success('Acta creada exitosamente')
      } else if (mode === 'edit') {
        const updateData = {
          ...payload,
          IdActa: dialog.value.acta.IdActa,
        }
        await recepcionService.updateRecepcion(updateData)
        $toast.success('Acta actualizada exitosamente')
      }
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al guardar acta:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al guardar el acta')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
