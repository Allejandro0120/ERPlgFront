<template>
  <v-container class="fill-height bg-background pa-0" fluid>
    <v-row align="center" class="fill-height" density="compact" justify="center">
      <v-col class="px-4" cols="12" lg="4" md="6" sm="8">
        <!-- Tarjeta de Login -->
        <v-card border class="px-10 py-14 mx-auto rounded-xl" max-width="440">
          <!-- Logo -->
          <div class="d-flex justify-center mb-4">
            <img
              alt="LogicPharma logo"
              fetchpriority="high"
              height="100"
              :src="Logo"
              style="object-fit: contain"
              width="180"
            />
          </div>

          <!-- Títulos -->
          <div class="text-center my-8">
            <h1 class="text-title-medium font-weight-bold text-brand-grey-1 mb">
              Acceso al Sistema
            </h1>
            <p class="text-title-small text-brand-grey-2 mt-n2">
              Bienvenido a la plataforma administrativa
            </p>
          </div>

          <!-- Formulario -->
          <v-form ref="formRef" @submit.prevent="handleLogin">
            <!-- Usuario -->
            <div class="mb-3">
              <v-text-field
                id="campo-usuario"
                v-model="form.Codigo"
                autocomplete="username"
                label="Usuario"
                prepend-inner-icon="mdi-account-outline"
                required
                :rules="[rules.required]"
              />
            </div>

            <!-- Contraseña -->
            <div class="mb-6">
              <v-text-field
                id="campo-contrasena"
                v-model="form.Contrasena"
                :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                autocomplete="current-password"
                label="Contraseña"
                prepend-inner-icon="mdi-lock-outline"
                required
                :rules="[rules.requiredPassword]"
                :type="showPassword ? 'text' : 'password'"
                @click:append-inner="showPassword = !showPassword"
              />
            </div>

            <!-- Botón Submit -->
            <v-btn
              block
              color="primary"
              :disabled="loadingLogin"
              height="48"
              :loading="loadingLogin"
              type="submit"
            >
              Iniciar Sesión
              <v-icon class="ml-2" end icon="mdi-login" />
            </v-btn>

            <!-- Olvidaste tu contraseña -->
            <div class="text-center mt-6">
              <a
                class="text-body-medium font-weight-medium text-primary text-decoration-none link-hover"
                href="#"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </v-form>
        </v-card>

        <!-- Footer -->
        <div class="text-center mt-6">
          <span class="text-body-small text-brand-grey-1">
            © {{ year }}  LogicPharma. Todos los derechos reservados.
          </span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { authService } from '@/api/services/authService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useAuthStore } from '@/stores/authStore'
  import { useUiStore } from '@/stores/uiStore'
  import Logo from '/LogicPharma_LogoT.png'

  // ─── Composables ─────────────────────────────────────────────────────────────
  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  // ─── Estado ──────────────────────────────────────────────────────────────────
  const formRef = ref(null)
  const showPassword = ref(false)
  const loadingLogin = ref(false)

  const form = ref({
    Codigo: '',
    Contrasena: '',
  })

  // ─── Reglas de validación ────────────────────────────────────────────────────
  const rules = {
    /** Valida que el campo no esté vacío ni contenga solo espacios (Usuario) */
    required: (v) => (v && v.trim().length > 0) || 'Este campo es obligatorio',

    /** Valida que la contraseña no esté vacía; permite espacios en blanco */
    requiredPassword: (v) =>
      (v !== null && v !== undefined && v.length > 0) || 'Este campo es obligatorio',
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────
  async function handleLogin() {
    const { valid } = await formRef.value.validate()

    if (!valid) {
      $toast.error('Por favor completa todos los campos')
      return
    }

    try {
      $loading.show()
      loadingLogin.value = true

      await authService.login(form.value)

      const profileResponse = await authService.profile()
      const profileData = profileResponse.data.data

      authStore.setAuth({
        Nombre: profileData.nombre,
        Rol: profileData.rol,
        authenticated: true,
      })

      authStore.setProfile(profileData)

      const firstRoute = authStore.firstRoute

      if (firstRoute) {
        uiStore.setActiveModule(firstRoute.module)
      }

      $toast.success('¡Bienvenido!')

      // Navega pero mantén el loading hasta que la ruta se cargue
      await router.push(firstRoute?.path || '/')
    } catch {
      // El manejo de error se delega al interceptor de axios o al servicio
    } finally {
      loadingLogin.value = false
      $loading.hide()
    }
  }

  // ─── Utilidades ──────────────────────────────────────────────────────────────
  const year = new Date().getFullYear()
</script>

<style scoped>
  .link-hover:hover {
    text-decoration: underline !important;
  }

  /* Aumentar contraste - labels más oscuros para pasar WCAG AA */
  :deep() .v-label {
    color: #0f172a !important;
  }

  /* Corregir solapamiento de Vuetify cuando Chrome u otros navegadores hacen autofill */
  :deep(.v-field:has(input:-webkit-autofill) .v-field-label:not(.v-field-label--floating)) {
    opacity: 0 !important;
  }
  :deep(.v-field:has(input:-webkit-autofill) .v-field-label--floating) {
    opacity: 1 !important;
    visibility: visible !important;
  }
</style>
