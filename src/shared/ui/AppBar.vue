<template>
  <v-app-bar flat border="b">
    <v-app-bar-nav-icon @click="handleMenuClick" />
    <v-app-bar-title class="font-weight-bold text-brand-grey-1">
      {{ moduleTitle }}
    </v-app-bar-title>

    <template #append>
      <div class="d-flex align-center ga-3 pr-3">
        <v-menu location="bottom end" :offset="[0, 8]">
          <template #activator="{ props }">
            <v-divider class="border-opacity-25" vertical></v-divider>
            
            <v-btn
              v-bind="props"
              variant="text"
              class="d-flex align-center px-2"
            >
              <v-avatar size="32" class="bg-primary text-white font-weight-bold">
                {{ userInitials }}
              </v-avatar>
              <span class="text-body-small font-weight-medium text-brand-grey-1 d-none d-sm-inline ml-2">
                {{ currentUser.name }}
              </span>
              <v-icon icon="mdi-chevron-down" size="18" class="text-brand-grey-1" />
            </v-btn>
          </template>

          <v-list density="compact" nav min-width="200" elevation="3" rounded="lg">
            <v-list-item
              prepend-icon="mdi-account"
              :title="currentUser.name"
              :subtitle="currentUser.role"
              disabled
            />
            <v-divider class="my-1" />
            <v-list-item
              prepend-icon="mdi-lock-reset"
              title="Cambiar contraseña"
              rounded="lg"
              @click="handleChangePassword"
            />
            <v-divider class="my-1" />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Cerrar sesión"
              rounded="lg"
              base-color="error"
              @click="handleLogout"
            />
          </v-list>
        </v-menu>
      </div>
    </template>
  </v-app-bar>
</template>
<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify/lib/composables/display";
import { useUiStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/api/services/authService";

const uiStore = useUiStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();

const moduleTitle = computed(() => {
  const moduleAlias = uiStore.activeModule || route.path.split("/")[1] || "";
  if (!moduleAlias) return "Panel";

  const group = authStore.orderedMenu.find(
    (item) => getGroupAlias(item) === moduleAlias,
  );

  if (group?.Nombre) return group.Nombre;
  return moduleAlias.charAt(0).toUpperCase() + moduleAlias.slice(1);
});

const currentUser = computed(() => {
  const user = authStore.user;
  if (!user) {
    return {
      name: "Usuario",
      role: "Invitado",
      avatar: null,
      gender: null,
    };
  }

  return {
    name: user.Nombre || user.name || "Usuario",
    role: user.Rol || user.role || "Usuario",
    avatar: user.avatar || null,
    gender: user.Genero?.toLowerCase() || user.gender || null,
  };
});

const userInitials = computed(() => getUserInitials(currentUser.value.name));

function getGroupAlias(group) {
  return group.Alias || group.Nombre?.toLowerCase();
}

function getUserInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function handleMenuClick() {
  if (mobile.value) {
    uiStore.toggleDrawer();
  } else {
    uiStore.toggleRail();
  }
}

async function handleLogout() {
  try {
    $loading.show("Cerrando sesión...");
    await authService.logout();
    authStore.clearAuth();
    uiStore.setActiveModule(null);
    window.$toast.success("Sesión cerrada correctamente");
    router.push({ name: "login" });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    authStore.clearAuth();
    uiStore.setActiveModule(null);
    router.push({ name: "login" });
  } finally {
    $loading.hide();
  }
}

function handleChangePassword() {
  console.log("change password");
}
</script>
