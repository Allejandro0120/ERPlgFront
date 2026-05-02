import { computed, ref } from 'vue'
import { clienteService } from '@/api/services/clienteService'
import { globalService } from '@/api/services/globalService'
import { mercanciaService } from '@/api/services/mercanciaService'

export function useClienteCatalogos() {
  const tipoDocumentos = ref([])
  const listaPrecios = ref([])
  const actividadesCiiu = ref([])
  const departamentos = ref([])
  const estadosCatalogo = ref([])
  const tiposCorreos = ref([])

  const ciuuConNa = computed(() => [
    { display: 'N/A', Codigo: null, IdCiiu: null },
    ...actividadesCiiu.value,
  ])

  const setCatalogosLectura = (cliente) => {
    if (cliente.IdTipoDocumento) {
      tipoDocumentos.value = [
        {
          IdTipoDocumento: cliente.IdTipoDocumento,
          display: cliente.NombreTipoDocumento,
        },
      ]
    }
    if (cliente.IdListaPrecio) {
      listaPrecios.value = [
        {
          IdListaPrecio: cliente.IdListaPrecio,
          display: cliente.NombreListaPrecio,
        },
      ]
    }
    if (cliente.IdCiiu) {
      actividadesCiiu.value = [{ IdCiiu: cliente.IdCiiu, display: cliente.NombreCiiu }]
    }
    const depSet = new Map()

    if (cliente.IdDepartamento && cliente.NombreDepartamento) {
      depSet.set(cliente.IdDepartamento, {
        IdDepartamento: cliente.IdDepartamento,
        NombreDepartamento: cliente.NombreDepartamento,
      })
    }

    for (const s of cliente.sucursales || []) {
      if (s.IdDepartamento && !depSet.has(s.IdDepartamento)) {
        depSet.set(s.IdDepartamento, {
          IdDepartamento: s.IdDepartamento,
          NombreDepartamento: s.NombreDepartamento,
        })
      }
    }

    departamentos.value = Array.from(depSet.values())
    if (cliente.IdEstado !== undefined && cliente.IdEstado !== null) {
      estadosCatalogo.value = [{ IdClienteEstado: cliente.IdEstado, Nombre: cliente.NombreEstado }]
    }

    const uniqueTiposCorreos = new Map()
    for (const c of cliente.correos || []) {
      if (c.IdTipoCorreo && !uniqueTiposCorreos.has(c.IdTipoCorreo)) {
        uniqueTiposCorreos.set(c.IdTipoCorreo, {
          IdTipoCorreo: c.IdTipoCorreo,
          Descripcion: c.TipoCorreo,
        })
      }
    }
    tiposCorreos.value = Array.from(uniqueTiposCorreos.values())
  }

  const cargarTiposDocumentos = async () => {
    const response = await globalService.getTiposDocumentos()
    tipoDocumentos.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.Codigo} - ${item.Nombre}`,
        }))
      : []
  }
  const cargarListaPrecios = async () => {
    const response = await mercanciaService.getListasPrecios()
    listaPrecios.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: item.NombreLista,
        }))
      : []
  }

  const cargarActividadCiiu = async () => {
    const response = await globalService.getActividadesCiiu()
    actividadesCiiu.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.Codigo} - ${item.Descripcion}`,
        }))
      : []
  }

  const cargarDepartamentos = async () => {
    const response = await globalService.getDepartamentos()
    departamentos.value = response.data?.success ? response.data.data || [] : []
  }

  const cargarEstados = async () => {
    const response = await clienteService.getEstados()
    estadosCatalogo.value = response.data?.success ? response.data.data || [] : []
  }

  const cargarTiposCorreos = async () => {
    const response = await clienteService.getTiposCorreos()
    tiposCorreos.value = response.data?.success ? response.data.data || [] : []
  }

  const cargarCatalogos = async () => {
    const jobs = [
      {
        key: 'tiposDocumentos',
        run: cargarTiposDocumentos,
        fallback: () => {
          tipoDocumentos.value = []
        },
      },
      {
        key: 'listaPrecios',
        run: cargarListaPrecios,
        fallback: () => {
          listaPrecios.value = []
        },
      },
      {
        key: 'actividadesCiiu',
        run: cargarActividadCiiu,
        fallback: () => {
          actividadesCiiu.value = []
        },
      },
      {
        key: 'departamentos',
        run: cargarDepartamentos,
        fallback: () => {
          departamentos.value = []
        },
      },
      {
        key: 'estadosCatalogo',
        run: cargarEstados,
        fallback: () => {
          estadosCatalogo.value = []
        },
      },
      {
        key: 'tiposCorreos',
        run: cargarTiposCorreos,
        fallback: () => {
          tiposCorreos.value = []
        },
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

  return {
    tipoDocumentos,
    listaPrecios,
    departamentos,
    estadosCatalogo,
    tiposCorreos,
    ciuuConNa,
    cargarCatalogos,
    setCatalogosLectura,
  }
}
