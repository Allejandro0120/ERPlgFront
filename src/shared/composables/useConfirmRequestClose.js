/**
 * Reutiliza el patrón de cierre con confirmación cuando hay cambios sin guardar.
 */
export function useConfirmRequestClose({
  emit,
  isReadonly,
  hasChanges,
  confirmClose,
  title = '¿Descartar cambios?',
  message = 'Tienes cambios sin guardar. ¿Deseas salir de todas formas?',
  labelConfirm = 'Sí, salir',
  labelCancel = 'Seguir editando',
  eventName = 'update:modelValue',
}) {
  async function onRequestClose(value) {
    if (!value && !isReadonly.value && hasChanges.value) {
      const confirmed = await confirmClose({
        title,
        message,
        labelConfirm,
        labelCancel,
      })

      if (!confirmed) {
        return
      }
    }

    emit(eventName, value)
  }

  return {
    onRequestClose,
  }
}
