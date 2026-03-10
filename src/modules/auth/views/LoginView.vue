<template>
  <v-container fluid class="fill-height bg-background pa-0">
    <v-row no-gutters class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4" class="px-4">
        <!-- Tarjeta de Login -->
        <v-card
          class="px-10 py-14 mx-auto rounded-xl"
          max-width="440"
          border=""
        >
          <!-- logo -->
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
            <h1 class="text-title-medium  font-weight-bold text-brand-grey-1 mb">
              Acceso al Sistema
            </h1>
            <p class="text-title-small text-brand-grey-3 mt-n2">
              Bienvenido a la plataforma administrativa
            </p>
          </div>

          <!-- Formulario -->
          <v-form @submit.prevent="handleLogin">
            <!-- Correo -->
            <div class="mb-6">
             
              <v-text-field
                v-model="form.email"
                placeholder="Usuario"
                prepend-inner-icon="mdi-account-outline"
                label="Usuario"
                required
              />
            </div>

            <!-- Contraseña -->
            <div class="mb-6">
             
              <v-text-field
                v-model="form.password"
                placeholder="••••••••"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="
                  showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'
                "
                :type="showPassword ? 'text' : 'password'"
                required
                label="Contraseña"
                @click:append-inner="showPassword = !showPassword"
              />
            </div>

            <!-- Olvidaste contraseña -->
            <!-- <div class="text-center mb-6">
              <a
                href="#"
                class="text-body-medium font-weight-medium text-primary text-decoration-none"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div> -->
            <v-btn variant="text" color="primary" class="mb-6" block>
                ¿Olvidaste tu contraseña?
              
            </v-btn>

            <!-- Botón Submit -->
            <v-btn
              type="submit"
              color="primary"
              block
              height="48"
              class=""
            >
              Iniciar Sesión
              <v-icon end icon="mdi-login" class="ml-2" />
            </v-btn>
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
import Logo from "@/assets/sanamos_logo_horizontal.jpg";

const showPassword = ref(false);
const form = ref({
  email: "",
  password: "",
});

const handleLogin = () => {
  // Lógica de autenticación
  console.log("Login attempt:", form.value);
};

const year = new Date().getFullYear();
</script>

<style scoped>
.login-background {
  /* Fondo base */
  background-color: #0d2e5c;
  /* Capa de color semitransparente (#0D2E5C = rgb(13, 46, 92)) y la imagen detrás */
  background-image:
    linear-gradient(rgba(13, 46, 92, 0.552), rgba(13, 46, 92, 0.705)),
    url("@/assets/pildoras_background.jpg");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-blend-mode: multiply; /* Mezcla el color y la imagen */
}
</style>
