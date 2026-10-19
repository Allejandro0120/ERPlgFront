<template>
  <base-dialog
    color="success"
    :disable-confirm="descargando"
    icon="mdi-microsoft-excel"
    label-confirm="Descargar Excel"
    max-width="800"
    :model-value="modelValue"
    title="Descargar Inventario"
    @accept="descargar"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #content>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Filtra lo que necesites. Sin filtros se descarga todo el inventario.
      </p>
      <v-row density="comfortable">
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="ui.IdCedi"
            clearable
            density="comfortable"
            item-title="NombreCedi"
            item-value="IdCedi"
            :items="cedis"
            label="Centro de Distribución"
            variant="outlined"
            @update:model-value="onCediSeleccionado"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.IdBodega"
            clearable
            density="comfortable"
            :disabled="!ui.IdCedi"
            item-title="NombreBodega"
            item-value="IdBodega"
            :items="bodegas"
            label="Bodega"
            :loading="loadingObj.bodegas"
            variant="outlined"
            @update:model-value="onBodegaChange"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.IdZona"
            clearable
            density="comfortable"
            :disabled="!form.IdBodega"
            item-title="CodZona"
            item-value="IdZona"
            :items="zonas"
            label="Zona"
            :loading="loadingObj.zonas"
            variant="outlined"
            @update:model-value="onZonaChange"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.IdPasillo"
            clearable
            density="comfortable"
            :disabled="!form.IdZona"
            item-title="CodPasillo"
            item-value="IdPasillo"
            :items="pasillos"
            label="Pasillo"
            :loading="loadingObj.pasillos"
            variant="outlined"
            @update:model-value="onPasilloChange"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.IdEstante"
            clearable
            density="comfortable"
            :disabled="!form.IdPasillo"
            item-title="CodEstante"
            item-value="IdEstante"
            :items="estantes"
            label="Estante"
            :loading="loadingObj.estantes"
            variant="outlined"
            @update:model-value="onEstanteChange"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-autocomplete
            v-model="form.IdUbicacion"
            clearable
            density="comfortable"
            :disabled="!form.IdEstante"
            item-title="CodUbicacion"
            item-value="IdUbicacion"
            :items="ubicaciones"
            label="Ubicación"
            :loading="loadingObj.ubicaciones"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="8">
          <v-autocomplete
            v-model="form.IdProducto"
            v-model:search="productoSearch"
            clearable
            density="comfortable"
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
        <v-col cols="12" md="4">
          <v-autocomplete
            v-model="form.IdLote"
            clearable
            density="comfortable"
            :disabled="!form.IdProducto"
            item-title="CodLote"
            item-value="IdLote"
            :items="lotes"
            label="Lote"
            :loading="loadingLotes"
            variant="outlined"
          />
        </v-col>
      </v-row>
    </template>
  </base-dialog>
</template>

<script setup>
  import { ref, watch } from 'vue'

  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { mercanciaService } from '@/api/services/mercanciaService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useDebounce } from '@/shared/composables/useDebounce'
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { downloadExcelResponse } from '@/shared/utils/fileDownload'
  import { unwrapApiData } from '@/shared/utils/unwrapApiData'

  const props = defineProps({
    modelValue: Boolean,
    cedis: { type: Array, default: () => [] },
    // CEDI que el usuario tiene seleccionado en la vista; se precarga al abrir
    cediInicial: { type: [Number, String], default: null },
  })

  const emit = defineEmits(['update:modelValue'])

  const initialForm = {
    IdBodega: null,
    IdZona: null,
    IdPasillo: null,
    IdEstante: null,
    IdUbicacion: null,
    IdProducto: null,
    IdLote: null,
  }

  const form = ref({ ...initialForm })
  const ui = ref({ IdCedi: null, IdBodega: null, IdEstante: null })
  const descargando = ref(false)

  const {
    bodegas,
    zonas,
    pasillos,
    estantes,
    ubicaciones,
    loading: loadingObj,
    onCediChange: triggerCascadeCedi,
    onBodegaChange,
    onZonaChange,
    onPasilloChange,
    onEstanteChange,
    resetInfraestructuraState,
  } = useInfraestructuraCascade({
    ui,
    form,
    services: infraestructuraService,
    autoSelect: false,
    onError: (error, stage) => {
      console.error(`Error de infraestructura (${stage}):`, error)
    },
  })

  // ─── Producto y lote ─────────────────────────────────────────────────────
  const productoSearch = ref('')
  const productosItems = ref([])
  const loadingProductos = ref(false)
  const selectedProducto = ref(null)
  const lotes = ref([])
  const loadingLotes = ref(false)

  function productoItemTitle(item) {
    if (!item) return ''
    return [item.CodigoProducto, item.Nombre].filter(Boolean).join(' - ')
  }

  async function buscarProductos(termino) {
    loadingProductos.value = true
    try {
      const response = await mercanciaService.getProductosSearch(termino)
      const resultados = unwrapApiData(response)
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

  async function onProductoChange(idProducto) {
    form.value.IdLote = null
    lotes.value = []
    selectedProducto.value = productosItems.value.find((p) => p.IdProducto === idProducto) ?? null
    if (!idProducto) return

    loadingLotes.value = true
    try {
      lotes.value = unwrapApiData(await mercanciaService.getLotesByProducto(idProducto))
    } catch (error) {
      console.error('Error cargando lotes:', error)
      $toast.error('No se pudieron cargar los lotes del producto')
    } finally {
      loadingLotes.value = false
    }
  }

  // ─── CEDI ────────────────────────────────────────────────────────────────
  function onCediSeleccionado(idCedi) {
    form.value = {
      ...form.value,
      IdBodega: null,
      IdZona: null,
      IdPasillo: null,
      IdEstante: null,
      IdUbicacion: null,
    }
    if (idCedi) {
      triggerCascadeCedi(idCedi)
    } else {
      resetInfraestructuraState()
    }
  }

  function resetForm() {
    form.value = { ...initialForm }
    ui.value = { IdCedi: null, IdBodega: null, IdEstante: null }
    resetInfraestructuraState()
    cancelBuscar()
    productoSearch.value = ''
    productosItems.value = []
    selectedProducto.value = null
    lotes.value = []
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      resetForm()
      if (isOpen && props.cediInicial) {
        ui.value.IdCedi = props.cediInicial
        triggerCascadeCedi(props.cediInicial)
      }
    },
  )

  // ─── Descarga ────────────────────────────────────────────────────────────
  async function descargar() {
    const filtros = {
      ...(ui.value.IdCedi && { IdCedi: ui.value.IdCedi }),
      ...Object.fromEntries(Object.entries(form.value).filter(([, valor]) => valor)),
    }

    descargando.value = true
    $loading.show('Generando archivo de inventario...')
    try {
      const res = await mercanciaService.exportSaldos(filtros)
      const fecha = new Date().toISOString().slice(0, 10)
      if (downloadExcelResponse(res, `Inventario_${fecha}`)) {
        emit('update:modelValue', false)
      }
    } catch (error) {
      if (!error._toastShown) $toast.error('No se pudo descargar el inventario')
    } finally {
      $loading.hide()
      descargando.value = false
    }
  }
</script>
