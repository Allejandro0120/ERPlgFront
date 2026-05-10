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
      <detalle-form-dialog
        v-model="detalleDialog.open"
        :detalle="detalleDialog.detalle"
        :mode="detalleDialog.mode"
        @submit="onDetalleSubmit"
      />
      <v-form ref="formRef">
        <v-tabs v-model="ui.tab" class="mb-4" color="primary">
          <v-tab value="info">
            <v-icon icon="mdi-file-document-outline" start />
            Información
          </v-tab>
          <v-tab value="detalle">
            <v-icon icon="mdi-format-list-bulleted" start />
            Detalle
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <v-tabs-window-item eager value="info">
            <recepcion-info-tab
              :bodegas="bodegasCascada"
              :cedis="cedis"
              :estados-catalogo="estadosCatalogo"
              :form="form"
              :is-readonly="isReadonly"
              :proveedores="proveedores"
              @cedi-change="onCediChange"
            />
          </v-tabs-window-item>

          <v-tabs-window-item eager value="detalle">
            <recepcion-detalle-tab
              :detalles="detalles"
              :headers="detalleHeaders"
              :is-readonly="isReadonly"
              :row-actions="detallerowActions"
              @add="abrirAgregarDetalle"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, reactive, ref, watch } from 'vue'
  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  // colors handled inside tabs
  import { useRecepcionCatalogos } from '../../composables/recepcion/useRecepcionCatalogos'
  import { useRecepcionDetalles } from '../../composables/recepcion/useRecepcionDetalles'
  import DetalleFormDialog from './DetalleFormDialog.vue'
  import RecepcionDetalleTab from './tabs/RecepcionDetalleTab.vue'
  import RecepcionInfoTab from './tabs/RecepcionInfoTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'edit', 'view'].includes(v),
    },
    acta: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  // ─── Computed modo ────────────────────────────────────────────────────────────
  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const actaDisplayName = computed(() => {
    const nombre = props.acta?.Acta
    if (nombre) return nombre
    return ''
  })
  const dialogTitle = computed(() => {
    const baseTitle =
      {
        create: 'Crear Acta',
        edit: 'Editar Acta',
        view: 'Detalle del Acta',
      }[props.mode] || 'Acta'

    if (props.mode === 'create' || !actaDisplayName.value) {
      return baseTitle
    }

    return `${baseTitle}: ${actaDisplayName.value}`
  })
  const dialogIcon = computed(
    () =>
      ({
        create: 'mdi-file-plus',
        edit: 'mdi-file-edit',
        view: 'mdi-file-eye',
      })[props.mode],
  )
  const labelConfirm = computed(
    () => ({ create: 'Crear Acta', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  const formRef = ref(null)
  const {
    estadosCatalogo,
    proveedores,
    cedis,
    bodegas: _bodegas,
    setCatalogosLectura,
    cargarCatalogos,
  } = useRecepcionCatalogos()

  const {
    detalles,
    detalleDialog,
    detalleHeaders,
    detallerowActions,
    abrirAgregarDetalle,
    onDetalleSubmit,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
  } = useRecepcionDetalles({ isReadonly })

  const formInitial = {
    IdActa: null,
    NroActa: '',
    Acta: '',
    IdProveedor: null,
    NombreProveedor: '',
    Observaciones: '',
    PrefijoFacturaRecibida: '',
    NumeroFacturaRecibida: '',
    FechaFacturaRecibida: '',
    FechaActa: '',
    EstadoActa: 'Borrador',
    IdEstado: null,
    IdCedi: null,
    IdBodega: null,
    Detalles: [],
  }

  const uiInitial = {
    tab: 'info',
  }
  const form = ref({ ...formInitial })
  const ui = ref({ ...uiInitial })
  const formSnapshot = ref(null)

  // cascada infraestructura
  const {
    bodegas: bodegasCascada,
    onCediChange,
    preloadInfraestructura,
    setInfraestructuraLectura,
    resetInfraestructuraState,
  } = useInfraestructuraCascade({
    ui,
    form,
    services: infraestructuraService,
    keys: {
      idCedi: 'IdCedi',
      idBodega: 'IdBodega',
    },
  })

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    const formChanged = hasObjectChanges(form.value, formSnapshot.value)
    const detallesChanged = hasDetallesChanges()
    return formChanged || detallesChanged
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
  })

  const disableConfirm = computed(() => isEditing.value && !hasChanges.value)

  const campoATab = {
    IdProveedor: 'info',
    IdCedi: 'info',
    IdBodega: 'info',
    PrefijoFacturaRecibida: 'info',
    NumeroFacturaRecibida: 'info',
    FechaFacturaRecibida: 'info',
    FechaActa: 'info',
    Observaciones: 'info',
  }

  const tabErrors = computed(() => {
    const result = { info: false }
    if (!formRef.value) return result
    for (const { id } of formRef.value.errors ?? []) {
      const tab = campoATab[id]
      if (tab) result[tab] = true
    }
    return result
  })

  async function precargarActa(acta) {
    if (isReadonly.value) {
      setInfraestructuraLectura(acta)
    } else {
      // Si es modo edición, precargamos en cascada para traer bodegas del cedi según el idCedi
      await preloadInfraestructura({
        idCedi: acta.IdCedi,
        idBodega: acta.IdBodega,
      })
    }

    form.value.IdActa = acta.IdActa
    form.value.Acta = acta.Acta
    form.value.NroActa = acta.Acta
    form.value.PrefijoFacturaRecibida = acta.PrefijoFacturaRecibida
    form.value.NumeroFacturaRecibida = acta.NumeroFacturaRecibida
    form.value.FechaFacturaRecibida = acta.FechaFacturaRecibida
    form.value.FechaActa = acta.FechaActa
    form.value.Observaciones = acta.Observaciones
    form.value.IdEstado = acta.IdEstado
    form.value.IdProveedor = acta.IdProveedor
    form.value.IdCedi = acta.IdCedi
    form.value.IdBodega = acta.IdBodega

    // Detalles: composable maneja locales y snapshot
    hydrateDetalles(acta.detalles || [])

    // Snapshots
    formSnapshot.value = { ...form.value }
  }

  function resetForm() {
    form.value = { ...formInitial }
    ui.value = { ...uiInitial }
    resetInfraestructuraState()
    resetDetalles()
    formSnapshot.value = null
    formRef.value?.resetValidation()
  }

  async function inicializarModoLectura() {
    setCatalogosLectura(props.acta)
    await precargarActa(props.acta)
  }
  async function inicializarModoEdicion() {
    const { ok } = await cargarCatalogos()
    if (!ok) {
      $toast.warning('Algunos catálogos no se cargaron. Revisa los campos de selección.')
    }
    setCatalogosLectura(props.acta)
    await precargarActa(props.acta)
  }

  async function inicializarModoCreacion() {
    const { ok } = await cargarCatalogos()
    if (!ok) {
      $toast.warning('Algunos catálogos no se cargaron. Revisa los campos de selección.')
    }
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
      $loading.show()
      try {
        if (isReadonly.value && props.acta) await inicializarModoLectura()
        else if (isCreating.value) await inicializarModoCreacion()
        else await inicializarModoEdicion()
      } catch (error) {
        console.error('Error al inicializar diálogo:', error)
      } finally {
        $loading.hide()
      }
    },
  )
  async function submitForm() {
    const { valid } = await formRef.value.validate()

    if (!valid) {
      const primerTabConError = Object.keys(tabErrors.value).find((k) => tabErrors.value[k])
      if (primerTabConError) ui.value.tab = primerTabConError
      $toast.error('Por favor corrige los errores en los campos marcados')
      return
    }

    const confirmado = await $confirm.confirm({
      title: isCreating.value ? '¿Crear Acta?' : '¿Guardar cambios?',
      message: isCreating.value
        ? 'Se registrará una nueva acta con los datos ingresados.'
        : `Se actualizará la información de <strong>${form.value.Acta}</strong>.`,
      labelConfirm: isCreating.value ? 'Sí, crear' : 'Sí, guardar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    const changes = getChangedFields(form.value, formSnapshot.value)
    const detalleCambios = getDetallesChanges()
    if (detalleCambios.length > 0) {
      changes.detalles = detalleCambios
    }

    emit('submit', { payload: changes, mode: props.mode })
  }

  // estado/color handled in tabs
</script>
