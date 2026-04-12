import api from "@/api/axios";
import { withCache, clearCache } from "@/api/utils/apiCache";

export const globalService = {
  /**
   * Obtiene la lista de departamentos (Caché en Memoria)
   */
  getDepartamentos: () =>
    withCache("departamentos", () => api.get("v1/global/departments")),

  /**
   * Obtiene la lista de municipios por departamento (Caché por ID)
   * @param {number} idDepartamento - ID del departamento
   */
  getMunicipiosByDepartamento: (idDepartamento) =>
    withCache(`municipios_${idDepartamento}`, () =>
      api.get(`v1/global/municipalities/${idDepartamento}`),
    ),

  /**
   * Obtiene la lista de centros poblados por municipio (Caché por ID)
   * @param {number} idMunicipio - ID del municipio
   */
  getCentrosPobladosByMunicipio: (idMunicipio) =>
    withCache(`centrosN_${idMunicipio}`, () =>
      api.get(`v1/global/populated-centers/${idMunicipio}`),
    ),

  /**
   * Obtiene la lista de tipos de documentos (Caché en Memoria)
   */
  getTiposDocumentos: () =>
    withCache("tiposDocumentos", () => api.get("v1/global/document-types")),

  /**
   * Obtiene la lista de actividades CIIU (Caché en Memoria)
   */
  getActividadesCiiu: () =>
    withCache("actividadesCiiu", () => api.get("v1/global/ciiu-activities")),

  /**
   * Limpia toda la caché almacenada (Útil para forzar actualización)
   */
  clearCache: (key) => clearCache(key),
};
