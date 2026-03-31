<!-- src/layouts/components/SidebarFooter.vue -->
<template>
  <div class="d-flex flex-column">
    <v-divider />

    <!-- Chip versión -->
    <div class="px-2 pb-3 d-flex align-center justify-center mt-2">
      <v-chip
        :size="rail ? 'x-small' : 'small'"
        variant="tonal"
        color="white"
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

function getUserInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
</script>

<style scoped></style>
