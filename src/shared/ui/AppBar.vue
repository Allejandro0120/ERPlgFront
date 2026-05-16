<template>
  <v-app-bar border="b" flat>
    <v-app-bar-nav-icon aria-label="Alternar menú de navegación" @click="handleMenuClick" />
    <v-app-bar-title class="font-weight-bold text-brand-grey-1">
      {{ moduleTitle }}
    </v-app-bar-title>

    <template #append>
      <div class="d-flex align-center ga-3 pr-3">
        <v-menu location="bottom end" :offset="[0, 8]">
          <template #activator="{ props }">
            <v-divider class="border-opacity-25" vertical />

            <v-btn v-bind="props" class="d-flex align-center px-2" variant="text">
              <v-avatar class="bg-primary text-white font-weight-bold" size="32">
                {{ userInitials }}
              </v-avatar>
              <span
                class="text-body-small font-weight-medium text-brand-grey-1 d-none d-sm-inline ml-2"
              >
                {{ currentUser.name }}
              </span>
              <v-icon class="text-brand-grey-1" icon="mdi-chevron-down" size="18" />
            </v-btn>
          </template>

          <v-list density="compact" elevation="3" min-width="200" nav rounded="lg">
            <v-list-item
              disabled
              prepend-icon="$account"
              :subtitle="currentUser.role"
              :title="currentUser.name"
            />
            <v-divider class="my-1" />
            <v-list-item
              prepend-icon="mdi-lock-reset"
              rounded="lg"
              title="Cambiar contraseña"
              @click="handleChangePassword"
            />
            <v-divider class="my-1" />
            <v-list-item
              base-color="error"
              prepend-icon="mdi-logout"
              rounded="lg"
              title="Cerrar sesión"
              @click="handleLogout"
            />
          </v-list>
        </v-menu>
      </div>
    </template>
  </v-app-bar>
</template>
<script setup>
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify/lib/composables/display'
  import { authService } from '@/api/services/authService'
  import { $loading } from '@/plugins/loading/loading'
  import { $toast } from '@/plugins/toast'
  import { useAuthStore } from '@/stores/auth.store'
  import { useUiStore } from '@/stores/ui.store'

  const uiStore = useUiStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const { mobile } = useDisplay()

  const moduleTitle = computed(() => {
    // Tomamos el alias del módulo leyendo exclusivamente la ruta activa,
    // así evitamos que cambie prematuramente al darle clic a otra opción en el sidebar sin cambiar de página.
    const moduleAlias = route.path.split('/')[1] || ''
    if (!moduleAlias) return 'Panel'

  const group = authStore.orderedMenu.find(
    (item) => getGroupAlias(item) === moduleAlias,
  );

  if (group?.Nombre) return group.Nombre;
  return moduleAlias.charAt(0).toUpperCase() + moduleAlias.slice(1);
});

  const currentUser = computed(() => {
    const user = authStore.user
    if (!user) {
      return {
        name: 'Usuario',
        role: 'Invitado',
        avatar: null,
        gender: null,
      }
    }

    return {
      name: user.Nombre || user.name || 'Usuario',
      role: user.Rol || user.role || 'Usuario',
      avatar: user.avatar || null,
      gender: user.Genero?.toLowerCase() || user.gender || null,
    }
  })

  const userInitials = computed(() => getUserInitials(currentUser.value.name))

  function getGroupAlias(group) {
    return group.Alias || group.Nombre?.toLowerCase()
  }

  function getUserInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts.at(-1)[0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  function handleMenuClick() {
    if (mobile.value) {
      uiStore.toggleDrawer()
    } else {
      uiStore.toggleRail()
    }
  }

  async function handleLogout() {
    try {
      $loading.show('Cerrando sesión...')
      await authService.logout()
      authStore.clearAuth()
      uiStore.setActiveModule(null)
      $toast.success('Sesión cerrada correctamente')
      router.push({ name: 'login' })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      authStore.clearAuth()
      uiStore.setActiveModule(null)
      router.push({ name: 'login' })
    } finally {
      $loading.hide()
    }
  }

  function handleChangePassword() {
    uiStore.openChangePasswordDialog({
      forced: Boolean(authStore.mustChangePassword),
    })
  }
</script>
