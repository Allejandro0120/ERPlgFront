<!-- src/modules/mercancia/views/ProductosListView.vue -->
<template>
  <div class="w-100">
    <page-header-actions>
      <v-row density="comfortable">
        <v-col cols="12" sm="auto">
          <v-btn class="text-none w-100" color="primary" prepend-icon="$plus" @click="abrirCrear">
            Añadir Producto
          </v-btn>
        </v-col>
      </v-row>
    </page-header-actions>

    <base-table
      ref="tableRef"
      empty-text="No se encontraron productos"
      :headers="headers"
      item-key="IdProducto"
      :items="productos"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por producto"
      searchable
      title="Productos"
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

        <v-col cols="12" md="2">
          <v-select
            id="filtro-laboratorio"
            v-model="laboratorioSeleccionado"
            density="compact"
            :disabled="loadingTable"
            hide-details
            item-title="Nombre"
            item-value="IdLaboratorio"
            :items="laboratorios"
            label="Laboratorio"
            name="laboratorioFiltro"
            variant="outlined"
            @update:model-value="onFilterChange"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-select
            id="filtro-tipo"
            v-model="tipoSeleccionado"
            density="compact"
            :disabled="loadingTable"
            hide-details
            item-title="label"
            item-value="value"
            :items="tipos"
            label="Tipo"
            name="tipoFiltro"
            variant="outlined"
            @update:model-value="onFilterChange"
          />
        </v-col>
      </template>

      <!-- Estado -->
      <template #item.Activo="{ item }">
        <v-chip
          :color="item.Activo ? 'success' : 'error'"
          :prepend-icon="item.Activo ? 'mdi-check-circle' : 'mdi-close-circle'"
          size="small"
          variant="tonal"
        >
          {{ item.Activo ? 'Activo' : 'Inactivo' }}
        </v-chip>
      </template>

      <!-- Habilitado Compras -->
      <template #item.HabilitadoCompras="{ item }">
        <v-icon :color="item.HabilitadoCompras ? 'success' : 'error'" size="20">
          {{ item.HabilitadoCompras ? 'mdi-check-circle' : 'mdi-close-circle' }}
        </v-icon>
      </template>

      <!-- Habilitado Ventas -->
      <template #item.HabilitadoVentas="{ item }">
        <v-icon :color="item.HabilitadoVentas ? 'success' : 'error'" size="20">
          {{ item.HabilitadoVentas ? 'mdi-check-circle' : 'mdi-close-circle' }}
        </v-icon>
      </template>

      <!-- IVA -->
      <template #item.PorcentajeIva="{ item }">
        <span class="text-body-2">{{ item.PorcentajeIva }}%</span>
      </template>

      <!-- Tipo (Regulado, Cadena Frío, Controlado) -->
      <template #[`item.tipo`]="{ item }">
        <div
          :style="{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            justifyContent: mobile ? 'flex-end' : 'flex-start',
          }"
        >
          <v-chip v-if="item.CadenaFrio" color="info" label size="x-small">
            <v-icon size="14" start>mdi-snowflake</v-icon> Cadena frío
          </v-chip>
          <v-chip v-if="item.Regulado" color="orange" label size="x-small">
            <v-icon size="14" start>mdi-shield-check</v-icon> Regulado
          </v-chip>
          <v-chip v-if="item.Controlado" color="deep-purple" label size="x-small">
            <v-icon size="14" start>mdi-lock</v-icon> Controlado
          </v-chip>
          <span
            v-if="!item.CadenaFrio && !item.Regulado && !item.Controlado"
            class="text-caption text-grey"
            >—</span
          >
        </div>
      </template>
    </base-table>

    <producto-dialog
      v-model="dialog.open"
      :mode="dialog.mode"
      :producto="dialog.producto"
      @submit="onSubmit"
    />
  </div>
</template>

