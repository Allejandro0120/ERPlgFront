<!-- src/layouts/components/SidebarFooter.vue -->
<template>
  <div class="d-flex flex-column">
    <v-divider />

    <!-- Chip versión -->
    <div class="px-2 pb-3 d-flex align-center justify-center mt-2">
      <v-chip
        class="font-weight-medium"
        color="white"
        label
        rounded="xl"
        :size="rail ? 'x-small' : 'small'"
        variant="tonal"
      >
        {{ rail ? version : `Sanamos ERP V${version}` }}
      </v-chip>
    </div>
  </div>
</template>

<script setup>
  const { rail, version } = defineProps({
    rail: { type: Boolean, default: false },
    user: {
      type: Object,
      default: () => ({
        name: 'Alex Johnson',
        role: 'Administrador',
        avatar: null,
        gender: 'm', // 'm' | 'f' | null
      }),
    },
    version: { type: String, default: '1.0.0' },
  })

  defineEmits(['logout', 'change-password'])
</script>

<style scoped></style>
