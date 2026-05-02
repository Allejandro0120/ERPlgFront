<template>
  <base-dialog
    color="primary"
    :disable-confirm="isEditing && !hasChanges"
    :icon="dialogIcon"
    :label-confirm="labelConfirm"
    max-width="800"
    :model-value="modelValue"
    :show-actions="!isReadonly"
    :title="dialogTitle"
    @accept="submitForm"
    @update:model-value="onRequestClose"
  >
    <template #content>
      <v-form ref="formRef">
        <v-row class="mt-1">
          <v-col cols="12" sm="4">
            <v-select
              id="IdTipoCorreo"
              v-model="form.IdTipoCorreo"
              :clearable="!isReadonly"
              item-title="Descripcion"
              item-value="IdTipoCorreo"
              :items="tiposCorreos"
              label="Tipo de Correo"
              name="IdTipoCorreo"
              prepend-inner-icon="mdi-tag-outline"
              :readonly="isReadonly"
              :rules="[rules.required]"
            />
          </v-col>

          <v-col cols="12" sm="8">
            <v-text-field
              id="Email"
              v-model="form.Email"
              :clearable="!isReadonly"
              label="Correo Electrónico"
              name="Email"
              prepend-inner-icon="mdi-email-outline"
              :readonly="isReadonly"
              :rules="[rules.required, rules.email]"
              type="email"
              @update:model-value="(val) => (form.Email = val?.toLowerCase())"
            />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </base-dialog>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import { $confirm } from '@/plugins/confirm/confirm.js'
  import { $toast } from '@/plugins/toast'
  import { useConfirmRequestClose } from '@/shared/composables/useConfirmRequestClose'
  import BaseDialog from '@/shared/ui/BaseDialog.vue'
  import { rules } from '@/shared/utils/validationRules'

  const props = defineProps({
    modelValue: Boolean,
    mode: {
      type: String,
      default: 'create',
      validator: v => ['create', 'edit', 'view'].includes(v),
    },
    correo: {
      type: Object,
      default: null,
    },
    tiposCorreos: {
      type: Array,
      default: () => [],
    },
  })

  const emit = defineEmits(['update:modelValue', 'submit'])

  const isReadonly = computed(() => props.mode === 'view')
  const isEditing = computed(() => props.mode === 'edit')

  const dialogTitle = computed(
    () =>
      ({
        create: 'Agregar Correo',
        edit: 'Editar Correo',
        view: 'Detalle de Correo',
      })[props.mode],
  )
  const dialogIcon = computed(
    () =>
      ({
        create: 'mdi-email-plus-outline',
        edit: 'mdi-email-edit-outline',
        view: 'mdi-email-outline',
      })[props.mode],
  )
  const labelConfirm = computed(
    () =>
      ({ create: 'Agregar Correo', edit: 'Guardar Cambios', view: '' })[
        props.mode
      ],
  )

  const formRef = ref(null)
  const formInitial = {
    IdTipoCorreo: null,
    Email: '',
  }

  const form = ref({ ...formInitial })
  const formSnapshot = ref(null)

  const hasChanges = computed(() => {
    if (!formSnapshot.value) return false
    return JSON.stringify(form.value) !== JSON.stringify(formSnapshot.value)
  })

  const { onRequestClose } = useConfirmRequestClose({
    emit,
    isReadonly,
    hasChanges,
    confirmClose: options => $confirm.warning(options),
    message:
      'Tienes cambios sin guardar en el correo. ¿Deseas salir de todas formas?',
  })

  function resetForm () {
    form.value = { ...formInitial }
    formSnapshot.value = null
    formRef.value?.resetValidation()
  }

  watch(
    () => props.modelValue,
    isOpen => {
      if (!isOpen) {
        resetForm()
        return
      }

      if (props.correo && props.mode !== 'create') {
        form.value = {
          IdTipoCorreo: props.correo.IdTipoCorreo ?? null,
          Email: props.correo.Email ?? '',
        }
      }

      formSnapshot.value = { ...form.value }
    },
  )

  async function submitForm () {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      $toast.error('Por favor corrige los errores marcados')
      return
    }

    const payload = {
      ...form.value,
      ...(props.correo?.IdCorreo ? { IdCorreo: props.correo.IdCorreo } : {}),
    }

    emit('submit', { payload, mode: props.mode })
  }
</script>
