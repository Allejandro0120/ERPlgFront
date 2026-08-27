<template>
  <span v-if="cadenaFrio || regulado || controlado" class="d-inline-flex align-center ga-1">
    <v-tooltip v-if="cadenaFrio" location="top" text="Cadena de frío">
      <template #activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          class="pa-0 justify-center atributo-chip"
          color="info"
          size="x-small"
          variant="tonal"
        >
          <v-icon icon="mdi-snowflake" size="13" />
        </v-chip>
      </template>
    </v-tooltip>
    <v-tooltip v-if="regulado" location="top" text="Regulado">
      <template #activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          class="pa-0 justify-center atributo-chip"
          color="orange"
          size="x-small"
          variant="tonal"
        >
          <v-icon icon="mdi-shield-check" size="13" />
        </v-chip>
      </template>
    </v-tooltip>
    <v-tooltip v-if="controlado" location="top" text="Controlado">
      <template #activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          class="pa-0 justify-center atributo-chip"
          color="deep-purple"
          size="x-small"
          variant="tonal"
        >
          <v-icon icon="mdi-lock" size="13" />
        </v-chip>
      </template>
    </v-tooltip>
  </span>
</template>

<script setup>
  defineProps({
    cadenaFrio: { type: Boolean, default: false },
    regulado: { type: Boolean, default: false },
    controlado: { type: Boolean, default: false },
  })
</script>

<style scoped>
  .atributo-chip {
    width: 20px;
    height: 20px;
    min-width: 20px;
    border-radius: 50%;
  }
</style>
