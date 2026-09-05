<template>
  <base-dialog
    color="primary"
    icon="mdi-beaker-outline"
    label-confirm="Guardar"
    max-width="550"
    :model-value="modelValue"
    title="Nueva Concentración"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row class="mt-1" density="compact">
          <v-col cols="12">
            <v-text-field
              v-model="form.Valor"
              clearable
              label="Valor"
              maxlength="20"
              prepend-inner-icon="mdi-numeric"
              required
              :rules="[rules.required]"
              variant="outlined"
              @input="form.Valor = sanitizeInput(form.Valor, allow.onlyDigits)"
              @keydown="blockKey($event, allow.onlyDigits)"
              @paste="blockPaste($event, allow.onlyDigits)"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.Unidad"
              clearable
              label="Unidad"
              maxlength="100"
              prepend-inner-icon="mdi-beaker-outline"
              required
              :rules="[rules.required]"
              variant="outlined"
              @input="form.Unidad = sanitizeInput(form.Unidad, allow.onlyLettersNoAccents)"
              @keydown="blockKey($event, allow.onlyLettersNoAccents)"
              @paste="blockPaste($event, allow.onlyLettersNoAccents)"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { mercanciaService } from '@/api/services/mercanciaService.js'
  import { $confirm } from '@/plugins/confirm/confirm.js'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/dialogs/BaseDialog.vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
  })
  const isReadonly = computed(() => false)

  const emit = defineEmits(['update:modelValue', 'created'])

  const formRef = ref(null)
  const formInitial = { Valor: '', Unidad: '' }
  const form = ref({ ...formInitial })

  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        form.value = { ...formInitial }
        formRef.value?.resetValidation()
      }
    },
  )
  // ── Cerrar con confirmación si hay datos ingresados ───────────────────────
  const hasChanges = computed(() => !!form.value.Codigo?.trim() || !!form.value.Nombre?.trim())

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: $confirm.warning,
    title: 'Cancelar creación',
    message: '¿Deseas salir? Los datos ingresados se perderán.',
    labelConfirm: 'Sí, salir',
    labelCancel: 'Continuar editando',
  })

  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores en los campos marcados')

      return
    }

    const confirmed = await $confirm.warning({
      title: 'Confirmar creación',
      message: `¿Deseas crear la concentración <strong>"${form.value.Valor} ${form.value.Unidad}</strong>?`,
      labelConfirm: 'Sí, crear',
      labelCancel: 'Cancelar',
    })
    if (!confirmed) return

    $loading.show('Creando Concentración...')
    try {
      const payload = {
        Valor: form.value.Valor.trim(),
        Unidad: form.value.Unidad.trim(),
      }
      const response = await mercanciaService.concentracion.createConcentracion(payload)
      if (response.data?.success) {
        mercanciaService.concentracion.invalidateConcentracionesCache()
        $toast.success('Concentración creada exitosamente')
        emit('created')
        emit('update:modelValue', false)
      } else {
        $toast.error(response.data?.message || 'No se pudo crear la concentración')
      }
    } catch (error) {
      console.error('Error creando concentración:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al crear la concentración')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
