import { ref } from 'vue'

function extractData(response) {
  if (response?.data?.success) {
    return response.data.data || []
  }
  return []
}

/**
 * Maneja la cascada de infraestructura: Cedi -> Bodega -> Zona -> Pasillo -> Estante.
 */
export function useInfraestructuraCascade({
  ui,
  form,
  services,
  keys = {
    idCedi: 'IdCedi',
    idBodega: 'IdBodega',
    idZona: 'IdZona',
    idPasillo: 'IdPasillo',
    idEstante: 'IdEstante',
    idUbicacion: 'IdUbicacion',
  },
  autoSelect = true,
  onError,
}) {
  const cascadeKeys = keys

  const bodegas = ref([])
  const zonas = ref([])
  const pasillos = ref([])
  const estantes = ref([])
  const ubicaciones = ref([])

  const loading = ref({
    bodegas: false,
    zonas: false,
    pasillos: false,
    estantes: false,
    ubicaciones: false,
  })

  const handleError = (error, stage) => {
    if (typeof onError === 'function') {
      onError(error, stage)
      return
    }
    console.error(`Error en cascada de infraestructura (${stage}):`, error)
  }

  async function loadBodegas(idCedi) {
    bodegas.value = []
    if (!idCedi) {
      return
    }
    loading.value.bodegas = true
    try {
      const resp = await services.getBodegasByCedi(idCedi)
      bodegas.value = extractData(resp)
      if (autoSelect && bodegas.value.length === 1) {
        form.value[cascadeKeys.idBodega] = bodegas.value[0].IdBodega
        await onBodegaChange(bodegas.value[0].IdBodega)
      }
    } catch (error) {
      handleError(error, 'bodegas')
    } finally {
      loading.value.bodegas = false
    }
  }

  async function loadZonas(idBodega) {
    zonas.value = []
    if (!idBodega) {
      return
    }
    loading.value.zonas = true
    try {
      const resp = await services.getZonasByBodega(idBodega)
      zonas.value = extractData(resp)
      if (autoSelect && zonas.value.length === 1) {
        form.value[cascadeKeys.idZona] = zonas.value[0].IdZona
        await onZonaChange(zonas.value[0].IdZona)
      }
    } catch (error) {
      handleError(error, 'zonas')
    } finally {
      loading.value.zonas = false
    }
  }

  async function loadPasillos(idZona) {
    pasillos.value = []
    if (!idZona) {
      return
    }
    loading.value.pasillos = true
    try {
      const resp = await services.getPasillosByZona(idZona)
      pasillos.value = extractData(resp)
      if (autoSelect && pasillos.value.length === 1) {
        form.value[cascadeKeys.idPasillo] = pasillos.value[0].IdPasillo
        await onPasilloChange(pasillos.value[0].IdPasillo)
      }
    } catch (error) {
      handleError(error, 'pasillos')
    } finally {
      loading.value.pasillos = false
    }
  }

  async function loadEstantes(idPasillo) {
    estantes.value = []
    if (!idPasillo) {
      return
    }
    loading.value.estantes = true
    try {
      const resp = await services.getEstantesByPasillo(idPasillo)
      estantes.value = extractData(resp)
      if (autoSelect && estantes.value.length === 1) {
        form.value[cascadeKeys.idEstante] = estantes.value[0].IdEstante
        await onEstanteChange(estantes.value[0].IdEstante)
      }
    } catch (error) {
      handleError(error, 'estantes')
    } finally {
      loading.value.estantes = false
    }
  }

  async function loadUbicaciones(idEstante) {
    ubicaciones.value = []
    if (!idEstante) {
      return
    }
    loading.value.ubicaciones = true
    try {
      const resp = await services.getUbicacionByEstante(idEstante)
      const data = extractData(resp)
      ubicaciones.value = Array.isArray(data) ? data : [data]
      if (autoSelect && ubicaciones.value.length === 1) {
        form.value[cascadeKeys.idUbicacion] = ubicaciones.value[0].IdUbicacion
      }
    } catch (error) {
      handleError(error, 'ubicaciones')
    } finally {
      loading.value.ubicaciones = false
    }
  }

  // --- Handlers de cambio ---

  async function onCediChange(idCedi) {
    ui.value[cascadeKeys.idBodega] = null
    form.value[cascadeKeys.idZona] = null
    form.value[cascadeKeys.idPasillo] = null
    form.value[cascadeKeys.idEstante] = null
    form.value[cascadeKeys.idUbicacion] = null
    zonas.value = []
    pasillos.value = []
    estantes.value = []
    ubicaciones.value = []
    await loadBodegas(idCedi)
  }

  async function onBodegaChange(idBodega) {
    ui.value[cascadeKeys.idZona] = null
    form.value[cascadeKeys.idPasillo] = null
    form.value[cascadeKeys.idEstante] = null
    form.value[cascadeKeys.idUbicacion] = null
    pasillos.value = []
    estantes.value = []
    ubicaciones.value = []
    await loadZonas(idBodega)
  }

  async function onZonaChange(idZona) {
    ui.value[cascadeKeys.idPasillo] = null
    form.value[cascadeKeys.idEstante] = null
    form.value[cascadeKeys.idUbicacion] = null
    estantes.value = []
    ubicaciones.value = []
    await loadPasillos(idZona)
  }

  async function onPasilloChange(idPasillo) {
    ui.value[cascadeKeys.idEstante] = null
    form.value[cascadeKeys.idUbicacion] = null
    estantes.value = []
    ubicaciones.value = []
    await loadEstantes(idPasillo)
  }

  async function onEstanteChange(idEstante) {
    const previousUbicacion = form.value[cascadeKeys.idUbicacion]
    ui.value[cascadeKeys.idEstante] = idEstante
    form.value[cascadeKeys.idUbicacion] = null
    await loadUbicaciones(idEstante)

    if (
      previousUbicacion &&
      ubicaciones.value.some((item) => item.IdUbicacion === previousUbicacion)
    ) {
      form.value[cascadeKeys.idUbicacion] = previousUbicacion
    }
  }

  async function preloadInfraestructura({ idCedi = null, idBodega = null } = {}) {
    ui.value[cascadeKeys.idCedi] = idCedi
    await loadBodegas(idCedi)

    form.value[cascadeKeys.idBodega] = idBodega
  }

  function setInfraestructuraLectura(data) {
    const idCedi = data.IdCedi
    const nomCedi = data.NombreCedi
    const idBodega = data.IdBodega
    const nomBodega = data.NombreBodega
    const idZona = data.IdZona
    const nomZona = data.NombreZona
    const idPasillo = data.IdPasillo
    const nomPasillo = data.NombrePasillo
    const idEstante = data.IdEstante
    const nomEstante = data.NombreEstante
    const idUbicacion = data.IdUbicacion
    const nomUbicacion = data.NombreUbicacion

    if (ui.value) {
      ui.value[cascadeKeys.idCedi] = idCedi
      ui.value[cascadeKeys.idBodega] = idBodega
      ui.value[cascadeKeys.idZona] = idZona
      ui.value[cascadeKeys.idPasillo] = idPasillo
      ui.value[cascadeKeys.idEstante] = idEstante
    }

    form.value[cascadeKeys.idCedi] = idCedi
    form.value[cascadeKeys.idBodega] = idBodega
    form.value[cascadeKeys.idZona] = idZona
    form.value[cascadeKeys.idPasillo] = idPasillo
    form.value[cascadeKeys.idEstante] = idEstante
    form.value[cascadeKeys.idUbicacion] = idUbicacion

    if (idCedi && nomCedi) {
      // In Reception we might only need these, the select takes the array
    }
    if (idBodega && nomBodega) {
      bodegas.value = [{ IdBodega: idBodega, NombreBodega: nomBodega }]
    }
    if (idZona && nomZona) {
      zonas.value = [{ IdZona: idZona, NombreZona: nomZona }]
    }
    if (idPasillo && nomPasillo) {
      pasillos.value = [{ IdPasillo: idPasillo, NombrePasillo: nomPasillo }]
    }
    if (idEstante && nomEstante) {
      estantes.value = [{ IdEstante: idEstante, NombreEstante: nomEstante }]
    }
    if (idUbicacion && nomUbicacion) {
      ubicaciones.value = [{ IdUbicacion: idUbicacion, NombreUbicacion: nomUbicacion }]
    }
  }

  function resetInfraestructuraState({ clearSelections = true } = {}) {
    bodegas.value = []
    zonas.value = []
    pasillos.value = []
    estantes.value = []
    ubicaciones.value = []
    loading.value = {
      bodegas: false,
      zonas: false,
      pasillos: false,
      estantes: false,
      ubicaciones: false,
    }

    if (!clearSelections) {
      return
    }
    ui.value[cascadeKeys.idCedi] = null
    ui.value[cascadeKeys.idBodega] = null
    ui.value[cascadeKeys.idZona] = null
    ui.value[cascadeKeys.idPasillo] = null
    ui.value[cascadeKeys.idEstante] = null
    ui.value[cascadeKeys.idUbicacion] = null
    form.value[cascadeKeys.idEstante] = null
    form.value[cascadeKeys.idUbicacion] = null
  }

  return {
    bodegas,
    zonas,
    pasillos,
    estantes,
    ubicaciones,
    loading,
    onCediChange,
    onBodegaChange,
    onZonaChange,
    onPasilloChange,
    onEstanteChange,
    preloadInfraestructura,
    setInfraestructuraLectura,
    resetInfraestructuraState,
  }
}
