import { computed, ref } from 'vue'
import { $confirm } from '@/plugins/confirm/confirm'
import { pickFields } from '@/shared/utils/objectUtils'
import { calcularLinea } from '../../utils/calculoLinea'

const LINEA_FIELDS = [
  'IdProducto',
  'CodigoProducto',
  'NombreProducto',
  'CodigoNombreProducto',
  'Controlado',
  'CadenaFrio',
  'Regulado',
  'PrecioUnitario',
  'PorcentajeDescuento',
  'PorcentajeDescuentoMaximo',
  'PorcentajeIva',
  'Observacion',
]

const LINEA_DEFAULTS = {
  IdProducto: null,
  CodigoProducto: '',
  NombreProducto: '',
  CodigoNombreProducto: '',
  Controlado: false,
  CadenaFrio: false,
  Regulado: false,
  PrecioUnitario: 0,
  PorcentajeDescuento: 0,
  PorcentajeDescuentoMaximo: null,
  PorcentajeIva: 0,
  Observacion: '',
}

/**
 * Cantidad total ya tomada del inventario para un producto agrupado.
 */
export function cantidadTomada(producto) {
  return (producto?.Tomas ?? []).reduce((acc, toma) => acc + (Number(toma.Cantidad) || 0), 0)
}

export function calcularTotalesProducto(producto) {
  return calcularLinea({
    Cantidad: cantidadTomada(producto),
    PrecioUnitario: producto?.PrecioUnitario,
    PorcentajeDescuento: producto?.PorcentajeDescuento,
    PorcentajeIva: producto?.PorcentajeIva,
  })
}

/**
 * Productos agrupados de un pedido "libre" (creado desde cero) o de un pedido ya
 * existente en modo lectura (de cualquier origen). A diferencia de usePedidoAsignaciones,
 * aquí no hay una cantidad cotizada previa: el usuario elige libremente qué productos
 * agregar, cuánto tomar de cada lote/ubicación, y puede declarar a mano cuánto queda
 * faltante (incluyendo productos sin ninguna toma, cantidad 0).
 */
