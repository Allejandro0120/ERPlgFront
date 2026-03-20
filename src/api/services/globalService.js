import api from "@/api/axios";

export const globalService = {
  /**
   * Obtiene la lista de departamentos
   */
  getDepartamentos: () => api.get("v1/global/departamentos"),

  /**
   * Obtiene la lista de municipios por departamento
   * @param {number} idDepartamento - ID del departamento
   */
  getMunicipiosByDepartamento: (idDepartamento) =>
    api.get(`v1/global/municipios/${idDepartamento}`),

  /**
   * Obtiene la lista de centros poblados por municipio
   * @param {number} idMunicipio - ID del municipio
   */
  getCentrosPobladosByMunicipio: (idMunicipio) =>
    api.get(`v1/global/centros-poblados/${idMunicipio}`),

  /**
   * Obtiene la lista de tipos de documentos
   *  */
  getTiposDocumentos: () => api.get("v1/global/tipos-documentos"),

  /**
   * Obtiene la lista de actividades CIIU
   */
  getActividadesCiiu: () => api.get("v1/global/actividades-ciiu"),
  /**
   * Obtiene las listas de precios disponibles
   */
  getListasPrecios: () => api.get("v1/global/listas-precios"),
};
