import api from '@/api/axios'
import { withCache } from '@/api/utils/apiCache'

export const infraestructuraService = {
  /**
   * Obtiene la lista de centros de distribución
   */
  getCedis: () => withCache('cedis_list', () => api.get('v1/infraestructure/distribution-centers')),

  /**
   *  Obtiene la lista de bodegas asociadas a un centro de distribución
   * @param {*} IdDistributionCenter  Id del centro de distribución
   */
  getBodegasByCedi: (IdDistributionCenter) =>
    withCache(`cedis_${IdDistributionCenter}_warehouses`, () =>
      api.get(`v1/infraestructure/distribution-centers/${IdDistributionCenter}/warehouses`),
    ),

  /**
   * Obtiene la lista de zonas asociadas a una bodega
   * @param {*} IdWarehouse Id de la bodega
   */
  getZonasByBodega: (IdWarehouse) =>
    withCache(`bodega_${IdWarehouse}_zones`, () =>
      api.get(`v1/infraestructure/warehouses/${IdWarehouse}/zones`),
    ),

  /**
   * Obtiene la lista de pasillos asociadas a una zona
   * @param {*} IdZone  Id de la zona
   */
  getPasillosByZona: (IdZone) =>
    withCache(`zona_${IdZone}_pasillos`, () => api.get(`infraestructure/zones/${IdZone}/aisles`)),

  /**
   *  Obtiene la lista de estantes asociadas a un pasillo
   * @param {*} IdPasillo  Id del pasillo
   */
  getEstantesByPasillo: (IdPasillo) =>
    withCache(`pasillo_${IdPasillo}_estantes`, () =>
      api.get(`infraestructure/aisles/${IdPasillo}/shelves`),
    ),

  /**
   * Obtiene la ubicación asociada a un estante
   * @param {*} IdEstante  Id del estante
   */
  getUbicacionByEstante: (IdEstante) =>
    withCache(`estante_${IdEstante}_ubicacion`, () =>
      api.get(`infraestructure/shelves/${IdEstante}/location`),
    ),
}
