<template>
  <v-container fluid class="fill-height bg-background pa-0">
    <v-row
      align="center"
      justify="center"
      density="compact"
      class="fill-height"
    >
      <v-col cols="12" sm="8" md="6" lg="4" class="px-4">
        <!-- Tarjeta de Login -->
        <v-card class="px-10 py-14 mx-auto rounded-xl" max-width="440" border>
          <!-- Logo -->
          <div class="d-flex justify-center mb-4">
            <v-img
              :src="Logo"
              alt="Sanamos Santander"
              max-width="180"
              height="100"
              contain
            />
          </div>

          <!-- Títulos -->
          <div class="text-center my-8">
            <h1 class="text-title-medium font-weight-bold text-brand-grey-1 mb">
              Acceso al Sistema
            </h1>
            <p class="text-title-small text-brand-grey-3 mt-n2">
              Bienvenido a la plataforma administrativa
            </p>
          </div>

          <!-- Formulario -->
          <v-form ref="formRef" @submit.prevent="handleLogin">
            <!-- Usuario -->
            <div class="mb-3">
              <v-text-field
                v-model="form.Codigo"
                label="Usuario"
                placeholder="Usuario"
                prepend-inner-icon="mdi-account-outline"
                required
                :rules="[rules.required]"
              />
            </div>

            <!-- Contraseña -->
            <div class="mb-6">
              <v-text-field
                v-model="form.Contrasena"
                label="Contraseña"
                placeholder="••••••••"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="
                  showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'
                "
                :type="showPassword ? 'text' : 'password'"
                required
                :rules="[rules.requiredPassword]"
                @click:append-inner="showPassword = !showPassword"
              />
            </div>

            <!-- Botón Submit -->
            <v-btn
              type="submit"
              color="primary"
              block
              height="48"
              :loading="loadingLogin"
              :disabled="loadingLogin"
            >
              Iniciar Sesión
              <v-icon end icon="mdi-login" class="ml-2" />
            </v-btn>

            <!-- Olvidaste tu contraseña -->
            <div class="text-center mt-6">
              <a
                href="#"
                class="text-body-medium font-weight-medium text-primary text-decoration-none link-hover"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </v-form>
        </v-card>

        <!-- Footer -->
        <div class="text-center mt-6">
          <span class="text-body-small text-brand-grey-3">
            © {{ year }} Sanamos Santander. Todos los derechos reservados.
          </span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { authService } from "@/api/services/authService";
import Logo from "@/assets/sanamos_logo_horizontal.jpg";

// ─── Composables ─────────────────────────────────────────────────────────────
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();

// ─── Estado ──────────────────────────────────────────────────────────────────
const formRef = ref(null);
const showPassword = ref(false);
const loadingLogin = ref(false);

const form = ref({
  Codigo: "",
  Contrasena: "",
});

// ─── Reglas de validación ────────────────────────────────────────────────────
const rules = {
  /** Valida que el campo no esté vacío ni contenga solo espacios (Usuario) */
  required: (v) => (v && v.trim().length > 0) || "Este campo es obligatorio",

  /** Valida que la contraseña no esté vacía; permite espacios en blanco */
  requiredPassword: (v) =>
    (v !== null && v !== undefined && v.length > 0) ||
    "Este campo es obligatorio",
};

// ─── Handlers ────────────────────────────────────────────────────────────────
const handleLogin = async () => {
  const { valid } = await formRef.value.validate();

  if (!valid) {
    $toast.error("Por favor completa todos los campos");
    return;
  }

  try {
    $loading.show();
    loadingLogin.value = true;

    await authService.login(form.value);

    const profileResponse = await authService.profile();
    const profileData = profileResponse.data.data;

    authStore.setAuth({
      Nombre: profileData.nombre,
      Rol: profileData.rol,
      authenticated: true,
    });

    authStore.setProfile(profileData);

    const firstRoute = authStore.firstRoute;

    if (firstRoute) {
      uiStore.setActiveModule(firstRoute.module);
    }

    $toast.success("¡Bienvenido!");

    // Navega pero mantén el loading hasta que la ruta se cargue
    await router.push(firstRoute?.path || "/");
  } catch (error) {
    // El manejo de error se delega al interceptor de axios o al servicio
  } finally {
    loadingLogin.value = false;
    $loading.hide();
  }
};

// ─── Utilidades ──────────────────────────────────────────────────────────────
const year = new Date().getFullYear();
</script>

<style scoped>
.login-background {
  background-color: #0d2e5c;
  background-image:
    linear-gradient(rgba(13, 46, 92, 0.552), rgba(13, 46, 92, 0.705)),
    url("@/assets/pildoras_background.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-blend-mode: multiply;
}

.link-hover:hover {
  text-decoration: underline !important;
}
</style>
