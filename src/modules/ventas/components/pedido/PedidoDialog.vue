<template>
  <base-dialog
    color="primary"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    max-width="1400"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #title>
      <span class="text-body-large font-weight-semibold">{{ dialogTitle }}</span>
      <v-chip
        v-if="esEntradaDirecta"
        class="ml-2"
        color="primary"
        density="comfortable"
        label
        size="small"
        variant="tonal"
      >
        Entrada Directa
      </v-chip>
    </template>

    <!-- En edición se agregan Anular/Autorizar (transiciones de estado vía PUT /orders/cancel
         y /orders/approve, aparte del guardado de contenido) junto a las acciones por defecto -->
    <template #actions="{ accept, cancel }">
      <v-row align="center" class="ma-0" justify="end" no-gutters>
        <v-col class="pa-1" cols="12" sm="auto">
          <v-btn block color="outline" variant="outlined" @click="cancel">
            <span style="color: rgb(var(--v-theme-brand-grey-2))">Cancelar</span>
          </v-btn>
        </v-col>

        <template v-if="origenModo === 'edit'">
          <v-divider class="my-1 d-none d-sm-flex" style="opacity: 0.5" vertical />
          <v-col class="pa-1" cols="12" sm="auto">
            <v-btn block color="error" variant="tonal" @click="anularPedido">Anular Pedido</v-btn>
          </v-col>
          <v-divider class="my-1 d-none d-sm-flex" style="opacity: 0.5" vertical />
          <v-col class="pa-1" cols="12" sm="auto">
            <v-btn block color="success" variant="tonal" @click="autorizarPedido">
              Autorizar Pedido
            </v-btn>
          </v-col>
        </template>

        <v-col class="pa-1" cols="12" sm="auto">
          <v-btn block color="primary" variant="flat" @click="accept">{{ labelConfirm }}</v-btn>
        </v-col>
      </v-row>
    </template>

    <template #content>
      <confirmar-observacion-dialog
        v-model="anularDialogOpen"
        color="error"
        icon="mdi-cancel"
        label-confirm="Anular Pedido"
        label-observacion="Observación de anulación"
        mensaje-alerta="Esta acción es irreversible. Una vez anulado, el pedido no podrá editarse ni volver a anularse."
        :pedido="props.pedido?.Pedido"
        titulo="Anular Pedido"
        @confirm="onConfirmAnular"
      />

      <pedido-asignacion-dialog
        v-if="origenModo === 'cotizacion'"
        :cargando="cargandoDisponibilidad"
        :is-readonly="isReadonly"
        :linea="lineaAsignacionActual"
        :model-value="asignacionDialog.open"
        :ubicaciones="ubicaciones"
        @submit="onAsignacionSubmit"
        @update:model-value="onAsignacionDialogToggle"
      />

      <pedido-producto-dialog
        v-else
        :cargando="cargandoDisponibilidad"
        :es-entrada-directa="esEntradaDirecta"
        :linea="lineaLibreActual"
        :mode="lineaDialog.mode"
        :model-value="lineaDialog.open"
        :productos-disponibles="productosDisponiblesFiltrados"
        :ubicaciones="ubicaciones"
        @producto-change="onLineaProductoChange"
        @submit="onLineaSubmit"
        @update:model-value="onLineaDialogToggle"
      />

      <v-form ref="formRef" @submit.prevent>
        <v-tabs v-model="ui.tab" class="mb-4" color="primary">
          <v-tab value="info">
            <v-icon icon="mdi-text-box" start />
            Información
            <v-badge v-if="tabErrors.info" class="ml-2" color="error" dot inline />
          </v-tab>
          <v-tab value="productos">
            <v-icon icon="mdi-package-variant" start />
            Productos
            <v-badge v-if="tabErrors.productos" class="ml-2" color="error" dot inline />
          </v-tab>
        </v-tabs>

        <v-tabs-window v-model="ui.tab">
          <v-tabs-window-item eager value="info">
            <pedido-info-tab
              :form="form"
              :is-readonly="isReadonly"
              :metodos-pago="metodosPago"
              :modo="origenModo"
              :origen="origen"
              :tipos-venta="tiposVenta"
            />
          </v-tabs-window-item>

          <v-tabs-window-item eager value="productos">
            <pedido-productos-tab
              v-if="origenModo === 'cotizacion'"
              :is-readonly="isReadonly"
              :lineas="lineasAsignacion"
              :lineas-completas="lineasCompletas"
              :todo-asignado="todoAsignado"
              :unidades-faltantes="unidadesFaltantes"
              @asignar="onAsignar"
            />
            <pedido-lineas-tab
              v-else
              :es-entrada-directa="esEntradaDirecta"
              :is-readonly="isReadonly"
              :lineas="lineasLibres"
              :totales="totalesLibres"
              @add="onAgregarLinea"
              @editar-linea="(localId) => abrirLineaPorLocalId(localId, 'edit')"
              @eliminar-linea="eliminarLineaLibre"
              @ver-linea="(localId) => abrirLineaPorLocalId(localId, 'view')"
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
  import { hasCollectionChanges, hasObjectChanges } from '@/shared/composables/useChangePayload'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { usePedidoAsignaciones } from '../../composables/pedido/usePedidoAsignaciones'
  import { usePedidoProductosLibre } from '../../composables/pedido/usePedidoProductosLibre'
  import { usePedidoStockDisponible } from '../../composables/pedido/usePedidoStockDisponible'
  import { useVentaCatalogos } from '../../composables/useVentaCatalogos'
  import ConfirmarObservacionDialog from './ConfirmarObservacionDialog.vue'
  import PedidoAsignacionDialog from './PedidoAsignacionDialog.vue'
  import PedidoProductoDialog from './PedidoProductoDialog.vue'
  import PedidoInfoTab from './tabs/PedidoInfoTab.vue'
  import PedidoLineasTab from './tabs/PedidoLineasTab.vue'
  import PedidoProductosTab from './tabs/PedidoProductosTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: (v) => ['create', 'view', 'edit'].includes(v),
    },
    // Cotización de origen ya cargada (GET /quotations/unique/:id): pasar cotización a pedido
    cotizacion: { type: Object, default: null },
    // Selección previa (cliente, sucursal, cedi) hecha antes de abrir el diálogo: pedido desde cero
    preseleccion: { type: Object, default: null },
    // Pedido ya existente (GET /orders/unique/:id): modo lectura
    pedido: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'submit', 'anular', 'autorizar'])

  const isReadonly = computed(() => props.mode === 'view')

  // Tres orígenes posibles para el contenido del diálogo: heredado de una cotización,
  // armado desde cero (cliente/sucursal/cedi elegidos a mano), o un pedido ya creado
  // (lectura en modo 'view', edición en modo 'edit').
  const origenModo = computed(() => {
    if (props.mode === 'view') return 'view'
    if (props.mode === 'edit') return 'edit'
    return props.cotizacion ? 'cotizacion' : 'libre'
  })

  // Pedido "Entrada Directa": solo aplica a pedidos armados desde cero (elegido en el
  // modal de selección previa). En ese modo, Productos funciona como en cotizaciones:
  // solo cantidad, sin elegir ubicación/lote ni declarar faltante.
  const esEntradaDirecta = computed(
    () => origenModo.value === 'libre' && !!props.preseleccion?.entradaDirecta,
  )

  const formRef = ref(null)
  const anularDialogOpen = ref(false)
  const productosTabError = ref(false)

  const campoATab = {
    IdTipoVenta: 'info',
    IdMetodoPago: 'info',
    ContactoRecepcion: 'info',
    TelefonoContacto: 'info',
    Observaciones: 'info',
    RequiereCadenaFrio: 'info',
    TemperaturaMinimaC: 'info',
    TemperaturaMaximaC: 'info',
  }

  const tabErrors = computed(() => {
    const result = { info: false, productos: productosTabError.value }
    if (!formRef.value) return result
    for (const { id } of formRef.value.errors ?? []) {
      const tab = campoATab[id]
      if (tab) result[tab] = true
    }
    return result
  })

  const formInitial = {
    ContactoRecepcion: '',
    TelefonoContacto: '',
    Observaciones: '',
    RequiereCadenaFrio: false,
    TemperaturaMinimaC: '',
    TemperaturaMaximaC: '',
    IdTipoVenta: null,
    IdMetodoPago: null,
  }

  const uiInitial = { tab: 'info' }

  const form = ref({ ...formInitial })
  const ui = ref({ ...uiInitial })
  const formSnapshot = ref(null)
  const lineasLibresSnapshot = ref([])

  // ─── Flujo "pasar cotización a pedido": cobertura cotizado/tomado/faltante ───────
  const {
    lineas: lineasAsignacion,
    asignacionDialog,
    lineaActual: lineaAsignacionActual,
    hydrateLineas: hydrateLineasAsignacion,
    resetLineas: resetLineasAsignacion,
    abrirAsignacion,
    cerrarAsignacion,
    guardarAsignaciones,
    lineasCompletas,
    unidadesFaltantes,
    todoAsignado,
    buildDetallesPayload,
  } = usePedidoAsignaciones()

  // ─── Flujo "pedido desde cero" / vista de un pedido ya creado: productos agrupados ─
  const {
    lineas: lineasLibres,
    lineaDialog,
    lineaActual: lineaLibreActual,
    hydrateLineas: hydrateLineasLibres,
    resetLineas: resetLineasLibres,
    abrirAgregar: abrirAgregarLinea,
    abrirPorLocalId: abrirLineaPorLocalId,
    cerrarLineaDialog,
    productosDisponiblesParaAgregar,
    agregarProducto,
    editarProducto,
    eliminarProducto: eliminarLineaLibre,
    totales: totalesLibres,
    unidadesFaltantes: unidadesFaltantesLibres,
    buildDetallesPayload: buildDetallesPayloadLibre,
    buildDetallesPayloadEdit,
  } = usePedidoProductosLibre()

  const {
    ubicaciones,
    cargando: cargandoDisponibilidad,
    cargarDisponibilidad,
    limpiarDisponibilidad,
  } = usePedidoStockDisponible()

  const {
    tiposVenta,
    metodosPago,
    nombreListaPrecio,
    productosListaPrecio: productosDisponibles,
    cargarCatalogosEdicion,
    cargarProductosDisponibles,
  } = useVentaCatalogos()

  // Un producto ya agregado al pedido no vuelve a aparecer en el buscador: para tomar
  // más stock o cambiar su faltante se usa "Editar" sobre su fila existente.
  const productosDisponiblesFiltrados = computed(() =>
    productosDisponiblesParaAgregar(productosDisponibles.value),
  )

  // Datos de solo lectura que se muestran en la pestaña Información, resueltos según
  // el origen del pedido (cotización, preselección manual, o el propio pedido ya creado).
  const origen = computed(() => {
    if (origenModo.value === 'cotizacion') {
      const sucursal = props.cotizacion?.Sucursal?.[0] ?? null
      return {
        Id: props.cotizacion?.Id ?? null,
        Cotizacion: props.cotizacion?.Cotizacion ?? '',
        Cliente: props.cotizacion?.Cliente ?? '',
        NumeroIdentificacionCliente: props.cotizacion?.NumeroIdentificacionCliente ?? '',
        NombreCedi: props.cotizacion?.NombreCedi ?? '',
        VigenciaHasta: props.cotizacion?.VigenciaHasta ?? '',
        DireccionEntrega: sucursal?.Direccion ?? '',
        NombreListaPrecio: props.cotizacion?.NombreLista ?? '',
        TipoVenta: props.cotizacion?.TipoVenta ?? '',
        MetodoPago: props.cotizacion?.MetodoPago ?? '',
        Usuario: props.cotizacion?.Usuario ?? '',
      }
    }

    if (origenModo.value === 'libre') {
      const cliente = props.preseleccion?.cliente ?? {}
      const sucursal = props.preseleccion?.sucursal ?? {}
      const cedi = props.preseleccion?.cedi ?? {}
      return {
        Id: null,
        Cotizacion: '',
        Cliente: cliente.Nombre ?? '',
        NumeroIdentificacionCliente: cliente.NumeroIdentificacion ?? '',
        NombreCedi: cedi.NombreCedi ?? '',
        VigenciaHasta: '',
        DireccionEntrega: sucursal.Direccion ?? '',
        NombreListaPrecio: cliente.NombreListaPrecio ?? nombreListaPrecio.value,
        TipoVenta: '',
        MetodoPago: '',
        Usuario: '',
      }
    }

    // view / edit: pedido ya creado
    const pedido = props.pedido ?? {}
    return {
      Id: null,
      Cotizacion: pedido.CotizacionOrigen ?? '',
      Cliente: pedido.Cliente ?? '',
      NumeroIdentificacionCliente: pedido.NumeroIdentificacionCliente ?? '',
      NombreCedi: pedido.NombreCedi ?? '',
      VigenciaHasta: '',
      DireccionEntrega: pedido.DireccionEntrega ?? '',
      NombreListaPrecio: pedido.NombreLista ?? '',
      TipoVenta: pedido.TipoVenta ?? '',
      MetodoPago: pedido.MetodoPago ?? '',
      Usuario: pedido.Usuario ?? '',
      Estado: pedido.Estado ?? '',
      FechaDecision: pedido.FechaDecision ?? '',
      ObservacionCierre: pedido.ObservacionCierre ?? '',
      ValorPedido: pedido.ValorPedido ?? null,
      ValorDespachado: pedido.ValorDespachado ?? null,
      ValorPendiente: pedido.ValorPendiente ?? null,
      Facturaciones: pedido.Facturaciones ?? [],
    }
  })

  const dialogTitle = computed(() => {
    if (origenModo.value === 'view') {
      return props.pedido?.Pedido
        ? `Detalle del Pedido: ${props.pedido.Pedido}`
        : 'Detalle del Pedido'
    }
    if (origenModo.value === 'edit') {
      return props.pedido?.Pedido ? `Editar Pedido: ${props.pedido.Pedido}` : 'Editar Pedido'
    }
    if (origenModo.value === 'cotizacion') {
      return origen.value.Cotizacion
        ? `Pasar cotización a pedido: ${origen.value.Cotizacion}`
        : 'Crear Pedido'
    }
    return origen.value.Cliente ? `Crear Pedido: ${origen.value.Cliente}` : 'Crear Pedido'
  })

  const dialogIcon = computed(() => {
    if (origenModo.value === 'view') return 'mdi-clipboard-text-outline'
    if (origenModo.value === 'edit') return 'mdi-clipboard-edit-outline'
    return 'mdi-clipboard-check-outline'
  })
  const labelConfirm = computed(() =>
    origenModo.value === 'edit' ? 'Guardar Cambios' : 'Confirmar pedido',
  )

  function hasFormChanges() {
    if (origenModo.value === 'edit') {
      return formSnapshot.value ? hasObjectChanges(form.value, formSnapshot.value) : false
    }
    return Object.keys(formInitial).some((key) => form.value[key] !== formInitial[key])
  }

  const hasChanges = computed(() => {
    if (origenModo.value === 'view') return false
    if (origenModo.value === 'cotizacion') {
      return (
        lineasAsignacion.value.some((linea) => linea.Asignaciones.length > 0) || hasFormChanges()
      )
    }
    if (origenModo.value === 'edit') {
      return (
        hasCollectionChanges(lineasLibres.value, lineasLibresSnapshot.value) || hasFormChanges()
      )
    }
    return lineasLibres.value.length > 0 || hasFormChanges()
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: (options) => $confirm.warning(options),
    message: 'Tienes datos sin guardar en el pedido. ¿Deseas salir de todas formas?',
  })

  function resetForm() {
    form.value = { ...formInitial }
    ui.value = { ...uiInitial }
    formSnapshot.value = null
    lineasLibresSnapshot.value = []
    productosTabError.value = false
    resetLineasAsignacion()
    resetLineasLibres()
    limpiarDisponibilidad()
    formRef.value?.resetValidation()
  }

  function precargarLibre(pedido) {
    form.value = {
      ...formInitial,
      ContactoRecepcion: pedido?.ContactoRecepcion ?? '',
      TelefonoContacto: pedido?.TelefonoContacto ?? '',
      Observaciones: pedido?.Observaciones ?? '',
      RequiereCadenaFrio: !!pedido?.RequiereCadenaFrio,
      TemperaturaMinimaC: pedido?.TemperaturaMinimaC ?? '',
      TemperaturaMaximaC: pedido?.TemperaturaMaximaC ?? '',
      IdTipoVenta: null,
      IdMetodoPago: null,
    }
  }

  watch(
    () => props.modelValue,
    async (isOpen) => {
      if (!isOpen) {
        resetForm()
        return
      }

      if (origenModo.value === 'cotizacion') {
        hydrateLineasAsignacion(props.cotizacion?.Detalles ?? [])
        return
      }

      if (origenModo.value === 'view') {
        precargarLibre(props.pedido)
        hydrateLineasLibres(props.pedido?.Detalles ?? [])
        return
      }

      if (origenModo.value === 'edit') {
        precargarLibre(props.pedido)
        form.value.IdTipoVenta = props.pedido?.IdTipoVenta ?? null
        form.value.IdMetodoPago = props.pedido?.IdMetodoPago ?? null
        hydrateLineasLibres(props.pedido?.Detalles ?? [])
        $loading.show()
        try {
          const { ok } = await cargarCatalogosEdicion()
          if (!ok) $toast.warning('Algunos catálogos no se pudieron cargar por completo.')
        } finally {
          $loading.hide()
        }
        formSnapshot.value = { ...form.value }
        // structuredClone falla con proxies reactivos de Vue: se serializa a plano en su lugar.
        // eslint-disable-next-line unicorn/prefer-structured-clone
        lineasLibresSnapshot.value = JSON.parse(JSON.stringify(lineasLibres.value))
        return
      }

      // libre: pedido desde cero
      precargarLibre(null)
      $loading.show()
      try {
        const { ok } = await cargarCatalogosEdicion()
        if (!ok) $toast.warning('Algunos catálogos no se pudieron cargar por completo.')
      } finally {
        $loading.hide()
      }
    },
  )

  // Igual que en CotizacionDialog: los productos disponibles (lista de precios + cedi)
  // solo se consultan cuando el usuario abre el modal para agregar un producto, y sin
  // caché: se vuelven a pedir en cada apertura porque el precio/stock puede cambiar.
  watch(
    () => lineaDialog.value.open,
    async (isOpen) => {
      const modoValido = origenModo.value === 'libre' || origenModo.value === 'edit'
      if (!isOpen || !modoValido) return

      const idCedi =
        origenModo.value === 'edit' ? props.pedido?.IdCedi : props.preseleccion?.cedi?.IdCedi

      if (lineaDialog.value.mode === 'create') {
        $loading.show()
        try {
          const idListaPrecio =
            origenModo.value === 'edit'
              ? props.pedido?.IdListaPrecio
              : props.preseleccion?.cliente?.IdListaPrecio
          const { ok } = await cargarProductosDisponibles(idListaPrecio, idCedi)
          if (!ok) $toast.warning('No se pudieron cargar los productos disponibles.')
        } finally {
          $loading.hide()
        }
        return
      }

      // Al editar un producto ya agregado se vuelve a consultar su disponibilidad,
      // igual que al elegirlo en modo "create", porque el stock pudo cambiar desde
      // que se agregó al pedido. En "Entrada Directa" no hay disponibilidad por
      // lote/ubicación que consultar.
      if (lineaDialog.value.mode === 'edit' && !esEntradaDirecta.value) {
        $loading.show()
        try {
          const { ok } = await cargarDisponibilidad(lineaLibreActual.value?.IdProducto, idCedi)
          if (!ok) $toast.error('No se pudo cargar la disponibilidad del producto.')
        } finally {
          $loading.hide()
        }
      }
    },
  )

  // ─── Flujo cotización: disponibilidad se consulta solo al abrir la asignación ────
  async function onAsignar(localId) {
    abrirAsignacion(localId)
    $loading.show()
    try {
      const { ok } = await cargarDisponibilidad(
        lineaAsignacionActual.value?.IdProducto,
        props.cotizacion?.IdCedi,
      )
      if (!ok) $toast.error('No se pudo cargar la disponibilidad del producto.')
    } finally {
      $loading.hide()
    }
  }

  function onAsignacionDialogToggle(isOpen) {
    if (!isOpen) cerrarAsignacion()
  }

  function onAsignacionSubmit({ localId, asignaciones, observacion }) {
    guardarAsignaciones(localId, asignaciones, observacion)
  }

  // ─── Flujo libre: agregar/editar/ver una línea (producto + lote/ubicación) ──────
  function onAgregarLinea() {
    abrirAgregarLinea()
  }

  function onLineaDialogToggle(isOpen) {
    if (!isOpen) cerrarLineaDialog()
  }

  async function onLineaProductoChange(idProducto) {
    $loading.show()
    try {
      const idCedi =
        origenModo.value === 'edit' ? props.pedido?.IdCedi : props.preseleccion?.cedi?.IdCedi
      const { ok } = await cargarDisponibilidad(idProducto, idCedi)
      if (!ok) $toast.error('No se pudo cargar la disponibilidad del producto.')
    } finally {
      $loading.hide()
    }
  }

  function onLineaSubmit(payload) {
    if (payload.mode === 'create') {
      agregarProducto(payload.datos)
    } else if (payload.mode === 'edit') {
      editarProducto(payload.localId, payload.cambios)
    }
  }

  function buildPayload() {
    const temperatura = (valor) => {
      const numero = Number(String(valor).replace(',', '.'))
      return Number.isNaN(numero) ? null : numero
    }

    const camposComunes = {
      ...(form.value.ContactoRecepcion ? { ContactoRecepcion: form.value.ContactoRecepcion } : {}),
      ...(form.value.TelefonoContacto ? { TelefonoContacto: form.value.TelefonoContacto } : {}),
      ...(form.value.Observaciones ? { Observaciones: form.value.Observaciones } : {}),
      RequiereCadenaFrio: !!form.value.RequiereCadenaFrio,
      ...(form.value.RequiereCadenaFrio
        ? {
            TemperaturaMinimaC: temperatura(form.value.TemperaturaMinimaC),
            TemperaturaMaximaC: temperatura(form.value.TemperaturaMaximaC),
          }
        : {}),
    }

    if (origenModo.value === 'cotizacion') {
      return {
        IdCotizacionOrigen: origen.value.Id,
        ...camposComunes,
        detalles: buildDetallesPayload(),
      }
    }

    if (origenModo.value === 'edit') {
      return {
        IdTransaccion: props.pedido?.Id,
        IdTipoVenta: form.value.IdTipoVenta,
        IdMetodoPago: form.value.IdMetodoPago,
        ...camposComunes,
        detalles: buildDetallesPayloadEdit(lineasLibresSnapshot.value),
      }
    }

    // libre: pedido desde cero. La dirección de entrega la resuelve el back solo:
    // desde la sucursal indicada, o desde la dirección principal del cliente si no
    // se indica ninguna (sucursal "Principal" elegida en la preselección).
    const cliente = props.preseleccion?.cliente ?? {}
    const sucursal = props.preseleccion?.sucursal ?? {}
    const cedi = props.preseleccion?.cedi ?? {}

    return {
      IdCliente: cliente.IdCliente,
      IdCedi: cedi.IdCedi,
      ...(sucursal.IdSucursal ? { IdSucursalCliente: sucursal.IdSucursal } : {}),
      IdTipoVenta: form.value.IdTipoVenta,
      IdMetodoPago: form.value.IdMetodoPago,
      EsEntregaDirecta: esEntradaDirecta.value,
      ...camposComunes,
      detalles: buildDetallesPayloadLibre(esEntradaDirecta.value),
    }
  }

  // Anular/Autorizar son transiciones de estado (PUT /orders/cancel|approve), no pasan por
  // el mismo endpoint de edición de contenido, así que se emiten aparte de "submit".
  function anularPedido() {
    anularDialogOpen.value = true
  }

  function onConfirmAnular(observacionAnulacion) {
    anularDialogOpen.value = false
    emit('anular', { id: props.pedido?.Id, observacionAnulacion })
  }

  async function autorizarPedido() {
    const confirmado = await $confirm.confirm({
      title: '¿Autorizar pedido?',
      message: `Se autorizará el pedido <strong>${props.pedido?.Pedido}</strong>.`,
      labelConfirm: 'Sí, autorizar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return
    emit('autorizar', { id: props.pedido?.Id })
  }

  async function submitForm() {
    if (isReadonly.value) return

    const { valid } = await formRef.value.validate()
    if (!valid) {
      const primerTabConError = Object.keys(tabErrors.value).find((k) => tabErrors.value[k])
      if (primerTabConError) ui.value.tab = primerTabConError
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    if (origenModo.value === 'cotizacion') {
      if (!todoAsignado.value) ui.value.tab = 'productos'

      const confirmado = todoAsignado.value
        ? await $confirm.confirm({
            title: '¿Confirmar pedido?',
            message: `Se creará un pedido a partir de la cotización <strong>${origen.value.Cotizacion}</strong> y la cotización quedará procesada.`,
            labelConfirm: 'Sí, crear pedido',
            labelCancel: 'Cancelar',
          })
        : await $confirm.warning({
            title: '¿Crear pedido con faltantes?',
            message:
              'Tienes productos con cantidades faltantes por asignar. El pedido se creará de todas formas, con esos productos marcados como faltantes. ¿Deseas continuar?',
            labelConfirm: 'Sí, crear igual',
            labelCancel: 'Cancelar',
          })
      if (!confirmado) return

      emit('submit', { payload: buildPayload(), mode: 'create' })
      return
    }

    if (origenModo.value === 'edit') {
      if (lineasLibres.value.length === 0) {
        productosTabError.value = true
        ui.value.tab = 'productos'
        $toast.error('El pedido debe conservar al menos un producto')
        return
      }
      productosTabError.value = false

      if (!hasChanges.value) {
        $toast.info('No hay cambios para guardar')
        return
      }

      const confirmado = await $confirm.confirm({
        title: '¿Guardar cambios?',
        message: `Se actualizará el pedido <strong>${props.pedido?.Pedido}</strong>.`,
        labelConfirm: 'Sí, guardar',
        labelCancel: 'Cancelar',
      })
      if (!confirmado) return

      emit('submit', { payload: buildPayload(), mode: 'edit' })
      return
    }

    // libre
    if (lineasLibres.value.length === 0) {
      productosTabError.value = true
      ui.value.tab = 'productos'
      $toast.error('Debes agregar al menos un producto al pedido')
      return
    }
    productosTabError.value = false

    const confirmado = esEntradaDirecta.value
      ? await $confirm.confirm({
          title: '¿Crear pedido de Entrada Directa?',
          message: `Se registrará, aprobará y facturará de inmediato un pedido para <strong>${origen.value.Cliente}</strong>. No queda como borrador: no hay paso de aprobación ni facturación manual después de este punto.`,
          labelConfirm: 'Sí, crear y facturar',
          labelCancel: 'Cancelar',
        })
      : unidadesFaltantesLibres.value > 0
        ? await $confirm.warning({
            title: '¿Crear pedido con faltantes?',
            message:
              'Tienes productos con cantidades faltantes declaradas. El pedido se creará de todas formas, con esos productos marcados como faltantes. ¿Deseas continuar?',
            labelConfirm: 'Sí, crear igual',
            labelCancel: 'Cancelar',
          })
        : await $confirm.confirm({
            title: '¿Crear pedido?',
            message: `Se registrará un nuevo pedido para <strong>${origen.value.Cliente}</strong>.`,
            labelConfirm: 'Sí, crear pedido',
            labelCancel: 'Cancelar',
          })
    if (!confirmado) return

    emit('submit', { payload: buildPayload(), mode: 'create' })
  }
</script>

<style scoped></style>
