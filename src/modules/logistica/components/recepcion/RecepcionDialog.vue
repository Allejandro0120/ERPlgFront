<template>
  <base-dialog
    color="primary"
    :disable-confirm="disableConfirm"
    :disable-secondary="disableSecondary"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    :label-secondary="labelSecondary"
    max-width="1200"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @secondary="() => submitForm('borrador')"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <recepcion-detalle-form-dialog
        v-model="detalleDialog.open"
        :detalle="detalleDialog.detalle"
        :existing-detalles="detalles"
        :mode="detalleDialog.mode"
        @submit="onDetalleSubmit"
      />
      <v-form ref="formRef">
        <v-tabs v-model="ui.tab" class="mb-4" color="primary">
          <v-tab value="info">
            <v-icon icon="mdi-file" start />
            Información
            <v-badge v-if="tabErrors.info" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="detalle">
            <v-icon icon="mdi-format-list-bulleted" start />
            Detalle
            <v-badge v-if="tabErrors.detalle" class="ml-2" color="error" dot inline />
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
              :permisos="permisos"
              :proveedores="proveedores"
              @cedi-change="onCediChange"
              @reload-proveedores="cargarProveedores"
            />
          </v-tabs-window-item>

          <v-tabs-window-item eager value="detalle">
            <recepcion-detalle-tab
              :detalles="detalles"
              :headers="detalleHeaders"
              :is-readonly="isReadonly"
              :puede-agregar="!isReadonly && permisos.puedeAgregarDetalle"
              :row-actions="detalleRowActions"
              @add="abrirAgregarDetalle"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { pickFields } from '@/shared/utils/objectUtils'
  // colors handled inside tabs
  import { useRecepcionCatalogos } from '../../composables/recepcion/useRecepcionCatalogos'
  import { useRecepcionDetalles } from '../../composables/recepcion/useRecepcionDetalles'
  import {
    ESTADOS_ACTA,
    useRecepcionPermisos,
  } from '../../composables/recepcion/useRecepcionPermisos'
  import RecepcionDetalleFormDialog from './RecepcionDetalleFormDialog.vue'
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

  const detalleTabError = ref(false)

  const estadoActaNombre = computed(() => {
    if (isCreating.value) return ESTADOS_ACTA.BORRADOR
    const estado = estadosCatalogo.value.find((e) => e.IdEstado === form.value.IdEstado)
    return estado?.Nombre ?? ''
  })

  const { permisos } = useRecepcionPermisos(estadoActaNombre)

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
    () => ({ create: 'Guardar y enviar', edit: 'Guardar y enviar', view: '' })[props.mode],
  )
  const labelSecondary = computed(() => (isReadonly.value ? '' : 'Guardar como borrador'))

  const formRef = ref(null)
  const {
    estadosCatalogo,
    proveedores,
    cedis,
    setCatalogosLectura,
    cargarCatalogos,
    cargarProveedores,
  } = useRecepcionCatalogos()

  const {
    detalles,
    detalleDialog,
    detalleHeaders,
    detalleRowActions,
    abrirAgregarDetalle,
    onDetalleSubmit,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
  } = useRecepcionDetalles({ isReadonly, permisos })

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
    ValorMercanciaRecibida: 0,
    FechaActa: '',
    EstadoActa: 'Borrador',
    IdEstado: null,
    IdCedi: null,
    IdBodega: null,
    Detalles: [],
  }
  const ACTA_API_FIELDS = [
    'IdProveedor',
    'Observaciones',
    'PrefijoFacturaRecibida',
    'NumeroFacturaRecibida',
    'FechaFacturaRecibida',
    'ValorMercanciaRecibida',
    'IdBodega',
    'IdEstado',
  ]
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

  const idEstadoBorrador = computed(() => {
    return estadosCatalogo.value.find((e) => e.Nombre === 'Borrador')?.IdEstado
  })

  const disableConfirm = computed(() => {
    if (isEditing.value && !hasChanges.value) {
      // Si el estado actual es Borrador, permitir guardar
      if (form.value.IdEstado === idEstadoBorrador.value) {
        return false
      }
      return true
    }
    return false
  })

  const disableSecondary = computed(() => {
    // Deshabilitar si no hay cambios (en cualquier estado)
    if (isEditing.value && !hasChanges.value) {
      return true
    }
    return false
  })

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
    const result = { info: false, detalle: detalleTabError.value }
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

    Object.assign(
      form.value,
      pickFields(acta, [
        ...ACTA_API_FIELDS,
        'IdActa',
        'Acta',
        'NroActa',
        'FechaActa',
        'IdEstado',
        'IdCedi',
      ]),
    )

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

  function resolverIdEstado(nombreEstado) {
    return (
      estadosCatalogo.value.find((e) => e.Nombre.toLowerCase() === nombreEstado.toLowerCase())
        ?.IdEstado ?? null
    )
  }

  async function submitForm(intent = 'enviar') {
    const { valid } = await formRef.value.validate()

    if (!valid) {
      const primerTabConError = Object.keys(tabErrors.value).find((k) => tabErrors.value[k])
      if (primerTabConError) ui.value.tab = primerTabConError
      $toast.error('Por favor corrige los errores en los campos marcados')
      return
    }

    if (detalles.value.length === 0) {
      detalleTabError.value = true
      ui.value.tab = 'detalle'
      $toast.error('Debes agregar al menos un producto al acta')
      return
    }

    detalleTabError.value = false

    const nombreEstado = intent === 'borrador' ? 'Borrador' : 'Pendiente'
    const idEstado = resolverIdEstado(nombreEstado)
    if (!idEstado) {
      $toast.error(`No se encontró el estado "${nombreEstado}". Contacta al administrador.`)
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

    const changedFields = getChangedFields(form.value, formSnapshot.value)
    const baseForm = isCreating.value
      ? pickFields(form.value, ACTA_API_FIELDS)
      : Object.fromEntries(
          Object.entries(changedFields).filter(([key]) => ACTA_API_FIELDS.includes(key)),
        )

    baseForm.IdEstado = idEstado

    const detalleCambios = getDetallesChanges()
    const payload = detalleCambios.length > 0 ? { ...baseForm, detalles: detalleCambios } : baseForm

    emit('submit', { payload, mode: props.mode, intent })
  }
</script>
