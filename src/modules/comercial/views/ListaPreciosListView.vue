<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto">
          <v-btn class="text-none w-100" color="primary" prepend-icon="$plus" @click="abrirCrear()">
            Añadir Lista de Precios
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>
    <base-table
      ref="tableRef"
      empty-text="No se encontraron listas de precios"
      :headers="headers"
      item-key="IdListaPrecio"
      :items="listas"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por lista de precios"
      searchable
      title="Listas de Precios"
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
            item-title="label"
            item-value="value"
            :items="estados"
            label="Estado"
            name="estadoFiltro"
            variant="outlined"
            @update:model-value="onFilterChange"
          />
        </v-col>
      </template>
      <!-- Estado -->
      <template #item.Habilitado="{ item }">
        <v-chip
          :color="getEstadoColor(item.Habilitado, DOMINIOS_ESTADO.SUCURSAL)"
          :prepend-icon="item.Habilitado ? 'mdi-check-circle' : 'mdi-close-circle'"
          size="small"
          variant="tonal"
        >
          {{ item.Habilitado ? 'Habilitado' : 'Deshabilitado' }}
        </v-chip>
      </template>
      <!-- Fecha de Creación -->
      <template #item.FechaCreacion="{ item }">
        {{ formatDate(item.FechaCreacion) }}
      </template>
    </base-table>

    <lista-precios-dialog
      v-model="dialog.open"
      :lista="dialog.lista"
      :mode="dialog.mode"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { comercialService } from '@/api/services/comercialService'
  import ListaPreciosDialog from '@/modules/comercial/components/listaPrecios/ListaPreciosDialog.vue'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import PageHeaderActions from '@/shared/ui/layout/PageHeaderActions.vue'
  import BaseTable from '@/shared/ui/table/BaseTable.vue'
  import { formatDate } from '@/shared/utils/dateFormatter'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'

  const tableRef = ref()
  const estadoSeleccionado = ref(null)
  const dialog = ref({ open: false, mode: 'view', lista: null })
  const listas = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)

  const headers = [
    {
      title: 'Código',
      key: 'Codigo',
      sortable: true,
      searchable: true,
    },
    { title: 'Nombre de la Lista', key: 'NombreLista', sortable: true, align: 'center' },
    { title: 'Fecha de Creación', key: 'FechaCreacion', sortable: true, align: 'center' },
    { title: 'Estado', key: 'Habilitado', sortable: false, align: 'center' },
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
      action: (item) => editarLista(item),
    },
  ]
  const estados = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ]

  function onFilterChange() {
    tableRef.value?.reset()
  }

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    loadingTable.value = true
    try {
      const filters = {}
      if (estadoSeleccionado.value !== null) {
        filters.Estado = estadoSeleccionado.value
      }

      const response = await comercialService.getListasPrecios(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )
      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        listas.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener las listas de precios:', error)
      listas.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }

  function refrescarTabla() {
    tableRef.value?.reset()
  }
  function abrirCrear() {
    dialog.value = { open: true, mode: 'create', lista: null }
  }

  async function cargarListaDetalle(item, mode) {
    $loading.show()
    try {
      const res = await comercialService.getListaPreciosById(item.IdListaPrecio)
      if (res.data?.success) {
        dialog.value = { open: true, mode, lista: res.data.data }
      }
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar la lista de precios')
      }
    } finally {
      $loading.hide()
    }
  }

  async function verDetalle(lista) {
    await cargarListaDetalle(lista, 'view')
  }
  async function editarLista(lista) {
    await cargarListaDetalle(lista, 'edit')
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
        await comercialService.createListaPrecios(payload)
        $toast.success('Lista de precios creada exitosamente')
      } else if (mode === 'edit') {
        await comercialService.updateListaPrecios(dialog.value.lista.IdListaPrecio, payload)
        $toast.success('Lista de precios actualizada exitosamente')
      }
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al guardar la lista de precios:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al guardar la lista de precios')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
