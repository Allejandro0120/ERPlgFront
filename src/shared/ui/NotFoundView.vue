<template>
  <v-container fluid class="fill-height bg-background pa-0">
    <v-row  density="compact"class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="6" class="px-4 text-center">
        <div class="illustration-container mb-6">
          <div class="number-404">
            <span class="digit text-primary">4</span>
            <div class="circle-icon">
              <v-icon
                icon="mdi-compass-off-outline"
                size="48"
                color="primary"
              />
            </div>
            <span class="digit text-primary">4</span>
          </div>
        </div>

        <div class="mb-8">
          <h1 class="text-h5 text-md-h4 font-weight-bold text-brand-grey-1 mb-3">
            ¡Oops! Página no encontrada
          </h1>
          <p class="text-body-1 text-brand-grey-3 mb-0 px-md-6">
            La página que estás buscando no existe, fue movida o no tienes permisos para acceder a ella.
          </p>
        </div>

        <div class="d-flex justify-center">
          <v-btn
            color="primary"
            size="large"
            min-width="160"
            height="48"
            prepend-icon="mdi-arrow-left"
            @click="goBack"
          >
            Regresar
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}
</script>

<style scoped>
.illustration-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.number-404 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.digit {
  font-size: 5rem;
  font-weight: 700;
  line-height: 1;
  opacity: 0.9;
}

.circle-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgb(var(--v-theme-primary));
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@media (min-width: 600px) {
  .digit {
    font-size: 7rem;
  }
  
  .circle-icon {
    width: 100px;
    height: 100px;
  }
}
</style>
