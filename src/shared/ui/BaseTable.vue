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
      <v-row dense align="center">
        <!-- Buscador -->
        <v-col v-if="searchable" cols="12" sm="6" md="4" lg="3">
          <v-text-field
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            @keyup.enter="onSearch"
            @click:clear="onClear"
          />
        </v-col>

        <!-- Filtros: el padre controla el responsive con v-col cols -->
        <slot name="filters" />

        <!-- Ordenar por — solo móvil -->
        <v-col v-if="sortableHeaders.length" cols="12" class="d-sm-none">
          <div class="d-flex ga-2">
            <v-select
              v-model="mobileSortKey"
              :items="sortableHeaders"
              item-title="title"
              item-value="key"
              label="Ordenar por"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              @update:model-value="onMobileSortChange"
            />
            <v-btn-toggle
              v-if="mobileSortKey"
              v-model="mobileSortOrder"
              density="compact"
              variant="outlined"
              color="primary"
              mandatory
              @update:model-value="onMobileSortChange"
            >
              <v-btn value="asc" size="small">
                <v-icon size="18">mdi-arrow-up</v-icon>
              </v-btn>
              <v-btn value="desc" size="small">
                <v-icon size="18">mdi-arrow-down</v-icon>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>

        <!-- Spacer desktop -->
        <v-col class="d-none d-sm-block" />

        <!-- Botones: Buscar + Refrescar -->
        <v-col cols="12" sm="auto" class="d-flex ga-2">
          <v-btn
            v-if="searchable"
            color="primary"
            variant="flat"
            class="text-none flex-1-1 flex-sm-0-0"
            prepend-icon="mdi-magnify"
            :loading="loading"
            @click="onSearch"
          >
            Buscar
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none flex-1-1 flex-sm-0-0"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="onRefresh"
          >
            Refrescar
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Tabla -->
    <v-data-table-server
      v-bind="$attrs"
      :headers="computedHeaders"
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :loading-text="loadingText"
      :items-per-page="tableOptions.itemsPerPage"
      :page="tableOptions.page"
      :sort-by="tableOptions.sortBy"
      hover
      class="bg-transparent"
      :no-data-text="emptyText"
      mobile-breakpoint="md"
      @update:options="onOptionsUpdate"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>

      <!-- Columna de acciones -->
      <template
        v-if="visibleRowActions.length"
        #[`item.${actionsKey}`]="{ item }"
      >
        <!-- Desktop: botones con tooltip -->
        <div class="d-none d-md-flex align-center justify-center ga-2">
          <template v-for="accion in visibleRowActions" :key="accion.label">
            <v-tooltip :text="accion.label" location="top">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  :icon="accion.icon"
                  :color="accion.color ?? 'primary'"
                  variant="tonal"
                  size="x-small"
                  rounded="xl"
                  @click="accion.action(item)"
                />
              </template>
            </v-tooltip>
          </template>
        </div>
        <!-- Móvil: menú 3 puntos -->
        <div class="d-flex d-md-none justify-end">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                color="primary"
              />
            </template>
            <v-list density="compact" min-width="160" elevation="8">
              <v-list-item
                v-for="accion in visibleRowActions"
                :key="accion.label"
                :prepend-icon="accion.icon"
                :title="accion.label"
                :base-color="accion.color ?? 'primary'"
                @click="accion.action(item)"
              />
            </v-list>
          </v-menu>
        </div>
      </template>

      <!-- Footer -->
      <template #bottom>
        <v-divider />
        <v-container fluid class="px-4 py-3">
          <v-row align="center" no-gutters class="ga-2 ga-md-0">
            <v-col cols="12" md="4" class="d-flex align-center ga-2">
              <span class="text-caption text-grey-darken-1 text-no-wrap"
                >Filas por página:</span
              >
              <v-select
                v-model="tableOptions.itemsPerPage"
                :items="rowsPerPageOptions"
                density="compact"
                variant="outlined"
                hide-details
                class="flex-grow-0"
                style="min-width: 75px; max-width: 90px"
                @update:model-value="onItemsPerPageChange"
              />
            </v-col>

            <v-col cols="12" class="d-flex d-md-none justify-center">
              <span class="text-caption text-grey-darken-1">{{
                paginationInfo
              }}</span>
            </v-col>

            <v-col
              v-if="totalPages > 1"
              md="4"
              class="d-none d-md-flex align-center justify-center ga-1"
            >
              <v-btn
                icon="mdi-page-first"
                variant="text"
                size="small"
                color="grey-darken-2"
                :disabled="tableOptions.page === 1 || loading"
                @click="goToPage(1)"
              />
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                size="small"
                color="grey-darken-2"
                :disabled="tableOptions.page === 1 || loading"
                @click="goToPage(tableOptions.page - 1)"
              />
              <template v-for="p in visiblePages" :key="p">
                <span v-if="p === '...'" class="text-caption text-grey px-1"
                  >…</span
                >
                <v-btn
                  v-else
                  :variant="p === tableOptions.page ? 'flat' : 'text'"
                  :color="p === tableOptions.page ? 'primary' : 'grey-darken-2'"
                  size="small"
                  class="px-2"
                  style="min-width: 32px"
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
                :disabled="tableOptions.page === totalPages || loading"
                @click="goToPage(tableOptions.page + 1)"
              />
              <v-btn
                icon="mdi-page-last"
                variant="text"
                size="small"
                color="grey-darken-2"
                :disabled="tableOptions.page === totalPages || loading"
                @click="goToPage(totalPages)"
              />
            </v-col>
            <v-col v-else md="4" class="d-none d-md-block" />

            <v-col cols="12" md="4">
              <div class="d-none d-md-flex justify-end">
                <span class="text-caption text-grey-darken-1">{{
                  paginationInfo
                }}</span>
              </div>
              <div
                v-if="totalPages > 1"
                class="d-flex d-md-none align-center justify-center ga-1"
              >
                <v-btn
                  icon="mdi-page-first"
                  variant="text"
                  size="small"
                  color="grey-darken-2"
                  :disabled="tableOptions.page === 1 || loading"
                  @click="goToPage(1)"
                />
                <v-btn
                  icon="mdi-chevron-left"
                  variant="text"
                  size="small"
                  color="grey-darken-2"
                  :disabled="tableOptions.page === 1 || loading"
                  @click="goToPage(tableOptions.page - 1)"
                />
                <template v-for="p in visiblePages" :key="p">
                  <span v-if="p === '...'" class="text-caption text-grey px-1"
                    >…</span
                  >
                  <v-btn
                    v-else
                    :variant="p === tableOptions.page ? 'flat' : 'text'"
                    :color="
                      p === tableOptions.page ? 'primary' : 'grey-darken-2'
                    "
                    size="small"
                    class="px-2"
                    style="min-width: 32px"
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
                  :disabled="tableOptions.page === totalPages || loading"
                  @click="goToPage(tableOptions.page + 1)"
                />
                <v-btn
                  icon="mdi-page-last"
                  variant="text"
                  size="small"
                  color="grey-darken-2"
                  :disabled="tableOptions.page === totalPages || loading"
                  @click="goToPage(totalPages)"
                />
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDisplay } from "vuetify";
import { useAuthStore } from "@/stores/auth.store";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  title: { type: String, default: "" },
  headers: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: "No hay registros para mostrar." },
  loadingText: { type: String, default: "Cargando..." },
  totalItems: { type: Number, default: 0 },
  itemsPerPage: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50] },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: "Buscar..." },
  rowActions: { type: Array, default: () => [] },
  actionsKey: { type: String, default: "acciones" },
});

