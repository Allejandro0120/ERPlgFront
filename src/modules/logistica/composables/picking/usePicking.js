import { ref } from 'vue'

const PEDIDO_INFO_DEFAULTS = {
  IdTransaccion: null,
  Pedido: '',
  IdCedi: null,
  NombreCedi: '',
  Usuario: '',
  Observaciones: '',
}

function buildPendienteItem(detalle) {
  return {
    IdDetalle: detalle.IdDetalle,
    IdProducto: detalle.IdProducto,
    CodigoProducto: detalle.CodigoProducto ?? '',
    NombreProducto: detalle.NombreProducto ?? '',
    CodigoBarras: detalle.CodigoBarras ?? '',
    Cantidad: Number(detalle.Cantidad) || 0,
    IdUbicacion: detalle.IdUbicacion ?? null,
    CodigoUbicacion: detalle.CodigoUbicacion ?? '',
  }
}

/**
 * Estado y flujo de picking de un pedido: productos pendientes por tomar y
 * productos ya tomados (por pistola de código de barras EAN13 o digitando el
 * código manualmente). Por ahora es un flujo solo de front: no persiste nada
 * en el backend, solo mueve cantidades entre las dos tablas.
 */
export function usePicking() {
  let localTomadoCounter = 0

  const pedidoInfo = ref({ ...PEDIDO_INFO_DEFAULTS })
  const pendientes = ref([])
  const tomados = ref([])

  function hydrate(idTransaccion, pickingInfo) {
    pedidoInfo.value = {
      IdTransaccion: idTransaccion,
      Pedido: pickingInfo?.Pedido ?? '',
      IdCedi: pickingInfo?.IdCedi ?? null,
      NombreCedi: pickingInfo?.NombreCedi ?? '',
      Usuario: pickingInfo?.Usuario ?? '',
      Observaciones: pickingInfo?.Observaciones ?? '',
    }
    pendientes.value = (pickingInfo?.Detalles ?? []).map((detalle) => buildPendienteItem(detalle))
    tomados.value = []
  }

  function reset() {
    pedidoInfo.value = { ...PEDIDO_INFO_DEFAULTS }
    pendientes.value = []
    tomados.value = []
  }

  /**
   * Busca en pendientes por código de barras (lectura de pistola), código de
   * producto o nombre de producto (digitado manualmente) — la barra de
   * búsqueda rápida usa esto para ubicar la(s) línea(s) antes de pedir
   * cantidad/lote. Si el producto encontrado tiene pendientes en más de una
   * ubicación (líneas distintas), se devuelven todas para que el usuario
   * elija la ubicación desde la que está pickeando.
   */
  function buscarPendientesPorCodigo(codigo) {
    const term = String(codigo ?? '').trim()
    if (!term) return []
    const termLower = term.toLowerCase()

    const match =
      pendientes.value.find((p) => p.CodigoBarras && p.CodigoBarras === term) ??
      pendientes.value.find((p) => p.CodigoProducto && p.CodigoProducto === term) ??
      pendientes.value.find((p) => p.NombreProducto?.toLowerCase().includes(termLower)) ??
      null

    if (!match) return []
    if (!match.CodigoProducto) return [match]

    return pendientes.value.filter((p) => p.CodigoProducto === match.CodigoProducto)
  }

  function moverATomados(pendiente, cantidad) {
    const cantidadAMover = Math.min(cantidad, pendiente.Cantidad)
    if (cantidadAMover <= 0) return

    const tomadoExistente = tomados.value.find((t) => t.IdDetalle === pendiente.IdDetalle)
    if (tomadoExistente) {
      tomadoExistente.Cantidad += cantidadAMover
    } else {
      tomados.value.push({ ...pendiente, LocalId: ++localTomadoCounter, Cantidad: cantidadAMover })
    }

    pendiente.Cantidad -= cantidadAMover
    if (pendiente.Cantidad <= 0) {
      pendientes.value = pendientes.value.filter((p) => p.IdDetalle !== pendiente.IdDetalle)
    }
  }

  /**
   * Confirma el pick de una línea pendiente: exige la cantidad físicamente
   * encontrada (puede ser menor a la pendiente, incluso 0, pero nunca mayor).
   * La validación del lote ya se hizo contra el backend antes de llamar esta
   * función — ver PickingDialog.onConfirmPick. No mueve nada a "tomados" si
   * la validación de cantidad falla, para que el usuario pueda corregir y
   * reintentar.
   */
  function confirmarPick({ idDetalle, cantidad }) {
    const pendiente = pendientes.value.find((p) => p.IdDetalle === idDetalle)
    if (!pendiente) {
      return { success: false, message: 'Esta línea ya no está pendiente por tomar.' }
    }

    const cantidadNum = Number(String(cantidad ?? '').replace(',', '.'))
    if (Number.isNaN(cantidadNum) || cantidadNum < 0) {
      return { success: false, message: 'Ingresa una cantidad válida.' }
    }
    if (cantidadNum > pendiente.Cantidad) {
      return {
        success: false,
        message: `La cantidad no puede ser mayor a la pendiente (${pendiente.Cantidad}).`,
      }
    }

    if (cantidadNum === 0) {
      return { success: true, tomado: false, item: pendiente }
    }

    moverATomados(pendiente, cantidadNum)
    return { success: true, tomado: true, item: pendiente, cantidad: cantidadNum }
  }

  /**
   * Deshace una toma: devuelve la cantidad de una línea de "tomados" a "pendientes".
   */
  function devolverAPendientes(localId) {
    const tomado = tomados.value.find((t) => t.LocalId === localId)
    if (!tomado) return

    const pendienteExistente = pendientes.value.find((p) => p.IdDetalle === tomado.IdDetalle)
    if (pendienteExistente) {
      pendienteExistente.Cantidad += tomado.Cantidad
    } else {
      pendientes.value.push(buildPendienteItem(tomado))
    }

    tomados.value = tomados.value.filter((t) => t.LocalId !== localId)
  }

  return {
    pedidoInfo,
    pendientes,
    tomados,
    hydrate,
    reset,
    buscarPendientesPorCodigo,
    confirmarPick,
    devolverAPendientes,
  }
}
