# Convenciones de nombres y ubicación de archivos

Este documento describe cómo se nombra y dónde se ubica cada tipo de archivo en
`src/`, a partir de los patrones ya presentes en el código. Sirve como
referencia al crear archivos nuevos.

## Resumen rápido

| Tipo de archivo                       | Carpeta                                       | Convención de nombre                                                  | Ejemplo                                                    |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Servicio de API                       | `src/api/services/`                           | `{entidad}Service.js` (camelCase)                                     | `cotizacionService.js`                                     |
| Handler de API                        | `src/api/handlers/`                           | `{nombre}.js` (camelCase)                                             | `authCodes.js`                                             |
| Middleware de API                     | `src/api/middleware/`                         | `{nombre}Middleware.js`                                               | `authMiddleware.js`                                        |
| Utilidad de la capa API               | `src/api/utils/`                              | `{nombre}.js` (camelCase)                                             | `apiCache.js`                                              |
| Rutas de un módulo                    | `src/modules/{modulo}/`                       | `{modulo}Routes.js`                                                   | `mercanciaRoutes.js`                                       |
| Vista (página) de un módulo           | `src/modules/{modulo}/views/`                 | `{Entidad}ListView.vue` (PascalCase)                                  | `RecepcionesListView.vue`                                  |
| Componente de dominio                 | `src/modules/{modulo}/components/{entidad}/`  | `{Entidad}Dialog.vue`, `{Entidad}{Cosa}FormDialog.vue`                | `CotizacionDialog.vue`, `RecepcionProveedorFormDialog.vue` |
| Tab de un diálogo                     | `.../components/{entidad}/tabs/`              | `{Entidad}{Tab}Tab.vue`                                               | `RecepcionInfoTab.vue`                                     |
| Composable de un módulo               | `src/modules/{modulo}/composables/{entidad}/` | `use{Entidad}{Cosa}.js`                                               | `useRecepcionDetalles.js`                                  |
| Utilidad específica de un módulo      | `src/modules/{modulo}/utils/`                 | `{nombre}.js` (camelCase)                                             | `recepcionMock.js`                                         |
| Componente UI genérico                | `src/shared/ui/`                              | `{Nombre}.vue` (PascalCase, prefijo `Base` si es un wrapper genérico) | `BaseTable.vue`, `DateRangeFilter.vue`                     |
| Utilidad reutilizable entre módulos   | `src/shared/utils/`                           | `{nombre}.js` (camelCase, sustantivo/verbo descriptivo)               | `fileDownload.js`, `dateFormatter.js`                      |
| Composable reutilizable entre módulos | `src/shared/composables/`                     | `use{Cosa}.js`                                                        | `useConfirmRequestClose.js`                                |
| Store de Pinia                        | `src/stores/`                                 | `use{Nombre}Store.js`                                                 | `authStore.js` (exporta `useAuthStore`)                    |
| Plugin de Vue                         | `src/plugins/{plugin}/`                       | `{plugin}.js` + `Global{Plugin}.vue` (si tiene UI)                    | `plugins/loading/loading.js`, `GlobalLoading.vue`          |
| Layout                                | `src/layout/`                                 | `{Nombre}Layout.vue`                                                  | `DefaultLayout.vue`                                        |
| Componente de layout                  | `src/layout/components/`                      | `{Nombre}.vue` (PascalCase)                                           | `AppSidebar.vue`                                           |

## Reglas generales

1. **`.vue` en PascalCase, `.js` en camelCase.** Sin excepciones detectadas en
   el código actual.
2. **Carpetas de dominio en minúscula y singular** (`cliente/`, `cotizacion/`,
   `recepcion/`), tanto dentro de `components/` como de `composables/`. Los
   módulos de negocio (`modules/*`) sí usan plural o el nombre del dominio tal
   cual (`cartera`, `comercial`, `facturacion`, `mercancia`).
3. **Un archivo de rutas por módulo**, nombrado `{modulo}Routes.js` en la raíz
   del módulo (no dentro de una subcarpeta), y registrado luego en
   `src/router/index.js`.
4. **Composables siempre empiezan con `use`** seguido del nombre en
   PascalCase (`useRecepcionCatalogos`, `useClienteSucursales`).
5. **Servicios de API terminan en `Service.js`** y agrupan todas las llamadas
   axios de una entidad (`cotizacionService.js` para todo lo de cotizaciones).
   No se crean funciones sueltas de API fuera de un service.
6. **`shared/` vs `modules/{modulo}/`**: si el código lo usa o podría usarlo
   más de un módulo (formateo, validaciones, descarga de archivos, utils de
   fecha/moneda), va en `shared/`. Si es específico de un dominio (p. ej.
   mocks de recepciones), va dentro del `utils/` o `composables/` del propio
   módulo.
7. **Diálogos de formulario terminan en `Dialog.vue`** (`{Entidad}Dialog.vue`
   para el diálogo principal de creación/edición, `{Entidad}{Cosa}FormDialog.vue`
   para sub-formularios dentro de ese diálogo, ej. añadir un producto a una
   recepción).
8. **Vistas de listado terminan en `ListView.vue`** y viven únicamente en
   `views/` del módulo correspondiente.

## Validación del estado actual

Se recorrió todo `src/` verificando estas convenciones (vistas sin sufijo
`View.vue`, servicios sin sufijo `Service.js`, composables sin prefijo `use`,
stores sin sufijo `Store.js`, componentes que no empiezan en mayúscula). No se
encontraron archivos que rompan el patrón — el código existente ya es
consistente con lo documentado arriba.

## Ejemplo aplicado: `fileDownload.js`

La utilidad de descarga de archivos (`downloadBlobResponse` /
`downloadPdfResponse`) se ubicó en `src/shared/utils/fileDownload.js` porque:

- Es una función pura sin estado ni dependencia de un componente específico.
- La usan vistas de **tres módulos distintos** (`mercancia` y `facturacion`),
  lo que la califica como reutilizable entre módulos y no específica de uno
  solo.
- Sigue el mismo patrón que `currencyFormatter.js` y `dateFormatter.js`:
  nombre en camelCase describiendo qué hace, sin sufijo de tipo.
