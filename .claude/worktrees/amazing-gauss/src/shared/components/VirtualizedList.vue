<template>
  <div 
    ref="containerRef"
    class="virtualized-list"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- Virtual spacer before visible items -->
    <div 
      v-if="offsetY > 0" 
      :style="{ height: `${offsetY}px` }"
      class="virtualized-list__spacer"
    ></div>

    <!-- Visible items -->
    <div
      v-for="(item, index) in visibleItems"
      :key="keyExtractor(item.data, item.index)"
      :style="getItemStyle(item.index)"
      class="virtualized-list__item"
    >
      <slot 
        name="item"
        :item="item.data"
        :index="item.index"
        :isVisible="true"
      >
        {{ item.data }}
      </slot>
    </div>

    <!-- Virtual spacer after visible items -->
    <div 
      v-if="offsetYEnd > 0" 
      :style="{ height: `${offsetYEnd}px` }"
      class="virtualized-list__spacer"
    ></div>

    <!-- Loading indicator -->
    <div 
      v-if="isLoading && visibleItems.length === 0"
      class="virtualized-list__loading"
    >
      <slot name="loading">
        <div class="virtualized-list__spinner"></div>
        <span>Loading...</span>
      </slot>
    </div>

    <!-- Empty state -->
    <div 
      v-if="!isLoading && items.length === 0"
      class="virtualized-list__empty"
    >
      <slot name="empty">
        <p>No items to display</p>
      </slot>
    </div>

    <!-- Load more trigger -->
    <div 
      v-if="hasMore && !isLoading"
      ref="loadMoreRef"
      class="virtualized-list__load-more"
    >
      <slot name="load-more" :load-more="loadMore">
        <button @click="loadMore" class="virtualized-list__load-more-btn">
          Load More
        </button>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { throttle } from '@/core/utils'
import { UI_CONFIG } from '@/core/constants'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    default: UI_CONFIG.VIRTUALIZED_ITEM_HEIGHT
  },
  containerHeight: {
    type: Number,
    default: 400
  },
  keyExtractor: {
    type: Function,
    default: (item, index) => index
  },
  overscan: {
    type: Number,
    default: 5
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  threshold: {
    type: Number,
    default: 200
  }
})

const emit = defineEmits(['load-more', 'scroll'])

// Refs
const containerRef = ref(null)
const loadMoreRef = ref(null)
const scrollTop = ref(0)

// Intersection Observer for load more
let loadMoreObserver = null

// Computed properties
const containerStyle = computed(() => ({
  height: `${props.containerHeight}px`,
  overflowY: 'auto',
  position: 'relative'
}))

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

const visibleStartIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
})

const visibleEndIndex = computed(() => {
  const containerHeight = props.containerHeight
  const endIndex = Math.min(
    props.items.length - 1,
    Math.floor((scrollTop.value + containerHeight) / props.itemHeight) + props.overscan
  )
  return Math.max(visibleStartIndex.value, endIndex)
})

const visibleItems = computed(() => {
  const start = visibleStartIndex.value
  const end = visibleEndIndex.value
  
  const items = []
  for (let i = start; i <= end; i++) {
    if (props.items[i]) {
      items.push({
        data: props.items[i],
        index: i
      })
    }
  }
  
  return items
})

const offsetY = computed(() => {
  return visibleStartIndex.value * props.itemHeight
})

const offsetYEnd = computed(() => {
  const remainingItems = props.items.length - visibleEndIndex.value - 1
  return Math.max(0, remainingItems * props.itemHeight)
})

// Methods
const getItemStyle = (index) => ({
  height: `${props.itemHeight}px`,
  position: 'relative'
})

const handleScroll = throttle((event) => {
  scrollTop.value = event.target.scrollTop
  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollLeft: event.target.scrollLeft,
    containerHeight: props.containerHeight,
    totalHeight: totalHeight.value
  })
}, 16) // ~60fps

const loadMore = () => {
  if (!props.isLoading && props.hasMore) {
    emit('load-more')
  }
}

const scrollToIndex = (index, align = 'auto') => {
  if (!containerRef.value) return
  
  const targetScrollTop = index * props.itemHeight
  const containerHeight = props.containerHeight
  const currentScrollTop = scrollTop.value
  
  let newScrollTop = targetScrollTop
  
  if (align === 'start') {
    newScrollTop = targetScrollTop
  } else if (align === 'end') {
    newScrollTop = targetScrollTop - containerHeight + props.itemHeight
  } else if (align === 'center') {
    newScrollTop = targetScrollTop - containerHeight / 2 + props.itemHeight / 2
  } else if (align === 'auto') {
    // Only scroll if item is not visible
    if (targetScrollTop < currentScrollTop) {
      newScrollTop = targetScrollTop
    } else if (targetScrollTop + props.itemHeight > currentScrollTop + containerHeight) {
      newScrollTop = targetScrollTop - containerHeight + props.itemHeight
    } else {
      return // Item is already visible
    }
  }
  
  containerRef.value.scrollTop = Math.max(0, Math.min(newScrollTop, totalHeight.value - containerHeight))
}

const scrollToTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = totalHeight.value
  }
}

const setupLoadMoreObserver = () => {
  if (!props.hasMore || !loadMoreRef.value) return
  
  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !props.isLoading) {
          loadMore()
        }
      })
    },
    {
      root: containerRef.value,
      rootMargin: `${props.threshold}px`,
      threshold: 0.1
    }
  )
  
  loadMoreObserver.observe(loadMoreRef.value)
}

// Watch for changes that require re-setup
watch(
  () => props.hasMore,
  async (hasMore) => {
    if (hasMore) {
      await nextTick()
      setupLoadMoreObserver()
    } else {
      loadMoreObserver?.disconnect()
    }
  }
)

watch(
  () => loadMoreRef.value,
  async (newRef) => {
    if (newRef && props.hasMore) {
      await nextTick()
      setupLoadMoreObserver()
    }
  }
)

// Lifecycle
onMounted(async () => {
  await nextTick()
  
  if (props.hasMore) {
    setupLoadMoreObserver()
  }
})

onUnmounted(() => {
  loadMoreObserver?.disconnect()
})

// Expose methods to parent
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  getVisibleRange: () => ({
    start: visibleStartIndex.value,
    end: visibleEndIndex.value
  })
})
</script>

<style scoped>
.virtualized-list {
  width: 100%;
  position: relative;
  contain: strict;
}

.virtualized-list__spacer {
  pointer-events: none;
}

.virtualized-list__item {
  width: 100%;
  box-sizing: border-box;
}

.virtualized-list__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  color: var(--color-gray-600, #6b7280);
}

.virtualized-list__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-gray-300, #d1d5db);
  border-top: 2px solid var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.virtualized-list__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  color: var(--color-gray-500, #6b7280);
  text-align: center;
}

.virtualized-list__load-more {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.virtualized-list__load-more-btn {
  padding: 0.5rem 1rem;
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.virtualized-list__load-more-btn:hover {
  background-color: var(--color-primary-dark, #2563eb);
}

.virtualized-list__load-more-btn:disabled {
  background-color: var(--color-gray-400, #9ca3af);
  cursor: not-allowed;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Smooth scrolling */
.virtualized-list {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.virtualized-list::-webkit-scrollbar {
  width: 8px;
}

.virtualized-list::-webkit-scrollbar-track {
  background: var(--color-gray-100, #f5f5f5);
  border-radius: 4px;
}

.virtualized-list::-webkit-scrollbar-thumb {
  background: var(--color-gray-400, #9ca3af);
  border-radius: 4px;
}

.virtualized-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-gray-500, #6b7280);
}
</style>