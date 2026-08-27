<template>
  <v-card class="rounded-lg bg-white overflow-hidden" elevation="0">
    <!-- Header: título + acciones -->
    <v-card-text
      v-if="$slots.title || title || $slots.actions"
      class="d-flex align-center justify-space-between py-4 px-4 border-b"
    >
      <div v-if="$slots.title || title" class="text-h6 font-weight-medium text-grey-darken-4">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="$slots.actions" class="d-flex align-center ga-2">
        <slot name="actions" />
      </div>
    </v-card-text>

    <!-- Barra: buscador + filtros + botones -->
    <v-card-text v-if="searchable || $slots.filters" class="py-3 px-4 border-b">
      <v-row align="center" density="comfortable">
        <!-- Buscador -->
        <v-col v-if="searchable" cols="12" lg="3" md="4" sm="6">
          <v-text-field
            id="search-input"
            v-model="searchQuery"
            aria-label="Buscar"
            clearable
            density="compact"
            :disabled="loading"
            hide-details
            name="searchQuery"
            :placeholder="searchPlaceholder"
            prepend-inner-icon="$search"
            variant="outlined"
            @click:clear="onClear"
            @keyup.enter="onSearch"
            @update:model-value="onSearchInput"
          />
        </v-col>

        <!-- Filtros: el padre controla el responsive con v-col cols -->
        <slot name="filters" />

        <!-- Ordenar por — solo móvil -->
        <v-col v-if="sortableHeaders.length > 0" class="d-sm-none" cols="12">
          <div class="d-flex ga-2">
            <v-select
              id="mobile-sort-key"
              v-model="mobileSortKey"
              clearable
              density="compact"
              :disabled="loading"
              hide-details
              item-title="title"
              item-value="key"
              :items="sortableHeaders"
              label="Ordenar por"
              name="mobileSortKey"
              variant="outlined"
              @update:model-value="onMobileSortChange"
            />
            <v-btn-toggle
              v-if="mobileSortKey"
              v-model="mobileSortOrder"
              color="primary"
              density="compact"
              mandatory
              variant="outlined"
              @update:model-value="onMobileSortChange"
            >
              <v-btn size="small" value="asc">
                <v-icon size="18">{{ 'mdi-arrow-up' }}</v-icon>
              </v-btn>
              <v-btn size="small" value="desc">
                <v-icon size="18">{{ 'mdi-arrow-down' }}</v-icon>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>

        <!-- Spacer desktop -->
        <v-col class="d-none d-sm-block" />

        <!-- Botones: Buscar + Refrescar -->
        <v-col class="d-flex ga-2" cols="12" sm="auto">
          <v-btn
            v-if="searchable || showSearchButton"
            class="text-none flex-1-1 flex-sm-0-0"
            color="primary"
            :disabled="loading"
            :loading="loading && actionSource === 'search'"
            prepend-icon="$search"
            variant="flat"
            @click="onSearch"
          >
            Buscar
          </v-btn>
          <v-btn
            v-if="!hideRefreshButton"
            class="text-none flex-1-1 flex-sm-0-0"
            color="primary"
            :disabled="loading"
            :loading="loading && actionSource === 'refresh'"
            prepend-icon="mdi-refresh"
            variant="tonal"
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
      class="bg-transparent"
      :headers="computedHeaders"
      hover
      :items="items"
      :items-length="totalItems"
      :items-per-page="tableOptions.itemsPerPage"
      :loading="loading"
      :loading-text="loadingText"
      mobile-breakpoint="md"
      :no-data-text="emptyText"
      :page="tableOptions.page"
      :sort-by="tableOptions.sortBy"
      @update:options="onOptionsUpdate"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>

      <!-- Columna de acciones -->
      <template v-if="visibleRowActions.length > 0" #[`item.${actionsKey}`]="{ item }">
        <TableRowActions :actions="getVisibleActions(item)" :item="item" />
      </template>

      <!-- Footer -->
      <template #bottom>
        <TablePaginationFooter
          :items-per-page="tableOptions.itemsPerPage"
          :loading="loading"
          :page="tableOptions.page"
          :pagination-info="paginationInfo"
          :rows-per-page-options="rowsPerPageOptions"
          :total-pages="totalPages"
          :visible-pages="visiblePages"
          @go-to-page="goToPage"
          @update:items-per-page="
            (val) => {
              tableOptions.itemsPerPage = val
              onItemsPerPageChange()
            }
          "
        />
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useDebounce } from '@/shared/composables/useDebounce'
  import { useTablePagination } from '@/shared/composables/useTablePagination'
  import TablePaginationFooter from '@/shared/ui/TablePaginationFooter.vue'
  import TableRowActions from '@/shared/ui/TableRowActions.vue'
  import { useAuthStore } from '@/stores/authStore'

  defineOptions({ inheritAttrs: false })

  const props = defineProps({
    title: { type: String, default: '' },
    headers: { type: Array, required: true },
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    emptyText: { type: String, default: 'No hay registros para mostrar.' },
    loadingText: { type: String, default: 'Cargando...' },
    totalItems: { type: Number, default: 0 },
    itemsPerPage: { type: Number, default: 10 },
    rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50] },
    searchable: { type: Boolean, default: false },
    searchPlaceholder: { type: String, default: 'Buscar...' },
    showSearchButton: { type: Boolean, default: false },
    hideRefreshButton: { type: Boolean, default: false },
    rowActions: { type: Array, default: () => [] },
    actionsKey: { type: String, default: 'acciones' },
    actionsWidth: { type: String, default: '150px' },
    autoLoad: { type: Boolean, default: true },
  })

  const emit = defineEmits(['load'])

  const authStore = useAuthStore()

  const actionSource = ref(null)

  const visibleRowActions = computed(() =>
    props.rowActions.filter(
      (a) => a.visible !== false && (!a.permission || authStore.hasPermission(a.permission)),
    ),
  )
  function getVisibleActions(item) {
    return props.rowActions.filter((a) => {
      const visible =
        a.visible === undefined
          ? true
          : typeof a.visible === 'function'
            ? a.visible(item)
            : a.visible
      return visible && (!a.permission || authStore.hasPermission(a.permission))
    })
  }

  // ── Estado central ────────────────────────────────────────────────────────────
  const {
    tableOptions,
    mobileSortKey,
    mobileSortOrder,
    computedHeaders,
    sortableHeaders,
    totalPages,
    paginationInfo,
    visiblePages,
    goToPage,
    onItemsPerPageChange,
    onMobileSortChange,
    applyOptionsUpdate,
    resetPagination,
  } = useTablePagination({
    headers: computed(() => props.headers),
    totalItems: computed(() => props.totalItems),
    visibleRowActions,
    itemsPerPage: props.itemsPerPage,
    actionsKey: props.actionsKey,
    actionsWidth: props.actionsWidth,
    onChange: () => emitLoad(),
  })

  const searchQuery = ref('')
  const appliedSearch = ref('') // término que se mandó a la API

  // Resetear a página 1 cuando cambia la búsqueda en tiempo real
  watch(
    () => appliedSearch.value,
    (newQuery, oldQuery) => {
      if (newQuery !== oldQuery && tableOptions.value.page !== 1) {
        tableOptions.value = { ...tableOptions.value, page: 1 }
      }
    },
  )

  watch(
    () => props.loading,
    (val) => {
      if (!val) actionSource.value = null // resetea cuando termina la carga
    },
  )

  function emitLoad() {
    emit('load', {
      page: tableOptions.value.page,
      itemsPerPage: tableOptions.value.itemsPerPage,
      sortByField: tableOptions.value.sortBy?.[0]?.key || '',
      sortOrder: tableOptions.value.sortBy?.[0]?.order || 'asc',
      search: appliedSearch.value || null,
    })
  }

  let initialized = false

  function onOptionsUpdate(options) {
    if (!initialized) {
      initialized = true
      return
    }

    if (props.loading) return // ← bloquea si está cargando

    if (applyOptionsUpdate(options)) emitLoad()
  }

  function onSearch() {
    actionSource.value = 'search'
    appliedSearch.value = searchQuery.value.trim() // ← confirma el término
    tableOptions.value = { ...tableOptions.value, page: 1 }
    emitLoad()
  }

  const { debounced: debouncedSearch, cancel: cancelDebouncedSearch } = useDebounce(onSearch, 800)
  function onSearchInput() {
    debouncedSearch()
  }

  function onClear() {
    cancelDebouncedSearch()
    searchQuery.value = ''
    appliedSearch.value = ''
    tableOptions.value = { ...tableOptions.value, page: 1 }
    emitLoad()
  }

  function onRefresh() {
    actionSource.value = 'refresh'
    emitLoad()
  }

  function reset() {
    resetPagination()
    emitLoad()
  }

  defineExpose({ reset, load: emitLoad })

  onMounted(() => {
    if (props.autoLoad) emitLoad()
  })
</script>

<style scoped>
  :deep(.v-data-table-headers--mobile) {
    display: none !important;
  }
  :deep(tbody tr:nth-child(odd)) {
    background-color: rgba(var(--v-theme-primary), 0.04);
  }

  :deep(tbody tr:nth-child(even)) {
    background-color: white;
  }
</style>