const emit = defineEmits(["load"]);

const authStore = useAuthStore();
const { mdAndUp } = useDisplay();

const visibleRowActions = computed(() =>
  props.rowActions.filter(
    (a) => !a.permission || authStore.hasPermission(a.permission),
  ),
);

const computedHeaders = computed(() => {
  const hasActionsCol = props.headers.some((h) => h.key === props.actionsKey);
  if (!visibleRowActions.value.length || hasActionsCol) return props.headers;
  return [
    ...props.headers,
    {
      title: "Acciones",
      key: props.actionsKey,
      sortable: false,
      align: "center",
    },
  ];
});

const sortableHeaders = computed(() =>
  props.headers.filter((h) => h.sortable !== false),
);

// ── Estado central ────────────────────────────────────────────────────────────
const tableOptions = ref({
  page: 1,
  itemsPerPage: props.itemsPerPage,
  sortBy: [],
});
const searchQuery = ref("");
const mobileSortKey = ref(null);
const mobileSortOrder = ref("asc");

// ── Paginación ────────────────────────────────────────────────────────────────
const totalPages = computed(
  () => Math.ceil(props.totalItems / tableOptions.value.itemsPerPage) || 1,
);

const paginationInfo = computed(() => {
  if (props.totalItems === 0) return "Sin registros";
  const start =
    (tableOptions.value.page - 1) * tableOptions.value.itemsPerPage + 1;
  const end = Math.min(
    tableOptions.value.page * tableOptions.value.itemsPerPage,
    props.totalItems,
  );
  return `${start}–${end} de ${props.totalItems}`;
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = tableOptions.value.page;
  if (!mdAndUp.value) return [current];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 1;
  const range = [];
  for (
    let i = Math.max(2, current - delta);
    i <= Math.min(total - 1, current + delta);
    i++
  ) {
    range.push(i);
  }
  if (range[0] > 2) range.unshift("...");
  if (range[range.length - 1] < total - 1) range.push("...");
  return [1, ...range, total];
});

