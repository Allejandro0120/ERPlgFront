import api from "@/api/axios";
import { withCache, clearCache } from "@/api/utils/cache";

export const globalService = {
  /**
   * Obtiene la lista de departamentos (Caché en Memoria)
   */
  getDepartamentos: () =>
    withCache("departamentos", () => api.get("v1/global/departamentos")),

  /**
   * Obtiene la lista de municipios por departamento (Caché por ID)
   * @param {number} idDepartamento - ID del departamento
   */
  getMunicipiosByDepartamento: (idDepartamento) =>
    withCache(`municipios_${idDepartamento}`, () =>
      api.get(`v1/global/municipios/${idDepartamento}`),
    ),

  /**
   * Obtiene la lista de centros poblados por municipio (Caché por ID)
   * @param {number} idMunicipio - ID del municipio
   */
  getCentrosPobladosByMunicipio: (idMunicipio) =>
    withCache(`centrosN_${idMunicipio}`, () =>
      api.get(`v1/global/centros-poblados/${idMunicipio}`),
    ),

  /**
   * Obtiene la lista de tipos de documentos (Caché en Memoria)
   */
  getTiposDocumentos: () =>
    withCache("tiposDocumentos", () => api.get("v1/global/tipos-documentos")),

  /**
   * Obtiene la lista de actividades CIIU (Caché en Memoria)
   */
  getActividadesCiiu: () =>
    withCache("actividadesCiiu", () => api.get("v1/global/actividades-ciiu")),

  /**
   * Obtiene las listas de precios disponibles (Caché en Memoria)
   */
  getListasPrecios: () =>
    withCache("listasPrecios", () => api.get("v1/global/listas-precios")),

  /**
   * Limpia toda la caché almacenada (Útil para forzar actualización)
   */
  clearCache: (key) => clearCache(key),
};
