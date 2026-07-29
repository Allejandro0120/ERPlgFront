<template>
  <div class="w-100">
    <page-header-actions />

    <base-table
      ref="tableRef"
      empty-text="No se encontraron saldos de inventario"
      :headers="headers"
      item-key="IdProducto"
      :items="saldos"
      :loading="loadingTable"
      :row-actions="rowActions"
      search-placeholder="Buscar por código, nombre o lote..."
      searchable
      title="Saldos de Inventario"
      :total-items="totalItems"
      @load="fetchData"
    >
      <template #filters>
        <v-col cols="12" md="3" sm="4">
          <v-autocomplete
            v-model="selectedCedi"
            clearable
            density="compact"
            hide-details
            item-title="NombreCedi"
            item-value="IdCedi"
            :items="cedisList"
            label="Centro de Distribución"
            placeholder="Seleccione un CEDI"
            variant="outlined"
            @update:model-value="onCediChange"
          ></v-autocomplete>
        </v-col>

        <v-col class="d-flex align-center" cols="12" lg="2" md="3" sm="2" xl="1">
          <BaseFilterDialog
            icon="mdi-filter-variant"
            :selected-count="totalFiltrosSeleccionados"
            title="Filtrar Inventario"
            @apply="aplicarFiltros"
            @clear="limpiarFiltros"
          >
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdBodega"
                clearable
                density="comfortable"
                item-title="NombreBodega"
                item-value="IdBodega"
                :items="bodegas"
                label="Bodega"
                :loading="loadingObj.bodegas"
                variant="outlined"
                @update:model-value="onBodegaChange"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdZona"
                clearable
                density="comfortable"
                item-title="CodZona"
                item-value="IdZona"
                :items="zonas"
                label="Zona"
                :loading="loadingObj.zonas"
                variant="outlined"
                @update:model-value="onZonaChange"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdPasillo"
                clearable
                density="comfortable"
                item-title="CodPasillo"
                item-value="IdPasillo"
                :items="pasillos"
                label="Pasillo"
                :loading="loadingObj.pasillos"
                variant="outlined"
                @update:model-value="onPasilloChange"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdEstante"
                clearable
                density="comfortable"
                item-title="CodEstante"
                item-value="IdEstante"
                :items="estantes"
                label="Estante"
                :loading="loadingObj.estantes"
                variant="outlined"
                @update:model-value="onEstanteChange"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.IdUbicacion"
                clearable
                density="comfortable"
                item-title="CodUbicacion"
                item-value="IdUbicacion"
                :items="ubicaciones"
                label="Ubicación"
                :loading="loadingObj.ubicaciones"
                variant="outlined"
              ></v-autocomplete>
            </v-col>
          </BaseFilterDialog>
        </v-col>
      </template>

      <template #item.UltimaActualizacion="{ item }">
        {{ formatearFecha(item.UltimaActualizacion) }}
      </template>
      <template #item.CantidadDisponible="{ item }">
        <v-chip class="font-weight-medium" color="success" size="small" variant="tonal">
          {{ item.CantidadDisponible }}
        </v-chip>
      </template>
    </base-table>

    <historial-movimientos-dialog
      v-model="showMovimientosDialog"
      :cedi="selectedCedi"
      :product="selectedProduct"
      @saved="onMovimientoGuardado"
    />
  </div>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { mercanciaService } from '@/api/services/mercanciaService'
  // 1. Importar el composable de infraestructura
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseFilterDialog from '@/shared/ui/BaseFilterDialog.vue'
  import BaseTable from '@/shared/ui/BaseTable.vue'
  import PageHeaderActions from '@/shared/ui/PageHeaderActions.vue'
  import { formatDateTime } from '@/shared/utils/dateFormatter'

  import HistorialMovimientosDialog from '../components/inventario/HistorialMovimientosDialog.vue'

  const tableRef = ref()
  const headers = [
    { title: 'Código', key: 'CodigoProducto', sortable: false, searchable: true },
    { title: 'Producto', key: 'NombreProducto', sortable: false, searchable: true },
    { title: 'Ubicación', key: 'CodUbicacion', sortable: false, searchable: true },
    { title: 'Lote', key: 'CodLote', sortable: false, searchable: true },
    { title: 'C. Física', key: 'CantidadFisica', sortable: true, align: 'end' },
    { title: 'C. Reservada', key: 'CantidadReservada', sortable: true, align: 'end' },
    { title: 'C. Disponible', key: 'CantidadDisponible', sortable: true, align: 'end' },
    { title: 'Última Act.', key: 'UltimaActualizacion', sortable: true },
  ]

  const rowActions = [
    {
      label: 'Ver detalle',
      icon: '$eye',
      color: 'blue-darken-3',
      action: (item) => verDetalle(item),
    },
  ]

  // 2. Simplificar el formData inicial (solo necesitamos IDs de ubicación para filtrar)
  const initialForm = {
    IdBodega: null,
    IdZona: null,
    IdPasillo: null,
    IdEstante: null,
    IdUbicacion: null,
  }

  const formData = ref({ ...initialForm })

  const totalFiltrosSeleccionados = computed(
    () => Object.values(formData.value).filter((v) => v !== null && v !== '').length,
  )

  // 3. Crear el UI ref requerido por el composable
  const ui = ref({ IdCedi: null, IdBodega: null, IdEstante: null })

  const saldos = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)
  const selectedCedi = ref(null)
  const cedisList = ref([])
  const showMovimientosDialog = ref(false)
  const selectedProduct = ref(null)

  // 4. Extraer variables y métodos del composable
  const {
    bodegas,
    zonas,
    pasillos,
    estantes,
    ubicaciones,
    loading: loadingObj,
    onCediChange: triggerCascadeCedi, // Alias para no chocar con el evento local
    onBodegaChange,
    onZonaChange,
    onPasilloChange,
    onEstanteChange,
    resetInfraestructuraState,
  } = useInfraestructuraCascade({
    ui,
    form: formData,
    services: infraestructuraService,
    keys: {
      idCedi: 'IdCedi',
      idBodega: 'IdBodega',
      idZona: 'IdZona',
      idPasillo: 'IdPasillo',
      idEstante: 'IdEstante',
      idUbicacion: 'IdUbicacion',
    },
    onError: (error, stage) => {
      console.error(`Error de infraestructura (${stage}):`, error)
    },
  })

  onMounted(async () => {
    try {
      const response = await infraestructuraService.getCedis()
      if (response.data?.success) {
        cedisList.value = response.data.data || []
        if (cedisList.value.length > 0) {
          selectedCedi.value = cedisList.value[0].IdCedi
          onCediChange()
        }
      }
    } catch (error) {
      console.error('Error al cargar los CEDIs:', error)
    }
  })

  // 5. Manejar el cambio del filtro principal (Cedi)
  function onCediChange() {
    // Sincronizar el estado de UI
    ui.value.IdCedi = selectedCedi.value

    // Limpiar el sub-árbol de selecciones porque el CEDI cambió
    formData.value = { ...initialForm }

    if (selectedCedi.value) {
      triggerCascadeCedi(selectedCedi.value)
    } else {
      resetInfraestructuraState()
    }

    if (tableRef.value) tableRef.value.reset()
  }

  // 6. Métodos para gestionar la aplicación de los filtros del diálogo
  function aplicarFiltros() {
    if (tableRef.value) tableRef.value.reset()
  }

  function limpiarFiltros() {
    formData.value = { ...initialForm }
    if (selectedCedi.value) {
      triggerCascadeCedi(selectedCedi.value)
    }
    if (tableRef.value) tableRef.value.reset()
  }

  function onMovimientoGuardado() {
    if (tableRef.value) tableRef.value.reset()
  }

  function verDetalle(item) {
    selectedProduct.value = item
    showMovimientosDialog.value = true
  }

  const formatearFecha = (fecha) => (fecha ? formatDateTime(fecha) : 'N/A')

  // 7. Enviar todos los filtros seleccionados al backend
  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    if (!selectedCedi.value) {
      saldos.value = []
      totalItems.value = 0
      return
    }

    loadingTable.value = true
    try {
      // Construimos el objeto final omitiendo los nulos
      const filters = {
        IdCedi: selectedCedi.value,
        ...(formData.value.IdBodega && { IdBodega: formData.value.IdBodega }),
        ...(formData.value.IdZona && { IdZona: formData.value.IdZona }),
        ...(formData.value.IdPasillo && { IdPasillo: formData.value.IdPasillo }),
        ...(formData.value.IdEstante && { IdEstante: formData.value.IdEstante }),
        ...(formData.value.IdUbicacion && { IdUbicacion: formData.value.IdUbicacion }),
      }

      const response = await mercanciaService.getSaldos(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
        filters,
      )

      if (response.data?.success) {
        const payload = response.data.data || {}
        saldos.value = payload.data || []
        totalItems.value = payload.totalRecords || 0
      }
    } catch (error) {
      console.error('Error al obtener saldos:', error)
      saldos.value = []
      totalItems.value = 0
    } finally {
      loadingTable.value = false
    }
  }
</script>