// ── Navegación ────────────────────────────────────────────────────────────────
function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === tableOptions.value.page)
    return;
  tableOptions.value = { ...tableOptions.value, page };
  emitLoad();
}

function onItemsPerPageChange() {
  tableOptions.value = { ...tableOptions.value, page: 1 };
  emitLoad();
}

// Sort móvil — dropdown propio, ignora el nativo de Vuetify
function onMobileSortChange() {
  const sortBy = mobileSortKey.value
    ? [{ key: mobileSortKey.value, order: mobileSortOrder.value }]
    : [];
  tableOptions.value = { ...tableOptions.value, page: 1, sortBy };
  emitLoad();
}

function emitLoad() {
  emit("load", {
    page: tableOptions.value.page,
    itemsPerPage: tableOptions.value.itemsPerPage,
    sortBy: tableOptions.value.sortBy?.[0] ?? null,
    search: searchQuery.value?.trim() || null,
  });
}

function onOptionsUpdate({ page, itemsPerPage, sortBy }) {
  if (mdAndUp.value) {
    // Desktop: sort nativo de los headers
    tableOptions.value = { page, itemsPerPage, sortBy: sortBy ?? [] };
  } else {
    // Móvil: solo page e itemsPerPage — el sort lo maneja el dropdown
    tableOptions.value = { ...tableOptions.value, page, itemsPerPage };
  }
  // Siempre emitimos — tanto en desktop como en móvil necesitamos cargar los datos
  emitLoad();
}

function onSearch() {
  tableOptions.value = { ...tableOptions.value, page: 1 };
  emitLoad();
}
function onClear() {
  searchQuery.value = "";
  tableOptions.value = { ...tableOptions.value, page: 1 };
  emitLoad();
}
function onRefresh() {
  emitLoad();
}

function reset() {
  tableOptions.value = {
    page: 1,
    itemsPerPage: props.itemsPerPage,
    sortBy: [],
  };
  mobileSortKey.value = null;
  mobileSortOrder.value = "asc";
  searchQuery.value = "";
  emitLoad();
}

defineExpose({ reset });
</script>

<style scoped>
/* Oculta el "Sort by" nativo de Vuetify en móvil */
:deep(.v-data-table-headers--mobile) {
  display: none !important;
}
</style>
