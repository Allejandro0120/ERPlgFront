<template>
  <div class="mt-2">
    <template v-if="!isReadonly">
      <v-row align="center" class="mb-4" density="compact">
        <v-col cols="12" md="10">
          <v-autocomplete
            v-model="productoSeleccionado"
            v-model:search="productoSearch"
            clearable
            hide-details
            :item-title="productoItemTitle"
            item-value="IdProducto"
            :items="productosItems"
            label="Buscar producto"
            :loading="loadingProductos"
            no-filter
            placeholder="Escribe código o nombre (mínimo 4 caracteres)"
            prepend-inner-icon="mdi-package-variant"
            return-object
            variant="outlined"
            @keydown.enter.prevent="onBuscarProductoEnter"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-btn
            block
            color="primary"
            :disabled="!productoSeleccionado"
            prepend-icon="mdi-plus"
            variant="tonal"
            @click="onAgregarProducto"
          >
            Agregar
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <div
      v-if="detalles.length === 0"
      class="d-flex flex-column align-center justify-center py-12 rounded-lg mt-2"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">mdi-package-variant-closed</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin productos asociados</p>
      <p v-if="!isReadonly" class="text-caption text-grey">
        Busca un producto y haz clic en "Agregar" para añadirlo a la lista
      </p>
    </div>

    <template v-else>
      <base-table-local
        class="rounded-lg border"
        :headers="headers"
        :items="detalles"
        :loading="false"
        :row-actions="rowActions"
        search-placeholder="Buscar producto en la lista..."
        searchable
      >
        <template v-if="!isReadonly && codigo" #filters>
          <v-col class="d-flex justify-end" cols="12" md="6">
            <v-btn
              color="primary"
              prepend-icon="mdi-file-excel"
              variant="outlined"
              @click="importDialogOpen = true"
            >
              Actualización masiva
            </v-btn>
          </v-col>
        </template>

        <template #item.PrecioBase="{ item }">
          <v-text-field
            v-if="!isReadonly"
            v-model="item.PrecioBase"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-currency-usd"
            required
            :rules="[rules.required, rules.maxCOP(1_000_000_000, 'El precio base')]"
            variant="outlined"
            @keydown="blockKey($event, allow.decimal)"
            @paste="blockPaste($event, allow.decimal)"
            @update:model-value="(val) => onPrecioBaseInput(item, val)"
          />
          <span v-else>{{ formatCurrencyCOP(item.PrecioBase) }}</span>
        </template>

        <template #item.PorcentajeDescuentoMaximo="{ item }">
          <v-text-field
            v-if="!isReadonly"
            v-model="item.PorcentajeDescuentoMaximo"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-percent"
            required
            :rules="[rules.required, rules.numeric, rules.maxValue(100, 'El descuento máximo')]"
            variant="outlined"
            @input="
              item.PorcentajeDescuentoMaximo = sanitizeInput(
                item.PorcentajeDescuentoMaximo,
                allow.onlyDigitsAndDot,
              )
            "
            @keydown="blockKey($event, allow.onlyDigitsAndDot)"
            @paste="blockPaste($event, allow.onlyDigitsAndDot)"
          />
          <span v-else>{{ item.PorcentajeDescuentoMaximo }}%</span>
        </template>
      </base-table-local>
    </template>

    <importar-productos-dialog v-model="importDialogOpen" @submit="onImportarProductos" />
  </div>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { comercialService } from '@/api/services/comercialService'
  import { mercanciaService } from '@/api/services/mercanciaService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useDebounce } from '@/shared/composables/useDebounce'
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'
  import { formatCOP, formatCurrencyCOP } from '@/shared/utils/currencyFormatter'
  import { allow, blockKey, blockPaste, sanitizeInput } from '@/shared/utils/inputKeyFilter'
  import { unwrapApiData } from '@/shared/utils/unwrapApiData'
  import { rules } from '@/shared/utils/validationRules'
  import ImportarProductosDialog from '../ImportarProductosDialog.vue'

  const props = defineProps({
    detalles: { type: Array, default: () => [] },
    headers: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
    codigo: { type: String, default: '' },
  })

  const emit = defineEmits(['agregar-producto', 'eliminar-producto', 'productos-importados'])

  const importDialogOpen = ref(false)

  async function onImportarProductos(file) {
    const formData = new FormData()
    formData.append('archivo', file)

    $loading.show()
    try {
      await comercialService.importarProductosListaPrecio(props.codigo, formData)
      $toast.success('Productos importados exitosamente')
      importDialogOpen.value = false
      emit('productos-importados')
    } catch (error) {
      if (!error._toastShown) $toast.error('Error inesperado al importar los productos')
    } finally {
      $loading.hide()
    }
  }

  function onPrecioBaseInput(item, val) {
    item.PrecioBase = formatCOP(val)
  }

  const rowActions = computed(() => [
    {
      label: 'Eliminar',
      icon: '$delete',
      color: 'error',
      visible: !props.isReadonly,
      action: (item) => emit('eliminar-producto', item.LocalId),
    },
  ])

  // ─── Búsqueda de productos ────────────────────────────────────────────────
  const productoSearch = ref('')
  const loadingProductos = ref(false)
  const productosItems = ref([])
  const productoSeleccionado = ref(null)

  function buildProductoItem(producto) {
    const codigo = producto.CodigoProducto ?? producto.CodProducto ?? ''
    const nombre = producto.NombreProducto ?? producto.Nombre ?? ''
    return {
      ...producto,
      CodigoNombreProducto:
        producto.CodigoNombreProducto ?? [codigo, nombre].filter(Boolean).join(' - '),
    }
  }

  function productoItemTitle(item) {
    if (!item) return ''
    return item.CodigoNombreProducto ?? buildProductoItem(item).CodigoNombreProducto
  }

  async function buscarProductos(termino) {
    if (termino?.trim().length < 4) {
      productosItems.value = []
      return
    }

    productosItems.value = []
    loadingProductos.value = true
    try {
      const response = await mercanciaService.getProductosSearch(termino)
      const resultados = unwrapApiData(response)
      const idsExistentes = new Set(props.detalles.map((d) => d.IdProducto))
      productosItems.value = resultados
        .filter((producto) => !idsExistentes.has(producto.IdProducto))
        .map((producto) => buildProductoItem(producto))
    } catch (error) {
      console.error('Error buscando productos:', error)
      $toast.error('No se pudieron cargar los productos')
    } finally {
      loadingProductos.value = false
    }
  }

  function onBuscarProductoEnter() {
    const termino = productoSearch.value?.trim()
    if (termino?.length >= 4) buscarProductos(termino)
  }

  const { debounced: debouncedBuscarProductos, cancel: cancelBuscarProductos } = useDebounce(
    (termino) => buscarProductos(termino),
    500,
  )

  watch(productoSearch, (value) => {
    if (!value || value.trim().length < 4) {
      cancelBuscarProductos()
      productosItems.value = []
      return
    }

    debouncedBuscarProductos(value.trim())
  })

  function onAgregarProducto() {
    if (!productoSeleccionado.value) return
    emit('agregar-producto', productoSeleccionado.value)
    productoSeleccionado.value = null
    productoSearch.value = ''
    productosItems.value = []
  }
</script>

<style scoped></style>
