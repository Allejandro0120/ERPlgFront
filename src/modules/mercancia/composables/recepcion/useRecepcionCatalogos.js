import { ref } from 'vue'
import { infraestructuraService } from '@/api/services/infraestructuraService'
import { proveedorService } from '@/api/services/proveedorService'
import { recepcionService } from '@/api/services/recepcionService'

export function useRecepcionCatalogos() {
  const estadosCatalogo = ref([])
  const proveedores = ref([])
  const cedis = ref([])
  const bodegas = ref([])

  // ─── Precarga para modo lectura: garantiza que el item actual aparezca en el select ───

  function setCatalogosLectura(acta) {
    if (!acta) return

    if (acta.IdEstado != null && !estadosCatalogo.value.some((e) => e.IdEstado === acta.IdEstado)) {
      estadosCatalogo.value = [
        { IdEstado: acta.IdEstado, Nombre: acta.NombreEstado },
        ...estadosCatalogo.value,
      ]
    }

    if (
      acta.IdProveedor != null &&
      !proveedores.value.some((p) => p.IdProveedor === acta.IdProveedor)
    ) {
      proveedores.value = [
        { IdProveedor: acta.IdProveedor, Nombre: acta.NombreProveedor },
        ...proveedores.value,
      ]
    }

    if (acta.IdCedi) {
      cedis.value = [{ IdCedi: acta.IdCedi, NombreCedi: acta.NombreCedi }]
    }

    if (acta.IdBodega) {
      bodegas.value = [{ IdBodega: acta.IdBodega, NombreBodega: acta.NombreBodega }]
    }
  }

  // ─── Loaders individuales ─────────────────────────────────────────────────

  async function cargarEstados() {
    const res = await recepcionService.getRecepcionEstados()
    estadosCatalogo.value = res.data?.success ? res.data.data || [] : []
  }

  async function cargarProveedores() {
    const res = await proveedorService.getProveedores()
    const lista = res.data?.success ? res.data.data?.data || [] : []
    proveedores.value = lista.map((p) => ({
      IdProveedor: p.IdProveedor,
      Nombre: `${p.NumeroIdentificacion} - ${p.Nombre}`,
    }))
  }

  async function cargarCedis() {
    const res = await infraestructuraService.getCedis()
    const raw = res.data?.success ? res.data.data || [] : []
    cedis.value = raw.map((item) => ({
      IdCedi: item.IdCedi ,
      NombreCedi: item.NombreCedi ,
    }))
  }

  // ─── Carga en paralelo con reporte de fallos ──────────────────────────────

  async function cargarCatalogos() {
    const jobs = [
      {
        key: 'estadosCatalogo',
        run: cargarEstados,
        fallback: () => {
          estadosCatalogo.value = []
        },
      },
      {
        key: 'proveedores',
        run: cargarProveedores,
        fallback: () => {
          proveedores.value = []
        },
      },
      {
        key: 'cedis',
        run: cargarCedis,
        fallback: () => {
          cedis.value = []
        },
      },
    ]

    const results = await Promise.allSettled(jobs.map((j) => j.run()))
    const failed = []

    for (const [i, result] of results.entries()) {
      if (result.status === 'rejected') {
        jobs[i].fallback()
        failed.push(jobs[i].key)
        console.error(`[RecepcionCatalogos] Error cargando ${jobs[i].key}:`, result.reason)
      }
    }

    return { ok: failed.length === 0, failed }
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
