<template>
  <base-dialog
    color="primary"
    :disable-confirm="disableConfirm"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    max-width="1200"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef">
        <v-tabs v-model="ui.tab" class="mb-4" color="primary">
          <v-tab value="info">
            <v-icon icon="mdi-file" start />
            Información
            <v-badge v-if="tabErrors.info" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="productos">
            <v-icon icon="mdi-format-list-bulleted" start />
            Productos
            <v-badge v-if="tabErrors.productos" class="ml-2" color="error" dot inline />
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <v-tabs-window-item eager value="info">
            <lista-precios-info-tab
              :form="form"
              :is-creating="isCreating"
              :is-readonly="isReadonly"
            />
          </v-tabs-window-item>

          <v-tabs-window-item eager value="productos">
            <lista-precios-productos-tab
              :codigo="isCreating ? '' : form.Codigo"
              :detalles="detalles"
              :headers="headers"
              :is-readonly="isReadonly"
              @agregar-producto="onAgregarProducto"
              @eliminar-producto="onEliminarProducto"
              @productos-importados="onProductosImportados"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { comercialService } from '@/api/services/comercialService'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { parseCOP } from '@/shared/utils/currencyFormatter'
  import { pickFields } from '@/shared/utils/objectUtils'
  import { useListaPreciosDetalles } from '../../composables/listaPrecios/useListaPreciosDetalles'
  import ListaPreciosInfoTab from './tabs/ListaPreciosInfoTab.vue'
  import ListaPreciosProductosTab from './tabs/ListaPreciosProductosTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'view', 'edit'].includes(v),
    },
    lista: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])
  const formRef = ref(null)
  const formSnapshot = ref(null)
  const productosTabError = ref(false)

  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const listaDisplayName = computed(() => props.lista?.NombreLista ?? '')
  const dialogTitle = computed(() => {
    const base =
      {
        create: 'Crear Lista de Precios',
        edit: 'Editar Lista de Precios',
        view: 'Detalle de la Lista de Precios',
      }[props.mode] ?? 'Lista de Precios'
    return props.mode === 'create' || !listaDisplayName.value
      ? base
      : `${base}: ${listaDisplayName.value}`
  })

  const dialogIcon = computed(
    () =>
      ({
        create: 'mdi-tag-plus',
        edit: 'mdi-tag-edit',
        view: 'mdi-tag-text',
      })[props.mode],
  )
  const labelConfirm = computed(
    () => ({ create: 'Crear Lista de Precios', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  const LISTA_API_FIELDS = ['Codigo', 'NombreLista', 'Habilitado']

  const formInitial = {
    IdListaPrecio: null,
    Codigo: '',
    NombreLista: '',
    Habilitado: true,
    FechaCreacion: '',
  }

  const uiInitial = {
    tab: 'info',
  }

  const form = ref({ ...formInitial })
  const ui = ref({ ...uiInitial })

  const {
    detalles,
    headers,
    agregarProducto,
    eliminarProducto,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
  } = useListaPreciosDetalles()

  function onAgregarProducto(producto) {
    agregarProducto(producto)
  }
  function onEliminarProducto(localId) {
    eliminarProducto(localId)
  }

  async function onProductosImportados() {
    if (!props.lista?.IdListaPrecio) return

    $loading.show()
    try {
      const res = await comercialService.getListaPreciosById(props.lista.IdListaPrecio)
      if (res.data?.success) {
        hydrateDetalles(res.data.data?.detalles || [])
      }
    } catch (error) {
      if (!error._toastShown) $toast.error('Error al refrescar los productos importados')
    } finally {
      $loading.hide()
    }
  }

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    const formChanged = hasObjectChanges(form.value, formSnapshot.value)
    return formChanged || hasDetallesChanges()
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
  })

  const disableConfirm = computed(() => isEditing.value && !hasChanges.value)

  const tabErrors = computed(() => ({
    info: !!formRef.value?.errors?.some((e) => ['Codigo', 'NombreLista'].includes(e.id)),
    productos: productosTabError.value,
  }))

  function precargarLista(lista) {
    Object.assign(
      form.value,
      pickFields(lista, [...LISTA_API_FIELDS, 'IdListaPrecio', 'FechaCreacion']),
    )
    hydrateDetalles(lista.detalles || [])
    formSnapshot.value = { ...form.value }
  }

  function resetForm() {
    form.value = { ...formInitial }
    ui.value = { ...uiInitial }
    resetDetalles()
    formSnapshot.value = null
    productosTabError.value = false
    formRef.value?.resetValidation()
  }

  function inicializarModoCreacion() {
    formSnapshot.value = { ...form.value }
    setDetallesSnapshot([])
  }

  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }
      if (isCreating.value) {
        inicializarModoCreacion()
        return
      }
      if (!props.lista) return
      $loading.show()
      try {
        precargarLista(props.lista)
      } catch (error) {
        console.error('Error al inicializar diálogo de lista de precios:', error)
      } finally {
        $loading.hide()
      }
    },
  )

  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores en los campos marcados')
      ui.value.tab = 'info'
      return
    }

    if (detalles.value.length === 0) {
      productosTabError.value = true
      ui.value.tab = 'productos'
      $toast.error('Debes agregar al menos un producto a la lista de precios')
      return
    }

    const PRECIO_BASE_MAX = 1_000_000_000
    const productoConPrecioInvalido = detalles.value.find((detalle) => {
      const precio = parseCOP(detalle.PrecioBase)
      return precio === null || precio <= 0 || precio > PRECIO_BASE_MAX
    })
    if (productoConPrecioInvalido) {
      productosTabError.value = true
      ui.value.tab = 'productos'
      $toast.error(
        `El precio base de "${productoConPrecioInvalido.CodigoNombreProducto}" debe ser mayor a 0 y no superar ${PRECIO_BASE_MAX.toLocaleString('es-CO')}`,
      )
      return
    }
    productosTabError.value = false

    const confirmado = await $confirm.confirm({
      title: isCreating.value ? '¿Crear Lista de Precios?' : '¿Guardar cambios?',
      message: isCreating.value
        ? 'Se registrará una nueva lista de precios con los datos ingresados.'
        : `Se actualizará la información de <strong>${form.value.NombreLista}</strong>.`,
      labelConfirm: isCreating.value ? 'Sí, crear' : 'Sí, guardar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    const detallesChanges = getDetallesChanges()

    let payload
    if (isCreating.value) {
      payload = {
        ...pickFields(form.value, LISTA_API_FIELDS),
        detalles: detallesChanges,
      }
    } else {
      const changedFields = getChangedFields(form.value, formSnapshot.value)
      payload = Object.fromEntries(
        Object.entries(changedFields).filter(([key]) => LISTA_API_FIELDS.includes(key)),
      )
      if (detallesChanges.length > 0) payload.detalles = detallesChanges
    }

    emit('submit', { payload, mode: props.mode })
  }
</script>
