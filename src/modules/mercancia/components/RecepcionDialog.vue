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
    @accept="emitSubmit"
    @update:model-value="onClose"
  >
    <template #content>
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
            <recepcion-detalle-tab :detalle-headers="detalleHeaders" :form="form" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, reactive, ref, watch } from 'vue'
  import { infraestructuraService } from '@/api/services/infraestructuraService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useInfraestructuraCascade } from '@/shared/composables/useInfraestructuraCascade'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  // colors handled inside tabs
  import { useRecepcionCatalogos } from '../composables/useRecepcionCatalogos'
  import { useRecepcionDetalles } from '../composables/useRecepcionDetalles'
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

  const formRef = ref(null)
  const ui = ref({ tab: 'info' })

  function formInitial() {
    return {
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
  }

  const form = reactive(formInitial())
  const formSnapshot = ref(null)

  // Composables
  const {
    estadosCatalogo,
    proveedores,
    cedis,
    bodegas: _bodegas,
    setCatalogosLectura,
    cargarCatalogos,
  } = useRecepcionCatalogos()

  const {
    bodegas: bodegasCascada,
    onCediChange,
    preloadInfraestructura,
    setInfraestructuraLectura,
  } = useInfraestructuraCascade({
    ui,
    form: ref(form),
    services: infraestructuraService,
    keys: {
      idCedi: 'IdCedi',
      idBodega: 'IdBodega',
    },
  })

  const {
    detalles,
    detallesSnapshot,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
  } = useRecepcionDetalles()

  const detalleHeaders = [
    { title: 'Producto', key: 'CodigoProducto', sortable: false },
    { title: 'Lote', key: 'CodLote', sortable: false },
    {
      title: 'Facturado',
      key: 'CantidadFacturada',
      align: 'center',
      sortable: false,
    },
    {
      title: 'Recibido',
      key: 'CantidadRecibida',
      align: 'center',
      sortable: false,
    },
    {
      title: 'Muestra',
      key: 'CantidadMuestra',
      align: 'center',
      sortable: false,
    },
    { title: 'Estado', key: 'Aceptado', align: 'center', sortable: false },
    { title: 'Obs.', key: 'ObservacionesProducto', sortable: false },
  ]
  const _DetallerowActions = [
    {
      label: 'Ver detalle',
      icon: '$eye',
      color: 'blue-darken-3',
      action: (item) => verDetalle(item),
    },
    {
      label: 'Editar',
      icon: '$pencil',
      color: 'purple-darken-3',
      action: (item) => editarCliente(item),
    },
  ]

  const dialogTitle = computed(
    () => ({ create: 'Crear Acta', edit: 'Editar Acta', view: 'Detalle del Acta' })[props.mode],
  )
  const dialogIcon = computed(
    () => ({ create: 'mdi-file-plus', edit: 'mdi-file-edit', view: 'mdi-file-eye' })[props.mode],
  )
  const labelConfirm = computed(
    () => ({ create: 'Crear Acta', edit: 'Guardar Cambios', view: '' })[props.mode],
  )

  const disableConfirm = computed(() => isEditing.value && !hasChanges.value)

  const hasChanges = computed(() => {
    const formChanged = formSnapshot.value ? hasObjectChanges(form, formSnapshot.value) : false
    const detallesChanged = hasDetallesChanges()
    return formChanged || detallesChanged
  })

  async function precargarActa(acta) {
    if (!acta) {
      Object.assign(form, formInitial())
      resetDetalles()
      formSnapshot.value = null
      return
    }

    if (isReadonly.value) {
      setInfraestructuraLectura(acta)
    } else {
      // Si es modo edición, precargamos en cascada para traer bodegas del cedi según el idCedi
      await preloadInfraestructura({
        idCedi: acta.IdCedi,
        idBodega: acta.IdBodega,
      })
    }

    form.IdActa = acta.IdActa
    form.Acta = acta.Acta
    form.NroActa = acta.Acta
    form.PrefijoFacturaRecibida = acta.PrefijoFacturaRecibida
    form.NumeroFacturaRecibida = acta.NumeroFacturaRecibida
    form.FechaFacturaRecibida = acta.FechaFacturaRecibida
    form.FechaActa = acta.FechaActa
    form.Observaciones = acta.Observaciones
    form.IdEstado = acta.IdEstado
    form.IdProveedor = acta.IdProveedor
    form.IdCedi = acta.IdCedi
    form.IdBodega = acta.IdBodega

    // Detalles: composable maneja locales y snapshot
    hydrateDetalles(acta.detalles || [])
    // Vincular la referencia de detalles con el form para compatibilidad con tabs existentes
    form.Detalles = detalles.value

    // Snapshots
    formSnapshot.value = { ...form }
    setDetallesSnapshot(detallesSnapshot.value || [])
  }

  watch(
    () => props.modelValue,
    async (_isOpen) => {
      // if (!isOpen) {
      //   resetForm()
      //   return
      // }

      $loading.show()
      try {
        if (isReadonly.value && props.acta) {
          setCatalogosLectura(props.acta)
          await precargarActa(props.acta)
        } else {
          const catalogResult = await cargarCatalogos()
          if (!catalogResult.ok) {
            $toast.warning(
              'Algunos catálogos no se cargaron. Puedes continuar, pero revisa los campos de selección.',
            )
          }
          if (props.acta && !isCreating.value) {
            await precargarActa(props.acta)
          } else {
            formSnapshot.value = { ...form.value }
            setDetallesSnapshot([])
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        $loading.hide()
      }
    },
  )
  function onClose(value) {
    emit('update:modelValue', value)
  }

  async function emitSubmit() {
    const { valid } = (await formRef.value?.validate?.()) ?? { valid: true }
    if (!valid) return

    let payload = {}
    if (isCreating.value) {
      // crear: enviar form completo + detalles como array
      payload = {
        ...form,
        Detalles: (detalles.value || []).map((d) => ({
          CodigoProducto: d.CodigoProducto,
          CodLote: d.CodLote,
          CantidadFacturada: d.CantidadFacturada,
          CantidadRecibida: d.CantidadRecibida,
          CantidadMuestra: d.CantidadMuestra,
          Aceptado: d.Aceptado,
        })),
      }
    } else {
      // editar: armar patch del form + payload de detalles (eliminados/upserts)
      const formPatch = getChangedFields(form, formSnapshot.value) || {}
      const detallesPayload = getDetallesChanges()
      payload = { ...formPatch }
      if (detallesPayload) payload.Detalles = detallesPayload
    }

    emit('submit', payload)
  }

  // estado/color handled in tabs
</script>
