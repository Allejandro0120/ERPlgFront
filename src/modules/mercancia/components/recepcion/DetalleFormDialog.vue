<template>
  <base-dialog
    color="primary"
    :disable-confirm="isEditing && !hasChanges"
    icon="mdi-package-variant"
    :label-confirm="labelConfirm"
    max-width="1000"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row class="mt-2">
          <!-- Información del Producto (Solo lectura para contexto) -->
          <v-col cols="12" md="12">
            <v-autocomplete
              v-model="form.IdProducto"
              v-model:search-input="productoSearch"
              :item-title="productoItemTitle"
              item-value="IdProducto"
              :items="productosItems"
              label="Producto"
              :loading="loadingProductos"
              placeholder="Escribe código o nombre (mínimo 4 caracteres)"
              prepend-inner-icon="mdi-package-variant"
              :readonly="!isCreating || isReadonly"
              :rules="[rules.required]"
              variant="outlined"
              @keydown.enter.prevent="onBuscarProductoEnter"
              @update:model-value="onProductoChange"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.CodLote"
              label="Lote"
              prepend-inner-icon="mdi-barcode-scan"
              :readonly="isReadonly"
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.CantidadMuestra"
              label="Cantidad Muestra"
              prepend-inner-icon="mdi-flask"
              :readonly="isReadonly"
              :rules="[rules.required, rules.numeric]"
              type="number"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" sm="4">
            <v-select
              v-model="form.Aceptado"
              item-title="label"
              item-value="value"
              :items="opcionesEstado"
              label="Estado"
              name="Aceptado"
              prepend-inner-icon="mdi-clipboard-check"
              :readonly="isReadonly"
            >
              <template #selection="{ item }">
                <v-chip class="estado-chip" :color="item.color" label variant="tonal">
                  <v-icon class="ml-1" :color="item.color" icon="$circle" size="10" start />
                  {{ item.label }}
                </v-chip>
              </template>

              <template #item="{ item, props: itemProps }">
                <v-list-item v-bind="itemProps" title="">
                  <v-chip :color="item.color" label variant="tonal">
                    <v-icon class="ml-1" :color="item.color" icon="$circle" size="10" start />
                    {{ item.label }}
                  </v-chip>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" md="12">
            <v-textarea
              v-model="form.ObservacionesProducto"
              label="Observaciones"
              placeholder="Ingrese observaciones del producto"
              :readonly="isReadonly"
              rows="4"
              variant="outlined"
            />
          </v-col>
          <!-- Cantidades -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.CantidadFacturada"
              label="Cantidad Facturada"
              prepend-inner-icon="mdi-package-variant-closed"
              readonly
              type="number"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.CantidadRecibida"
              label="Cantidad Recibida"
              prepend-inner-icon="mdi-package-variant-closed-check"
              :readonly="isReadonly"
              :rules="[rules.required, rules.numeric]"
              type="number"
              variant="outlined"
            />
          </v-col>

          <!-- Cascada de Infraestructura (Zona, Pasillo, Estante) -->
          <v-col cols="12">
            <h3 class="text-subtitle-1 mb-2">Ubicación de Almacenamiento</h3>
          </v-col>

          <v-col cols="12" md="3">
            <v-autocomplete
              v-model="form.IdZona"
              item-title="CodZona"
              item-value="IdZona"
              :items="zonas"
              label="Zona"
              :loading="loading.zonas"
              :readonly="isReadonly"
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onZonaChange"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-autocomplete
              v-model="form.IdPasillo"
              :disabled="!form.IdZona"
              item-title="CodPasillo"
              item-value="IdPasillo"
              :items="pasillos"
              label="Pasillo"
              :loading="loading.pasillos"
              :readonly="isReadonly"
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onPasilloChange"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-autocomplete
              v-model="form.IdEstante"
              :disabled="!form.IdPasillo"
              item-title="CodEstante"
              item-value="IdEstante"
              :items="estantes"
              label="Estante"
              :loading="loading.estantes"
              :readonly="isReadonly"
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onEstanteChange"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-autocomplete
              v-model="form.IdUbicacion"
              :disabled="!form.IdEstante"
              item-title="CodUbicacion"
              item-value="IdUbicacion"
              :items="ubicaciones"
              label="Ubicación"
              :loading="loading.ubicaciones"
              :readonly="isReadonly"
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'

  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { mercanciaService } from '@/api/services/mercanciaService'
  import { recepcionService } from '@/api/services/recepcionService'
  import { $confirm } from '@/plugins/confirm/confirm.js'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { DOMINIOS_ESTADO, getEstadoColor } from '@/shared/utils/statusColors'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'edit', 'view'].includes(v),
    },
    detalle: {
      type: Object,
      default: null,
    },
    idBodega: {
      type: Number,
      default: null,
    },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const dialogTitle = computed(() => {
    if (isReadonly.value) return 'Ver Detalle del Producto'
    if (isEditing.value) return 'Editar Detalle del Producto'
    return 'Agregar Detalle'
  })

  const labelConfirm = computed(
    () => ({ create: 'Agregar', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  const opcionesEstado = computed(() =>
    [
      { label: 'Aceptado', value: true },
      { label: 'Rechazado', value: false },
    ].map((op) => ({
      ...op,
      color: getEstadoColor(op.value, DOMINIOS_ESTADO.PRODCUTO_ACTA),
    })),
  )
  const formRef = ref(null)

  const formInitial = {
    IdDetalle: null,
    IdProducto: null,
    CodigoProducto: '',
    NombreProducto: '',
    IdLote: null,
    CodLote: '',
    CantidadFacturada: null,
    CantidadRecibida: null,
    CantidadMuestra: null,
    ObservacionesProducto: '',
    IdZona: null,
    IdPasillo: null,
    IdEstante: null,
    IdUbicacion: null,
    Aceptado: false,
  }

  const uiInitial = {
    IdCedi: null,
    IdBodega: null,
  }

  const form = ref({ ...formInitial })
  const ui = ref({ ...uiInitial })
  const formSnapshot = ref(null)

  const productoSearch = ref('')
  const loadingProductos = ref(false)
  const productosItems = ref([])
  const selectedProducto = ref(null)

  function buildProductoItem(producto) {
    const codigo = producto.CodigoProducto ?? producto.CodProducto ?? ''
    const nombre = producto.NombreProducto ?? producto.Nombre ?? ''
    return {
      ...producto,
      displayName: [codigo, nombre].filter(Boolean).join(' - '),
    }
  }

  function productoItemTitle(item) {
    if (!item) return ''
    return item.displayName ?? buildProductoItem(item).displayName
  }

  async function buscarProductos(termino) {
    if (termino?.trim().length < 4) {
      productosItems.value = selectedProducto.value ? [selectedProducto.value] : []
      return
    }

    productosItems.value = []
    loadingProductos.value = true
    try {
      const response = await mercanciaService.getProductos(termino)
      const resultados = response?.data?.success ? response.data.data || [] : []
      productosItems.value = resultados.map((producto) => buildProductoItem(producto))
      if (selectedProducto.value) {
        const exists = productosItems.value.some(
          (item) => item.IdProducto === selectedProducto.value.IdProducto,
        )
        if (!exists) {
          productosItems.value.unshift(selectedProducto.value)
        }
      }
    } catch (error) {
      console.error('Error buscando productos:', error)
      $toast.error('No se pudieron cargar los productos')
    } finally {
      loadingProductos.value = false
    }
  }

  function onBuscarProductoEnter() {
    if (!isCreating.value || isReadonly.value) {
      return
    }
    const termino = productoSearch.value?.trim()
    if (termino?.length >= 4) {
      buscarProductos(termino)
    } else {
      productosItems.value = selectedProducto.value ? [selectedProducto.value] : []
    }
  }

  watch(productoSearch, (value) => {
    if (!isCreating.value) {
      return
    }
    if (!value || value.trim().length < 4) {
      productosItems.value = selectedProducto.value ? [selectedProducto.value] : []
    }
  })

  function onProductoChange(productId) {
    form.value.IdProducto = productId
    const producto = productosItems.value.find((item) => item.IdProducto === productId)
    if (producto) {
      selectedProducto.value = producto
      form.value.CodigoProducto = producto.CodigoProducto ?? producto.CodProducto ?? ''
      form.value.NombreProducto = producto.NombreProducto ?? producto.Nombre ?? ''
    } else if (!productId) {
      selectedProducto.value = null
      form.value.CodigoProducto = ''
      form.value.NombreProducto = ''
    }
  }

  const {
    zonas,
    pasillos,
    estantes,
    ubicaciones,
    loading,
    onBodegaChange,
    onZonaChange,
    onPasilloChange,
    onEstanteChange,
    setInfraestructuraLectura,
    resetInfraestructuraState,
    preloadForEdit,
  } = useInfraestructuraCascade({
    ui,
    form,
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
      console.error(`Error en detalle de recepción (${stage}):`, error)
    },
  })

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    return JSON.stringify(form.value) !== JSON.stringify(formSnapshot.value)
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes cambios sin guardar en este detalle. ¿Deseas salir de todas formas?',
  })

  async function precargarDetalle(det) {
    if (!det || !det.IdDetalle) return
    $loading.show('Cargando información del detalle...')
    try {
      const response = await recepcionService.getDetalleRecepcionById(det.IdDetalle)
      if (response?.data?.success) {
        const item = response.data.data
        form.value = { ...formInitial, ...item }

        const currentProducto = buildProductoItem({
          IdProducto: item.IdProducto,
          CodigoProducto: item.CodigoProducto ?? item.CodProducto ?? '',
          NombreProducto: item.NombreProducto ?? item.Nombre ?? '',
        })
        selectedProducto.value = currentProducto
        productosItems.value = [currentProducto]

        if (isReadonly.value) {
          setInfraestructuraLectura({
            ...item,
            IdBodega: props.idBodega,
          })
        } else {
          await preloadForEdit({
            idBodega: props.idBodega,
            idZona: item.IdZona,
            idPasillo: item.IdPasillo,
            idEstante: item.IdEstante,
            idUbicacion: item.IdUbicacion,
          })
        }
      }
    } catch (error) {
      console.error(error)
      $toast.error('Error al cargar la información del detalle')
      emit('update:modelValue', false)
    } finally {
      formSnapshot.value = { ...form.value }
      $loading.hide()
    }
  }

  function resetForm() {
    form.value = { ...formInitial }
    ui.value = { ...uiInitial }
    resetInfraestructuraState()
    formSnapshot.value = null
    if (formRef.value) formRef.value.resetValidation()
  }

  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (isOpen) {
        if (props.detalle) {
          await precargarDetalle(props.detalle)
        } else {
          resetForm()
          // Cargar Zonas inicialmente si tenemos la bodega
          if (props.idBodega) {
            ui.value.IdBodega = props.idBodega
            await onBodegaChange(props.idBodega)
          }
          formSnapshot.value = { ...form.value }
        }
      } else {
        resetForm()
      }
    },
  )

  async function submitForm() {
    if (isReadonly.value) {
      emit('update:modelValue', false)
      return
    }

    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.warning('Por favor completa todos los campos requeridos correctamente')
      return
    }

    $loading.show('Guardando detalle...')
    try {
      // Aquí puedes agregar la lógica para guardar si es necesario o emitir el submit
      emit('submit', form.value)
      emit('update:modelValue', false)
    } catch (error) {
      console.error(error)
      $toast.error('Ocurrió un error al guardar el detalle')
    } finally {
      $loading.hide()
    }
  }
</script>
