<template>
  <base-dialog
    :model-value="uiStore.changePasswordDialogOpen"
    :title="isForcedPasswordChange ? 'Debes cambiar tu contraseña' : 'Cambiar contraseña'"
    icon="mdi-lock-reset"
    color="primary"
    :persistent="isForcedPasswordChange"
    max-width="600"
    :show-cancel="!isForcedPasswordChange"
    label-confirm="Actualizar contraseña"
    :disable-confirm="changingPassword"
    @update:model-value="handlePasswordDialogModelValue"
    @accept="submitChangePassword"
  >
    <template #content>
      <div class="px-2 pb-1">
        <v-alert
          v-if="isForcedPasswordChange"
          type="warning"
          variant="tonal"
          density="comfortable"
          class="mb-8"
        >
          Tu contraseña venció{{ passwordExpiryText ? ` el ${passwordExpiryText}` : '' }}.
          Debes actualizarla para continuar.
        </v-alert>

        <v-form ref="changePasswordFormRef" @submit.prevent="submitChangePassword">
          <v-text-field
            v-model="changePasswordForm.ContrasenaActual"
            label="Contraseña actual"
            placeholder="••••••••"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showCurrentPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            :type="showCurrentPassword ? 'text' : 'password'"
            autocomplete="current-password"
            :rules="passwordFieldRules.current"
            class="mb-4"
            @click:append-inner="showCurrentPassword = !showCurrentPassword"
          />

          <v-text-field
            v-model="changePasswordForm.ContrasenaNueva"
            label="Nueva contraseña"
            placeholder="••••••••"
            prepend-inner-icon="mdi-lock-reset"
            :append-inner-icon="showNewPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            :type="showNewPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :rules="passwordFieldRules.next"
            class="mb-4"
            @click:append-inner="showNewPassword = !showNewPassword"
          />

          <v-text-field
            v-model="changePasswordForm.ConfirmacionContrasena"
            label="Confirmar nueva contraseña"
            placeholder="••••••••"
            prepend-inner-icon="mdi-check-circle-outline"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            :type="showConfirmPassword ? 'text' : 'password'"
            autocomplete="new-password"
            :rules="passwordFieldRules.confirm"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          />
        </v-form>
      </div>
    </template>
  </base-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseDialog from '@/shared/ui/BaseDialog.vue'
import { authService } from '@/api/services/authService'
import { $confirm } from '@/plugins/confirm/confirm.js'
import { $loading } from '@/plugins/loading/loading'
import { $toast } from '@/plugins/toast'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { rules } from '@/shared/utils/formRules'

const authStore = useAuthStore()
const uiStore = useUiStore()
const router = useRouter()

const changingPassword = ref(false)
const changePasswordFormRef = ref(null)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const changePasswordForm = ref({
  ContrasenaActual: '',
  ContrasenaNueva: '',
  ConfirmacionContrasena: '',
})

const passwordFieldRules = {
  current: [rules.required],
  next: [
    rules.required,
    rules.passwordStrength,        
    rules.differentFrom(
      () => changePasswordForm.value.ContrasenaActual,
      'La nueva contraseña debe ser diferente a la actual',
    ),
  ],
  confirm: [
    rules.required,
    rules.matchesWith(
      () => changePasswordForm.value.ContrasenaNueva,
      'La confirmación no coincide con la nueva contraseña',
    ),
  ],
}

const isForcedPasswordChange = computed(() => uiStore.changePasswordDialogForced)

const passwordExpiryText = computed(() => {
  const value = authStore.passwordExpiryDate
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
})

watch(
  () => authStore.mustChangePassword,
  (mustChangePassword) => {
    if (mustChangePassword) {
      uiStore.openChangePasswordDialog({ forced: true })
      return
    }

    if (uiStore.changePasswordDialogForced) {
      uiStore.closeChangePasswordDialog({ force: true })
      resetChangePasswordForm()
    }
  },
  { immediate: true },
)

watch(
  () => uiStore.changePasswordDialogOpen,
  (isOpen) => {
    if (!isOpen) {
      resetChangePasswordForm()
    }
  },
)

function handlePasswordDialogModelValue(isOpen) {
  if (isOpen) {
    uiStore.openChangePasswordDialog({ forced: isForcedPasswordChange.value })
    return
  }

  uiStore.closeChangePasswordDialog()
}

function resetChangePasswordForm() {
  changePasswordForm.value = {
    ContrasenaActual: '',
    ContrasenaNueva: '',
    ConfirmacionContrasena: '',
  }

  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
  changePasswordFormRef.value?.resetValidation?.()
}

async function submitChangePassword() {
  if (changingPassword.value) return

  const { valid } = await changePasswordFormRef.value.validate()
  if (!valid) {
    $toast.error('Por favor corrige los errores en los campos marcados')
    return
  }

  const confirmed = await $confirm.confirm({
    title: '¿Guardar cambio de contraseña?',
    message:
      'Se actualizará tu contraseña y se cerrará tu sesión actual para que ingreses nuevamente.',
    labelConfirm: 'Sí, guardar',
    labelCancel: 'Cancelar',
  })
  if (!confirmed) return

  try {
    changingPassword.value = true
    $loading.show('Actualizando contraseña...')

    await authService.changePassword({
      ContrasenaActual: changePasswordForm.value.ContrasenaActual,
      ContrasenaNueva: changePasswordForm.value.ContrasenaNueva,
    })

    // Esperar 2 segundos para que el loading sea más visible
    await new Promise(resolve => setTimeout(resolve, 1000))

    $toast.success('Contraseña actualizada. Inicia sesión nuevamente.')

    uiStore.closeChangePasswordDialog({ force: true })
    resetChangePasswordForm()
    authStore.clearAuth()
    uiStore.setActiveModule(null)
    await router.replace({ name: 'login' })
  } catch {
    // El interceptor global ya muestra los errores de autenticación
  } finally {
    changingPassword.value = false
    $loading.hide()
  }
}
</script>
