import { ref } from 'vue'
import { mercanciaService } from '@/api/services/mercanciaService'
export function useProductoCatalogos() {
  const concentraciones = ref([])
  const formasFarmaceuticas = ref([])
  const moleculas = ref([])
  const laboratorios = ref([])
  const presentaciones = ref([])
  const tarifasIVA = ref([])

  const setCatalogosLectura = (producto) => {
    if (producto.Concentracion?.IdConcentracion) {
      concentraciones.value = [
        {
          IdConcentracion: producto.Concentracion.IdConcentracion,
          display: producto.Concentracion.Descripcion,
        },
      ]
    }
    if (producto.FormaFarmaceutica?.IdFormaFarmaceutica) {
      formasFarmaceuticas.value = [
        {
          IdFormaFarmaceutica: producto.FormaFarmaceutica.IdFormaFarmaceutica,
          display: producto.FormaFarmaceutica.NombreCompletoForma,
        },
      ]
    }
    if (producto.Molecula?.IdMolecula) {
      moleculas.value = [
        {
          IdMolecula: producto.Molecula.IdMolecula,
          display: producto.Molecula.NombreCompletoMolecula,
        },
      ]
    }
    if (producto.Laboratorio?.IdLaboratorio) {
      laboratorios.value = [
        {
          IdLaboratorio: producto.Laboratorio.IdLaboratorio,
          display: producto.Laboratorio.NombreCompletoLaboratorio,
        },
      ]
    }
    if (producto.Presentacion?.IdPresentacion) {
      presentaciones.value = [
        {
          IdPresentacion: producto.Presentacion.IdPresentacion,
          display: producto.Presentacion.Descripcion,
        },
      ]
    }
    if (producto.TarifaIVA?.IdTarifaIVA) {
      tarifasIVA.value = [
        {
          IdTarifaIVA: producto.TarifaIVA.IdTarifaIVA,
          display: `${producto.TarifaIVA.Porcentaje}%`,
        },
      ]
    }
  }

  const cargarConcentraciones = async () => {
    const response = await mercanciaService.concentracion.getConcentraciones()
    concentraciones.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.Descripcion} `,
        }))
      : []
  }

  const cargarFormasFarmaceuticas = async () => {
    const response = await mercanciaService.formaFarmaceutica.getFormasFarmaceuticas()
    formasFarmaceuticas.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.NombreCompletoForma} `,
        }))
      : []
  }

  const cargarMoleculas = async () => {
    const response = await mercanciaService.molecula.getMoleculas()
    moleculas.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.NombreCompletoMolecula} `,
        }))
      : []
  }

  const cargarLaboratorios = async () => {
    const response = await mercanciaService.laboratorio.getLaboratorios()
    laboratorios.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.NombreCompletoLaboratorio} `,
        }))
      : []
  }

  const cargarPresentaciones = async () => {
    const response = await mercanciaService.presentacion.getPresentaciones()
    presentaciones.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.Descripcion} `,
        }))
      : []
  }

  const cargarTarifasIva = async () => {
    const response = await mercanciaService.tarifaIVA.getTarifasIva()
    tarifasIVA.value = response.data?.success
      ? (response.data.data || []).map((item) => ({
          ...item,
          display: `${item.Porcentaje}%`,
        }))
      : []
  }

  const cargarCatalogos = async () => {
    const jobs = [
      {
        key: 'concentraciones',
        run: cargarConcentraciones,
        fallback: () => {
          concentraciones.value = []
        },
      },
      {
        key: 'formasFarmaceuticas',
        run: cargarFormasFarmaceuticas,
        fallback: () => {
          formasFarmaceuticas.value = []
        },
      },
      {
        key: 'moleculas',
        run: cargarMoleculas,
        fallback: () => {
          moleculas.value = []
        },
      },
      {
        key: 'laboratorios',
        run: cargarLaboratorios,
        fallback: () => {
          laboratorios.value = []
        },
      },
      {
        key: 'presentaciones',
        run: cargarPresentaciones,
        fallback: () => {
          presentaciones.value = []
        },
      },

      {
        key: 'tarifasIva',
        run: cargarTarifasIva,
        fallback: () => {
          tarifasIVA.value = []
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
    concentraciones,
    formasFarmaceuticas,
    moleculas,
    laboratorios,
    presentaciones,
    tarifasIVA,
    cargarCatalogos,
    cargarConcentraciones,
    cargarFormasFarmaceuticas,
    cargarMoleculas,
    cargarLaboratorios,
    cargarPresentaciones,
    cargarTarifasIva,
    setCatalogosLectura,
  }
}
