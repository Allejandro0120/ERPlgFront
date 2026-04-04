/**
 * api/services/clienteService.js
 * Servicio para gestionar operaciones de cartera (clientes)
 */

import api from "@/api/axios";
import { withCache } from "@/api/utils/cache";

export const clienteService = {
  /**
   * Obtiene lista de clientes con paginación y filtros
   * @param {number} page - Número de página
   * @param {number} limit - Cantidad de registros por página
   * @param {string} search - Término de búsqueda
   * @param {string} sortBy - Campo para ordenamiento
   * @param {string} sortOrder - Orden (asc/desc)
   * @param {object} filters - Filtros adicionales
   */
  getClientes: (
    page = 1,
    limit = 10,
    search = "",
    sortBy = "",
    sortOrder = "asc",
    filters = {},
  ) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
      ...filters,
    });

    return api.get(`v1/clients/list?${params.toString()}`);
  },

  /**
   * Obtiene un cliente por su ID
   * @param {number} IdCliente - ID del cliente
   */
  getClienteById: (IdCliente) => api.get(`v1/clients/getunique/${IdCliente}`),

  /**
   * Crea un nuevo cliente
   * @param {object} clienteData - Datos del cliente
   */
  createCliente: (clienteData) => api.post("v1/clients/create", clienteData),

  /**
   * Actualiza un cliente existente
   * @param {object} updateData - Datos a actualizar (debe incluir IdCliente)
   */
  updateCliente: (updateData) => api.put("v1/clients/update", updateData),

  /**
   * Obtiene los estados posibles de un cliente (Petición Cacheada de manera Global)
   */
  getEstados: () =>
    withCache("clientes_estados", () => api.get("v1/clients/states")),

  /**
   * Obtiene los tipos de correos posibles para un cliente (Petición Cacheada de manera Global)
   */
  getTiposCorreos: () =>
    withCache("clientes_tipos_correos", () =>
      api.get("v1/clients/email-types")
    ),
};
