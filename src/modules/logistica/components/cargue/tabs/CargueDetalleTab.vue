<template>
  <div>
    <!-- ── Tabla de RECEPCIÓN (solo en modo crear) ────────────────────────── -->
    <template v-if="!isReadonly">
      <div
        v-if="recepcionDetalles.length === 0"
        class="d-flex flex-column align-center justify-center py-8 rounded-lg mb-4"
        style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
      >
        <v-icon class="mb-2" color="grey-lighten-1" size="36">mdi-clipboard-check-outline</v-icon>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          {{
            recepcionActaCargada
              ? 'Todos los productos han sido asignados'
              : 'Selecciona un acta de recepción en la pestaña Información'
          }}
        </p>
      </div>

      <base-table-local
        v-else
        class="rounded-lg border mb-6"
        :headers="recepcionHeaders"
        :items="recepcionDetalles"
        :loading="false"
        :row-actions="recepcionRowActions"
        :searchable="false"
      >
        <template #title>
          <v-icon color="info" icon="mdi-clipboard-text-outline mx-1" size="20" />
          Productos de Recepción
        </template>
        <template #chip>
          <v-chip
            class="ml-2"
            color="info"
            density="comfortable"
            label
            size="small"
            variant="tonal"
          >
            {{ recepcionDetalles.length }} pendiente{{ recepcionDetalles.length !== 1 ? 's' : '' }}
          </v-chip>
        </template>

        <template #item.CantidadPendiente="{ item }">
          <v-chip color="warning" density="comfortable" label size="small" variant="tonal">
            {{ item.CantidadPendiente }}
          </v-chip>
        </template>
        <template #item.ObservacionesProducto="{ item }">
          <div class="text-body-2 text-truncate" style="max-width: 200px">
            {{ item.ObservacionesProducto || '—' }}
          </div>
        </template>
      </base-table-local>

      <v-divider class="mb-4" />
    </template>

    <!-- ── Tabla de CARGUE (siempre visible) ─────────────────────────────── -->
    <div
      v-if="cargueDetalles.length === 0"
      class="d-flex flex-column align-center justify-center py-10 rounded-lg"
      style="border: 2px dashed rgba(0, 0, 0, 0.1); background: rgba(0, 0, 0, 0.015)"
    >
      <v-icon class="mb-3" color="grey-lighten-1" size="44">mdi-package-variant-closed</v-icon>
      <p class="text-body-2 text-grey-darken-1 mb-1">Sin productos asignados</p>
      <p v-if="!isReadonly" class="text-caption text-grey">
        Asigna ubicación a los productos de recepción para agregarlos aquí
      </p>
    </div>

    <base-table-local
      v-else
      class="rounded-lg border"
      :headers="cargueHeaders"
      :items="cargueDetalles"
      :loading="false"
      :row-actions="cargueRowActions"
      :searchable="false"
    >
      <template #title>
        <v-icon color="primary" icon="mdi-package-variant-closed-check mx-1" size="20" />
        Productos Asignados al Cargue
      </template>
      <template #chip>
        <v-chip color="primary" size="small" variant="tonal">{{ cargueDetalles.length }}</v-chip>
      </template>

      <template #item.CantidadAsignada="{ item }">
        <v-chip color="success" density="comfortable" label size="small" variant="tonal">
          {{ item.CantidadAsignada }}
        </v-chip>
      </template>
      <template #item.Observaciones="{ item }">
        <div class="text-body-2 text-truncate" style="max-width: 200px">
          {{ item.Observaciones || '—' }}
        </div>
      </template>
    </base-table-local>
  </div>
</template>

<script setup>
  import BaseTableLocal from '@/shared/ui/table/BaseTableLocal.vue'

  defineProps({
    recepcionDetalles: { type: Array, default: () => [] },
    cargueDetalles: { type: Array, default: () => [] },
    recepcionHeaders: { type: Array, default: () => [] },
    cargueHeaders: { type: Array, default: () => [] },
    recepcionRowActions: { type: Array, default: () => [] },
    cargueRowActions: { type: Array, default: () => [] },
    isReadonly: { type: Boolean, default: false },
    recepcionActaCargada: { type: Boolean, default: false },
  })
</script>
