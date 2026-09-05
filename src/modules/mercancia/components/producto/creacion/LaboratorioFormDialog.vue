<template>
  <base-dialog
    color="primary"
    icon="mdi-flask"
    label-confirm="Guardar"
    max-width="550"
    :model-value="modelValue"
    title="Nuevo Laboratorio"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row class="mt-1" density="compact">
          <v-col cols="12">
            <v-text-field
              v-model="form.Codigo"
              clearable
              label="Código"
              maxlength="20"
              prepend-inner-icon="mdi-identifier"
              required
              :rules="[rules.required]"
              variant="outlined"
              @keydown="blockKey($event, allow.alphanumericDash)"
              @paste="blockPaste($event, allow.alphanumericDash)"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.Nombre"
              clearable
              label="Nombre"
              maxlength="100"
              prepend-inner-icon="mdi-flask"
              required
              :rules="[rules.required]"
              variant="outlined"
              @keydown="blockKey($event, allow.alphanumericDashDot)"
              @paste="blockPaste($event, allow.alphanumericDashDot)"
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
  const formInitial = { Codigo: '', Nombre: '' }
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
      message: `¿Deseas crear el laboratorio <strong>"${form.value.Nombre}"</strong> con el código <strong>${form.value.Codigo}</strong>?`,
      labelConfirm: 'Sí, crear',
      labelCancel: 'Cancelar',
    })
    if (!confirmed) return

    $loading.show('Creando Laboratorio...')
    try {
      const payload = {
        Codigo: form.value.Codigo.trim(),
        Nombre: form.value.Nombre.trim(),
      }
      const response = await mercanciaService.laboratorio.createLaboratorio(payload)
      if (response.data?.success) {
        mercanciaService.laboratorio.invalidateLaboratoriosCache()
        $toast.success('Laboratorio creado exitosamente')
        emit('created')
        emit('update:modelValue', false)
      } else {
        $toast.error(response.data?.message || 'No se pudo crear el laboratorio')
      }
    } catch (error) {
      console.error('Error creando laboratorio:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al crear el laboratorio')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
