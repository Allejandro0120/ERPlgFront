<template>
  <div class="mt-2 d-flex flex-column">
    <div class="order-2 order-sm-1">
      <div
        v-if="detalles.length === 0"
        class="d-flex flex-column align-center justify-center py-12 rounded-lg"
        style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
      >
        <v-icon class="mb-3" color="grey-lighten-1" size="44">mdi-package-variant-closed</v-icon>
        <p class="text-body-2 text-grey-darken-1 mb-1">Sin productos en la cotización</p>
        <template v-if="!isReadonly">
          <p class="text-caption text-grey mb-3">
            Haz clic en "Agregar Producto" para añadir el primero
          </p>
          <v-btn color="primary" prepend-icon="mdi-plus" variant="tonal" @click="emit('add')">
            Agregar Producto
          </v-btn>
        </template>
      </div>

      <template v-else>
        <base-table-local
          class="rounded-lg border"
          :headers="headers"
          :items="detalles"
          :loading="false"
          :row-actions="rowActions"
          search-placeholder="Buscar producto..."
          searchable
          title="Productos"
          :title-button="titleButton"
        >
          <template #chip>
            <v-chip color="primary" size="small" variant="tonal">{{ detalles.length }}</v-chip>
          </template>

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
          <template #item.Subtotal="{ item }">
            <strong>{{ formatCurrencyCOP(item.Subtotal + item.ValorIva) }}</strong>
          </template>
        </base-table-local>
      </template>
    </div>

    <!-- Totales: en móvil aparece primero y a todo el ancho; en desktop, después de la tabla -->
    <v-row class="mt-3 mb-3 order-1 order-sm-2" justify="end">
      <v-col cols="12" md="5" sm="7">
        <totales-resumen-card
          :descuento-total="totales.descuentoTotal"
          :otros-impuestos="otrosImpuestos"
          :subtotal="totales.subtotal"
          :valor-iva="totales.valorIva"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import ProductoAtributosIcons from '@/shared/ui/common/ProductoAtributosIcons.vue'
  import TotalesResumenCard from '@/shared/ui/common/TotalesResumenCard.vue'
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'

  const props = defineProps({
    detalles: { type: Array, default: () => [] },
    totales: {
      type: Object,
      default: () => ({ subtotal: 0, descuentoTotal: 0, valorIva: 0 }),
    },
    isReadonly: { type: Boolean, default: false },
    otrosImpuestos: { type: Number, default: 0 },
  })

  const emit = defineEmits(['add', 'editar-producto', 'eliminar-producto', 'ver-producto'])

  const titleButton = computed(() =>
    props.isReadonly
      ? null
      : {
          label: 'Agregar Producto',
          icon: 'mdi-plus',
          variant: 'tonal',
          action: () => emit('add'),
        },
  )

  const headers = computed(() => [
    {
      title: 'Producto',
      key: 'CodigoNombreProducto',
      sortable: false,
      minWidth: '220px',
      searchable: true,
    },
    { title: 'Cantidad', key: 'Cantidad', align: 'center', sortable: false },
    { title: 'Precio Unit.', key: 'PrecioUnitario', align: 'end', sortable: false },
    { title: '% Desc.', key: 'PorcentajeDescuento', align: 'center', sortable: false },
    { title: '% IVA', key: 'PorcentajeIva', align: 'center', sortable: false },
    { title: 'Total Línea', key: 'Subtotal', align: 'end', sortable: false },
  ])

  const rowActions = computed(() => [
    {
      label: 'Editar',
      icon: '$pencil',
      visible: !props.isReadonly,
      action: (item) => emit('editar-producto', item.LocalId),
    },
    {
      label: 'Eliminar',
      icon: '$delete',
      color: 'error',
      visible: !props.isReadonly,
      action: (item) => emit('eliminar-producto', item.LocalId),
    },
    {
      label: 'Ver detalle',
      icon: '$eye',
      visible: props.isReadonly,
      action: (item) => emit('ver-producto', item.LocalId),
    },
  ])
</script>

<style scoped></style>
