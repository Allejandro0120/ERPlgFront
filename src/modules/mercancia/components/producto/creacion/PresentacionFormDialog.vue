<template>
  <base-dialog
    color="primary"
    icon="mdi-package-variant-closed"
    label-confirm="Guardar"
    max-width="550"
    :model-value="modelValue"
    title="Nueva Presentación"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row class="mt-1" density="compact">
          <v-col cols="12">
            <v-text-field
              hint="Se genera automáticamente"
              label="Nombre"
              :model-value="nombrePresentacion"
              persistent-hint
              prepend-inner-icon="mdi-label-outline"
              readonly
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.Empaque"
              class="mt-3"
              clearable
              label="Empaque"
              maxlength="20"
              prepend-inner-icon="mdi-identifier"
              required
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.Cantidad"
              clearable
              label="Cantidad"
              prepend-inner-icon="mdi-counter"
              required
              :rules="[rules.required]"
              type="number"
              variant="outlined"
              @keydown="blockKey($event, allow.onlyDigits)"
              @paste="blockPaste($event, allow.onlyDigits)"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.UnidadContenido"
              clearable
              label="Unidad de Contenido"
              maxlength="50"
              prepend-inner-icon="mdi-package-variant"
              required
              :rules="[rules.required]"
              variant="outlined"
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
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { allow, blockKey, blockPaste } from '@/shared/utils/inputKeyFilter'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
  })
  const isReadonly = computed(() => false)

  const emit = defineEmits(['update:modelValue', 'created'])

  const formRef = ref(null)
  const formInitial = { Empaque: '', Cantidad: null, UnidadContenido: '' }
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
  const hasChanges = computed(
    () =>
      !!form.value.Empaque?.trim() || !!form.value.Cantidad || !!form.value.UnidadContenido?.trim(),
  )

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

  const nombrePresentacion = computed(() => {
    const { Empaque, Cantidad, UnidadContenido } = form.value

    if (!Empaque && !Cantidad && !UnidadContenido) return ''

    return `${Empaque || ''} X ${Cantidad || ''} ${UnidadContenido || ''}`.trim()
  })
  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores en los campos marcados')

      return
    }

    const confirmed = await $confirm.warning({
      title: 'Confirmar creación',
      message: `¿Deseas crear la presentación <strong>"${nombrePresentacion.value}"?`,
      labelConfirm: 'Sí, crear',
      labelCancel: 'Cancelar',
    })
    if (!confirmed) return

    $loading.show('Creando Presentación...')
    try {
      const payload = {
        Empaque: form.value.Empaque.trim(),
        Cantidad: form.value.Cantidad,
        UnidadContenido: form.value.UnidadContenido.trim(),
      }
      const response = await mercanciaService.presentacion.createPresentacion(payload)
      if (response.data?.success) {
        mercanciaService.presentacion.invalidatePresentacionesCache()
        $toast.success('Presentación creada exitosamente')
        emit('created')
        emit('update:modelValue', false)
      } else {
        $toast.error(response.data?.message || 'No se pudo crear la presentación')
      }
    } catch (error) {
      console.error('Error creando presentación:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al crear la presentación')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
