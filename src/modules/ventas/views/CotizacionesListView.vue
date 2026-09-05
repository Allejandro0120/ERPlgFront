<!-- src/modules/ventas/views/CotizacionesListView.vue -->
<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto">
          <v-btn class="text-none w-100" color="primary" prepend-icon="$plus" @click="abrirCrear()">
            Añadir Cotización
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>
    <!-- Modal de selección previa: cliente, sucursal y cedi -->
    <venta-seleccion-dialog
      v-model="seleccionDialogOpen"
      titulo="Nueva Cotización"
      @continue="onSeleccionContinue"
    />

    <!-- Modal para cotización -->
    <cotizacion-dialog
      v-model="dialog.open"
      :cotizacion="dialog.cotizacion"
      :mode="dialog.mode"
      :preseleccion="dialog.preseleccion"
      @anular="onAnularCotizacion"
      @submit="onSubmit"
    />

    <!-- Modal para pasar la cotización a pedido -->
    <pedido-dialog
      v-model="dialogPedido.open"
      :cotizacion="dialogPedido.cotizacion"
      mode="create"
      @submit="onSubmitPedido"
    />

    <base-table
      ref="tableRef"
      empty-text="No se encontraron cotizaciones"
      :headers="headers"
      item-key="Id"
      :items="cotizaciones"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por cotización, cliente o identificación..."
      searchable
      title="Cotizaciones"
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
            item-value="Id"
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
            :show-preset-select="false"
            start-label="Desde"
          />
        </v-col>
      </template>

      <!-- Fecha Documento -->
      <template #item.FechaDocumento="{ item }">
        {{ formatDate(item.FechaDocumento) }}
      </template>

      <!-- Vigencia Hasta -->
      <template #item.VigenciaHasta="{ item }">
        {{ formatDate(item.VigenciaHasta) }}
      </template>

      <!-- Total -->
      <template #item.Total="{ item }"> {{ formatCurrencyCOP(item.Total) }} </template>

      <!-- Estado -->
      <template #item.Estado="{ item }">
        <v-chip
          class="font-weight-medium"
          :color="getEstadoColor(item.Estado, DOMINIOS_ESTADO.COTIZACION)"
          size="small"
          variant="tonal"
        >
          <v-icon icon="mdi-tag" size="14" start />
          {{ item.Estado }}
        </v-chip>
      </template>
    </base-table>
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { cotizacionService } from '@/api/services/cotizacionService'
  import { pedidoService } from '@/api/services/pedidoService'
  import CotizacionDialog from '@/modules/ventas/components/cotizacion/CotizacionDialog.vue'
  import PedidoDialog from '@/modules/ventas/components/pedido/PedidoDialog.vue'
  import VentaSeleccionDialog from '@/modules/ventas/components/VentaSeleccionDialog.vue'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import DateRangeFilter from '@/shared/ui/fields/DateRangeFilter.vue'
  import PageHeaderActions from '@/shared/ui/layout/PageHeaderActions.vue'
  import BaseTable from '@/shared/ui/table/BaseTable.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { downloadPdfResponse } from '@/shared/utils/fileDownload'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'

  const tableRef = ref()
  const cotizaciones = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)
  const seleccionDialogOpen = ref(false)
  const dialog = ref({ open: false, mode: 'view', cotizacion: null, preseleccion: null })
  const dialogPedido = ref({ open: false, cotizacion: null })
  const dateRange = ref({ start: null, end: null })
  const estados = ref([])
  const estadoSeleccionado = ref(null)

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
      visible: (item) => item.Estado === 'Abierta',
      action: (item) => editarCotizacion(item),
    },
    {
      label: 'Pasar a pedido',
      icon: 'mdi-clipboard-check-outline',
      color: 'success',
      visible: (item) => item.Estado === 'Abierta' && estaVigente(item.VigenciaHasta),
      action: (item) => pasarAPedido(item),
    },
    {
      label: 'Descargar PDF',
      icon: '$pdf',
      color: 'red-darken-3',
      action: (item) => descargarPdf(item),
    },
  ]

  const headers = [
    { title: 'Cotización', key: 'Cotizacion', sortable: true, searchable: true },
    { title: 'Cliente', key: 'Cliente', sortable: true, searchable: true },
    {
      title: 'Identificación',
      key: 'NumeroIdentificacionCliente',
      sortable: false,
      searchable: true,
    },
    { title: 'Fecha Documento', key: 'FechaDocumento', sortable: true, align: 'center' },
    { title: 'Vigencia Hasta', key: 'VigenciaHasta', sortable: true, align: 'center' },
    { title: 'Total', key: 'Total', sortable: true, align: 'center' },
    { title: 'Estado', key: 'Estado', sortable: false, align: 'center' },
  ]

  // La cotización solo puede pasarse a pedido si aún no ha vencido (hoy sigue siendo válido).
  // Se compara solo la fecha (sin hora) para evitar falsos negativos por zona horaria.
  function estaVigente(vigenciaHasta) {
    if (!vigenciaHasta) return false
    const vigencia = new Date(vigenciaHasta)
    if (Number.isNaN(vigencia.getTime())) return false
    const hoy = new Date()
    const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const vigenciaUTC = Date.UTC(
      vigencia.getUTCFullYear(),
      vigencia.getUTCMonth(),
      vigencia.getUTCDate(),
    )
    return vigenciaUTC >= hoyUTC
  }

  async function cargarEstados() {
    try {
      const response = await cotizacionService.getEstados()
      if (response.data?.success) {
        estados.value = [{ Id: null, Nombre: 'Todos' }, ...response.data.data]
      }
    } catch (error) {
      console.error('Error al obtener los estados:', error)
      estados.value = [{ Id: null, Nombre: 'Todos' }]
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
        filters.IdEstadoCotizacion = estadoSeleccionado.value
      }
      if (dateRange.value && (dateRange.value.start || dateRange.value.end)) {
        if (dateRange.value.start)
          filters.startDate = new Date(dateRange.value.start).toISOString().slice(0, 10)
        if (dateRange.value.end)
          filters.endDate = new Date(dateRange.value.end).toISOString().slice(0, 10)
      }
      const response = await cotizacionService.getCotizaciones(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )
      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        cotizaciones.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener las cotizaciones:', error)
      cotizaciones.value = []
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
    seleccionDialogOpen.value = true
  }

  function onSeleccionContinue({ cliente, sucursal, cedi }) {
    dialog.value = {
      open: true,
      mode: 'create',
      cotizacion: null,
      preseleccion: { cliente, sucursal, cedi },
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
        await cotizacionService.createCotizacion(payload)
        $toast.success('Cotización creada exitosamente')
      } else if (mode === 'edit') {
        const updateData = { ...payload, IdTransaccion: dialog.value.cotizacion.Id }
        await cotizacionService.updateCotizacion(updateData)
        $toast.success('Cotización actualizada exitosamente')
      }
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al guardar la cotización:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al guardar la cotización')
      }
    } finally {
      $loading.hide()
    }
  }

  async function obtenerCotizacion(item) {
    $loading.show()
    try {
      const res = await cotizacionService.getCotizacionById(item.Id)
      return res.data?.success ? res.data.data : null
    } catch (error) {
      console.error('Error al obtener la cotización:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar la cotización')
      }
      return null
    } finally {
      $loading.hide()
    }
  }

  async function cargarCotizacion(item, mode) {
    const cotizacion = await obtenerCotizacion(item)
    if (cotizacion) {
      dialog.value = { open: true, mode, cotizacion }
    }
  }

  function verDetalle(item) {
    cargarCotizacion(item, 'view')
  }

  function editarCotizacion(item) {
    cargarCotizacion(item, 'edit')
  }

  async function pasarAPedido(item) {
    const cotizacion = await obtenerCotizacion(item)
    if (!cotizacion) return
    if (!cotizacion.Detalles?.length) {
      $toast.warning('La cotización no tiene productos para pasar a pedido')
      return
    }
    dialogPedido.value = { open: true, cotizacion }
  }

  async function onSubmitPedido({ payload }) {
    $loading.show()
    try {
      const res = await pedidoService.createPedido(payload)
      const pedido = res.data?.data?.Pedido
      $toast.success(pedido ? `Pedido ${pedido} creado exitosamente` : 'Pedido creado exitosamente')
      dialogPedido.value = { open: false, cotizacion: null }
      refrescarTabla()
    } catch (error) {
      console.error('Error al crear el pedido:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al crear el pedido')
      }
    } finally {
      $loading.hide()
    }
  }

  async function onAnularCotizacion({ id, observacionAnulacion }) {
    $loading.show()
    try {
      await cotizacionService.closeCotizacion({
        IdTransaccion: id,
        ObservacionCierre: observacionAnulacion,
      })
      $toast.success('Cotización anulada exitosamente')
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al anular la cotización:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al anular la cotización')
      }
    } finally {
      $loading.hide()
    }
  }

  async function descargarPdf(item) {
    $loading.show()
    try {
      const res = await cotizacionService.getCotizacionPDF(item.Id)
      downloadPdfResponse(res, `Cotizacion_${item.Cotizacion}`)
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al descargar el PDF')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
