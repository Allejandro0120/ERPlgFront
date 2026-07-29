<template>
  <base-dialog
    color="primary"
    icon="mdi-truck"
    label-confirm="Guardar"
    max-width="550"
    :model-value="modelValue"
    title="Nuevo Proveedor"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef" @submit.prevent>
        <v-row class="mt-1" density="compact">
          <v-col cols="12">
            <v-select
              v-model="form.IdTipoIdentificacion"
              item-title="display"
              item-value="IdTipoIdentificacion"
              :items="tipoIdentificaciones"
              label="Tipo de Identificación"
              :loading="loadingTipos"
              prepend-inner-icon="mdi-card-account-details-outline"
              required
              :rules="[rules.required]"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.NumeroIdentificacion"
              label="Número de Identificación"
              maxlength="20"
              prepend-inner-icon="mdi-identifier"
              required
              :rules="[rules.required]"
              variant="outlined"
              @keydown="blockKey($event, allow.numericWithDash)"
              @paste="blockPaste($event, allow.numericWithDash)"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.Nombre"
              label="Nombre / Razón Social"
              maxlength="200"
              prepend-inner-icon="mdi-domain"
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
  import { globalService } from '@/api/services/globalService'
  import { proveedorService } from '@/api/services/proveedorService.js'
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

  const emit = defineEmits(['update:modelValue', 'created'])

  // ── Estado ────────────────────────────────────────────────────────────────
  const formRef = ref(null)
  const tipoIdentificaciones = ref([])
  const loadingTipos = ref(false)

  const formInitial = { IdTipoIdentificacion: null, NumeroIdentificacion: '', Nombre: '' }
  const form = ref({ ...formInitial })
  const isReadonly = computed(() => false)

  // ── Catalogos ─────────────────────────────────────────────────────────────
  async function cargarTiposIdentificaciones() {
    loadingTipos.value = true
    try {
      const response = await globalService.getTiposIdentificaciones()
      tipoIdentificaciones.value = response.data?.success
        ? (response.data.data || []).map((item) => ({
            ...item,
            display: `${item.Codigo} - ${item.Nombre}`,
          }))
        : []
    } catch (error) {
      console.error('Error cargando tipos de identificación:', error)
      tipoIdentificaciones.value = []
    } finally {
      loadingTipos.value = false
    }
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────
  watch(
    () => props.modelValue,
    (isOpen) => {
      if (isOpen) {
        form.value = { ...formInitial }
        formRef.value?.resetValidation()
        cargarTiposIdentificaciones()
      }
    },
  )

  // ── Cerrar con confirmación si hay datos ingresados ───────────────────────
  const hasChanges = computed(
    () =>
      !!form.value.IdTipoIdentificacion ||
      !!form.value.NumeroIdentificacion?.trim() ||
      !!form.value.Nombre?.trim(),
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
  // ── Guardar ───────────────────────────────────────────────────────────────
  async function submitForm() {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.warning('Por favor completa todos los campos requeridos correctamente')
      return
    }

    const confirmed = await $confirm.warning({
      title: 'Confirmar creación',
      message: `¿Deseas crear el proveedor <strong>"${form.value.Nombre}"</strong> con el documento <strong>${form.value.NumeroIdentificacion}</strong>?`,
      labelConfirm: 'Sí, crear',
      labelCancel: 'Cancelar',
    })
    if (!confirmed) return

    $loading.show('Creando proveedor...')
    try {
      const payload = {
        IdTipoIdentificacion: form.value.IdTipoIdentificacion,
        NumeroIdentificacion: form.value.NumeroIdentificacion.trim(),
        Nombre: form.value.Nombre.trim(),
      }
      const response = await proveedorService.createProveedor(payload)
      if (response.data?.success) {
        proveedorService.invalidateProveedoresCache()
        $toast.success('Proveedor creado exitosamente')
        emit('created')
        emit('update:modelValue', false)
      } else {
        $toast.error(response.data?.message || 'No se pudo crear el proveedor')
      }
    } catch (error) {
      console.error('Error creando proveedor:', error)
      if (!error._toastShown) {
        $toast.error('Error inesperado al crear el proveedor')
      }
    } finally {
      $loading.hide()
    }
  }
</script>
