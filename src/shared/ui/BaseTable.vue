<template>
  <v-card class="rounded-lg bg-white overflow-hidden" elevation="0">
    <!-- Header: título + acciones -->
    <v-card-text
      v-if="$slots.title || title || $slots.actions"
      class="d-flex align-center justify-space-between py-4 px-4 border-b"
    >
      <div
        v-if="$slots.title || title"
        class="text-h6 font-weight-bold text-grey-darken-4"
      >
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="$slots.actions" class="d-flex align-center ga-2">
        <slot name="actions" />
      </div>
    </v-card-text>

    <!-- Barra: buscador + filtros + botones -->
    <v-card-text v-if="searchable || $slots.filters" class="py-3 px-4 border-b">
      <div class="d-flex align-center ga-3 flex-wrap">
        <!-- Buscador -->
        <v-text-field
          v-if="searchable"
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="min-width: 220px; max-width: 280px"
          @keyup.enter="onSearch"
          @click:clear="onClear"
        />

        <!-- Filtros del padre -->
        <slot name="filters" />

        <v-spacer />

        <!-- Botón buscar -->
        <v-btn
          v-if="searchable"
          color="primary"
          variant="flat"
          class="text-none"
          :loading="loading"
          @click="onSearch"
        >
          Buscar
        </v-btn>

        <!-- Botón refrescar -->
        <v-tooltip text="Refrescar" location="top"  content-class="tooltip">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon
              variant="tonal"
              color="primary"
              size="small"
              :loading="loading"
              @click="onRefresh"
            >
              <v-icon size="18">mdi-refresh</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </v-card-text>

    <!-- Tabla -->
    <v-data-table-server
      v-bind="$attrs"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :items-per-page="internalItemsPerPage"
      :page="internalPage"
      hover
      class="bg-transparent"
      :no-data-text="emptyText"
      mobile-breakpoint="md"
      @update:options="onOptionsUpdate"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>

      <template #bottom>
        <v-divider />
        <div
          class="d-flex align-center justify-space-between px-4 py-3 flex-wrap ga-3"
        >
          <div class="d-flex align-center ga-2">
            <span class="text-caption text-grey-darken-1 text-no-wrap"
              >Filas por página:</span
            >
            <v-select
              v-model="internalItemsPerPage"
              :items="rowsPerPageOptions"
              density="compact"
              variant="outlined"
              hide-details
              style="width: 80px"
              @update:model-value="onItemsPerPageChange"
            />
          </div>

          <div class="d-flex align-center ga-3">
            <span class="text-caption text-grey-darken-1 text-no-wrap">
              {{ paginationInfo }}
            </span>

            <div v-if="totalPages > 1" class="d-flex align-center ga-1">
              <v-btn
                icon="mdi-page-first"
                variant="text"
                size="small"
                color="grey-darken-2"
                :disabled="internalPage === 1 || loading"
                @click="goToPage(1)"
              />
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                size="small"
                color="grey-darken-2"
                :disabled="internalPage === 1 || loading"
                @click="goToPage(internalPage - 1)"
              />

              <template v-for="p in visiblePages" :key="p">
                <span v-if="p === '...'" class="text-caption text-grey px-1"
                  >…</span
                >
                <v-btn
                  v-else
                  :variant="p === internalPage ? 'flat' : 'text'"
                  :color="p === internalPage ? 'primary' : 'grey-darken-2'"
                  size="small"
                  style="min-width: 32px"
                  class="px-2"
                  :disabled="loading"
                  @click="goToPage(p)"
                  >{{ p }}</v-btn
                >
              </template>

              <v-btn
                icon="mdi-chevron-right"
                variant="text"
                size="small"
                color="grey-darken-2"
                :disabled="internalPage === totalPages || loading"
                @click="goToPage(internalPage + 1)"
              />
              <v-btn
                icon="mdi-page-last"
                variant="text"
                size="small"
                color="grey-darken-2"
                :disabled="internalPage === totalPages || loading"
                @click="goToPage(totalPages)"
              />
            </div>
          </div>
        </div>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup>
import { ref, computed } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  title: { type: String, default: "" },
  headers: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: "No hay registros para mostrar." },
  totalItems: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50] },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: "Buscar..." },
});

const emit = defineEmits(["load"]);

const internalPage = ref(props.page);
const internalItemsPerPage = ref(props.itemsPerPage);
const currentSortBy = ref(null);
const searchQuery = ref("");

const totalPages = computed(
  () => Math.ceil(props.totalItems / internalItemsPerPage.value) || 1,
);

const paginationInfo = computed(() => {
  if (props.totalItems === 0) return "Sin registros";
  const start = (internalPage.value - 1) * internalItemsPerPage.value + 1;
  const end = Math.min(
    internalPage.value * internalItemsPerPage.value,
    props.totalItems,
  );
  return `${start}–${end} de ${props.totalItems}`;
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = internalPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push("...");
  if (current > 2) pages.push(current - 1);
  pages.push(current);
  if (current < total - 1) pages.push(current + 1);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
});

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === internalPage.value)
    return;
  internalPage.value = page;
  emitLoad();
}

function onItemsPerPageChange() {
  internalPage.value = 1;
  emitLoad();
}

function emitLoad() {
  emit("load", {
    page: internalPage.value,
    itemsPerPage: internalItemsPerPage.value,
    sortBy: currentSortBy.value,
    search: searchQuery.value?.trim() || null,
  });
}

function onOptionsUpdate({ page, itemsPerPage, sortBy }) {
  internalPage.value = page;
  internalItemsPerPage.value = itemsPerPage;
  currentSortBy.value = sortBy?.[0] ?? null;
  emit("load", {
    page,
    itemsPerPage,
    sortBy: currentSortBy.value,
    search: searchQuery.value?.trim() || null,
  });
}

function onSearch() {
  internalPage.value = 1;
  emitLoad();
}
function onClear() {
  searchQuery.value = "";
  internalPage.value = 1;
  emitLoad();
}
function onRefresh() {
  emitLoad();
}

function reset() {
  internalPage.value = 1;
  currentSortBy.value = null;
  searchQuery.value = "";
  emitLoad();
}

defineExpose({ reset });
</script>
