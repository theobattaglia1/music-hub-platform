/**
 * Shared UI composables for common patterns
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { debounce, throttle } from '@/core/utils'

// Modal management
export function useModal(initialOpen = false) {
  const isOpen = ref(initialOpen)
  const triggerRef = ref(null)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  // Close on escape key
  const handleKeydown = (event) => {
    if (event.key === 'Escape' && isOpen.value) {
      close()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    isOpen: computed(() => isOpen.value),
    open,
    close,
    toggle,
    triggerRef
  }
}

// Search with debouncing
export function useSearch(initialQuery = '', delay = 300) {
  const query = ref(initialQuery)
  const debouncedQuery = ref(initialQuery)
  const isSearching = ref(false)

  const updateDebouncedQuery = debounce((newQuery) => {
    debouncedQuery.value = newQuery
    isSearching.value = false
  }, delay)

  const setQuery = (newQuery) => {
    query.value = newQuery
    isSearching.value = true
    updateDebouncedQuery(newQuery)
  }

  const clear = () => {
    setQuery('')
  }

  return {
    query: computed(() => query.value),
    debouncedQuery: computed(() => debouncedQuery.value),
    isSearching: computed(() => isSearching.value),
    setQuery,
    clear
  }
}

// Pagination
export function usePagination(initialPage = 1, initialPageSize = 20) {
  const currentPage = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const total = ref(0)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  const hasNext = computed(() => currentPage.value < totalPages.value)
  const hasPrevious = computed(() => currentPage.value > 1)
  const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
  const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, total.value))

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = () => {
    if (hasNext.value) {
      currentPage.value++
    }
  }

  const previousPage = () => {
    if (hasPrevious.value) {
      currentPage.value--
    }
  }

  const setPageSize = (newSize) => {
    pageSize.value = newSize
    currentPage.value = 1 // Reset to first page
  }

  const setTotal = (newTotal) => {
    total.value = newTotal
    // Adjust current page if it's beyond the new total
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    }
  }

  const reset = () => {
    currentPage.value = 1
    total.value = 0
  }

  return {
    currentPage: computed(() => currentPage.value),
    pageSize: computed(() => pageSize.value),
    total: computed(() => total.value),
    totalPages,
    hasNext,
    hasPrevious,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    setTotal,
    reset
  }
}

// Sorting
export function useSorting(initialSort = null, initialOrder = 'asc') {
  const sortBy = ref(initialSort)
  const sortOrder = ref(initialOrder)

  const toggleSort = (field) => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortBy.value = field
      sortOrder.value = 'asc'
    }
  }

  const setSorting = (field, order = 'asc') => {
    sortBy.value = field
    sortOrder.value = order
  }

  const clearSorting = () => {
    sortBy.value = null
    sortOrder.value = 'asc'
  }

  const getSortIcon = (field) => {
    if (sortBy.value !== field) return 'sort'
    return sortOrder.value === 'asc' ? 'sort-asc' : 'sort-desc'
  }

  return {
    sortBy: computed(() => sortBy.value),
    sortOrder: computed(() => sortOrder.value),
    toggleSort,
    setSorting,
    clearSorting,
    getSortIcon
  }
}

// Selection (single or multiple)
export function useSelection(multiple = false) {
  const selected = ref(multiple ? [] : null)

  const isSelected = (item) => {
    if (multiple) {
      return selected.value.includes(item)
    }
    return selected.value === item
  }

  const select = (item) => {
    if (multiple) {
      if (!selected.value.includes(item)) {
        selected.value.push(item)
      }
    } else {
      selected.value = item
    }
  }

  const deselect = (item) => {
    if (multiple) {
      const index = selected.value.indexOf(item)
      if (index > -1) {
        selected.value.splice(index, 1)
      }
    } else {
      selected.value = null
    }
  }

  const toggle = (item) => {
    if (isSelected(item)) {
      deselect(item)
    } else {
      select(item)
    }
  }

  const selectAll = (items) => {
    if (multiple) {
      selected.value = [...items]
    }
  }

  const deselectAll = () => {
    if (multiple) {
      selected.value = []
    } else {
      selected.value = null
    }
  }

  const selectedCount = computed(() => {
    if (multiple) {
      return selected.value.length
    }
    return selected.value ? 1 : 0
  })

  const hasSelection = computed(() => {
    if (multiple) {
      return selected.value.length > 0
    }
    return selected.value !== null
  })

  return {
    selected: computed(() => selected.value),
    selectedCount,
    hasSelection,
    isSelected,
    select,
    deselect,
    toggle,
    selectAll,
    deselectAll
  }
}

// Toast notifications
export function useToast() {
  const toasts = ref([])

  const addToast = (toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    }

    toasts.value.push(newToast)

    // Auto remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearToasts = () => {
    toasts.value = []
  }

  // Convenience methods
  const success = (message, options = {}) => {
    return addToast({ ...options, type: 'success', message })
  }

  const error = (message, options = {}) => {
    return addToast({ ...options, type: 'error', message, duration: 0 })
  }

  const warning = (message, options = {}) => {
    return addToast({ ...options, type: 'warning', message })
  }

  const info = (message, options = {}) => {
    return addToast({ ...options, type: 'info', message })
  }

  return {
    toasts: computed(() => toasts.value),
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  }
}

// Loading states
export function useLoading(initialState = false) {
  const isLoading = ref(initialState)
  const loadingCount = ref(0)

  const startLoading = () => {
    loadingCount.value++
    isLoading.value = true
  }

  const stopLoading = () => {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
    if (loadingCount.value === 0) {
      isLoading.value = false
    }
  }

  const setLoading = (state) => {
    isLoading.value = state
    loadingCount.value = state ? 1 : 0
  }

  return {
    isLoading: computed(() => isLoading.value),
    startLoading,
    stopLoading,
    setLoading
  }
}

// Window scroll position
export function useScroll() {
  const x = ref(window.scrollX)
  const y = ref(window.scrollY)

  const updateScroll = throttle(() => {
    x.value = window.scrollX
    y.value = window.scrollY
  }, 16) // ~60fps

  onMounted(() => {
    window.addEventListener('scroll', updateScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', updateScroll)
  })

  const scrollTo = (options) => {
    window.scrollTo(options)
  }

  const scrollToTop = () => {
    scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToElement = (element, options = {}) => {
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', ...options })
    }
  }

  return {
    x: computed(() => x.value),
    y: computed(() => y.value),
    scrollTo,
    scrollToTop,
    scrollToElement
  }
}

// Local storage with reactivity
export function useLocalStorage(key, defaultValue = null) {
  // Initialize with stored value or default
  const storedValue = localStorage.getItem(key)
  const initialValue = storedValue ? JSON.parse(storedValue) : defaultValue
  
  const value = ref(initialValue)

  // Watch for changes and update localStorage
  const setValue = (newValue) => {
    value.value = newValue
    localStorage.setItem(key, JSON.stringify(newValue))
  }

  const removeValue = () => {
    value.value = defaultValue
    localStorage.removeItem(key)
  }

  return {
    value: computed(() => value.value),
    setValue,
    removeValue
  }
}

// Media query matching
export function useMediaQuery(query) {
  const matches = ref(false)
  let mediaQuery = null

  const updateMatches = () => {
    matches.value = mediaQuery?.matches || false
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(query)
    updateMatches()
    mediaQuery.addEventListener('change', updateMatches)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', updateMatches)
  })

  return {
    matches: computed(() => matches.value)
  }
}