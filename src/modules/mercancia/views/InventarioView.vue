<!-- src/modules/mercancia/views/InventarioView.vue -->
<template>
  <div class="w-100">
    <page-header-actions>
      <!-- Acciones de cabecera si son necesarias a futuro -->
    </page-header-actions>

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
      <template #item.UltimaActualizacion="{ item }">
        {{ formatearFecha(item.UltimaActualizacion) }}
      </template>

      <template #item.CantidadDisponible="{ item }">
        <v-chip class="font-weight-medium" color="success" size="small" variant="tonal">
          {{ item.CantidadDisponible }}
        </v-chip>
      </template>

      <!-- Puedes añadir chips o formato para físicas, reservadas, etc. si lo necesitas -->
    </base-table>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { mercanciaService } from '@/api/services/mercanciaService'
  import BaseTable from '@/shared/ui/BaseTable.vue'
  import PageHeaderActions from '@/shared/ui/PageHeaderActions.vue'
  import { formatDateTime } from '@/shared/utils/dateFormatter'

  const tableRef = ref()

  const headers = [
    { title: 'Código', key: 'CodigoProducto', sortable: true, searchable: true },
    { title: 'Producto', key: 'NombreProducto', sortable: true, searchable: true },
    { title: 'Ubicación', key: 'CodigoUbicacion', sortable: true, searchable: true },
    { title: 'Lote', key: 'CodLote', sortable: true, searchable: true },
    { title: 'C. Física', key: 'CantidadFisica', sortable: true, align: 'end' },
    { title: 'C. Reservada', key: 'CantidadReservada', sortable: true, align: 'end' },
    { title: 'C. Bloqueada', key: 'CantidadBloqueada', sortable: true, align: 'end' },
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

  const saldos = ref([])
  const totalItems = ref(0)
  const loadingTable = ref(false)

  const formatearFecha = (fecha) => {
    return fecha ? formatDateTime(fecha) : 'N/A'
  }

  async function fetchData({ page, itemsPerPage, sortByField, sortOrder, search }) {
    loadingTable.value = true
    try {
      const response = await mercanciaService.getSaldos(
        page,
        itemsPerPage,
        search,
        sortByField,
        sortOrder,
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
