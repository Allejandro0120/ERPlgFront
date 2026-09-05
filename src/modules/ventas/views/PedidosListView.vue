<!-- src/modules/ventas/views/PedidosListView.vue -->
<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto">
          <v-btn class="text-none w-100" color="primary" prepend-icon="$plus" @click="abrirCrear()">
            Añadir Pedido
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>

    <!-- Modal de selección previa: cliente, sucursal y cedi -->
    <venta-seleccion-dialog
      v-model="seleccionDialogOpen"
      mostrar-entrada-directa
      titulo="Nuevo Pedido"
      @continue="onSeleccionContinue"
    />

    <!-- Modal para pedido (crear desde cero o ver detalle) -->
    <pedido-dialog
      v-model="dialog.open"
      :mode="dialog.mode"
      :pedido="dialog.pedido"
      :preseleccion="dialog.preseleccion"
      @anular="onAnular"
      @autorizar="onAutorizar"
      @submit="onSubmit"
    />

    <!-- Modal para cerrar con faltante un pedido en Facturado_Parcial -->
    <confirmar-observacion-dialog
      v-model="cerrarDialog.open"
      color="warning"
      icon="mdi-package-variant-closed-remove"
      label-confirm="Cerrar con Faltante"
      label-observacion="Observación de cierre"
      mensaje-alerta="Se liberará la reserva de inventario del saldo pendiente de este pedido y quedará cerrado. Esta acción es irreversible."
      :pedido="cerrarDialog.pedido?.Pedido"
      titulo="Cerrar con Faltante"
      @confirm="onConfirmCerrar"
    />

    <base-table
      ref="tableRef"
      empty-text="No se encontraron pedidos"
      :headers="headers"
      item-key="Id"
      :items="pedidos"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por pedido, cliente o identificación..."
      searchable
      title="Pedidos"
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

      <!-- Total -->
      <template #item.Total="{ item }"> {{ formatCurrencyCOP(item.Total) }} </template>

      <!-- Estado -->
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
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { pedidoService } from '@/api/services/pedidoService'
  import ConfirmarObservacionDialog from '@/modules/ventas/components/pedido/ConfirmarObservacionDialog.vue'
  import PedidoDialog from '@/modules/ventas/components/pedido/PedidoDialog.vue'
  import VentaSeleccionDialog from '@/modules/ventas/components/VentaSeleccionDialog.vue'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import DateRangeFilter from '@/shared/ui/fields/DateRangeFilter.vue'
  import PageHeaderActions from '@/shared/ui/layout/PageHeaderActions.vue'
  import BaseTable from '@/shared/ui/table/BaseTable.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { downloadPdfResponse } from '@/shared/utils/fileDownload'
  import { DOMINIOS_ESTADO, formatEstadoTexto, getEstadoColor } from '@/shared/utils/statusColors'

  const tableRef = ref()
  const pedidos = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)
  const seleccionDialogOpen = ref(false)
  const dialog = ref({ open: false, mode: 'create', pedido: null, preseleccion: null })
  const dateRange = ref({ start: null, end: null })
  const estados = ref([])
  const estadoSeleccionado = ref(null)
  const cerrarDialog = ref({ open: false, pedido: null })

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
      visible: (item) => item.Estado === 'Creado',
      action: (item) => editarPedido(item),
    },
    {
      label: 'Cerrar con faltante',
      icon: 'mdi-package-variant-closed-remove',
      color: 'brown-darken-3',
      permission: 'Pedido.EDIT',
      visible: (item) => item.Estado === 'Facturado_Parcial',
      action: (item) => abrirCerrarConFaltante(item),
    },
    {
      label: 'Desautorizar',
      icon: 'mdi-undo-variant',
      color: 'orange-darken-3',
      permission: 'Pedido.EDIT',
      visible: (item) => item.Estado === 'Aprobado',
      action: (item) => onRevertar(item),
    },
    {
      label: 'Descargar PDF',
      icon: '$pdf',
      color: 'red-darken-3',
      action: (item) => descargarPdf(item),
    },
  ]

  const headers = [
    { title: 'Pedido', key: 'Pedido', sortable: true, searchable: true },
    { title: 'Cliente', key: 'Cliente', sortable: true, searchable: true },
    {
      title: 'Identificación',
      key: 'NumeroIdentificacionCliente',
      sortable: false,
      searchable: true,
    },
    { title: 'Fecha Documento', key: 'FechaDocumento', sortable: true, align: 'center' },
    { title: 'Total', key: 'Total', sortable: true, align: 'center' },
    { title: 'Estado', key: 'Estado', sortable: false, align: 'center' },
  ]

  async function cargarEstados() {
    try {
      const response = await pedidoService.getEstados()
      if (response.data?.success) {
        estados.value = [
          { Id: null, Nombre: 'Todos' },
          ...response.data.data.map((estado) => ({
            ...estado,
            Nombre: formatEstadoTexto(estado.Nombre),
          })),
        ]
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
        filters.IdEstadoPedido = estadoSeleccionado.value
      }
      if (dateRange.value && (dateRange.value.start || dateRange.value.end)) {
        if (dateRange.value.start)
          filters.startDate = new Date(dateRange.value.start).toISOString().slice(0, 10)
        if (dateRange.value.end)
          filters.endDate = new Date(dateRange.value.end).toISOString().slice(0, 10)
      }
      const response = await pedidoService.getPedidos(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )
      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        pedidos.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener los pedidos:', error)
      pedidos.value = []
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

  function onSeleccionContinue({ cliente, sucursal, cedi, entradaDirecta }) {
    dialog.value = {
      open: true,
      mode: 'create',
      pedido: null,
      preseleccion: { cliente, sucursal, cedi, entradaDirecta },
    }
  }

  async function obtenerPedido(item) {
    $loading.show()
    try {
      const res = await pedidoService.getPedidoById(item.Id)
      return res.data?.success ? res.data.data : null
    } catch (error) {
      console.error('Error al obtener el pedido:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar el pedido')
      }
      return null
    } finally {
      $loading.hide()
    }
  }

  async function cargarPedido(item, mode) {
    const pedido = await obtenerPedido(item)
    if (pedido) {
      dialog.value = { open: true, mode, pedido, preseleccion: null }
    }
  }

  function verDetalle(item) {
    cargarPedido(item, 'view')
  }

  function editarPedido(item) {
    cargarPedido(item, 'edit')
  }

  async function onSubmit({ payload, mode }) {
    if (mode === 'edit') {
      $loading.show()
      try {
        const res = await pedidoService.updatePedido(payload)
        const pedido = res.data?.data?.Pedido
        $toast.success(
          pedido ? `Pedido ${pedido} actualizado exitosamente` : 'Pedido actualizado exitosamente',
        )
        dialog.value.open = false
        refrescarTabla()
      } catch (error) {
        console.error('Error al editar el pedido:', error)
        if (!error._toastShown) {
          $toast.error('Error inesperado al editar el pedido')
        }
      } finally {
        $loading.hide()
      }
      return
    }

    $loading.show()
    try {
      const res = await pedidoService.createPedido(payload)
      const data = res.data?.data ?? {}

      if (payload.EsEntregaDirecta) {
        // Entrada Directa: el back crea, aprueba y factura el pedido en un solo paso —
        // la respuesta es la de la facturación (PedidoOrigen/OrderSettlement), no la del pedido.
        $toast.success(
          data.PedidoOrigen
            ? `Pedido ${data.PedidoOrigen} creado y facturado exitosamente (${data.OrderSettlement})`
            : 'Pedido de entrada directa creado y facturado exitosamente',
        )
        if (Array.isArray(data.LineasRecortadas) && data.LineasRecortadas.length > 0) {
          $toast.warning('Algunas líneas se facturaron por menos cantidad de la solicitada.')
        }
      } else {
        const pedido = data.Pedido
        $toast.success(
          pedido ? `Pedido ${pedido} creado exitosamente` : 'Pedido creado exitosamente',
        )
      }

      dialog.value.open = false
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

  async function onAnular({ id, observacionAnulacion }) {
    $loading.show()
    try {
      await pedidoService.anularPedido(id, observacionAnulacion)
      $toast.success('Pedido anulado exitosamente')
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al anular el pedido:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al anular el pedido')
      }
    } finally {
      $loading.hide()
    }
  }

  async function onAutorizar({ id }) {
    $loading.show()
    try {
      await pedidoService.autorizarPedido(id)
      $toast.success('Pedido autorizado exitosamente')
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al autorizar el pedido:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al autorizar el pedido')
      }
    } finally {
      $loading.hide()
    }
  }

  async function onRevertar(item) {
    const confirmado = await $confirm.warning({
      title: '¿Desautorizar pedido?',
      message: `El pedido <strong>${item.Pedido}</strong> volverá al estado "Creado".`,
      labelConfirm: 'Sí, desautorizar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    $loading.show()
    try {
      await pedidoService.revertPedido(item.Id)
      $toast.success('Pedido desautorizado exitosamente')
      refrescarTabla()
    } catch (error) {
      console.error('Error al desautorizar el pedido:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al desautorizar el pedido')
      }
    } finally {
      $loading.hide()
    }
  }

  function abrirCerrarConFaltante(item) {
    cerrarDialog.value = { open: true, pedido: item }
  }

  async function onConfirmCerrar(observacionCierre) {
    const id = cerrarDialog.value.pedido?.Id
    cerrarDialog.value.open = false
    $loading.show()
    try {
      await pedidoService.cerrarConFaltante(id, observacionCierre)
      $toast.success('Pedido cerrado con faltante exitosamente')
      refrescarTabla()
    } catch (error) {
      console.error('Error al cerrar el pedido con faltante:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al cerrar el pedido con faltante')
      }
    } finally {
      $loading.hide()
    }
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
</script>
