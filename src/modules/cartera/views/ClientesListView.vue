<!-- src/modules/cartera/views/ClientesListView.vue -->
<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col v-if="hasPermission('Clientes.ADD')" cols="12" sm="auto">
          <v-btn class="text-none w-100" color="primary" prepend-icon="$plus" @click="abrirCrear()">
            Añadir Cliente
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>

    <!-- Modal para cliente -->
    <cliente-dialog
      v-model="dialog.open"
      :cliente="dialog.cliente"
      :mode="dialog.mode"
      @submit="onSubmit"
    />

    <base-table
      ref="tableRef"
      empty-text="No se encontraron clientes"
      :headers="headers"
      item-key="IdCliente"
      :items="clientes"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por identificación, nombre o municipio..."
      searchable
      title="Directorio de Clientes"
      :total-items="totalItems"
      @load="fetchData"
    >
      <!-- Filtros: cols="12" en móvil, cols="auto" en sm+ -->
      <template #filters>
        <v-col cols="12" md="2">
          <v-select
            id="filtro-estado"
            v-model="estadoSeleccionado"
            density="compact"
            :disabled="loadingTable"
            hide-details
            item-title="Nombre"
            item-value="IdClienteEstado"
            :items="estados"
            label="Estado"
            name="estadoFiltro"
            variant="outlined"
            @update:model-value="onFilterChange"
          />
        </v-col>
      </template>

      <!-- Estado -->
      <template #item.Estado="{ item }">
        <v-chip
          class="font-weight-medium"
          :color="getEstadoColor(getEstadoNombre(item.Estado), DOMINIOS_ESTADO.CLIENTE)"
          size="small"
          variant="tonal"
        >
          <v-icon icon="$circle" size="14" start />
          {{ getEstadoNombre(item.Estado) }}
        </v-chip>
      </template>
    </base-table>
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { clienteService } from '@/api/services/clienteService'
  import ClienteDialog from '@/modules/cartera/components/cliente/ClienteDialog.vue'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import PageHeaderActions from '@/shared/ui/layout/PageHeaderActions.vue'
  import BaseTable from '@/shared/ui/table/BaseTable.vue'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const hasPermission = (permiso) => authStore.hasPermission(permiso)
  const tableRef = ref()

  const headers = [
    {
      title: 'Identificación',
      key: 'NumeroIdentificacion',
      sortable: true,
      searchable: true,
    },
    { title: 'Tipo Identificación', key: 'TipoIdentificacion', sortable: false },
    { title: 'Nombre', key: 'Nombre', sortable: true, searchable: true },
    { title: 'Municipio', key: 'Municipio', sortable: true, searchable: true },
    { title: 'Estado', key: 'Estado', sortable: false, align: 'center' },
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
      action: (item) => editarCliente(item),
    },
  ]

  const estados = ref([])
  const estadoSeleccionado = ref(null)

  function getEstadoNombre(estadoId) {
    const estado = estados.value.find((e) => e.IdClienteEstado === estadoId)
    return estado ? estado.Nombre : 'Desconocido'
  }

  const clientes = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)

  const dialog = ref({ open: false, mode: 'create', cliente: null })

  async function cargarEstados() {
    try {
      const response = await clienteService.getEstados()
      if (response.data?.success) {
        estados.value = [{ IdClienteEstado: null, Nombre: 'Todos' }, ...response.data.data]
      }
    } catch (error) {
      console.error('Error al obtener los estados:', error)
      estados.value = [{ IdClienteEstado: null, Nombre: 'Todos' }]
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
        filters.IdEstado = estadoSeleccionado.value
      }

      const response = await clienteService.getClientes(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )

      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        clientes.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener clientes:', error)
      clientes.value = []
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
    dialog.value = { open: true, mode: 'create', cliente: null }
  }

  async function editarCliente(item) {
    $loading.show()
    try {
      const res = await clienteService.getClienteById(item.IdCliente)
      if (res.data?.success) {
        dialog.value = { open: true, mode: 'edit', cliente: res.data.data }
      }
    } catch (error) {
      console.error('Error al obtener cliente:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar el cliente')
      }
    } finally {
      $loading.hide()
    }
  }

  async function verDetalle(item) {
    $loading.show()
    try {
      const res = await clienteService.getClienteById(item.IdCliente)
      if (res.data?.success) {
        dialog.value = { open: true, mode: 'view', cliente: res.data.data }
      }
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar el cliente')
      }
    } finally {
      $loading.hide()
    }
  }

  // ─── Submit Cliente (captura datos y modo del diálogo) ───────────────────────
  async function onSubmit({ payload, mode }) {
    if (mode === 'edit' && Object.keys(payload || {}).length === 0) {
      $toast.info('No hay cambios para guardar')
      dialog.value.open = false
      return
    }

    $loading.show()
    try {
      if (mode === 'create') {
        await clienteService.createCliente(payload)
        $toast.success('Cliente creado exitosamente')
      } else if (mode === 'edit') {
        const updateData = {
          ...payload,
          IdCliente: dialog.value.cliente.IdCliente,
        }
        await clienteService.updateCliente(updateData)
        $toast.success('Cliente actualizado exitosamente')
      }
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al guardar cliente:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al guardar el cliente')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
