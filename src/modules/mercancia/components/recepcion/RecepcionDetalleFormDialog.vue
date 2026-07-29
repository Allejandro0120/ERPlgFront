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
              v-model:search="productoSearch"
              :clearable="isCreating && !isReadonly"
              :item-title="productoItemTitle"
              item-value="IdProducto"
              :items="productosItems"
              label="Producto"
              :loading="loadingProductos"
              no-filter
              placeholder="Escribe código o nombre (mínimo 4 caracteres)"
              prepend-inner-icon="mdi-package-variant"
              :readonly="!isCreating || isReadonly"
              required
              :rules="[rules.required]"
              variant="outlined"
              @keydown.enter.prevent="onBuscarProductoEnter"
              @update:model-value="onProductoChange"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="form.IdLote"
              item-title="CodLote"
              item-value="IdLote"
              :items="lotes"
              label="Lote"
              :loading="loadingLotes"
              prepend-inner-icon="mdi-barcode-scan"
              :readonly="isReadonly || !form.IdProducto"
              required
              :rules="[rules.required]"
              variant="outlined"
              @update:model-value="onLoteChange"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.CantidadMuestra"
              label="Cantidad Muestra"
              prepend-inner-icon="mdi-flask"
              :readonly="isReadonly"
              :rules="cantidadMuestraRules"
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
              counter="400"
              label="Observaciones"
              maxlength="400"
              persistent-counter
              placeholder="Ingrese observaciones del producto"
              :readonly="isReadonly"
              rows="4"
              :rules="observacionesRules"
              variant="outlined"
            />
          </v-col>
          <!-- Cantidades -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.CantidadFacturada"
              label="Cantidad Facturada"
              prepend-inner-icon="mdi-package-variant-closed"
              :readonly="isReadonly"
              required
              :rules="[
                rules.required,
                rules.numeric,
                rules.maxValue(10000000, 'La cantidad facturada'),
              ]"
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
              :rules="cantidadRecibidaRules"
              type="number"
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

  import { mercanciaService } from '@/api/services/mercanciaService'
  import { recepcionService } from '@/api/services/recepcionService'
  import { $confirm } from '@/plugins/confirm/confirm.js'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
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
    existingDetalles: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const observacionesRules = computed(() => {
    if (isReadonly.value) return []
    if (form.value.Aceptado === false) {
      return [
        (v) =>
          !!v?.trim() || 'Cuando el producto es rechazado, las observaciones son obligatorias.',
      ]
    }
    return []
  })

  // Validar duplicados: mismo producto y mismo lote
  const isDuplicate = computed(() => {
    if (isReadonly.value) return false
    if (!form.value.CodigoProducto || !form.value.CodLote) return false

    return props.existingDetalles.some((det) => {
      if (isEditing.value && det.LocalId === props.detalle?.LocalId) return false
      return det.CodigoProducto === form.value.CodigoProducto && det.CodLote === form.value.CodLote
    })
  })
  const debounceTimer = ref(null)

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
      color: getEstadoColor(op.value, DOMINIOS_ESTADO.PRODUCTO_ACTA),
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
    Aceptado: true,
  }

  const form = ref({ ...formInitial })
  const formSnapshot = ref(null)

  const productoSearch = ref('')
  const loadingProductos = ref(false)
  const productosItems = ref([])
  const selectedProducto = ref(null)
  const lotes = ref([])
  const loadingLotes = ref(false)

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
      const response = await mercanciaService.getProductosSearch(termino)
      const resultados = response?.data?.success ? response.data.data || [] : []
      productosItems.value = resultados.map((producto) => buildProductoItem(producto))
      if (selectedProducto.value) {
        const selectedId = selectedProducto.value.IdProducto
        const exists = productosItems.value.some((item) => item.IdProducto === selectedId)
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
    if (!isCreating.value) return

    clearTimeout(debounceTimer.value)

    if (!value || value.trim().length < 4) {
      productosItems.value = selectedProducto.value ? [selectedProducto.value] : []
      return
    }

    debounceTimer.value = setTimeout(() => {
      buscarProductos(value.trim())
    }, 500) // 500ms de debounce
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

    // Limpiar lote anterior y cargar los del nuevo producto
    form.value.IdLote = null
    form.value.CodLote = ''
    lotes.value = []
    if (productId) cargarLotes(productId)
  }

  async function cargarLotes(idProducto) {
    loadingLotes.value = true
    try {
      const response = await mercanciaService.getLotesByProducto(idProducto)
      lotes.value = response?.data?.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Error cargando lotes:', error)
      $toast.error('No se pudieron cargar los lotes del producto')
    } finally {
      loadingLotes.value = false
    }
  }

  function onLoteChange(idLote) {
    const lote = lotes.value.find((l) => l.IdLote === idLote)
    form.value.CodLote = lote?.CodLote ?? ''
  }

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    return hasObjectChanges(form.value, formSnapshot.value)
  })
  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes cambios sin guardar en este detalle. ¿Deseas salir de todas formas?',
  })

  async function precargarDetalle(det) {
    if (!det) return
    // Si no tiene IdDetalle, es un detalle local (recién creado), cargar directo del prop
    if (!det.IdDetalle) {
      form.value = { ...formInitial, ...det }

      // Reconstruir el producto seleccionado para el autocomplete
      if (det.IdProducto) {
        const currentProducto = buildProductoItem({
          IdProducto: det.IdProducto,
          CodigoProducto: det.CodigoProducto ?? '',
          NombreProducto: det.NombreProducto ?? '',
        })
        selectedProducto.value = currentProducto
        productosItems.value = [currentProducto]
        await cargarLotes(det.IdProducto)
      }
      formSnapshot.value = { ...form.value }
      return
    }

    $loading.show('Cargando información del detalle...')
    try {
      const response = await recepcionService.getDetalleRecepcionById(det.IdDetalle)
      if (response?.data?.success) {
        const item = response.data.data
        form.value = { ...formInitial, ...item }
        await cargarLotes(item.IdProducto)

        const currentProducto = buildProductoItem({
          IdProducto: item.IdProducto,
          CodigoProducto: item.CodigoProducto ?? item.CodProducto ?? '',
          NombreProducto: item.NombreProducto ?? item.Nombre ?? '',
        })
        selectedProducto.value = currentProducto
        productosItems.value = [currentProducto]
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
  const cantidadMuestraRules = computed(() => [
    rules.required,
    rules.numeric,
    rules.maxValue(10_000_000, 'La cantidad de muestra'),
    (v) => {
      if (!v || !form.value.CantidadFacturada) return true
      return (
        Number(v) <= Number(form.value.CantidadFacturada) ||
        'La cantidad de muestra no puede ser mayor a la cantidad facturada'
      )
    },
    (v) => {
      if (!v || !form.value.CantidadRecibida) return true
      return (
        Number(v) <= Number(form.value.CantidadRecibida) ||
        'La cantidad de muestra no puede ser mayor a la cantidad recibida'
      )
    },
  ])

  // Validación: CantidadRecibida no puede ser mayor que CantidadFacturada
  const cantidadRecibidaRules = computed(() => [
    rules.required,
    rules.numeric,
    rules.maxValue(10_000_000, 'La cantidad recibida'),
    (v) => {
      if (!v || !form.value.CantidadFacturada) return true
      return (
        Number(v) <= Number(form.value.CantidadFacturada) ||
        'La cantidad recibida no puede ser mayor a la cantidad facturada'
      )
    },
  ])
  function resetForm() {
    form.value = { ...formInitial }
    productoSearch.value = ''
    productosItems.value = []
    selectedProducto.value = null
    formSnapshot.value = null
    if (formRef.value) formRef.value.resetValidation()
  }

  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (isOpen) {
        resetForm()
        if (props.detalle) {
          await precargarDetalle(props.detalle)
        } else {
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
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    if (isDuplicate.value) {
      const codLote = form.value.CodLote || `ID ${form.value.IdLote}`
      $toast.warning(`El lote ${codLote} ya fue agregado para este producto.`)
      return
    }
    // Solo los campos que realmente cambiaron en el form (no todos los PATCH_FIELDS)
    const changedFields = getChangedFields(form.value, formSnapshot.value ?? {})

    const payload = {
      IdDetalle: form.value.IdDetalle,
      ...changedFields,
      // Display: para mostrar en la tabla del acta, no van a la API
      CodigoProducto: form.value.CodigoProducto,
      NombreProducto: form.value.NombreProducto,
      CodLote: form.value.CodLote,
    }

    emit('submit', { payload, mode: props.mode })
    emit('update:modelValue', false)
  }
</script>
