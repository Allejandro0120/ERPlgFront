<!-- src/layouts/DefaultLayout.vue -->
<template>
  <AppSidebar />
  <v-main>
    <AppBar />
    <ChangePasswordDialog />
    <router-view v-slot="{ Component }">
      <v-container class="pa-3 pa-sm-5" fluid>
        <div class="d-flex flex-wrap justify-space-between align-center mb-6 mx-1 mx-sm-3 ga-3">
          <div class="d-flex flex-column ga-1 w-100 w-sm-auto">
            <span class="text-headline-small text-brand-grey-1 font-weight-bold">
              {{ sectionInfo.title || 'Sección' }}
            </span>
            <span class="text-body-medium text-medium-emphasis">
              {{ sectionInfo.description || 'Descripción no disponible' }}
            </span>
          </div>
          <div
            id="page-header-actions-slot"
            class="d-flex flex-wrap align-center ga-2 w-100 w-sm-auto"
          />
        </div>

        <component :is="Component" />
      </v-container>
    </router-view>
  </v-main>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppSidebar from '@/layout/components/AppSidebar.vue'
  import AppBar from '@/shared/ui/AppBar.vue'
  import ChangePasswordDialog from '@/shared/ui/ChangePasswordDialog.vue'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()
  const route = useRoute()

  const sectionInfo = computed(() => {
    const currentPath = route.path
    for (const group of authStore.orderedMenu || []) {
      const groupAlias = group.Alias || group.Nombre?.toLowerCase() || ''
      const seccion = group.secciones?.find((item) =>
        currentPath.startsWith(`/${groupAlias}${item.Ruta}`),
      )

      if (seccion) {
        return {
          title: seccion.Nombre || group.Nombre || '',
          description: seccion.Descripcion || group.Descripcion || '',
        }
      }
    }
    return { title: '', description: '' }
  })
</script>
