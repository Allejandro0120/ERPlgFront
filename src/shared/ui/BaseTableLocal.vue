<template>
  <v-card class="rounded-lg bg-white overflow-hidden" elevation="0">
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

    <v-card-text v-if="searchable || $slots.filters" class="py-3 px-4 border-b">
      <v-row align="center" density="comfortable">
        <v-col v-if="searchable" cols="12" lg="3" md="4" sm="6">
          <v-text-field
            :id="controlNames.search"
            v-model="searchQuery"
            aria-label="Buscar"
            clearable
            density="compact"
            hide-details
            :name="controlNames.search"
            :placeholder="searchPlaceholder"
            prepend-inner-icon="$search"
            variant="outlined"
            @click:clear="onClear"
            @keyup.enter="onSearch"
          />
        </v-col>

        <slot name="filters" />

        <v-col v-if="sortableHeaders.length > 0" class="d-sm-none" cols="12">
          <div class="d-flex ga-2">
            <v-select
              :id="controlNames.mobileSort"
              v-model="mobileSortKey"
              clearable
              density="compact"
              :disabled="loading"
              hide-details
              item-title="title"
              item-value="key"
              :items="sortableHeaders"
              label="Ordenar por"
              :name="controlNames.mobileSort"
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

        <v-col class="d-none d-sm-block" />

        <v-col class="d-flex ga-2" cols="12" sm="auto">
          <v-btn
            v-if="searchable || showSearchButton"
            class="text-none flex-1-1 flex-sm-0-0"
            color="primary"
            :disabled="loading"
            :loading="loading"
            prepend-icon="$search"
            variant="flat"
            @click="onSearch"
          >
            Buscar
          </v-btn>
          <v-btn
            class="text-none flex-1-1 flex-sm-0-0"
            color="primary"
            :disabled="loading"
            :loading="loading"
            prepend-icon="mdi-refresh"
            variant="tonal"
            @click="onRefresh"
          >
            Refrescar
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <v-data-table
      v-bind="$attrs"
      class="bg-transparent"
      :headers="computedHeaders"
      hover
      :items="pagedItems"
      :items-length="sortedItems.length"
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

      <template v-if="visibleRowActions.length > 0" #[`item.${actionsKey}`]="{ item }">
        <div class="d-none d-md-flex align-center justify-center ga-2">
          <template v-for="accion in visibleRowActions" :key="accion.label">
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
                v-for="accion in visibleRowActions"
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

      <template #bottom>
        <v-divider />
        <v-container class="px-4 py-3" fluid>
          <v-row align="center" class="ga-2 ga-md-0" density="compact">
            <v-col class="d-flex align-center ga-2" cols="12" md="4">
              <span class="text-caption text-grey-darken-1 text-no-wrap">Filas por página:</span>
              <v-select
                :id="controlNames.itemsPerPage"
                v-model="tableOptions.itemsPerPage"
                aria-label="Filas por página"
                class="flex-grow-0"
                density="compact"
                :disabled="loading"
                hide-details
                :items="rowsPerPageOptions"
                :name="controlNames.itemsPerPage"
                style="min-width: 75px; max-width: 90px"
                variant="outlined"
                @update:model-value="onItemsPerPageChange"
              />
            </v-col>

            <v-col class="d-flex d-md-none justify-center" cols="12">
              <span class="text-caption text-grey-darken-1">{{ paginationInfo }}</span>
            </v-col>

            <v-col
              v-if="totalPages > 1"
              class="d-none d-md-flex align-center justify-center ga-1"
              md="4"
            >
              <v-btn
                aria-label="Primera página"
                color="grey-darken-2"
                :disabled="tableOptions.page === 1 || loading"
                icon="mdi-page-first"
                size="small"
                variant="text"
                @click="goToPage(1)"
              />
              <v-btn
                aria-label="Página anterior"
                color="grey-darken-2"
                :disabled="tableOptions.page === 1 || loading"
                icon="mdi-chevron-left"
                size="small"
                variant="text"
                @click="goToPage(tableOptions.page - 1)"
              />
              <template v-for="p in visiblePages" :key="p">
                <span v-if="p === '...'" class="text-caption text-grey px-1">…</span>
                <v-btn
                  v-else
                  :aria-label="`Ir a la página ${p}`"
                  class="px-2"
                  :color="p === tableOptions.page ? 'primary' : 'grey-darken-2'"
                  :disabled="loading"
                  size="small"
                  style="min-width: 32px"
                  :variant="p === tableOptions.page ? 'flat' : 'text'"
                  @click="goToPage(p)"
                >
                  {{ p }}
                </v-btn>
              </template>
              <v-btn
                aria-label="Página siguiente"
                color="grey-darken-2"
                :disabled="tableOptions.page === totalPages || loading"
                icon="mdi-chevron-right"
                size="small"
                variant="text"
                @click="goToPage(tableOptions.page + 1)"
              />
              <v-btn
                aria-label="Última página"
                color="grey-darken-2"
                :disabled="tableOptions.page === totalPages || loading"
                icon="mdi-page-last"
                size="small"
                variant="text"
                @click="goToPage(totalPages)"
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
                  :disabled="tableOptions.page === 1 || loading"
                  icon="mdi-page-first"
                  size="small"
                  variant="text"
                  @click="goToPage(1)"
                />
                <v-btn
                  aria-label="Página anterior"
                  color="grey-darken-2"
                  :disabled="tableOptions.page === 1 || loading"
                  icon="mdi-chevron-left"
                  size="small"
                  variant="text"
                  @click="goToPage(tableOptions.page - 1)"
                />
                <template v-for="p in visiblePages" :key="p">
                  <span v-if="p === '...'" class="text-caption text-grey px-1">…</span>
                  <v-btn
                    v-else
                    :aria-label="`Ir a la página ${p}`"
                    class="px-2"
                    :color="p === tableOptions.page ? 'primary' : 'grey-darken-2'"
                    :disabled="loading"
                    size="small"
                    style="min-width: 32px"
                    :variant="p === tableOptions.page ? 'flat' : 'text'"
                    @click="goToPage(p)"
                  >
                    {{ p }}
                  </v-btn>
                </template>
                <v-btn
                  aria-label="Página siguiente"
                  color="grey-darken-2"
                  :disabled="tableOptions.page === totalPages || loading"
                  icon="mdi-chevron-right"
                  size="small"
                  variant="text"
                  @click="goToPage(tableOptions.page + 1)"
                />
                <v-btn
                  aria-label="Última página"
                  color="grey-darken-2"
                  :disabled="tableOptions.page === totalPages || loading"
                  icon="mdi-page-last"
                  size="small"
                  variant="text"
                  @click="goToPage(totalPages)"
                />
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
  import { computed, getCurrentInstance, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useAuthStore } from '@/stores/auth.store'

  defineOptions({ inheritAttrs: false })

  const props = defineProps({
    title: { type: String, default: '' },
    headers: { type: Array, required: true },
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    emptyText: { type: String, default: 'No hay registros para mostrar.' },
    loadingText: { type: String, default: 'Cargando...' },
    itemsPerPage: { type: Number, default: 10 },
    rowsPerPageOptions: { type: Array, default: () => [5, 10, 25, 50] },
    searchable: { type: Boolean, default: false },
    showSearchButton: { type: Boolean, default: false },
    searchPlaceholder: { type: String, default: 'Buscar...' },
    rowActions: { type: Array, default: () => [] },
    actionsKey: { type: String, default: 'acciones' },
    actionsWidth: { type: String, default: '150px' },
  })

  const authStore = useAuthStore()
  const { mdAndUp } = useDisplay()
  const instanceUid = getCurrentInstance()?.uid ?? '0'

  const controlNames = {
    search: `search-input-local-${instanceUid}`,
    mobileSort: `mobile-sort-key-local-${instanceUid}`,
    itemsPerPage: `items-per-page-local-${instanceUid}`,
  }

  function isVisible(obj) {
    if (obj.visible === undefined) return true
    if (typeof obj.visible === 'function') return obj.visible()
    return obj.visible === true
  }

  const visibleRowActions = computed(() =>
    props.rowActions.filter(
      (a) => isVisible(a) && (!a.permission || authStore.hasPermission(a.permission)),
    ),
  )

  const computedHeaders = computed(() => {
    const visibleHeaders = props.headers.filter((h) => isVisible(h))
    const hasActionsCol = visibleHeaders.some((h) => h.key === props.actionsKey)
    if (visibleRowActions.value.length === 0 || hasActionsCol) return visibleHeaders
    return [
      ...visibleHeaders,
      {
        title: 'Acciones',
        key: props.actionsKey,
        sortable: false,
        align: 'center',
        width: props.actionsWidth,
      },
    ]
  })

  const sortableHeaders = computed(() =>
    props.headers.filter((h) => isVisible(h) && h.sortable !== false),
  )

  const tableOptions = ref({
    page: 1,
    itemsPerPage: props.itemsPerPage,
    sortBy: [],
  })
  const searchQuery = ref('')
  const appliedSearch = ref('')
  const mobileSortKey = ref(null)
  const mobileSortOrder = ref('asc')

  const filteredItems = computed(() => {
    const q = appliedSearch.value.trim().toLowerCase()
    if (!q) return props.items
    const keys = props.headers.filter((h) => h.searchable).map((h) => h.key)
    if (keys.length === 0) return props.items
    return props.items.filter((item) =>
      keys.some((key) =>
        String(item[key] ?? '')
          .toLowerCase()
          .includes(q),
      ),
    )
  })

  const sortedItems = computed(() => {
    const sortBy = tableOptions.value.sortBy?.[0]
    if (!sortBy) return filteredItems.value
    const { key, order } = sortBy
    const factor = order === 'desc' ? -1 : 1
    return [...filteredItems.value].toSorted((a, b) => {
      const va = a?.[key]
      const vb = b?.[key]
      if (va == null && vb == null) return 0
      if (va == null) return -1 * factor
      if (vb == null) return 1 * factor
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor
      return String(va).localeCompare(String(vb)) * factor
    })
  })

  const pagedItems = computed(() => {
    const start = (tableOptions.value.page - 1) * tableOptions.value.itemsPerPage
    return sortedItems.value.slice(start, start + tableOptions.value.itemsPerPage)
  })

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(sortedItems.value.length / tableOptions.value.itemsPerPage)),
  )

  const paginationInfo = computed(() => {
    if (sortedItems.value.length === 0) return 'Sin registros'
    const start = (tableOptions.value.page - 1) * tableOptions.value.itemsPerPage + 1
    const end = Math.min(
      tableOptions.value.page * tableOptions.value.itemsPerPage,
      sortedItems.value.length,
    )
    return `${start}–${end} de ${sortedItems.value.length}`
  })

  const visiblePages = computed(() => {
    const total = totalPages.value
    const current = tableOptions.value.page
    if (!mdAndUp.value) return [current]
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const delta = 1
    const range = []
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i)
    }
    if (range[0] > 2) range.unshift('...')
    if (range.at(-1) < total - 1) range.push('...')
    return [1, ...range, total]
  })

  watch(
    () => totalPages.value,
    (total) => {
      if (tableOptions.value.page > total) {
        tableOptions.value = { ...tableOptions.value, page: total }
      }
    },
  )

  function goToPage(page) {
    if (page < 1 || page > totalPages.value || page === tableOptions.value.page) return
    tableOptions.value = { ...tableOptions.value, page }
  }

  function onItemsPerPageChange() {
    tableOptions.value = { ...tableOptions.value, page: 1 }
  }

  function onMobileSortChange() {
    const sortBy = mobileSortKey.value
      ? [{ key: mobileSortKey.value, order: mobileSortOrder.value }]
      : []
    tableOptions.value = { ...tableOptions.value, page: 1, sortBy }
  }

  let initialized = false
  function onOptionsUpdate({ page, itemsPerPage, sortBy }) {
    if (!initialized) {
      initialized = true
      return
    }
    const newSortBy = mdAndUp.value ? (sortBy ?? []) : tableOptions.value.sortBy
    const changed =
      page !== tableOptions.value.page ||
      itemsPerPage !== tableOptions.value.itemsPerPage ||
      JSON.stringify(newSortBy) !== JSON.stringify(tableOptions.value.sortBy)
    tableOptions.value = { page, itemsPerPage, sortBy: newSortBy }
    if (changed) {
      // No emit needed; state drives table
    }
  }

  function onSearch() {
    appliedSearch.value = searchQuery.value.trim()
    tableOptions.value = { ...tableOptions.value, page: 1 }
  }

  function onClear() {
    searchQuery.value = ''
    appliedSearch.value = ''
    tableOptions.value = { ...tableOptions.value, page: 1 }
  }

  function onRefresh() {
    tableOptions.value = { ...tableOptions.value }
  }

  function reset() {
    tableOptions.value = {
      page: 1,
      itemsPerPage: props.itemsPerPage,
      sortBy: [],
    }
    mobileSortKey.value = null
    mobileSortOrder.value = 'asc'
    searchQuery.value = ''
    appliedSearch.value = ''
  }

  defineExpose({ reset })
</script>

<style scoped>
  :deep(.v-data-table-headers--mobile) {
    display: none !important;
  }
</style>
