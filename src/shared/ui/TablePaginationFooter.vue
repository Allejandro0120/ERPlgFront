<template>
  <v-divider />
  <v-container class="px-4 py-3" fluid>
    <v-row align="center" class="ga-2 ga-md-0" density="compact">
      <v-col class="d-flex align-center ga-2" cols="12" md="4">
        <span class="text-caption text-grey-darken-1 text-no-wrap">Filas por página:</span>
        <v-select
          :id="itemsPerPageId"
          aria-label="Filas por página"
          class="flex-grow-0"
          density="compact"
          :disabled="loading"
          hide-details
          :items="rowsPerPageOptions"
          :model-value="itemsPerPage"
          :name="itemsPerPageId"
          style="min-width: 75px; max-width: 90px"
          variant="outlined"
          @update:model-value="$emit('update:items-per-page', $event)"
        />
      </v-col>

      <v-col class="d-flex d-md-none justify-center" cols="12">
        <span class="text-caption text-grey-darken-1">{{ paginationInfo }}</span>
      </v-col>

      <v-col v-if="totalPages > 1" class="d-none d-md-flex align-center justify-center ga-1" md="4">
        <v-btn
          aria-label="Primera página"
          color="grey-darken-2"
          :disabled="page === 1 || loading"
          icon="mdi-page-first"
          size="small"
          variant="text"
          @click="$emit('go-to-page', 1)"
        />
        <v-btn
          aria-label="Página anterior"
          color="grey-darken-2"
          :disabled="page === 1 || loading"
          icon="mdi-chevron-left"
          size="small"
          variant="text"
          @click="$emit('go-to-page', page - 1)"
        />
        <template v-for="p in visiblePages" :key="p">
          <span v-if="p === '...'" class="text-caption text-grey px-1">…</span>
          <v-btn
            v-else
            :aria-label="`Ir a la página ${p}`"
            class="px-2"
            :color="p === page ? 'primary' : 'grey-darken-2'"
            :disabled="loading"
            size="small"
            style="min-width: 32px"
            :variant="p === page ? 'flat' : 'text'"
            @click="$emit('go-to-page', p)"
            >{{ p }}</v-btn
          >
        </template>
        <v-btn
          aria-label="Página siguiente"
          color="grey-darken-2"
          :disabled="page === totalPages || loading"
          icon="mdi-chevron-right"
          size="small"
          variant="text"
          @click="$emit('go-to-page', page + 1)"
        />
        <v-btn
          aria-label="Última página"
          color="grey-darken-2"
          :disabled="page === totalPages || loading"
          icon="mdi-page-last"
          size="small"
          variant="text"
          @click="$emit('go-to-page', totalPages)"
        />
      </v-col>
      <v-col v-else class="d-none d-md-block" md="4" />

      <v-col cols="12" md="4">
        <div class="d-none d-md-flex justify-end">
          <span class="text-caption text-grey-darken-1">{{ paginationInfo }}</span>
        </div>
        <div v-if="totalPages > 1" class="d-flex d-md-none align-center justify-center ga-1">
          <v-btn
            aria-label="Primera página"
            color="grey-darken-2"
            :disabled="page === 1 || loading"
            icon="mdi-page-first"
            size="small"
            variant="text"
            @click="$emit('go-to-page', 1)"
          />
          <v-btn
            aria-label="Página anterior"
            color="grey-darken-2"
            :disabled="page === 1 || loading"
            icon="mdi-chevron-left"
            size="small"
            variant="text"
            @click="$emit('go-to-page', page - 1)"
          />
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="text-caption text-grey px-1">…</span>
            <v-btn
              v-else
              :aria-label="`Ir a la página ${p}`"
              class="px-2"
              :color="p === page ? 'primary' : 'grey-darken-2'"
              :disabled="loading"
              size="small"
              style="min-width: 32px"
              :variant="p === page ? 'flat' : 'text'"
              @click="$emit('go-to-page', p)"
              >{{ p }}</v-btn
            >
          </template>
          <v-btn
            aria-label="Página siguiente"
            color="grey-darken-2"
            :disabled="page === totalPages || loading"
            icon="mdi-chevron-right"
            size="small"
            variant="text"
            @click="$emit('go-to-page', page + 1)"
          />
          <v-btn
            aria-label="Última página"
            color="grey-darken-2"
            :disabled="page === totalPages || loading"
            icon="mdi-page-last"
            size="small"
            variant="text"
            @click="$emit('go-to-page', totalPages)"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { getCurrentInstance } from 'vue'

  defineProps({
    page: { type: Number, required: true },
    totalPages: { type: Number, required: true },
    itemsPerPage: { type: Number, required: true },
    rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50] },
    loading: { type: Boolean, default: false },
    paginationInfo: { type: String, default: '' },
    visiblePages: { type: Array, default: () => [] },
  })
  defineEmits(['go-to-page', 'update:items-per-page'])

  const itemsPerPageId = `items-per-page-${getCurrentInstance()?.uid ?? '0'}`
</script>
