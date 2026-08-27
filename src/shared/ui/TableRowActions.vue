<template>
  <div class="d-none d-md-flex align-center justify-center ga-2">
    <template v-for="accion in actions" :key="accion.label">
      <v-tooltip
        :aria-label="accion.label"
        :disabled="accion.showLabel"
        location="top"
        :text="accion.label"
      >
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-if="!accion.showLabel && accion.icon"
            v-bind="tooltipProps"
            :aria-label="accion.label"
            :color="accion.color ?? 'primary'"
            :icon="accion.icon"
            rounded="xl"
            size="x-small"
            :variant="accion.variant ?? 'tonal'"
            @click="accion.action(item)"
          />
          <v-btn
            v-else
            v-bind="tooltipProps"
            :aria-label="accion.label"
            class="text-none"
            :color="accion.color ?? 'primary'"
            :prepend-icon="accion.icon ?? undefined"
            rounded="xl"
            size="small"
            :variant="accion.variant ?? 'tonal'"
            @click="accion.action(item)"
          >
            {{ accion.label }}
          </v-btn>
        </template>
      </v-tooltip>
    </template>
  </div>
  <div class="d-flex d-md-none justify-end">
    <v-menu location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          aria-label="Opciones"
          color="primary"
          icon="mdi-dots-vertical"
          size="small"
          variant="text"
        />
      </template>
      <v-list density="compact" elevation="8" min-width="160">
        <v-list-item
          v-for="accion in actions"
          :key="accion.label"
          :base-color="accion.color ?? 'primary'"
          :prepend-icon="accion.icon"
          :title="accion.label"
          @click="accion.action(item)"
        />
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
  defineProps({
    actions: { type: Array, default: () => [] },
    item: { type: Object, required: true },
  })
</script>
