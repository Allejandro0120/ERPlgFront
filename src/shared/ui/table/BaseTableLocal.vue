<template>
  <v-card class="rounded-lg bg-white overflow-hidden" elevation="0">
    <v-card-text
      v-if="$slots.title || title || $slots.titleButton || titleButton || $slots.actions"
      class="d-flex align-center justify-space-between py-4 px-4 border-b"
    >
      <div
        v-if="$slots.title || title"
        class="text-h5 font-weight-bold text-grey-darken-4 d-flex align-center ga-2"
      >
        <slot name="title">{{ title }}</slot>
        <slot name="chip" />
      </div>
      <div
        v-if="$slots.titleButton || titleButton || $slots.actions"
        class="d-flex align-center ga-2"
      >
        <slot name="titleButton">
          <v-btn
            v-if="visibleTitleButton"
            class="text-none"
            :color="titleButton.color || 'primary'"
            :disabled="titleButton.disabled"
            :loading="titleButton.loading"
            :prepend-icon="titleButton.icon"
            size="small"
            :variant="titleButton.variant || 'flat'"
            @click="titleButton.action?.()"
          >
            {{ titleButton.label }}
          </v-btn>
        </slot>
        <slot name="actions" />
      </div>
    </v-card-text>

    <v-card-text v-if="searchable || $slots.filters" class="py-3 px-2 mb-4">
      <v-row align="center" density="comfortable">
        <v-col v-if="searchable" cols="12" md="6">
          <v-text-field
            :id="controlNames.search"
            v-model="searchQuery"
            aria-label="Buscar"
            clearable
            density="compact"
            :disabled="loading"
            hide-details
            :name="controlNames.search"
            :placeholder="searchPlaceholder"
            prepend-inner-icon="$search"
            variant="outlined"
            @click:clear="onClear"
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
        <TableRowActions :actions="visibleRowActions" :item="item" />
      </template>

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
    </v-data-table>
  </v-card>
</template>

<script setup>
  import { computed, getCurrentInstance, ref, watch } from 'vue'
  import { isVisible, useTablePagination } from '@/shared/composables/useTablePagination'
  import TablePaginationFooter from '@/shared/ui/table/TablePaginationFooter.vue'
  import TableRowActions from '@/shared/ui/table/TableRowActions.vue'
  import { useAuthStore } from '@/stores/authStore'

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
    // Botón junto al título: { label, icon, color, variant, action, permission, loading, disabled }
    titleButton: { type: Object, default: null },
  })

  const authStore = useAuthStore()
  const instanceUid = getCurrentInstance()?.uid ?? '0'
  const actionSource = ref(null)

  const visibleTitleButton = computed(
    () =>
      !!props.titleButton &&
      (!props.titleButton.permission || authStore.hasPermission(props.titleButton.permission)),
  )

  const controlNames = {
    search: `search-input-local-${instanceUid}`,
    mobileSort: `mobile-sort-key-local-${instanceUid}`,
  }

  const visibleRowActions = computed(() =>
    props.rowActions.filter(
      (a) => isVisible(a) && (!a.permission || authStore.hasPermission(a.permission)),
    ),
  )

  const searchQuery = ref('')

  const filteredItems = computed(() => {
    const q = (searchQuery.value ?? '').trim().toLowerCase()
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

  const totalItemsForPagination = computed(() => sortedItems.value.length)

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
    totalItems: totalItemsForPagination,
    visibleRowActions,
    itemsPerPage: props.itemsPerPage,
    actionsKey: props.actionsKey,
    actionsWidth: props.actionsWidth,
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

  watch(
    () => totalPages.value,
    (total) => {
      if (tableOptions.value.page > total) {
        tableOptions.value = { ...tableOptions.value, page: total }
      }
    },
  )

  watch(
    () => props.loading,
    (val) => {
      if (!val) actionSource.value = null // resetea cuando termina la carga
    },
  )

  watch(searchQuery, () => {
    tableOptions.value = { ...tableOptions.value, page: 1 }
  })

  let initialized = false
  function onOptionsUpdate(options) {
    if (!initialized) {
      initialized = true
      return
    }
    applyOptionsUpdate(options)
  }

  function onClear() {
    searchQuery.value = ''
    tableOptions.value = { ...tableOptions.value, page: 1 }
  }

  function reset() {
    resetPagination()
    searchQuery.value = ''
  }

  defineExpose({ reset })
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