export function usePedidoProductosLibre() {
  let localLineaCounter = 0

  const lineas = ref([])
  const lineaDialog = ref({ open: false, mode: 'create', localId: null })

  // Agrupa las filas planas que devuelve el backend (una por combinación producto +
  // lote + ubicación, más una fila sin ubicación cuando queda un remanente 100%
  // pendiente) en un producto por IdProducto, para mostrarlas ya agrupadas en modo vista.
  function hydrateLineas(apiDetalles = []) {
    const grupos = new Map()

    for (const detalle of apiDetalles ?? []) {
      const idProducto = detalle.IdProducto
      if (!grupos.has(idProducto)) {
        const codigoNombre =
          detalle.CodigoNombreProducto ??
          [detalle.CodigoProducto, detalle.NombreProducto].filter(Boolean).join(' - ')
        grupos.set(idProducto, {
          LocalId: ++localLineaCounter,
          IdProducto: idProducto,
          CodigoProducto: detalle.CodigoProducto ?? '',
          NombreProducto: detalle.NombreProducto ?? '',
          CodigoNombreProducto: codigoNombre,
          Controlado: !!detalle.Controlado,
          CadenaFrio: !!detalle.CadenaFrio,
          Regulado: !!detalle.Regulado,
          PrecioUnitario: Number(detalle.PrecioUnitario) || 0,
          PorcentajeDescuento: Number(detalle.PorcentajeDescuento) || 0,
          PorcentajeIva: Number(detalle.PorcentajeIva) || 0,
          Observacion: detalle.Observacion || '',
          Tomas: [],
          CantidadFaltante: 0,
          // IdDetalle de la(s) fila(s) sin ubicación que traen el faltante del pedido
          // original (normalmente una sola). Se usa solo en modo edición.
          FaltanteDetalleIds: [],
          // Solo vienen del back al ver un pedido ya creado (GET /orders/unique)
          CantidadDespachada: 0,
          CantidadPendiente: 0,
        })
      }

      const producto = grupos.get(idProducto)
      producto.CantidadDespachada += Number(detalle.CantidadDespachada) || 0
      producto.CantidadPendiente += Number(detalle.CantidadPendiente) || 0
      if (detalle.IdUbicacion == null) {
        producto.CantidadFaltante += Number(detalle.CantidadFaltante) || 0
        if (detalle.IdDetalle) producto.FaltanteDetalleIds.push(detalle.IdDetalle)
      } else {
        producto.Tomas.push({
          IdDetalle: detalle.IdDetalle,
          IdLote: detalle.IdLote,
          CodLote: detalle.CodLote,
          IdUbicacion: detalle.IdUbicacion,
          CodigoUbicacion: detalle.CodigoUbicacion,
          Cantidad: Number(detalle.Cantidad) || 0,
        })
      }
    }

    lineas.value = [...grupos.values()]
  }

  function resetLineas() {
    lineas.value = []
    lineaDialog.value = { open: false, mode: 'create', localId: null }
  }

  const lineaActual = computed(
    () => lineas.value.find((linea) => linea.LocalId === lineaDialog.value.localId) ?? null,
  )

  function abrirAgregar() {
    lineaDialog.value = { open: true, mode: 'create', localId: null }
  }

  function abrirPorLocalId(localId, mode) {
    if (!lineas.value.some((linea) => linea.LocalId === localId)) return
    lineaDialog.value = { open: true, mode, localId }
  }

  function cerrarLineaDialog() {
    lineaDialog.value = { open: false, mode: 'create', localId: null }
  }

  // Filtra del catálogo los productos que ya están agregados: para tomar más stock o
  // cambiar el faltante de un producto ya agregado se usa "Editar" sobre su fila.
  function productosDisponiblesParaAgregar(catalogo = []) {
    const usados = new Set(lineas.value.map((linea) => linea.IdProducto))
    return catalogo.filter((producto) => !usados.has(producto.IdProducto))
  }

  function agregarProducto(datos) {
    lineas.value.push({
      LocalId: ++localLineaCounter,
      ...pickFields(datos, LINEA_FIELDS, LINEA_DEFAULTS),
      Tomas: datos.Tomas ?? [],
      CantidadFaltante: Number(datos.CantidadFaltante) || 0,
    })
    cerrarLineaDialog()
  }

  function editarProducto(localId, cambios) {
    const idx = lineas.value.findIndex((linea) => linea.LocalId === localId)
    if (idx === -1) return
    lineas.value[idx] = {
      ...lineas.value[idx],
      ...pickFields(cambios, LINEA_FIELDS, LINEA_DEFAULTS),
      Tomas: cambios.Tomas ?? lineas.value[idx].Tomas,
      CantidadFaltante:
        cambios.CantidadFaltante === undefined
          ? lineas.value[idx].CantidadFaltante
          : Number(cambios.CantidadFaltante) || 0,
    }
    cerrarLineaDialog()
  }

  function eliminarProducto(localId) {
    const producto = lineas.value.find((linea) => linea.LocalId === localId)
    const nombre = producto?.CodigoNombreProducto || 'este producto'

    $confirm
      .warning({
        title: '¿Eliminar producto?',
        message: `Se eliminará <strong>${nombre}</strong> del pedido.`,
        labelConfirm: 'Sí, eliminar',
        labelCancel: 'Cancelar',
      })
      .then((confirmado) => {
        if (confirmado) {
          lineas.value = lineas.value.filter((linea) => linea.LocalId !== localId)
        }
      })
  }

  const totales = computed(() =>
    lineas.value.reduce(
      (acc, producto) => {
        const valores = calcularTotalesProducto(producto)
        acc.subtotal += valores.subtotal
        acc.descuentoTotal += valores.valorDescuento
        acc.valorIva += valores.valorIva
        return acc
      },
      { subtotal: 0, descuentoTotal: 0, valorIva: 0 },
    ),
  )

  const unidadesFaltantes = computed(() =>
    lineas.value.reduce((acc, producto) => acc + (Number(producto.CantidadFaltante) || 0), 0),
  )

  /**
   * Aplana los productos agrupados a los detalles que espera POST /v1/orders/create,
   * igual forma que orderService.resolveDetallesData del back: una fila por toma
   * (producto + lote + ubicación), y una fila adicional sin ubicación (Cantidad 0)
   * cuando el producto no tiene ninguna toma pero sí un faltante declarado. Cuando el
   * producto sí tiene tomas, el faltante declarado viaja en una sola de ellas (la
   * última) para que el back no lo duplique.
   */
  function buildDetallesPayload() {
    return lineas.value.flatMap((producto) => {
      const tomas = producto.Tomas ?? []
      const faltante = Number(producto.CantidadFaltante) || 0
      const base = {
        IdProducto: producto.IdProducto,
        PrecioUnitario: Number(producto.PrecioUnitario) || 0,
        PorcentajeDescuento: Number(producto.PorcentajeDescuento) || 0,
        ...(producto.Observacion ? { Observacion: producto.Observacion } : {}),
      }

      if (tomas.length === 0) {
        return [{ ...base, Cantidad: 0, CantidadFaltante: faltante }]
      }

      return tomas.map((toma, idx) => ({
        ...base,
        Cantidad: Number(toma.Cantidad) || 0,
        IdUbicacion: toma.IdUbicacion,
        IdLote: toma.IdLote,
        ...(faltante > 0 && idx === tomas.length - 1 ? { CantidadFaltante: faltante } : {}),
      }))
    })
  }

  /**
   * Aplana los productos agrupados a los detalles que espera PUT /v1/orders/update,
   * comparando contra el snapshot del pedido tal como se cargó al abrir el diálogo
   * (lineasLibresSnapshot en PedidoDialog). A diferencia de buildDetallesPayload (crear),
   * cada fila existente debe viajar con su IdDetalle para que el back la actualice en vez
   * de duplicarla, y las tomas/faltantes que el usuario quitó deben viajar como
   * { IdDetalle, Eliminar: true }. El back fuerza CantidadFaltante a 0 en cualquier fila
   * que tenga ubicación (ver clasificarDetallesEdicion en orderService), así que el
   * faltante siempre va en su propia fila sin ubicación, nunca adjunto a una toma.
   */
  function buildDetallesPayloadEdit(snapshot = []) {
    const detalles = []

    // Productos que estaban en el pedido original y ya no están: eliminar todas sus filas.
    for (const original of snapshot) {
      const sigueExistiendo = lineas.value.some((linea) => linea.IdProducto === original.IdProducto)
      if (sigueExistiendo) continue
      const idsOriginales = [
        ...(original.Tomas ?? []).map((toma) => toma.IdDetalle).filter(Boolean),
        ...(original.FaltanteDetalleIds ?? []),
      ]
      for (const idDetalle of idsOriginales) detalles.push({ IdDetalle: idDetalle, Eliminar: true })
    }

    for (const producto of lineas.value) {
      const original = snapshot.find((linea) => linea.IdProducto === producto.IdProducto)
      const tomasOriginalesIds = new Set(
        (original?.Tomas ?? []).map((toma) => toma.IdDetalle).filter(Boolean),
      )
      const faltanteOriginalIds = original?.FaltanteDetalleIds ?? []

      const base = {
        IdProducto: producto.IdProducto,
        PrecioUnitario: Number(producto.PrecioUnitario) || 0,
        PorcentajeDescuento: Number(producto.PorcentajeDescuento) || 0,
        ...(producto.Observacion ? { Observacion: producto.Observacion } : {}),
      }

      const tomas = producto.Tomas ?? []
      const tomasActualesIds = new Set(tomas.map((toma) => toma.IdDetalle).filter(Boolean))

      // Tomas que existían en el pedido y el usuario quitó (o movió de lote/ubicación).
      for (const idDetalle of tomasOriginalesIds) {
        if (!tomasActualesIds.has(idDetalle))
          detalles.push({ IdDetalle: idDetalle, Eliminar: true })
      }

      // Tomas actuales: actualiza la existente (trae IdDetalle reconocido) o agrega una nueva.
      for (const toma of tomas) {
        const esExistente = toma.IdDetalle && tomasOriginalesIds.has(toma.IdDetalle)
        detalles.push({
          ...base,
          Cantidad: Number(toma.Cantidad) || 0,
          IdUbicacion: toma.IdUbicacion,
          IdLote: toma.IdLote,
          ...(esExistente ? { IdDetalle: toma.IdDetalle } : {}),
        })
      }

      // Faltante: siempre en su propia fila sin ubicación.
      const faltante = Number(producto.CantidadFaltante) || 0
      const [idFaltanteExistente, ...idsFaltanteSobrantes] = faltanteOriginalIds
      if (faltante > 0) {
        detalles.push({
          ...base,
          Cantidad: 0,
          CantidadFaltante: faltante,
          ...(idFaltanteExistente ? { IdDetalle: idFaltanteExistente } : {}),
        })
        for (const idExtra of idsFaltanteSobrantes)
          detalles.push({ IdDetalle: idExtra, Eliminar: true })
      } else if (idFaltanteExistente) {
        for (const idDetalle of faltanteOriginalIds)
          detalles.push({ IdDetalle: idDetalle, Eliminar: true })
      }
    }

    return detalles
  }

  return {
    lineas,
    lineaDialog,
    lineaActual,
    hydrateLineas,
    resetLineas,
    abrirAgregar,
    abrirPorLocalId,
    cerrarLineaDialog,
    productosDisponiblesParaAgregar,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    totales,
    unidadesFaltantes,
    buildDetallesPayload,
    buildDetallesPayloadEdit,
  }
}
