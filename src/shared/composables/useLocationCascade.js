import { ref } from "vue";

function extractData(response) {
  if (response?.data?.success) {
    return response.data.data || [];
  }
  return [];
}

/**
 * Maneja la cascada Departamento -> Municipio -> Centro Poblado.
 */
export function useLocationCascade({
  ui,
  form,
  fetchMunicipios,
  fetchCentrosPoblados,
  idDepartamentoKey = "idDepartamento",
  idMunicipioKey = "idMunicipio",
  idCentroPobladoKey = "IdCentroPoblado",
  autoSelectSingleCentro = true,
  onError,
}) {
  const municipios = ref([]);
  const centrosPoblados = ref([]);
  const loadingMunicipios = ref(false);
  const loadingCentrosPoblados = ref(false);

  const handleError = (error, stage) => {
    if (typeof onError === "function") {
      onError(error, stage);
      return;
    }
    console.error(`Error en cascada de ubicacion (${stage}):`, error);
  };

  async function loadMunicipios(idDepartamento) {
    municipios.value = [];
    if (!idDepartamento) return;

    loadingMunicipios.value = true;
    try {
      const response = await fetchMunicipios(idDepartamento);
      municipios.value = extractData(response);
    } catch (error) {
      handleError(error, "municipios");
    } finally {
      loadingMunicipios.value = false;
    }
  }

  async function loadCentrosPoblados(idMunicipio, { allowAutoSelect = autoSelectSingleCentro } = {}) {
    centrosPoblados.value = [];
    if (!idMunicipio) return;

    loadingCentrosPoblados.value = true;
    try {
      const response = await fetchCentrosPoblados(idMunicipio);
      const data = extractData(response);
      centrosPoblados.value = data;

      if (allowAutoSelect && data.length === 1) {
        form.value[idCentroPobladoKey] = data[0].IdCentroPoblado;
      }
    } catch (error) {
      handleError(error, "centros-poblados");
    } finally {
      loadingCentrosPoblados.value = false;
    }
  }

  async function onDepartamentoChange(idDepartamento) {
    ui.value[idMunicipioKey] = null;
    form.value[idCentroPobladoKey] = null;
    centrosPoblados.value = [];

    await loadMunicipios(idDepartamento);
  }

  async function onMunicipioChange(idMunicipio) {
    form.value[idCentroPobladoKey] = null;
    await loadCentrosPoblados(idMunicipio);
  }

  async function preloadLocation({
    idDepartamento = null,
    idMunicipio = null,
    idCentroPoblado = null,
  } = {}) {
    ui.value[idDepartamentoKey] = idDepartamento;
    await loadMunicipios(idDepartamento);

    ui.value[idMunicipioKey] = idMunicipio;
    await loadCentrosPoblados(idMunicipio, { allowAutoSelect: false });

    form.value[idCentroPobladoKey] = idCentroPoblado;
  }

  function resetLocationState({ clearSelections = true } = {}) {
    municipios.value = [];
    centrosPoblados.value = [];
    loadingMunicipios.value = false;
    loadingCentrosPoblados.value = false;

    if (!clearSelections) return;
    ui.value[idDepartamentoKey] = null;
    ui.value[idMunicipioKey] = null;
    form.value[idCentroPobladoKey] = null;
  }

  return {
    municipios,
    centrosPoblados,
    loadingMunicipios,
    loadingCentrosPoblados,
    onDepartamentoChange,
    onMunicipioChange,
    preloadLocation,
    resetLocationState,
  };
}
