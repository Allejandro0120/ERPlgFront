<!-- src/modules/logistica/components/picking/tabs/PickingProductosTab.vue -->
<template>
  <v-row class="mt-2" density="comfortable">
    <!-- ── Buscador rápido de pickeo: escaneo o digitado ──────────────── -->
    <v-col cols="12">
      <v-text-field
        ref="codigoBarraRef"
        v-model="codigoBarra"
        autofocus
        class="picking-search"
        clearable
        density="comfortable"
        hint="Escanea con la pistola o digita el código/nombre del producto y presiona Enter"
        label="Buscar producto a pickear"
        persistent-hint
        prepend-inner-icon="mdi-barcode-scan"
        variant="outlined"
        @keyup.enter="onCodigoIngresado"
      />
    </v-col>

    <!-- ── Pendientes por agregar ─────────────────────────────────────── -->
    <v-col cols="12">
      <base-table-local
        empty-text="No hay productos pendientes"
        :headers="headersPendientes"
        :items="pendientes"
        search-placeholder="Buscar producto pendiente..."
        searchable
        title="Pendientes por agregar"
      >
        <template #item.Cantidad="{ item }">{{ item.Cantidad }}</template>
        <template #item.CodigoUbicacion="{ item }">{{ item.CodigoUbicacion || '-' }}</template>
      </base-table-local>
    </v-col>

    <!-- ── A facturar ─────────────────────────────────────────────────── -->
    <v-col cols="12">
      <base-table-local
        empty-text="Aún no se ha tomado ningún producto"
        :headers="headersTomados"
        :items="tomados"
        :row-actions="rowActionsTomados"
        search-placeholder="Buscar producto tomado..."
        searchable
        title="A facturar"
      >
        <template #item.Cantidad="{ item }">{{ item.Cantidad }}</template>
        <template #item.CodigoUbicacion="{ item }">{{ item.CodigoUbicacion || '-' }}</template>
      </base-table-local>
    </v-col>

    <!-- ── Crear facturación con lo tomado ───────────────────────────── -->
    <template v-if="tomados.length > 0">
      <v-col class="d-flex justify-end" cols="12">
        <v-btn
          color="primary"
          :loading="creandoFacturacion"
          prepend-icon="mdi-truck-check-outline"
          variant="flat"
          @click="$emit('crear-facturacion')"
        >
          Facturar
        </v-btn>
      </v-col>
    </template>
  </v-row>
</template>

<script setup>
  import { nextTick, ref } from 'vue'
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'

  defineProps({
    pendientes: { type: Array, default: () => [] },
    tomados: { type: Array, default: () => [] },
    creandoFacturacion: { type: Boolean, default: false },
  })

  const emit = defineEmits(['quitar', 'crear-facturacion', 'codigo-ingresado'])

  const codigoBarra = ref('')
  const codigoBarraRef = ref(null)

  const headersPendientes = [
    { title: 'Código', key: 'CodigoProducto', sortable: false, width: '140px' },
    {
      title: 'Producto',
      key: 'NombreProducto',
      sortable: false,
      searchable: true,
      minWidth: '220px',
    },
    { title: 'Cantidad esperada', key: 'Cantidad', sortable: false, align: 'center' },
    { title: 'Ubicación', key: 'CodigoUbicacion', sortable: false, align: 'center' },
  ]

  const headersTomados = [
    { title: 'Código', key: 'CodigoProducto', sortable: false, width: '140px' },
    {
      title: 'Producto',
      key: 'NombreProducto',
      sortable: false,
      searchable: true,
      minWidth: '220px',
    },
    { title: 'Cantidad', key: 'Cantidad', sortable: false, align: 'center' },
    { title: 'Ubicación', key: 'CodigoUbicacion', sortable: false, align: 'center' },
  ]

  const rowActionsTomados = [
    {
      label: 'Quitar',
      icon: 'mdi-delete',
      color: 'error',
      action: (item) => emit('quitar', item.LocalId),
    },
  ]

  function onCodigoIngresado() {
    const codigo = codigoBarra.value
    codigoBarra.value = ''
    if (!codigo) return
    emit('codigo-ingresado', codigo)
  }

  function focusCodigo() {
    nextTick(() => codigoBarraRef.value?.focus?.())
  }

  defineExpose({ focusCodigo })
</script>
