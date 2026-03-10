<!-- src/layouts/components/SidebarFooter.vue -->
<template>
  <div class="d-flex flex-column">
    <v-divider />

    <!-- Contenedor usuario -->
    <div class="d-flex align-center px-3 mb-2" style="height: 65px">
      <!-- Avatar siempre visible -->
      <v-avatar size="36" class="flex-shrink-0">
        <v-img :src="avatarSrc" :alt="user.name" cover />
      </v-avatar>
      <div v-if="!rail" class="ml-2 mt-n2">
        <p
          class="mb-0 font-weight-bold text-truncate"
          style="font-size: 0.8rem; line-height: 1.3"
        >
          {{ user.name }}
        </p>
        <p
          class="mb-0 mt-0 text-truncate"
          style="font-size: 0.7rem; opacity: 0.55"
        >
          {{ user.role }}
        </p>
      </div>

      <!-- Botón 3 puntos: solo en modo expandido -->

      <v-menu v-if="!rail" location="end top" :offset="[0, 8]">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            class="ml-auto flex-shrink-0"
          />
        </template>

        <v-list
          density="compact"
          nav
          min-width="180"
          elevation="3"
          rounded="lg"
        >
          <v-list-item
            prepend-icon="mdi-lock-reset"
            title="Cambiar contraseña"
            rounded="lg"
            @click="$emit('change-password')"
          />
          <v-divider class="my-1" />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Cerrar sesión"
            rounded="lg"
            base-color="error"
            @click="$emit('logout')"
          />
        </v-list>
      </v-menu>
    </div>

    <!-- Chip versión -->
    <div class="px-2 pb-3 d-flex align-center justify-center">
      <v-chip
        :size="rail ? 'x-small' : 'small'"
        variant="tonal"
        color="primary"
        label
        rounded="xl"
        class="font-weight-medium"
      >
        {{ rail ? version : `Sanamos ERP V${version}` }}
      </v-chip>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import avatarMujer from "@/assets/avatar_mujer.jpg";
import avatarHombre from "@/assets/avatar_hombre.jpg";
const props = defineProps({
  rail: { type: Boolean, default: false },
  user: {
    type: Object,
    default: () => ({
      name: "Alex Johnson",
      role: "Administrador",
      avatar: null,
      gender: "m", // 'm' | 'f' | null
    }),
  },
  version: { type: String, default: "1.0.0" },
});

defineEmits(["logout", "change-password"]);

const avatarSrc = computed(() => {
  if (props.user.avatar) return props.user.avatar;
  return props.user.gender === "m" ? avatarHombre : avatarMujer;
});
</script>

<style scoped></style>
