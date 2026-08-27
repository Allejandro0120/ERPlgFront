<template>
  <base-dialog
    color="primary"
    color-secondary="error"
    :disable-confirm="isEditing && !hasChanges"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    :label-secondary="labelSecondary"
    max-width="1400"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @secondary="anularDialogOpen = true"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <cotizacion-detalle-form-dialog
        v-model="detalleDialog.open"
        :detalle="detalleDialog.detalle"
        :existing-detalles="detalles"
        :mode="detalleDialog.mode"
        :productos-disponibles="productosListaPrecio"
        @submit="onDetalleSubmit"
      />

      <anular-cotizacion-dialog
        v-model="anularDialogOpen"
        :cotizacion="form.Cotizacion"
        @confirm="onConfirmAnular"
      />

      <v-form ref="formRef">
        <v-tabs v-model="ui.tab" class="mb-4" color="primary">
          <v-tab value="info">
            <v-icon icon="mdi-text-box" start />
            Información
          </v-tab>
          <v-tab value="productos">
            <v-icon icon="mdi-package-variant" start />
            Productos
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <v-tabs-window-item eager value="info">
            <cotizacion-info-tab
              :form="form"
              :is-readonly="isReadonly"
              :metodos-pago="metodosPagoOptions"
              :nombre-lista-precio="form.NombreLista"
              :tipos-venta="tiposVentaOptions"
            />
          </v-tabs-window-item>

          <v-tabs-window-item eager value="productos">
            <cotizacion-productos-tab
              :detalles="detalles"
              :is-readonly="isReadonly"
              :otros-impuestos="form.OtrosImpuestos"
              :totales="totales"
              @add="abrirAgregarDetalle"
              @editar-producto="(localId) => abrirPorLocalId(localId, 'edit')"
              @eliminar-producto="eliminarDetalle"
              @ver-producto="(localId) => abrirPorLocalId(localId, 'view')"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { getChangedFields, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { pickFields } from '@/shared/utils/objectUtils'
  import { useAuthStore } from '@/stores/authStore'
  import { useCotizacionDetalles } from '../../composables/cotizacion/useCotizacionDetalles'
  import { useVentaCatalogos } from '../../composables/useVentaCatalogos'
  import AnularCotizacionDialog from './AnularCotizacionDialog.vue'
  import CotizacionDetalleFormDialog from './CotizacionDetalleFormDialog.vue'
  import CotizacionInfoTab from './tabs/CotizacionInfoTab.vue'
  import CotizacionProductosTab from './tabs/CotizacionProductosTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'view',
      validator: (v) => ['view', 'edit', 'create'].includes(v),
    },
    cotizacion: { type: Object, default: null },
    // Selección previa (cliente, sucursal, cedi) hecha antes de abrir el diálogo en modo creación
    preseleccion: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'submit', 'anular'])

  const authStore = useAuthStore()

  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')
  const isCreating = computed(() => props.mode === 'create')

  const formRef = ref(null)
  const anularDialogOpen = ref(false)

  const cotizacionDisplayName = computed(() => props.cotizacion?.Cotizacion ?? '')
  const dialogTitle = computed(() => {
    if (isCreating.value) {
      const nombreCliente = props.preseleccion?.cliente?.Nombre
      return nombreCliente ? `Crear Cotización: ${nombreCliente}` : 'Crear Cotización'
    }
    const base = isReadonly.value ? 'Detalle de la Cotización' : 'Editar Cotización'
    return cotizacionDisplayName.value ? `${base}: ${cotizacionDisplayName.value}` : base
  })
  // Solo se puede anular una cotización desde el modo edición cuando sigue "Abierta"
  // (acción secundaria, igual que "Guardar y enviar" / "Guardar como borrador" en recepciones).
  const puedeAnularse = computed(() => isEditing.value && form.value.Estado === 'Abierta')

  const dialogIcon = computed(() => {
    if (isCreating.value) return 'mdi-file-plus'
    return isReadonly.value ? 'mdi-file-eye' : 'mdi-file-edit'
  })
  const labelConfirm = computed(
    () => ({ create: 'Crear Cotización', edit: 'Guardar Cambios', view: '' })[props.mode],
  )
  const labelSecondary = computed(() => (puedeAnularse.value ? 'Anular Cotización' : ''))

  const FORM_FIELDS = [
    'Id',
    'Cotizacion',
    'FechaDocumento',
    'IdCliente',
    'Cliente',
    'NumeroIdentificacionCliente',
    'IdListaPrecio',
    'NombreLista',
    'IdCedi',
    'NombreCedi',
    'IdTipoVenta',
    'TipoVenta',
    'IdMetodoPago',
    'MetodoPago',
    'Subtotal',
    'DescuentoTotal',
    'ValorIva',
    'OtrosImpuestos',
    'Total',
    'Observaciones',
    'Usuario',
    'Anulada',
    'IdEstado',
    'Estado',
    'VigenciaHasta',
    'CondicionesEntrega',
    'FechaDecision',
    'ObservacionCierre',
    'Pedido',
  ]

  const formInitial = {
    Id: null,
    Cotizacion: '',
    FechaDocumento: '',
    IdCliente: null,
    Cliente: '',
    NumeroIdentificacionCliente: '',
    // IdSucursal null representa la dirección principal del cliente (sin sucursal específica)
    IdSucursal: null,
    NombreSucursal: '',
    IdCedi: null,
    NombreCedi: '',
    IdListaPrecio: null,
    NombreLista: '',
    IdTipoVenta: null,
    TipoVenta: '',
    IdMetodoPago: null,
    MetodoPago: '',
    Subtotal: 0,
    DescuentoTotal: 0,
    ValorIva: 0,
    OtrosImpuestos: 0,
    Total: 0,
    Observaciones: '',
    Usuario: '',
    Anulada: false,
    IdEstado: null,
    Estado: '',
    VigenciaHasta: '',
    CondicionesEntrega: '',
    FechaDecision: null,
    ObservacionCierre: null,
    Pedido: null,
  }

  const uiInitial = { tab: 'info' }

  const form = ref({ ...formInitial })
  const ui = ref({ ...uiInitial })
  const formSnapshot = ref(null)

  const {
    tiposVenta,
    metodosPago,
    productosListaPrecio,
    cargarCatalogosEdicion,
    cargarProductosListaPrecio,
    cargarProductosDisponibles,
  } = useVentaCatalogos()

  const {
    detalles,
    detalleDialog,
    hydrateDetalles,
    resetDetalles,
    abrirAgregarDetalle,
    abrirPorLocalId,
    eliminarDetalle,
    onDetalleSubmit,
    totales,
    hasDetallesChanges,
    getDetallesChanges,
  } = useCotizacionDetalles()

  // En modo lectura no se cargan los catálogos completos: se arma una opción única
  // con los valores ya guardados en la cotización, igual que en el resto de módulos.
  const tiposVentaOptions = computed(() =>
    isReadonly.value
      ? [{ IdTipoVenta: form.value.IdTipoVenta, Nombre: form.value.TipoVenta }]
      : tiposVenta.value,
  )
  const metodosPagoOptions = computed(() =>
    isReadonly.value
      ? [{ IdMetodoPago: form.value.IdMetodoPago, Nombre: form.value.MetodoPago }]
      : metodosPago.value,
  )

  function precargarCotizacion(cotizacion) {
    Object.assign(form.value, pickFields(cotizacion, FORM_FIELDS, formInitial))

    const sucursal = cotizacion.Sucursal?.[0] ?? null
    form.value.IdSucursal = sucursal?.IdSucursal ?? cotizacion.IdSucursalCliente ?? null
    form.value.NombreSucursal = sucursal
      ? [
          sucursal.NombreSucursal,
          sucursal.Direccion,
          [sucursal.NombreMunicipio, sucursal.NombreDepartamento].filter(Boolean).join(', '),
        ]
          .filter(Boolean)
          .join(' - ')
      : ''

    hydrateDetalles(cotizacion.Detalles || [])
  }

  function precargarCreacion(preseleccion) {
    const cliente = preseleccion?.cliente ?? {}
    const sucursal = preseleccion?.sucursal ?? {}
    const cedi = preseleccion?.cedi ?? {}

    form.value = {
      ...formInitial,
      FechaDocumento: new Date().toISOString(),
      Usuario: authStore.user?.Nombre ?? '',
      IdCliente: cliente.IdCliente ?? null,
      Cliente: cliente.Nombre ?? '',
      NumeroIdentificacionCliente: cliente.NumeroIdentificacion ?? '',
      IdSucursal: sucursal.IdSucursal ?? null,
      NombreSucursal: [
        sucursal.NombreSucursal,
        sucursal.Direccion,
        [sucursal.NombreMunicipio, sucursal.NombreDepartamento].filter(Boolean).join(', '),
      ]
        .filter(Boolean)
        .join(' - '),
      IdCedi: cedi.IdCedi ?? null,
      NombreCedi: cedi.NombreCedi ?? '',
      IdListaPrecio: cliente.IdListaPrecio ?? null,
      NombreLista: cliente.NombreListaPrecio ?? '',
    }
  }

  function resetForm() {
    form.value = { ...formInitial }
    ui.value = { ...uiInitial }
    formSnapshot.value = null
    resetDetalles()
    formRef.value?.resetValidation()
  }

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    if (isCreating.value) {
      return hasObjectChanges(form.value, formSnapshot.value) || detalles.value.length > 0
    }
    if (isEditing.value) {
      return hasObjectChanges(form.value, formSnapshot.value) || hasDetallesChanges()
    }
    return false
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes cambios sin guardar en la cotización. ¿Deseas salir de todas formas?',
  })

  async function inicializarModoCreacion() {
    precargarCreacion(props.preseleccion)
    const { ok } = await cargarCatalogosEdicion()
    if (!ok) {
      $toast.warning('Algunos catálogos no se pudieron cargar por completo.')
    }
    formSnapshot.value = { ...form.value }
  }

  // Los productos disponibles solo se consultan cuando el usuario realmente abre el
  // modal para agregar un producto, nunca al abrir la cotización (ni en modo lectura
  // ni en edición). Se vuelven a pedir cada vez (sin caché): el precio, descuento o
  // stock pueden cambiar entre una apertura y otra del modal.
  watch(
    () => detalleDialog.value.open,
    async (isOpen) => {
      if (!isOpen || detalleDialog.value.mode !== 'create') return
      $loading.show()
      try {
        const { ok } = isCreating.value
          ? await cargarProductosDisponibles(form.value.IdListaPrecio, form.value.IdCedi)
          : await cargarProductosListaPrecio(form.value.IdListaPrecio)
        if (!ok) {
          $toast.warning('No se pudieron cargar los productos disponibles.')
        }
      } finally {
        $loading.hide()
      }
    },
  )

  async function inicializarModoLecturaOEdicion() {
    if (!props.cotizacion) return
    precargarCotizacion(props.cotizacion)
    if (isEditing.value) {
      const { ok } = await cargarCatalogosEdicion()
      if (!ok) {
        $toast.warning('Algunos catálogos no se pudieron cargar por completo.')
      }
      formSnapshot.value = { ...form.value }
    }
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
        await (isCreating.value ? inicializarModoCreacion() : inicializarModoLecturaOEdicion())
      } catch (error) {
        console.error('Error al inicializar el diálogo de cotización:', error)
      } finally {
        $loading.hide()
      }
    },
  )

  async function submitCreate() {
    if (detalles.value.length === 0) {
      ui.value.tab = 'productos'
      $toast.error('Debes agregar al menos un producto a la cotización')
      return
    }

    const confirmado = await $confirm.confirm({
      title: '¿Crear cotización?',
      message: `Se registrará una nueva cotización para <strong>${form.value.Cliente}</strong>.`,
      labelConfirm: 'Sí, crear',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    const payload = {
      IdCliente: form.value.IdCliente,
      IdSucursalCliente: form.value.IdSucursal,
      IdCedi: form.value.IdCedi,
      VigenciaHasta: form.value.VigenciaHasta,
      CondicionesEntrega: form.value.CondicionesEntrega,
      IdTipoVenta: form.value.IdTipoVenta,
      IdMetodoPago: form.value.IdMetodoPago,
      Observaciones: form.value.Observaciones,
      detalles: detalles.value.map((detalle) => ({
        IdProducto: detalle.IdProducto,
        Cantidad: Number(detalle.Cantidad) || 0,
        PrecioUnitario: Number(detalle.PrecioUnitario) || 0,
        PorcentajeDescuento: Number(detalle.PorcentajeDescuento) || 0,
        Observacion: detalle.Observacion,
      })),
    }

    emit('submit', { payload, mode: props.mode })
  }

  async function submitEdit() {
    if (detalles.value.length === 0) {
      ui.value.tab = 'productos'
      $toast.error('La cotización debe conservar al menos un producto')
      return
    }

    if (!hasChanges.value) {
      $toast.info('No hay cambios para guardar')
      return
    }

    const confirmado = await $confirm.confirm({
      title: '¿Guardar cambios?',
      message: `Se actualizará la cotización <strong>${form.value.Cotizacion}</strong>.`,
      labelConfirm: 'Sí, guardar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    const changes = getChangedFields(form.value, formSnapshot.value)

    const detallesCambios = getDetallesChanges()
    if (detallesCambios !== null) {
      changes.detalles = detallesCambios
    }

    if (Object.keys(changes).length === 0) {
      $toast.info('No hay cambios para guardar')
      return
    }

    emit('submit', { payload: changes, mode: props.mode })
  }

  function onConfirmAnular(observacionAnulacion) {
    anularDialogOpen.value = false
    emit('anular', { id: form.value.Id, observacionAnulacion })
  }

  async function submitForm() {
    if (isReadonly.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    if (isCreating.value) {
      await submitCreate()
    } else if (isEditing.value) {
      await submitEdit()
    }
  }
</script>

<style scoped></style>
