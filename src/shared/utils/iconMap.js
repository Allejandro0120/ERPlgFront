/**
 * Mapeo dinámico de nombres de iconos a valores SVG de @mdi/js
 * Los iconos se importan en tiempo de ejecución
 */

import * as MdiIcons from "@mdi/js";

/**
 * Convierte un nombre de icono de kebab-case a camelCase
 * Ej: "mdi-briefcase-account-outline" → "mdiBriefcaseAccountOutline"
 * @param {string} kebabName - Nombre del icono en kebab-case
 * @returns {string} Nombre en camelCase
 */
function kebabToCamelCase(kebabName) {
  return kebabName
    .split("-")
    .map((word, index) => {
      // Primera palabra "mdi" se mantiene, resto se capitalizan
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

/**
 * Obtiene el valor SVG de un icono por su nombre
 * Acepta nombres en formato kebab-case (como vienen de la BD)
 * @param {string} iconName - Nombre del icono (ej: "mdi-briefcase-account-outline")
 * @returns {string|undefined} SVG path del icono, o undefined si no existe
 */
export function getIconByName(iconName) {
  // Si no hay nombre, retornar undefined
  if (!iconName) return undefined;
  
  // Convertir de kebab-case a camelCase si es necesario
  const camelCaseName = iconName.includes("-") 
    ? kebabToCamelCase(iconName) 
    : iconName;
  
  // Buscar el icono en el módulo importado de @mdi/js
  const icon = MdiIcons[camelCaseName];
  
  if (!icon) {
    console.warn(`Icono no encontrado: "${iconName}" (${camelCaseName}). Verifica el nombre en @mdi/js`);
    return undefined;
  }

  return icon;
}

/**
 * Valida si un ícono existe en @mdi/js
 * @param {string} iconName - Nombre del icono
 * @returns {boolean}
 */
export function hasIcon(iconName) {
  return iconName in MdiIcons;
}
