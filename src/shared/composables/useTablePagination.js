import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

export function isVisible(obj) {
  if (obj.visible === undefined) return true
  if (typeof obj.visible === 'function') return obj.visible()
  return obj.visible === true
}

export function useTablePagination({
  headers,
  totalItems,
  visibleRowActions,
  itemsPerPage = 10,
  actionsKey = 'acciones',
  actionsWidth = '150px',
  onChange,
} = {}) {
  const { mdAndUp } = useDisplay()

  const tableOptions = ref({ page: 1, itemsPerPage, sortBy: [] })
  const mobileSortKey = ref(null)
  const mobileSortOrder = ref('asc')

  const computedHeaders = computed(() => {
    const visibleHeaders = headers.value.filter((h) => isVisible(h))
    const hasActionsCol = visibleHeaders.some((h) => h.key === actionsKey)
    if (visibleRowActions.value.length === 0 || hasActionsCol) return visibleHeaders
    return [
      ...visibleHeaders,
      {
        title: 'Acciones',
        key: actionsKey,
        sortable: false,
        align: 'center',
        width: actionsWidth,
      },
    ]
  })

  const sortableHeaders = computed(() =>
    headers.value.filter((h) => isVisible(h) && h.sortable !== false),
  )

  const totalPages = computed(
    () => Math.ceil(totalItems.value / tableOptions.value.itemsPerPage) || 1,
  )

  const paginationInfo = computed(() => {
    const total = totalItems.value
    if (total === 0) return 'Sin registros'
    const start = (tableOptions.value.page - 1) * tableOptions.value.itemsPerPage + 1
    const end = Math.min(tableOptions.value.page * tableOptions.value.itemsPerPage, total)
    return `${start}–${end} de ${total}`
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

  function goToPage(page) {
    if (page < 1 || page > totalPages.value || page === tableOptions.value.page) return
    tableOptions.value = { ...tableOptions.value, page }
    onChange?.('page')
  }

  function onItemsPerPageChange() {
    tableOptions.value = { ...tableOptions.value, page: 1 }
    onChange?.('itemsPerPage')
  }

  function onMobileSortChange() {
    const sortBy = mobileSortKey.value
      ? [{ key: mobileSortKey.value, order: mobileSortOrder.value }]
      : []
    tableOptions.value = { ...tableOptions.value, page: 1, sortBy }
    onChange?.('sort')
  }

  function applyOptionsUpdate({ page, itemsPerPage: newItemsPerPage, sortBy }) {
    const newSortBy = mdAndUp.value ? (sortBy ?? []) : tableOptions.value.sortBy
    const changed =
      page !== tableOptions.value.page ||
      newItemsPerPage !== tableOptions.value.itemsPerPage ||
      JSON.stringify(newSortBy) !== JSON.stringify(tableOptions.value.sortBy)
    tableOptions.value = { page, itemsPerPage: newItemsPerPage, sortBy: newSortBy }
    return changed
  }

  function resetPagination() {
    tableOptions.value = { page: 1, itemsPerPage, sortBy: [] }
    mobileSortKey.value = null
    mobileSortOrder.value = 'asc'
  }

  return {
    tableOptions,
    mobileSortKey,
    mobileSortOrder,
    isVisible,
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
  }
}
