<template>
  <div class="w-100">
    <v-card class="mb-4" variant="outlined">
      <v-card-text>
        <v-row align="center" density="comfortable">
          <v-col cols="12" md="5">
            <v-autocomplete
              v-model="filtros.IdProducto"
              v-model:search="productoSearch"
              clearable
              density="comfortable"
              hide-details
              :item-title="productoItemTitle"
              item-value="IdProducto"
              :items="productosItems"
              label="Producto"
              :loading="loadingProductos"
              no-filter
              placeholder="Código, nombre o código de barras (mínimo 4 caracteres)"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              @update:model-value="onProductoChange"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field
              v-model="filtros.desde"
              density="comfortable"
              hide-details
              label="Desde"
              :max="filtros.hasta || undefined"
              type="date"
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field
              v-model="filtros.hasta"
              density="comfortable"
              hide-details
              label="Hasta"
              :min="filtros.desde || undefined"
              type="date"
              variant="outlined"
            />
          </v-col>
          <v-col class="d-flex ga-2" cols="12" md="3">
            <v-btn
              class="text-none flex-grow-1"
              color="primary"
              :disabled="!filtrosValidos"
              :loading="consultando"
              prepend-icon="mdi-magnify"
              @click="consultar"
            >
              Consultar
            </v-btn>
            <v-btn
              class="text-none flex-grow-1"
              color="success"
              :disabled="!filtrosValidos"
              :loading="descargando"
              prepend-icon="mdi-microsoft-excel"
              @click="descargar"
            >
              Excel
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <base-table-local
      empty-text="Selecciona un producto y un rango de fechas, y pulsa Consultar"
      :headers="headers"
      :items="movimientos"
      :loading="consultando"
      :rows-per-page-options="[10, 25, 50, 100]"
      :title="tituloTabla"
    >
      <template #item.FechaRegistro="{ item }">
        {{ formatDateTime(item.FechaRegistro) }}
      </template>
      <template #item.TipoMovimiento="{ item }">
        <v-chip :color="colorMovimiento(item.Factor)" size="small" variant="tonal">
          {{ item.TipoMovimiento }}
        </v-chip>
      </template>
      <template #item.DocumentoReferencia="{ item }">
        <span v-if="item.DocumentoReferencia">
          {{ item.DocumentoReferencia }}
          <span v-if="item.TipoDocumento" class="text-caption text-medium-emphasis">
            ({{ item.TipoDocumento }})
          </span>
        </span>
        <span v-else>—</span>
      </template>
      <template #item.PrecioCompra="{ item }">{{ formatPrecio(item.PrecioCompra) }}</template>
      <template #item.PrecioVenta="{ item }">{{ formatPrecio(item.PrecioVenta) }}</template>
      <template #item.Observaciones="{ item }">
        <div class="text-body-2 text-truncate" style="max-width: 240px">
          {{ item.Observaciones || '—' }}
        </div>
      </template>
    </base-table-local>
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'

  import { informesService } from '@/api/services/informesService'
  import { mercanciaService } from '@/api/services/mercanciaService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useDebounce } from '@/shared/composables/useDebounce'
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'
  import { formatDateTime } from '@/shared/utils/dateFormatter'
  import { downloadExcelResponse } from '@/shared/utils/fileDownload'
  import { unwrapApiData } from '@/shared/utils/unwrapApiData'

  const headers = [
    { title: 'Fecha', key: 'FechaRegistro', sortable: false },
    { title: 'Movimiento', key: 'TipoMovimiento', sortable: false },
    { title: 'Documento', key: 'DocumentoReferencia', sortable: false },
    { title: 'Lote', key: 'CodLote', sortable: false },
    { title: 'Cantidad', key: 'Cantidad', align: 'end', sortable: false },
    { title: 'Origen', key: 'UbicacionOrigen', sortable: false },
    { title: 'Destino', key: 'UbicacionDestino', sortable: false },
    { title: 'Usuario', key: 'Usuario', sortable: false },
    { title: 'Precio compra', key: 'PrecioCompra', align: 'end', sortable: false },
    { title: 'Precio venta', key: 'PrecioVenta', align: 'end', sortable: false },
    { title: 'Observaciones', key: 'Observaciones', sortable: false },
  ]

  // ─── Filtros ─────────────────────────────────────────────────────────────
  const hoy = new Date()
  const haceUnMes = new Date()
  haceUnMes.setDate(haceUnMes.getDate() - 30)
  function aIso(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
  }

  const filtros = ref({ IdProducto: null, desde: aIso(haceUnMes), hasta: aIso(hoy) })
  const filtrosValidos = computed(
    () =>
      !!filtros.value.IdProducto &&
      !!filtros.value.desde &&
      !!filtros.value.hasta &&
      filtros.value.desde <= filtros.value.hasta,
  )

  // ─── Búsqueda de producto ────────────────────────────────────────────────
  const productoSearch = ref('')
  const productosItems = ref([])
  const loadingProductos = ref(false)
  const selectedProducto = ref(null)

  function productoItemTitle(item) {
    if (!item) return ''
    return [item.CodigoProducto, item.Nombre].filter(Boolean).join(' - ')
  }

  async function buscarProductos(termino) {
    loadingProductos.value = true
    try {
      const resultados = unwrapApiData(await mercanciaService.getProductosSearch(termino))
      productosItems.value = resultados
      if (selectedProducto.value) {
        const existe = resultados.some((p) => p.IdProducto === selectedProducto.value.IdProducto)
        if (!existe) productosItems.value.unshift(selectedProducto.value)
      }
    } catch (error) {
      console.error('Error buscando productos:', error)
      $toast.error('No se pudieron cargar los productos')
    } finally {
      loadingProductos.value = false
    }
  }

  const { debounced: debouncedBuscar, cancel: cancelBuscar } = useDebounce(
    (termino) => buscarProductos(termino),
    500,
  )

  watch(productoSearch, (value) => {
    const termino = value?.trim() ?? ''
    // Al elegir un producto el campo muestra su título: no vuelve a consultar
    if (selectedProducto.value && termino === productoItemTitle(selectedProducto.value)) return
    if (termino.length < 4) {
      cancelBuscar()
      productosItems.value = selectedProducto.value ? [selectedProducto.value] : []
      return
    }
    debouncedBuscar(termino)
  })

  function onProductoChange(idProducto) {
    selectedProducto.value = productosItems.value.find((p) => p.IdProducto === idProducto) ?? null
    movimientos.value = []
    productoConsultado.value = null
  }

  // ─── Consulta y descarga ─────────────────────────────────────────────────
  const movimientos = ref([])
  const productoConsultado = ref(null)
  const consultando = ref(false)
  const descargando = ref(false)

  const tituloTabla = computed(() =>
    productoConsultado.value
      ? `Movimientos de ${productoItemTitle(productoConsultado.value)}`
      : 'Movimientos del producto',
  )

  function parametros() {
    return {
      IdProducto: filtros.value.IdProducto,
      desde: filtros.value.desde,
      hasta: filtros.value.hasta,
    }
  }

  async function consultar() {
    consultando.value = true
    try {
      const response = await informesService.getHistoricoProducto(parametros())
      movimientos.value = unwrapApiData(response)
      productoConsultado.value = selectedProducto.value
      if (movimientos.value.length === 0) {
        $toast.info('No hay movimientos del producto en ese rango de fechas')
      }
    } catch (error) {
      movimientos.value = []
      if (!error._toastShown) $toast.error('No se pudo consultar el histórico')
    } finally {
      consultando.value = false
    }
  }

  async function descargar() {
    descargando.value = true
    $loading.show('Generando archivo...')
    try {
      const res = await informesService.exportHistoricoProducto(parametros())
      const codigo = selectedProducto.value?.CodigoProducto ?? filtros.value.IdProducto
      downloadExcelResponse(
        res,
        `Historico_${codigo}_${filtros.value.desde}_${filtros.value.hasta}`,
      )
    } catch (error) {
      if (!error._toastShown) $toast.error('No se pudo descargar el histórico')
    } finally {
      $loading.hide()
      descargando.value = false
    }
  }

  // ─── Presentación ────────────────────────────────────────────────────────
  function colorMovimiento(factor) {
    if (factor > 0) return 'success'
    if (factor < 0) return 'error'
    return 'grey'
  }

  function formatPrecio(valor) {
    return valor === null || valor === undefined
      ? '—'
      : `$ ${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`
  }
</script>
