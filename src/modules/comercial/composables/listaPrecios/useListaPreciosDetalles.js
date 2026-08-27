import { computed, ref } from 'vue'
import { $confirm } from '@/plugins/confirm/confirm'
import { $toast } from '@/plugins/toast'
import {
  getChangedCollectionPayload,
  hasCollectionChanges,
} from '@/shared/composables/useChangePayload'
import { formatCOP, parseCOP } from '@/shared/utils/currencyFormatter'
import { pickFields } from '@/shared/utils/objectUtils'

// CAMPOS PARA LA API
const PRODUCTO_PATCH_FIELDS = ['PrecioBase', 'PorcentajeDescuentoMaximo']

// CAMPOS DE DISPLAY (solo para mostrar, no van en payloads ni snapshots)
const PRODUCTO_DISPLAY_FIELDS = ['CodigoProducto', 'NombreProducto', 'CodigoNombreProducto']
// CAMPOS PARA SNAPSHOT (incluye IdProducto para detectar creados)
const PRODUCTO_SNAPSHOT_FIELDS = ['IdDetalleListaPrecio', 'IdProducto', ...PRODUCTO_PATCH_FIELDS]

const PRODUCTO_DEFAULTS = {
  IdDetalleListaPrecio: null,
  IdProducto: null,
  PrecioBase: 0,
  PorcentajeDescuentoMaximo: 0,
}

export function useListaPreciosDetalles() {
  let localDetalleCounter = 0

  const detalles = ref([])
  const detallesSnapshot = ref([])

  // ─── Transformadores ─────────────────────────────────────────────────────────
  function apiDetalleToLocal(api) {
    return {
      LocalId: ++localDetalleCounter,
      ...pickFields(api, PRODUCTO_SNAPSHOT_FIELDS, PRODUCTO_DEFAULTS),
      ...pickFields(api, PRODUCTO_DISPLAY_FIELDS),
      PrecioBase: formatCOP(api.PrecioBase ?? 0),
    }
  }

  // Serializa un item local a valores comparables/enviables (numéricos)
  function detalleSerializable(detalle) {
    return {
      ...pickFields(detalle, PRODUCTO_SNAPSHOT_FIELDS, PRODUCTO_DEFAULTS),
      PrecioBase: parseCOP(detalle.PrecioBase) ?? 0,
      PorcentajeDescuentoMaximo: Number(detalle.PorcentajeDescuentoMaximo) || 0,
    }
  }

  const headers = computed(() => [
    { title: 'Producto', key: 'CodigoNombreProducto', sortable: false, searchable: true },
    { title: 'Precio Base', key: 'PrecioBase', align: 'center', sortable: false, width: '220px' },
    {
      title: 'Descuento Máx.',
      key: 'PorcentajeDescuentoMaximo',
      align: 'center',
      sortable: false,
      width: '160px',
    },
  ])

  // ─── Mutaciones de lista  ───────────────────────────────────────────────────
  function agregarProducto(producto) {
    if (!producto?.IdProducto) return

    const yaExiste = detalles.value.some((d) => d.IdProducto === producto.IdProducto)
    if (yaExiste) {
      $toast.warning('Este producto ya fue agregado a la lista de precios.')
      return
    }

    detalles.value.push({
      LocalId: ++localDetalleCounter,
      IdDetalleListaPrecio: null,
      IdProducto: producto.IdProducto,
      CodigoProducto: producto.CodigoProducto ?? '',
      NombreProducto: producto.NombreProducto ?? '',
      CodigoNombreProducto:
        producto.CodigoNombreProducto ??
        [producto.CodigoProducto, producto.NombreProducto].filter(Boolean).join(' - '),
      PrecioBase: formatCOP(0),
      PorcentajeDescuentoMaximo: 0,
    })
  }

  function eliminarProducto(LocalId) {
    const detalle = detalles.value.find((d) => d.LocalId === LocalId)
    const nombre = detalle?.CodigoNombreProducto || 'este producto'

    $confirm
      .warning({
        title: '¿Eliminar producto?',
        message: `Se eliminará el producto <strong>${nombre}</strong> de la lista de precios.`,
        labelConfirm: 'Sí, eliminar',
        labelCancel: 'Cancelar',
      })
      .then((confirmado) => {
        if (confirmado) {
          detalles.value = detalles.value.filter((d) => d.LocalId !== LocalId)
        }
      })
  }

  function hydrateDetalles(apiDetalles = []) {
    const locales = Array.isArray(apiDetalles) ? apiDetalles.map((d) => apiDetalleToLocal(d)) : []

    detalles.value = locales
    detallesSnapshot.value = locales.map((d) => detalleSerializable(d))
  }

  function setDetallesSnapshot(snapshot = []) {
    detallesSnapshot.value = snapshot
  }

  function resetDetalles() {
    detalles.value = []
    detallesSnapshot.value = []
  }

  function hasDetallesChanges() {
    return hasCollectionChanges(detalles.value, detallesSnapshot.value, detalleSerializable)
  }

  function getDetallesChanges() {
    const serializedCurrent = detalles.value.map((d) => detalleSerializable(d))
    const currentIds = new Set(
      serializedCurrent.filter((d) => d.IdDetalleListaPrecio).map((d) => d.IdDetalleListaPrecio),
    )

    // Elementos eliminados (presentes en snapshot pero no en current)
    const deleted = (detallesSnapshot.value || [])
      .filter((item) => item.IdDetalleListaPrecio && !currentIds.has(item.IdDetalleListaPrecio))
      .map((item) => ({ IdDetalleListaPrecio: item.IdDetalleListaPrecio, Eliminar: true }))

    // Elementos creados/modificados
    const changes = getChangedCollectionPayload({
      currentList: serializedCurrent,
      snapshotList: detallesSnapshot.value,
      idKey: 'IdDetalleListaPrecio',
      patchFields: PRODUCTO_PATCH_FIELDS,
      toCreatePayload: (item) => ({
        IdProducto: item.IdProducto,
        PrecioBase: item.PrecioBase,
        PorcentajeDescuentoMaximo: item.PorcentajeDescuentoMaximo,
      }),
      toFallbackPayload: (item) => ({
        IdDetalleListaPrecio: item.IdDetalleListaPrecio,
        IdProducto: item.IdProducto,
        PrecioBase: item.PrecioBase,
        PorcentajeDescuentoMaximo: item.PorcentajeDescuentoMaximo,
      }),
    })

    return [...changes, ...deleted]
  }

  return {
    detalles,
    detallesSnapshot,
    headers,
    agregarProducto,
    eliminarProducto,
    hydrateDetalles,
    setDetallesSnapshot,
    resetDetalles,
    hasDetallesChanges,
    getDetallesChanges,
  }
}
