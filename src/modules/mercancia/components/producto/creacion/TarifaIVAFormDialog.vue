<template>
  <base-dialog
    color="primary"
    icon="mdi-percent"
    label-confirm="Guardar"
    max-width="550"
    :model-value="modelValue"
    title="Nueva Tarifa IVA"
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
              v-model="form.Descripcion"
              clearable
              label="Descripción"
              maxlength="100"
              prepend-inner-icon="mdi-text-box"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.Porcentaje"
              clearable
              label="Porcentaje"
              maxlength="10"
              prepend-inner-icon="mdi-percent"
              required
              :rules="[rules.required, rules.maxValue(100)]"
              variant="outlined"
              @keydown="blockKey($event, allow.onlyDigitsAndDot)"
              @paste="blockPaste($event, allow.onlyDigitsAndDot)"
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
  const formInitial = { Codigo: '', Descripcion: '', Porcentaje: null }
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
      !!form.value.Codigo?.trim() ||
      !!form.value.Descripcion?.trim() ||
      form.value.Porcentaje !== null,
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

  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores en los campos marcados')

      return
    }

    const confirmed = await $confirm.warning({
      title: 'Confirmar creación',
      message: `¿Deseas crear la tarifa de IVA <strong>"${form.value.Porcentaje}%"</strong> con el código <strong>${form.value.Codigo}</strong>?`,
      labelConfirm: 'Sí, crear',
      labelCancel: 'Cancelar',
    })
    if (!confirmed) return

    $loading.show('Creando Tarifa de IVA...')
    try {
      const payload = {
        Codigo: form.value.Codigo.trim(),
        Descripcion: form.value.Descripcion.trim(),
        Porcentaje: form.value.Porcentaje,
      }
      const response = await mercanciaService.tarifaIVA.createTarifaIVA(payload)
      if (response.data?.success) {
        mercanciaService.tarifaIVA.invalidateTarifasIVACache()
        $toast.success('Tarifa de IVA creada exitosamente')
        emit('created')
        emit('update:modelValue', false)
      } else {
        $toast.error(response.data?.message || 'No se pudo crear la tarifa de IVA')
      }
    } catch (error) {
      console.error('Error creando tarifa de IVA:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al crear la tarifa de IVA')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