<script setup>
  import { onMounted, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { mercanciaService } from '@/api/services/mercanciaService'
  import ProductoDialog from '@/modules/mercancia/components/producto/ProductoDialog.vue'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import BaseTable from '@/shared/ui/BaseTable.vue'
  import PageHeaderActions from '@/shared/ui/PageHeaderActions.vue'

  const { mobile } = useDisplay()

  const tableRef = ref()

  const headers = [
    {
      title: 'Código',
      key: 'CodigoProducto',
      sortable: true,
      searchable: true,
      width: '120px',
    },
    {
      title: 'Nombre',
      key: 'Nombre',
      sortable: false,
      searchable: true,
      width: '200px',
    },
    {
      title: 'Nombre Comercial',
      key: 'NombreComercial',
      sortable: false,
      searchable: true,
    },
    {
      title: 'Laboratorio',
      key: 'Nombrelaboratorio',
      sortable: false,
      searchable: true,
    },
    {
      title: 'Molécula',
      key: 'NombreMolecula',
      sortable: false,
      searchable: true,
    },
    {
      title: 'Presentación',
      key: 'NombrePresentacion',
      sortable: false,
      searchable: false,
    },
    {
      title: 'IVA',
      key: 'PorcentajeIva',
      sortable: true,
      searchable: false,
      align: 'center',
    },
    {
      title: 'Estado',
      key: 'Activo',
      sortable: false,
      searchable: false,
      align: 'center',
    },
    {
      title: 'Compras',
      key: 'HabilitadoCompras',
      sortable: false,
      searchable: false,
      align: 'center',
    },
    {
      title: 'Ventas',
      key: 'HabilitadoVentas',
      sortable: false,
      searchable: false,
      align: 'center',
    },
    { title: 'Tipo', key: 'tipo', sortable: false },
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
      action: (item) => editarProducto(item),
    },
  ]
  const dialog = ref({ open: false, mode: 'view', producto: null })
  const productos = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)

  // ─── Filtros ──────────────────────────────────────────────────────────────
  const estados = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ]
  const estadoSeleccionado = ref(null)

  const tipos = [
    { label: 'Todos', value: null },
    { label: 'Regulado', value: 'Regulado' },
    { label: 'Cadena frío', value: 'CadenaFrio' },
    { label: 'Controlado', value: 'Controlado' },
  ]
  const tipoSeleccionado = ref(null)

  const laboratorios = ref([{ IdLaboratorio: null, Nombre: 'Todos' }])
  const laboratorioSeleccionado = ref(null)

  async function cargarLaboratorios() {
    try {
      const response = await mercanciaService.laboratorio.getLaboratorios()
      if (response.data?.success) {
        laboratorios.value = [{ IdLaboratorio: null, Nombre: 'Todos' }, ...response.data.data]
      }
    } catch (error) {
      console.error('Error al obtener laboratorios:', error)
      laboratorios.value = [{ IdLaboratorio: null, Nombre: 'Todos' }]
    }
  }

  onMounted(() => {
    cargarLaboratorios()
  })

  function onFilterChange() {
    tableRef.value?.reset()
  }

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    loadingTable.value = true
    try {
      const filters = {}

      if (estadoSeleccionado.value !== null) {
        filters.activo = estadoSeleccionado.value
      }
      if (laboratorioSeleccionado.value !== null) {
        filters.IdLaboratorio = laboratorioSeleccionado.value
      }
      if (tipoSeleccionado.value !== null) {
        filters[tipoSeleccionado.value] = true
      }

      const response = await mercanciaService.getProductos(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )

      if (response.data?.success) {
        const { items = [], totalItems: total = 0 } = response.data.data || {}
        productos.value = items
        totalItems.value = total
      }
    } catch (error) {
      console.error('Error al obtener productos:', error)
      productos.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }

  function refrescarTabla() {
    tableRef.value?.reset()
  }
  function abrirCrear() {
    dialog.value = { open: true, mode: 'create', producto: null }
  }

  async function verDetalle(item) {
    $loading.show()
    try {
      const res = await mercanciaService.getProductoById(item.IdProducto)
      if (res.data?.success) {
        dialog.value = { open: true, mode: 'view', producto: res.data.data }
      }
    } catch (error) {
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar el producto')
      }
    } finally {
      $loading.hide()
    }
  }

  async function editarProducto(item) {
    $loading.show()
    try {
      const res = await mercanciaService.getProductoById(item.IdProducto)
      if (res.data?.success) {
        dialog.value = { open: true, mode: 'edit', producto: res.data.data }
      }
    } catch (error) {
      console.error('Error al obtener producto:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al cargar el producto')
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
        await mercanciaService.createProducto(payload)
        $toast.success('Producto creado exitosamente')
      } else if (mode === 'edit') {
        const updateData = {
          ...payload,
          IdProducto: dialog.value.producto.IdProducto,
        }
        await mercanciaService.updateProducto(dialog.value.producto.IdProducto, updateData)
        $toast.success('Producto actualizado exitosamente')
      }
      dialog.value.open = false
      refrescarTabla()
    } catch (error) {
      console.error('Error al guardar producto:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al guardar el producto')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
