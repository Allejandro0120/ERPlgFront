<template>
  <div class="mt-2 d-flex flex-column">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center ga-2">
        <div class="text-subtitle-1 font-weight-bold">Productos</div>
        <v-chip color="primary" size="small" variant="tonal">{{ lineas.length }}</v-chip>
      </div>
      <v-btn
        v-if="!isReadonly"
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        @click="emit('add')"
      >
        Agregar Producto
      </v-btn>
    </div>

    <div class="order-2 order-sm-1">
      <div
        v-if="lineas.length === 0"
        class="d-flex flex-column align-center justify-center py-12 rounded-lg"
        style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
      >
        <v-icon class="mb-3" color="grey-lighten-1" size="44">mdi-package-variant-closed</v-icon>
        <p class="text-body-2 text-grey-darken-1 mb-1">Sin productos en el pedido</p>
        <p v-if="!isReadonly" class="text-caption text-grey">
          Haz clic en "Agregar Producto" para añadir el primero
        </p>
      </div>

      <template v-else>
        <base-table-local
          class="rounded-lg border"
          :headers="headers"
          :items="filas"
          :loading="false"
          :row-actions="rowActions"
          search-placeholder="Buscar producto..."
          searchable
        >
          <template #item.CodigoNombreProducto="{ item }">
            <span>
              {{ item.CodigoNombreProducto }}
              <producto-atributos-icons
                :cadena-frio="item.CadenaFrio"
                class="align-middle"
                :controlado="item.Controlado"
                :regulado="item.Regulado"
              />
            </span>
          </template>

          <template #item.PrecioUnitario="{ item }">{{
            formatCurrencyCOP(item.PrecioUnitario)
          }}</template>

          <template #item.PorcentajeDescuento="{ item }">{{ item.PorcentajeDescuento }}%</template>

          <template #item.PorcentajeIva="{ item }">{{ item.PorcentajeIva }}%</template>

          <template #item.Tomado="{ item }">
            <v-chip color="success" density="comfortable" label size="small" variant="tonal">
              {{ item.Tomado }}
            </v-chip>
          </template>

          <template #item.Faltante="{ item }">
            <v-chip
              :color="item.Faltante > 0 ? 'warning' : 'success'"
              density="comfortable"
              label
              size="small"
              variant="tonal"
            >
              {{ item.Faltante }}
            </v-chip>
          </template>

          <template v-if="isReadonly" #item.Despachado="{ item }">
            <v-chip
              color="purple-darken-3"
              density="comfortable"
              label
              size="small"
              variant="tonal"
            >
              {{ item.Despachado }}
            </v-chip>
          </template>

          <template v-if="isReadonly" #item.Pendiente="{ item }">
            <v-chip
              :color="item.Pendiente > 0 ? 'orange-darken-2' : 'success'"
              density="comfortable"
              label
              size="small"
              variant="tonal"
            >
              {{ item.Pendiente }}
            </v-chip>
          </template>

          <template #item.Total="{ item }">
            <strong>{{ formatCurrencyCOP(item.Total) }}</strong>
          </template>
        </base-table-local>
      </template>
    </div>

    <v-row class="mt-3 mb-3 order-1 order-sm-2" justify="end">
      <v-col cols="12" md="5" sm="7">
        <v-card class="pa-3" rounded="lg" variant="tonal">
          <div class="d-flex justify-space-between align-center py-1">
            <span class="text-body-2 text-grey-darken-1">Subtotal</span>
            <span class="text-body-2 font-weight-medium">{{
              formatCurrencyCOP(totales.subtotal)
            }}</span>
          </div>
          <div class="d-flex justify-space-between align-center py-1">
            <span class="text-body-2 text-grey-darken-1">Descuento</span>
            <span class="text-body-2 font-weight-medium">
              - {{ formatCurrencyCOP(totales.descuentoTotal) }}
            </span>
          </div>
          <div class="d-flex justify-space-between align-center py-1">
            <span class="text-body-2 text-grey-darken-1">IVA</span>
            <span class="text-body-2 font-weight-medium">{{
              formatCurrencyCOP(totales.valorIva)
            }}</span>
          </div>
          <v-divider class="my-1" />
          <div class="d-flex justify-space-between align-center pt-1">
            <span class="text-body-1 font-weight-bold text-primary">Total</span>
            <span class="text-body-1 font-weight-bold text-primary">
              {{ formatCurrencyCOP(totales.subtotal + totales.valorIva) }}
            </span>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import ProductoAtributosIcons from '@/shared/ui/ProductoAtributosIcons.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import {
    calcularTotalesProducto,
    cantidadTomada,
  } from '../../../composables/pedido/usePedidoProductosLibre'

  const props = defineProps({
    lineas: { type: Array, default: () => [] },
    totales: {
      type: Object,
      default: () => ({ subtotal: 0, descuentoTotal: 0, valorIva: 0 }),
    },
    isReadonly: { type: Boolean, default: false },
  })

  const emit = defineEmits(['add', 'editar-linea', 'eliminar-linea', 'ver-linea'])

  const filas = computed(() =>
    props.lineas.map((linea) => ({
      LocalId: linea.LocalId,
      CodigoNombreProducto: linea.CodigoNombreProducto,
      CadenaFrio: linea.CadenaFrio,
      Controlado: linea.Controlado,
      Regulado: linea.Regulado,
      Tomado: cantidadTomada(linea),
      Faltante: Number(linea.CantidadFaltante) || 0,
      Despachado: Number(linea.CantidadDespachada) || 0,
      Pendiente: Number(linea.CantidadPendiente) || 0,
      PrecioUnitario: linea.PrecioUnitario,
      PorcentajeDescuento: linea.PorcentajeDescuento,
      PorcentajeIva: linea.PorcentajeIva,
      Total: calcularTotalesProducto(linea).total,
    })),
  )

  const headers = computed(() => [
    {
      title: 'Producto',
      key: 'CodigoNombreProducto',
      sortable: false,
      minWidth: '220px',
      searchable: true,
    },
    { title: 'Tomado', key: 'Tomado', sortable: false, align: 'center' },
    { title: 'Faltante(Stock)', key: 'Faltante', sortable: false, align: 'center' },
    ...(props.isReadonly
      ? [
          { title: 'Despachado', key: 'Despachado', sortable: false, align: 'center' },
          { title: 'Pendiente', key: 'Pendiente', sortable: false, align: 'center' },
        ]
      : []),
    { title: 'Precio Unit.', key: 'PrecioUnitario', align: 'end', sortable: false },
    { title: '% Desc.', key: 'PorcentajeDescuento', sortable: false, align: 'center' },
    { title: '% IVA', key: 'PorcentajeIva', sortable: false, align: 'center' },
    { title: 'Total Línea', key: 'Total', align: 'end', sortable: false },
  ])

  const rowActions = computed(() => [
    {
      label: 'Editar',
      icon: '$pencil',
      visible: !props.isReadonly,
      action: (item) => emit('editar-linea', item.LocalId),
    },
    {
      label: 'Eliminar',
      icon: '$delete',
      color: 'error',
      visible: !props.isReadonly,
      action: (item) => emit('eliminar-linea', item.LocalId),
    },
    {
      label: 'Ver detalle',
      icon: '$eye',
      visible: props.isReadonly,
      action: (item) => emit('ver-linea', item.LocalId),
    },
  ])
</script>

<style scoped></style>
