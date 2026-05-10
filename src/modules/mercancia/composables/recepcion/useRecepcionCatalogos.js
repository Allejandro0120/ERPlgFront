import { ref } from 'vue'
import { proveedorService } from '@/api/services/proveedorService'
import { recepcionService } from '@/api/services/recepcionService'
import { infraestructuraService } from '@/api/services/infraestructuraService'

export function useRecepcionCatalogos() {
  const estadosCatalogo = ref([])
  const proveedores = ref([])
  const cedis = ref([])
  const bodegas = ref([])

  const setCatalogosLectura = (acta) => {
    if (!acta) {
      return
    }

    if (
      acta.IdEstado !== undefined &&
      acta.IdEstado !== null && // ensure at least the actual estado is present for read-only views
      !estadosCatalogo.value.some((e) => e.IdEstado === acta.IdEstado)
    ) {
      estadosCatalogo.value = [
        { IdEstado: acta.IdEstado, Nombre: acta.NombreEstado },
        ...estadosCatalogo.value,
      ]
    }

    if (
      acta.IdProveedor !== undefined &&
      acta.IdProveedor !== null &&
      !proveedores.value.some((p) => p.IdProveedor === acta.IdProveedor)
    ) {
      proveedores.value = [
        { IdProveedor: acta.IdProveedor, Nombre: acta.NombreProveedor },
        ...proveedores.value,
      ]
    }

    if (acta.IdCedi) {
      cedis.value = [{ IdCedi: acta.IdCedi, Nombre: acta.NombreCedi }]
    }

    if (acta.IdBodega) {
      bodegas.value = [{ IdBodega: acta.IdBodega, NombreBodega: acta.NombreBodega }]
    }
  }

  const cargarCatalogos = async () => {
    const jobs = [
      {
        key: 'estadosCatalogo',
        run: cargarEstados,
        fallback: () => (estadosCatalogo.value = []),
      },
      {
        key: 'proveedores',
        run: cargarProveedores,
        fallback: () => (proveedores.value = []),
      },
      {
        key: 'cedis',
        run: cargarCedis,
        fallback: () => (cedis.value = []),
      },
    ]
    const results = await Promise.allSettled(jobs.map((job) => job.run()))
    const failed = []

    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        jobs[index].fallback()
        failed.push(jobs[index].key)
      }
    }

    return {
      ok: failed.length === 0,
      failed,
    }
  }

  const cargarProveedores = async () => {
    try {
      const response = await proveedorService.getProveedores()
      proveedores.value = response.data?.success
        ? response.data.data.map((p) => ({
            IdProveedor: p.IdProveedor,
            Nombre: `${p.NumeroIdentificacion} - ${p.NombreProveedor}`,
          }))
        : []
    } catch {
      proveedores.value = []
    }
  }
  const cargarEstados = async () => {
    try {
      const res = await recepcionService.getRecepcionestadosCatalogo()
      estadosCatalogo.value = res.data?.success ? res.data.data || [] : []
    } catch {
      estadosCatalogo.value = []
    }
  }

  const cargarCedis = async () => {
    try {
      const res = await infraestructuraService.getCedis()
      const raw = res.data?.success ? res.data.data || [] : []
      cedis.value = raw.map((item) => ({
        IdCedi: item.IdCedi ?? item.IdDistributionCenter ?? item.IdDistribucion ?? item.id,
        Nombre: item.Nombre ?? item.Name ?? item.NombreCedi ?? item.name,
      }))
    } catch {
      cedis.value = []
    }
  }

  return {
    estadosCatalogo,
    proveedores,
    cedis,
    bodegas,
    cargarCatalogos,
    setCatalogosLectura,
  }
}
