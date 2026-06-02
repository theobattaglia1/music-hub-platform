<template>
  <div class="track-list-container">
    <!-- Header with search and controls -->
    <div class="track-list-header">
      <div class="search-section">
        <div class="search-input-wrapper">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search songs..."
            class="search-input"
          >
          <svg v-if="!isSearching" class="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.24c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <div v-else class="search-spinner"></div>
        </div>
        
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-search-btn"
        >
          Clear
        </button>
      </div>

      <div class="controls-section">
        <!-- Sort dropdown -->
        <div class="sort-dropdown">
          <button @click="sortDropdownOpen = !sortDropdownOpen" class="sort-btn">
            Sort: {{ getSortLabel() }}
            <svg class="dropdown-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          <div v-if="sortDropdownOpen" class="dropdown-menu">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              @click="handleSortChange(option.value, option.order)"
              :class="{ active: sortBy === option.value && sortOrder === option.order }"
              class="dropdown-item"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- View mode toggle -->
        <div class="view-toggle">
          <button
            @click="viewMode = 'list'"
            :class="{ active: viewMode === 'list' }"
            class="view-btn"
            title="List view"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>
          <button
            @click="viewMode = 'grid'"
            :class="{ active: viewMode === 'grid' }"
            class="view-btn"
            title="Grid view"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
            </svg>
          </button>
        </div>

        <!-- Selection info -->
        <div v-if="hasSelection" class="selection-info">
          {{ selectedCount }} selected
          <button @click="deselectAll" class="deselect-btn">
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && !songs.length" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading songs...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading && !songs.length" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
      <h3>No songs found</h3>
      <p v-if="searchQuery">Try adjusting your search terms</p>
      <p v-else>Add some songs to get started</p>
    </div>

    <!-- Track list -->
    <div v-else class="track-list-content">
      <!-- List view (virtualized) -->
      <VirtualizedList
        v-if="viewMode === 'list'"
        :items="songs"
        :item-height="trackItemHeight"
        :container-height="listHeight"
        :key-extractor="(song) => song.id"
        class="track-list"
        @load-more="loadMore"
        :has-more="hasNext"
        :is-loading="isLoadingMore"
      >
        <template #item="{ item: song, index }">
          <div class="track-item-wrapper">
            <div 
              :class="[
                'track-item',
                {
                  'track-item--selected': isSelected(song),
                  'track-item--playing': currentSong?.id === song.id
                }
              ]"
              @click="toggle(song)"
              @dblclick="handlePlay(song)"
              @contextmenu="handleContextMenu(song, $event)"
            >
              <div class="track-index">{{ index + 1 }}</div>
              <div class="track-info">
                <div class="track-title">{{ song.title }}</div>
                <div class="track-artist">{{ song.artist?.name }}</div>
              </div>
              <div class="track-duration">{{ formatDuration(song.duration) }}</div>
            </div>
          </div>
        </template>

        <template #loading>
          <div class="list-loading">
            <div class="loading-spinner"></div>
            <span>Loading more songs...</span>
          </div>
        </template>
      </VirtualizedList>

      <!-- Grid view -->
      <div v-else class="track-grid">
        <div
          v-for="song in songs"
          :key="song.id"
          :class="[
            'track-grid-item',
            {
              'track-grid-item--selected': isSelected(song),
              'track-grid-item--playing': currentSong?.id === song.id
            }
          ]"
          @click="toggle(song)"
          @dblclick="handlePlay(song)"
          @contextmenu="handleContextMenu(song, $event)"
        >
          <div class="track-cover">
            <OptimizedImage
              v-if="song.cover_url"
              :src="song.cover_url"
              :alt="song.title"
              :width="150"
              :height="150"
              aspect-ratio="1/1"
            />
            <div v-else class="track-cover-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
          <div class="track-info">
            <div class="track-title">{{ song.title }}</div>
            <div class="track-artist">{{ song.artist?.name }}</div>
          </div>
        </div>
        
        <!-- Load more button for grid -->
        <div v-if="hasNext" class="load-more-section">
          <button
            @click="loadMore"
            :disabled="isLoadingMore"
            class="load-more-btn"
          >
            <div v-if="isLoadingMore" class="loading-spinner"></div>
            {{ isLoadingMore ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import VirtualizedList from '@/shared/components/VirtualizedList.vue'
import OptimizedImage from '@/shared/components/OptimizedImage.vue'
import { useSongs } from '@/features/music/composables/useSongs'
import { usePlaybackStore } from '@/stores/playback'
import { useSearch, usePagination, useSorting, useSelection } from '@/shared/composables/useUI'
import { formatDuration } from '@/core/utils'

const props = defineProps({
  artistId: {
    type: String,
    default: null
  },
  playlistId: {
    type: String,
    default: null
  },
  genre: {
    type: String,
    default: null
  },
  showSelection: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['selection-change', 'song-play', 'context-menu'])

// Store
const playbackStore = usePlaybackStore()
const { currentSong } = storeToRefs(playbackStore)

// UI State
const viewMode = ref('list')
const sortDropdownOpen = ref(false)
const trackItemHeight = 64
const listHeight = 600

// Search
const { query: searchQuery, debouncedQuery, isSearching, clear: clearSearch } = useSearch()

// Pagination
const {
  currentPage,
  pageSize,
  hasNext,
  setTotal,
  nextPage,
  reset: resetPagination
} = usePagination(1, 50)

// Sorting
const {
  sortBy,
  sortOrder,
  setSorting
} = useSorting('created_at', 'desc')

// Selection (if enabled)
const {
  selected,
  selectedCount,
  hasSelection,
  isSelected,
  toggle,
  deselectAll
} = useSelection(props.showSelection)

// Sort options
const sortOptions = [
  { value: 'title', order: 'asc', label: 'Title A-Z' },
  { value: 'title', order: 'desc', label: 'Title Z-A' },
  { value: 'created_at', order: 'desc', label: 'Newest First' },
  { value: 'created_at', order: 'asc', label: 'Oldest First' },
  { value: 'duration', order: 'desc', label: 'Longest First' },
  { value: 'duration', order: 'asc', label: 'Shortest First' }
]

// Build query options
const queryOptions = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  search: debouncedQuery.value,
  sort: sortBy.value,
  order: sortOrder.value,
  filters: {
    ...(props.artistId && { artist_id: props.artistId }),
    ...(props.genre && { genre: props.genre })
  }
}))

