function isEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Compara objeto actual contra snapshot y devuelve solo los campos que cambiaron.
 */
export function getChangedFields(current = {}, snapshot = {}, { normalizers = {} } = {}) {
  const changes = {}

  for (const key of Object.keys(current)) {
    const normalize = normalizers[key] || ((value) => value)
    const currentValue = normalize(current[key])
    const snapshotValue = normalize(snapshot?.[key])

    if (!isEqual(currentValue, snapshotValue)) {
      changes[key] = currentValue
    }
  }

  return changes
}

export function hasObjectChanges(current = {}, snapshot = {}, options = {}) {
  return Object.keys(getChangedFields(current, snapshot, options)).length > 0
}

/**
 * Compara colecciones serializadas para detectar cambios en UI.
 */
export function hasCollectionChanges(
  currentList = [],
  snapshotList = [],
  serializer = (item) => item,
) {
  const currentSerialized = (currentList || []).map((item) => serializer(item))
  return !isEqual(currentSerialized, snapshotList || [])
}

/**
 * Construye payload de colección enviando solo nuevos o modificados.
 */
export function getChangedCollectionPayload({
  currentList = [],
  snapshotList = [],
  idKey,
  patchFields = [],
  toCreatePayload = (item) => item,
  toFallbackPayload = (item) => item,
}) {
  const snapshotById = new Map(
    (snapshotList || []).filter((item) => !!item?.[idKey]).map((item) => [item[idKey], item]),
  )

  return (currentList || [])
    .map((current) => {
      const currentId = current?.[idKey]

      if (!currentId) {
        return toCreatePayload(current)
      }

      const original = snapshotById.get(currentId)
      if (!original) {
        return toFallbackPayload(current)
      }

      const patch = { [idKey]: currentId }
      for (const field of patchFields) {
        if (!isEqual(current[field], original[field])) {
          patch[field] = current[field]
        }
      }

      return Object.keys(patch).length > 1 ? patch : null
    })
    .filter(Boolean)
}
