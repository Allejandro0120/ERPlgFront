<template>
  <div class="mt-2 d-flex flex-column">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center ga-2">
        <div class="text-subtitle-1 font-weight-bold">Productos de la cotización</div>
        <v-chip color="primary" size="small" variant="tonal">{{ lineas.length }}</v-chip>
      </div>
      <v-chip :color="todoAsignado ? 'success' : 'primary'" size="small" variant="tonal">
        {{ lineasCompletas }} de {{ lineas.length }} completos
      </v-chip>
    </div>

    <div
      v-if="lineas.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">mdi-package-variant-closed</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-0">La cotización no tiene productos</p>
    </div>

    <template v-else>
      <base-table-local
        class="rounded-lg border"
        :headers="headers"
        :items="filas"
        :loading="false"
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

        <template #item.Estado="{ item }">
          <v-chip :color="colorEstado(item.Estado)" size="small" variant="tonal">
            <v-icon :icon="iconoEstado(item.Estado)" size="14" start />
            {{ item.Estado }}
          </v-chip>
        </template>

        <template #item.Total="{ item }">
          <strong>{{ formatCurrencyCOP(item.Total) }}</strong>
        </template>

        <template #item.acciones="{ item }">
          <v-btn
            class="text-none"
            color="primary"
            :variant="item.Tomado > 0 ? 'flat' : 'tonal'"
            @click="emit('asignar', item.LocalId)"
          >
            {{ labelAccion(item) }}
          </v-btn>
        </template>
      </base-table-local>

      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mt-3">
        <span class="text-body-2" :class="todoAsignado ? 'text-success' : 'text-grey-darken-1'">
          {{ resumen }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import BaseTableLocal from '@/shared/ui/BaseTableLocal.vue'
  import ProductoAtributosIcons from '@/shared/ui/ProductoAtributosIcons.vue'
  import { formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import {
    cantidadFaltante,
    cantidadTomada,
    ESTADO_LINEA,
    estadoLinea,
  } from '../../../composables/pedido/usePedidoAsignaciones'
  import { calcularLinea } from '../../../utils/calculoLinea'

  const props = defineProps({
    lineas: { type: Array, default: () => [] },
    lineasCompletas: { type: Number, default: 0 },
    unidadesFaltantes: { type: Number, default: 0 },
    todoAsignado: { type: Boolean, default: false },
    isReadonly: { type: Boolean, default: false },
  })

  const emit = defineEmits(['asignar'])

  const filas = computed(() =>
    props.lineas.map((linea) => {
      const tomado = cantidadTomada(linea)
      return {
        LocalId: linea.LocalId,
        CodigoNombreProducto: linea.CodigoNombreProducto,
        CadenaFrio: linea.CadenaFrio,
        Controlado: linea.Controlado,
        Regulado: linea.Regulado,
        Cantidad: linea.Cantidad,
        PrecioUnitario: linea.PrecioUnitario,
        PorcentajeDescuento: linea.PorcentajeDescuento,
        PorcentajeIva: linea.PorcentajeIva,
        Tomado: tomado,
        Faltante: cantidadFaltante(linea),
        Estado: estadoLinea(linea),
        Total: calcularLinea({
          Cantidad: tomado,
          PrecioUnitario: linea.PrecioUnitario,
          PorcentajeDescuento: linea.PorcentajeDescuento,
          PorcentajeIva: linea.PorcentajeIva,
        }).total,
      }
    }),
  )

  const headers = [
    {
      title: 'Producto',
      key: 'CodigoNombreProducto',
      sortable: false,
      minWidth: '220px',
      searchable: true,
    },
    { title: 'Cotizado', key: 'Cantidad', sortable: false, align: 'center' },
    { title: 'Tomado', key: 'Tomado', sortable: false, align: 'center' },
    { title: 'Faltante', key: 'Faltante', sortable: false, align: 'center' },
    {
      title: 'Precio Unit.',
      key: 'PrecioUnitario',
      sortable: false,
      align: 'end',
      minWidth: '160px',
    },
    { title: '% Desc.', key: 'PorcentajeDescuento', sortable: false, align: 'center' },
    { title: '% IVA', key: 'PorcentajeIva', sortable: false, align: 'center' },
    { title: 'Total Línea', key: 'Total', sortable: false, align: 'end', minWidth: '140px' },
    { title: 'Estado', key: 'Estado', sortable: false, align: 'center' },
    { title: '', key: 'acciones', sortable: false, align: 'center', width: '160px' },
  ]

  const resumen = computed(() => {
    if (props.lineas.length === 0) return ''
    if (props.todoAsignado) return 'Todos los productos están completamente asignados.'
    if (props.unidadesFaltantes > 0) return `${props.unidadesFaltantes} unidades por cubrir.`
    return ''
  })

  function colorEstado(estado) {
    return {
      [ESTADO_LINEA.COMPLETO]: 'success',
      [ESTADO_LINEA.FALTANTE]: 'warning',
    }[estado]
  }

  function iconoEstado(estado) {
    return {
      [ESTADO_LINEA.COMPLETO]: 'mdi-check-circle',
      [ESTADO_LINEA.FALTANTE]: 'mdi-alert-circle-outline',
    }[estado]
  }

  // El botón distingue "Asignar" (aún no se ha tomado nada) de "Continuar" (cobertura
  // parcial) usando la cantidad tomada, no el estado: ambos casos se muestran como
  // "Faltante" porque puede que simplemente no haya stock disponible del producto.
  function labelAccion(item) {
    if (props.isReadonly) return 'Ver'
    if (item.Estado === ESTADO_LINEA.COMPLETO) return 'Ver'
    return item.Tomado > 0 ? 'Continuar' : 'Asignar'
  }
</script>

<style scoped></style>
