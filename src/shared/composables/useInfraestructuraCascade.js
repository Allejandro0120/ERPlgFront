import { ref } from 'vue'

function extractData(response) {
  if (response?.data?.success) {
    return response.data.data || []
  }
  return []
}

/**
 * Maneja la cascada de infraestructura: Cedi -> Bodega -> Zona -> Pasillo -> Estante -> Ubicacion.
 *
 * - onXxxChange: para interacción del usuario (limpia niveles inferiores y carga el siguiente)
 * - setInfraestructuraLectura: modo view, puebla arrays con los datos ya conocidos sin hacer peticiones
 * - preloadForEdit: modo edit, carga todos los niveles en secuencia sin pisar los IDs del form
 * - preloadInfraestructura: carga bodegas de un cedi (usado en cabecera de acta)
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
  const k = keys

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

  // ─── Utilidades internas ───────────────────────────────────────────────────

  function handleError(error, stage) {
    if (typeof onError === 'function') {
      onError(error, stage)
    } else {
      console.error(`[InfraestructuraCascade] Error en ${stage}:`, error)
    }
  }

  function clearFrom(level) {
    const levels = ['idZona', 'idPasillo', 'idEstante', 'idUbicacion']
    const start = levels.indexOf(level)
    if (start === -1) return
    for (const key of levels.slice(start)) {
      form.value[k[key]] = null
      if (ui.value && k[key] in ui.value) ui.value[k[key]] = null
    }
    if (start <= 0) zonas.value = []
    if (start <= 1) pasillos.value = []
    if (start <= 2) estantes.value = []
    if (start <= 3) ubicaciones.value = []
  }

  // ─── Loaders (solo cargan el array, sin tocar el form) ────────────────────

  async function loadBodegas(idCedi) {
    bodegas.value = []
    if (!idCedi) return
    loading.value.bodegas = true
    try {
      bodegas.value = extractData(await services.getBodegasByCedi(idCedi))
      if (autoSelect && bodegas.value.length === 1) {
        form.value[k.idBodega] = bodegas.value[0].IdBodega
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
    if (!idBodega) return
    loading.value.zonas = true
    try {
      zonas.value = extractData(await services.getZonasByBodega(idBodega))
      if (autoSelect && zonas.value.length === 1) {
        form.value[k.idZona] = zonas.value[0].IdZona
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
    if (!idZona) return
    loading.value.pasillos = true
    try {
      pasillos.value = extractData(await services.getPasillosByZona(idZona))
      if (autoSelect && pasillos.value.length === 1) {
        form.value[k.idPasillo] = pasillos.value[0].IdPasillo
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
    if (!idPasillo) return
    loading.value.estantes = true
    try {
      estantes.value = extractData(await services.getEstantesByPasillo(idPasillo))
      if (autoSelect && estantes.value.length === 1) {
        form.value[k.idEstante] = estantes.value[0].IdEstante
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
    if (!idEstante) return
    loading.value.ubicaciones = true
    try {
      const data = extractData(await services.getUbicacionByEstante(idEstante))
      ubicaciones.value = Array.isArray(data) ? data : [data]
      if (autoSelect && ubicaciones.value.length === 1) {
        form.value[k.idUbicacion] = ubicaciones.value[0].IdUbicacion
      }
    } catch (error) {
      handleError(error, 'ubicaciones')
    } finally {
      loading.value.ubicaciones = false
    }
  }

  // ─── Handlers de interacción del usuario ──────────────────────────────────

  async function onCediChange(idCedi) {
    form.value[k.idBodega] = null
    if (ui.value) ui.value[k.idBodega] = null
    clearFrom('idZona')
    await loadBodegas(idCedi)
  }

  async function onBodegaChange(idBodega) {
    clearFrom('idZona')
    await loadZonas(idBodega)
  }

  async function onZonaChange(idZona) {
    clearFrom('idPasillo')
    await loadPasillos(idZona)
  }

  async function onPasilloChange(idPasillo) {
    clearFrom('idEstante')
    await loadEstantes(idPasillo)
  }

  async function onEstanteChange(idEstante) {
    const prevUbicacion = form.value[k.idUbicacion]
    form.value[k.idUbicacion] = null
    if (ui.value) ui.value[k.idEstante] = idEstante
    await loadUbicaciones(idEstante)
    // Restaurar ubicación si sigue siendo válida en el nuevo estante
    if (prevUbicacion && ubicaciones.value.some((u) => u.IdUbicacion === prevUbicacion)) {
      form.value[k.idUbicacion] = prevUbicacion
    }
  }

  // ─── Precarga para cabecera de acta (Cedi → Bodegas) ──────────────────────

  async function preloadInfraestructura({ idCedi = null, idBodega = null } = {}) {
    if (ui.value) ui.value[k.idCedi] = idCedi
    await loadBodegas(idCedi)
    form.value[k.idBodega] = idBodega
  }

  // ─── Modo lectura: puebla arrays con datos ya conocidos, sin peticiones ───

  function setInfraestructuraLectura(data) {
    // Asignar IDs al form y ui
    const ids = {
      [k.idCedi]: data.IdCedi ?? null,
      [k.idBodega]: data.IdBodega ?? null,
      [k.idZona]: data.IdZona ?? null,
      [k.idPasillo]: data.IdPasillo ?? null,
      [k.idEstante]: data.IdEstante ?? null,
      [k.idUbicacion]: data.IdUbicacion ?? null,
    }
    Object.assign(form.value, ids)
    if (ui.value) Object.assign(ui.value, ids)

    // Poblar arrays para que los selects muestren el label en lugar del ID
    if (data.IdBodega && data.NombreBodega)
      bodegas.value = [{ IdBodega: data.IdBodega, NombreBodega: data.NombreBodega }]
    if (data.IdZona && data.CodZona) zonas.value = [{ IdZona: data.IdZona, CodZona: data.CodZona }]
    if (data.IdPasillo && data.CodPasillo)
      pasillos.value = [{ IdPasillo: data.IdPasillo, CodPasillo: data.CodPasillo }]
    if (data.IdEstante && data.CodEstante)
      estantes.value = [{ IdEstante: data.IdEstante, CodEstante: data.CodEstante }]
    if (data.IdUbicacion && data.CodUbicacion)
      ubicaciones.value = [{ IdUbicacion: data.IdUbicacion, CodUbicacion: data.CodUbicacion }]
  }

  // ─── Modo edición: carga todos los niveles sin pisar el form ──────────────

  async function preloadForEdit({ idBodega, idZona, idPasillo, idEstante, idUbicacion } = {}) {
    // Cargar cada nivel en secuencia (cada uno depende del anterior)
    if (idBodega) {
      loading.value.zonas = true
      try {
        zonas.value = extractData(await services.getZonasByBodega(idBodega))
      } catch (error) {
        handleError(error, 'zonas')
      } finally {
        loading.value.zonas = false
      }
    }

    if (idZona) {
      loading.value.pasillos = true
      try {
        pasillos.value = extractData(await services.getPasillosByZona(idZona))
      } catch (error) {
        handleError(error, 'pasillos')
      } finally {
        loading.value.pasillos = false
      }
    }

    if (idPasillo) {
      loading.value.estantes = true
      try {
        estantes.value = extractData(await services.getEstantesByPasillo(idPasillo))
      } catch (error) {
        handleError(error, 'estantes')
      } finally {
        loading.value.estantes = false
      }
    }

    if (idEstante) {
      loading.value.ubicaciones = true
      try {
        const data = extractData(await services.getUbicacionByEstante(idEstante))
        ubicaciones.value = Array.isArray(data) ? data : [data]
      } catch (error) {
        handleError(error, 'ubicaciones')
      } finally {
        loading.value.ubicaciones = false
      }
    }

    // Asignar IDs al form solo cuando los arrays ya están listos
    if (idZona) form.value[k.idZona] = idZona
    if (idPasillo) form.value[k.idPasillo] = idPasillo
    if (idEstante) form.value[k.idEstante] = idEstante
    if (idUbicacion) form.value[k.idUbicacion] = idUbicacion
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

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

    if (!clearSelections) return

    const nullIds = {
      [k.idCedi]: null,
      [k.idBodega]: null,
      [k.idZona]: null,
      [k.idPasillo]: null,
      [k.idEstante]: null,
      [k.idUbicacion]: null,
    }
    if (ui.value) Object.assign(ui.value, nullIds)
    // Solo limpia los campos que gestiona este composable en el form
    form.value[k.idEstante] = null
    form.value[k.idUbicacion] = null
  }

  return {
    bodegas,
    zonas,
    pasillos,
    estantes,
    ubicaciones,
    loading,
    loadBodegas,
    loadZonas,
    loadPasillos,
    loadEstantes,
    loadUbicaciones,
    onCediChange,
    onBodegaChange,
    onZonaChange,
    onPasilloChange,
    onEstanteChange,
    preloadInfraestructura,
    setInfraestructuraLectura,
    preloadForEdit,
    resetInfraestructuraState,
  }
}
