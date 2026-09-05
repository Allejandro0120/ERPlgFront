<!-- src/modules/logistica/components/picking/PickingDialog.vue -->
<template>
  <base-dialog
    color="primary"
    icon="mdi-barcode-scan"
    max-width="1200"
    :model-value="modelValue"
    :show-actions="false"
    :title="dialogTitle"
    @update:model-value="onClose"
  >
    <template #content>
      <confirmar-pick-dialog
        v-model="pickConfirmDialog.open"
        :pendientes="pickConfirmDialog.pendientes"
        @confirm="onConfirmPick"
      />

      <v-tabs v-model="ui.tab" class="mb-4" color="primary">
        <v-tab value="info">
          <v-icon icon="mdi-file" start />
          Información
        </v-tab>
        <v-tab value="productos">
          <v-icon icon="mdi-format-list-bulleted" start />
          Productos
          <v-badge
            v-if="tomados.length > 0"
            class="ml-2"
            color="primary"
            :content="tomados.length"
            inline
          />
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="ui.tab">
        <v-tabs-window-item eager value="info">
          <picking-info-tab :pedido="pedido" :pedido-info="pedidoInfo" />
        </v-tabs-window-item>

        <v-tabs-window-item eager value="productos">
          <picking-productos-tab
            ref="productosTabRef"
            :creando-facturacion="creandoFacturacion"
            :pendientes="pendientes"
            :tomados="tomados"
            @codigo-ingresado="onCodigoIngresado"
            @crear-facturacion="onCrearFacturacion"
            @quitar="devolverAPendientes"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import { pedidoService } from '@/api/services/pedidoService'
  import { pickingService } from '@/api/services/pickingService'
  import { usePicking } from '@/modules/logistica/composables/picking/usePicking'
  import { $confirm } from '@/plugins/confirm/confirm'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { unwrapApiData } from '@/shared/utils/unwrapApiData'
  import ConfirmarPickDialog from './ConfirmarPickDialog.vue'
  import PickingInfoTab from './tabs/PickingInfoTab.vue'
  import PickingProductosTab from './tabs/PickingProductosTab.vue'

  const props = defineProps({
    modelValue: Boolean,
    // Fila del pedido seleccionada en la tabla de "Pendientes" (Id, Pedido, Cliente, Total, FechaDocumento, ...)
    pedido: { type: Object, default: null },
  })

  const emit = defineEmits(['update:modelValue', 'created'])

  const {
    pedidoInfo,
    pendientes,
    tomados,
    hydrate,
    reset,
    buscarPendientesPorCodigo,
    confirmarPick,
    devolverAPendientes,
  } = usePicking()

  const uiInitial = { tab: 'info' }
  const ui = ref({ ...uiInitial })

  const productosTabRef = ref(null)

  // ─── Confirmar pick: cantidad encontrada + validación de lote ────────────
  const pickConfirmDialog = ref({ open: false, pendientes: [] })

  // ─── Crear facturación (POST /order-settlements/create) con lo tomado ────
  const creandoFacturacion = ref(false)

  const dialogTitle = computed(() =>
    props.pedido?.Pedido ? `Picking: ${props.pedido.Pedido}` : 'Picking de pedido',
  )

  async function cargarPedido() {
    if (!props.pedido?.Id) return

    $loading.show()
    try {
      const response = await pedidoService.getPedidoPickingInfo(props.pedido.Id)
      const data = unwrapApiData(response, null)
      if (!data) {
        $toast.error('No se pudo obtener la información de picking del pedido')
        return
      }
      hydrate(props.pedido.Id, data)
    } catch (error) {
      console.error('Error cargando información de picking:', error)
      $toast.error('Error al cargar la información de picking del pedido')
    } finally {
      $loading.hide()
    }
  }

  // ─── Búsqueda rápida de pickeo: escaneo o digitado ────────────────────────
  function onCodigoIngresado(codigo) {
    const candidatos = buscarPendientesPorCodigo(codigo)
    if (candidatos.length === 0) {
      $toast.error(`No se encontró un producto pendiente con el código "${codigo}".`)
      return
    }
    abrirPickConfirm(candidatos)
  }

  function abrirPickConfirm(pendientes) {
    pickConfirmDialog.value = { open: true, pendientes }
  }

  /**
   * Valida contra el backend (GET /order-settlements/validate-picking) que la
   * combinación producto + ubicación + código de lote sea la realmente
   * asignada al pedido: la validación del lote ya no la hace el front.
   */
  async function loteCoincideConPedido({ idProducto, idUbicacion, codigoLote }) {
    try {
      const response = await pickingService.validatePickingMatch({
        IdPedidoOrigen: pedidoInfo.value.IdTransaccion,
        IdProducto: idProducto,
        IdUbicacion: idUbicacion,
        CodigoLote: codigoLote,
      })
      const data = unwrapApiData(response, {})
      return !!data.Coincide
    } catch (error) {
      console.error('Error validando el lote del picking:', error)
      return false
    }
  }

  async function onConfirmPick({ idDetalle, cantidad, lote }) {
    const pendiente = pendientes.value.find((p) => p.IdDetalle === idDetalle)
    if (!pendiente) {
      $toast.error('Esta línea ya no está pendiente por tomar.')
      return
    }

    $loading.show()
    let coincide = false
    try {
      coincide = await loteCoincideConPedido({
        idProducto: pendiente.IdProducto,
        idUbicacion: pendiente.IdUbicacion,
        codigoLote: lote,
      })
    } finally {
      $loading.hide()
    }
    if (!coincide) {
      $toast.error('El lote que intentas pickear no es el mismo del pedido.')
      return
    }

    const resultado = confirmarPick({ idDetalle, cantidad })
    if (!resultado.success) {
      $toast.error(resultado.message)
      return
    }

    pickConfirmDialog.value = { open: false, pendientes: [] }
    $toast.success(
      resultado.tomado
        ? `${resultado.item.CodigoProducto}: ${resultado.cantidad} unidad(es) tomada(s)`
        : `${resultado.item.CodigoProducto}: no se tomó ninguna unidad`,
    )
    // Vuelve el foco al buscador para encadenar el siguiente escaneo sin usar el mouse.
    nextTick(() => productosTabRef.value?.focusCodigo())
  }

  function describirRecorte(linea) {
    const producto =
      linea.NombreProducto || linea.CodigoNombreProducto || linea.Producto || 'Producto'
    const pedida = linea.CantidadPedida ?? linea.CantidadSolicitada ?? null
    const facturada = linea.CantidadFacturada ?? linea.CantidadDespachada ?? null
    if (pedida !== null && facturada !== null) {
      return `${producto}: pediste ${pedida}, se facturaron ${facturada} por falta de stock`
    }
    return producto
  }

  async function onCrearFacturacion() {
    if (tomados.value.length === 0) return

    const confirmado = await $confirm.confirm({
      title: '¿Crear facturación?',
      message: `Se creará una facturación para el pedido <strong>${pedidoInfo.value.Pedido}</strong> sobre ${tomados.value.length} línea(s).`,
      labelConfirm: 'Sí, facturar',
      labelCancel: 'Cancelar',
    })
    if (!confirmado) return

    creandoFacturacion.value = true
    $loading.show()
    try {
      const res = await pickingService.createFacturacion({
        IdPedidoOrigen: pedidoInfo.value.IdTransaccion,
        detalles: tomados.value.map((item) => ({
          IdDetalle: item.IdDetalle,
          Cantidad: item.Cantidad,
        })),
      })
      const data = unwrapApiData(res, {})
      const numero = data.OrderSettlement ? `${data.OrderSettlement} ` : ''
      $toast.success(
        data.EstadoPedidoOrigen === 'Facturado'
          ? `Facturación ${numero}creada: el pedido quedó totalmente facturado`
          : `Facturación parcial ${numero}creada exitosamente`,
      )
      if (Array.isArray(data.LineasRecortadas) && data.LineasRecortadas.length > 0) {
        for (const linea of data.LineasRecortadas) {
          $toast.warning(describirRecorte(linea))
        }
      }
      emit('created')
      emit('update:modelValue', false)
    } catch (error) {
      console.error('Error al crear la facturación:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al crear la facturación')
      }
    } finally {
      creandoFacturacion.value = false
      $loading.hide()
    }
  }

  function resetDialog() {
    reset()
    ui.value = { ...uiInitial }
    pickConfirmDialog.value = { open: false, pendientes: [] }
  }

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        cargarPedido()
      } else {
        resetDialog()
      }
    },
  )

  function onClose(value) {
    emit('update:modelValue', value)
  }
</script>

<style scoped></style>
