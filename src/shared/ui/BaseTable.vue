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
      <!-- DESKTOP (md+) -->
      <div class="d-none d-md-flex align-center ga-3">
        <v-text-field
          v-if="searchable"
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="flex-grow-0"
          style="min-width: 220px; max-width: 280px"
          @keyup.enter="onSearch"
          @click:clear="onClear"
        />
        <slot name="filters" />
        <v-spacer />
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
        <v-tooltip text="Refrescar" location="top">
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

      <!-- MÓVIL (< md) -->
      <div class="d-flex d-md-none flex-column ga-3">
        <v-text-field
          v-if="searchable"
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
        <slot name="filters-mobile" />
        <div class="d-flex ga-2">
          <v-btn
            v-if="searchable"
            color="primary"
            variant="flat"
            class="text-none flex-1-1"
            :loading="loading"
            @click="onSearch"
          >
            Buscar
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none flex-1-1"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="onRefresh"
          >
            Refrescar
          </v-btn>
        </div>
      </div>
    </v-card-text>

    <!-- Tabla -->
    <v-data-table-server
      v-bind="$attrs"
      :headers="computedHeaders"
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :loading-text="loadingText"
      :items-per-page="internalItemsPerPage"
      :page="internalPage"
      hover
      class="bg-transparent"
      :no-data-text="emptyText"
      mobile-breakpoint="md"
      @update:options="onOptionsUpdate"
    >
      <!-- Reexponer slots del padre -->
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>

      <template #header.data-table-group></template>

      <!-- ── Columna de acciones generada automáticamente ─────────────── -->
      <template
        v-if="visibleRowActions.length"
        #[`item.${actionsKey}`]="{ item }"
      >
        <!-- Desktop: botones con tooltip alineados al centro -->
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

        <!-- Móvil: menú de 3 puntos alineado a la derecha -->
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
            <!-- Col 1: Filas por página -->
            <v-col cols="12" md="4" class="d-flex align-center ga-2">
              <span class="text-caption text-grey-darken-1 text-no-wrap"
                >Filas por página:</span
              >
              <v-select
                v-model="internalItemsPerPage"
                :items="rowsPerPageOptions"
                density="compact"
                variant="outlined"
                hide-details
                class="flex-grow-0"
                style="min-width: 75px; max-width: 90px"
                @update:model-value="onItemsPerPageChange"
              />
            </v-col>

            <!-- Móvil: info -->
            <v-col cols="12" class="d-flex d-md-none justify-center">
              <span class="text-caption text-grey-darken-1">{{
                paginationInfo
              }}</span>
            </v-col>

            <!-- Desktop: paginación centrada -->
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
            </v-col>
            <v-col v-else md="4" class="d-none d-md-block" />

            <!-- Col 3: info desktop | paginación móvil -->
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
  page: { type: Number, default: 1 },
  itemsPerPage: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50] },
  searchable: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: "Buscar..." },

  /**
   * rowActions — acciones por fila.
   *
   * Cada acción:
   * {
   *   label:      string             — texto del tooltip (desktop) y del ítem (móvil)
   *   icon:       string             — ícono mdi (ej. 'mdi-pencil')
   *   color?:     string             — color Vuetify (default: 'grey-darken-1')
   *   permission?: string            — si se define, la acción solo aparece si
   *                                    authStore.hasPermission(permission) === true
   *   action:     (item) => void     — función que recibe el item de la fila
   * }
   *
   * Ejemplo:
   * [
   *   { label: 'Editar',    icon: 'mdi-pencil', permission: 'clientes.editar',    action: (item) => editar(item)    },
   *   { label: 'Eliminar',  icon: 'mdi-delete', color: 'error',
   *     permission: 'clientes.eliminar', action: (item) => eliminar(item) },
   * ]
   */
  rowActions: {
    type: Array,
    default: () => [],
  },

  /**
   * actionsKey — key de la columna de acciones.
   * Cambia solo si ya tienes una columna con key 'acciones'.
   */
  actionsKey: {
    type: String,
    default: "acciones",
  },
});

const emit = defineEmits(["load"]);

const authStore = useAuthStore();
const { mdAndUp } = useDisplay();

// ── Acciones visibles (filtra por permiso) ────────────────────────────────────
const visibleRowActions = computed(() =>
  props.rowActions.filter(
    (a) => !a.permission || authStore.hasPermission(a.permission),
  ),
);

/**
 * Agrega automáticamente la columna de acciones a los headers
 * si rowActions tiene al menos una acción visible.
 * No la agrega si el padre ya incluyó una columna con el mismo key.
 */
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

// ── Estado interno ────────────────────────────────────────────────────────────
const internalPage = ref(props.page);
const internalItemsPerPage = ref(props.itemsPerPage);
const currentSortBy = ref(null);
const searchQuery = ref("");

// ── Paginación ────────────────────────────────────────────────────────────────
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

<style scoped>
:deep(.v-data-table__td--select-row),
:deep(
  [data-v-data-table-mobile]
    .v-data-table-header__content:has(.v-data-table-column-title)
) {
  display: none;
}

</style>