// Vue Query for songs
const {
  data: songsData,
  isLoading,
  isError,
  error
} = useSongs(queryOptions)

// Extract songs and pagination info
const songs = computed(() => songsData.value?.songs || [])
const isLoadingMore = computed(() => isLoading.value && currentPage.value > 1)

// Watch for data changes to update pagination
watch(songsData, (newData) => {
  if (newData) {
    setTotal(newData.total)
  }
}, { immediate: true })

// Watch for search changes to reset pagination
watch(debouncedQuery, () => {
  resetPagination()
})

// Watch for filter changes to reset pagination
watch(() => [props.artistId, props.genre], () => {
  resetPagination()
})

// Watch selection changes
watch(selected, (newSelection) => {
  emit('selection-change', newSelection)
}, { deep: true })

// Methods
const getSortLabel = () => {
  const option = sortOptions.find(opt => 
    opt.value === sortBy.value && opt.order === sortOrder.value
  )
  return option?.label || 'Default'
}

const handleSortChange = (field, order) => {
  setSorting(field, order)
  sortDropdownOpen.value = false
  resetPagination()
}

const loadMore = () => {
  if (hasNext.value && !isLoadingMore.value) {
    nextPage()
  }
}

const handlePlay = (song) => {
  playbackStore.playSong(song)
  emit('song-play', song)
}

const handleContextMenu = (song, event) => {
  event.preventDefault()
  emit('context-menu', { song, event })
}

// Click outside to close dropdowns
const handleClickOutside = (event) => {
  if (!event.target.closest('.sort-dropdown')) {
    sortDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* All the CSS from the previous component remains the same but I'll add the new styles for the simplified components */

.track-item-wrapper {
  padding: 0 1rem;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.track-item:hover {
  background: var(--color-bg-hover);
}

.track-item--selected {
  background: var(--color-primary-light);
}

.track-item--playing {
  background: var(--color-primary);
  color: white;
}

.track-index {
  width: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-artist {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-duration {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.track-grid-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.track-grid-item:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
}

.track-grid-item--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.track-grid-item--playing {
  background: var(--color-primary);
  color: white;
}

.track-cover {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.375rem;
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.track-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.track-cover-placeholder svg {
  width: 2rem;
  height: 2rem;
}

/* Previous CSS continues here... */
.track-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.track-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1rem;
  gap: 1rem;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: var(--color-bg-secondary);
  color: var(--color-text);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--color-text-secondary);
}

.search-spinner {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--color-border);
  border-top: 1px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.clear-search-btn {
  padding: 0.5rem 1rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
}

.clear-search-btn:hover {
  background: var(--color-bg-hover);
}

.controls-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sort-dropdown {
  position: relative;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.875rem;
}

.sort-btn:hover {
  background: var(--color-bg-hover);
}

.dropdown-icon {
  width: 1rem;
  height: 1rem;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 200px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.875rem;
}

.dropdown-item:hover {
  background: var(--color-bg-hover);
}

.dropdown-item.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.view-toggle {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  overflow: hidden;
}

.view-btn {
  padding: 0.5rem;
  background: var(--color-bg-secondary);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn:hover {
  background: var(--color-bg-hover);
}

.view-btn.active {
  background: var(--color-primary);
  color: white;
}

.view-btn svg {
  width: 1rem;
  height: 1rem;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.deselect-btn {
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.track-list-content {
  flex: 1;
  min-height: 0;
}

.track-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.load-more-section {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--color-text-secondary);
}

.list-loading .loading-spinner {
  width: 1rem;
  height: 1rem;
  margin-bottom: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>