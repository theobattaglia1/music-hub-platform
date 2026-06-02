<template>
  <div class="modern-songs-view">
    <!-- Enhanced Header with Analytics -->
    <div class="view-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">Songs Library</h1>
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-value">{{ totalSongs.toLocaleString() }}</span>
              <span class="stat-label">Songs</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formatDuration(totalDuration) }}</span>
              <span class="stat-label">Total Duration</span>
            </div>
            <div v-if="hasSelection" class="stat-item selection">
              <span class="stat-value">{{ selectedCount }}</span>
              <span class="stat-label">Selected</span>
            </div>
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="quick-filters">
          <button
            v-for="filter in quickFilters"
            :key="filter.key"
            @click="setQuickFilter(filter.key)"
            :class="[
              'filter-chip',
              { active: activeFilter === filter.key }
            ]"
          >
            <svg v-if="filter.icon" viewBox="0 0 24 24" fill="currentColor">
              <path :d="filter.icon" />
            </svg>
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <div v-if="hasSelection" class="selection-actions">
          <div class="selection-info">
            <span>{{ selectedCount }} selected</span>
            <button @click="deselectAll" class="clear-selection">
              Clear
            </button>
          </div>
          
          <div class="action-buttons">
            <button @click="playSelected" class="action-btn primary">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Play Selected
            </button>
            
            <button @click="deleteSelected" class="action-btn danger">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Delete
            </button>
          </div>
        </div>

        <div v-else class="main-actions">
          <button @click="playAll" class="action-btn primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play All
          </button>
          
          <button @click="shuffleAll" class="action-btn secondary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
            Shuffle All
          </button>
        </div>
      </div>
    </div>

    <!-- Modern Track List with all features -->
    <TrackList
      :show-selection="true"
      @selection-change="handleSelectionChange"
      @song-play="handleSongPlay"
      @context-menu="handleContextMenu"
      class="songs-track-list"
    />

    <!-- Loading Overlay for bulk operations -->
    <div v-if="isBulkLoading" class="bulk-loading-overlay">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <h3>{{ bulkLoadingMessage }}</h3>
        <p>Please wait while we process your request...</p>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'toast-message',
          `toast-${toast.type}`
        ]"
      >
        <div class="toast-content">
          <strong>{{ toast.message }}</strong>
        </div>
        <button @click="removeToast(toast.id)" class="toast-close">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import TrackList from '@/features/music/components/TrackList.vue'
import { useSongs, useBulkSongOperations } from '@/features/music/composables/useSongs'
import { usePlaybackStore } from '@/stores/playback'
import { useSelection, useToast } from '@/shared/composables/useUI'
import { formatDuration, shuffleArray } from '@/core/utils'

// Stores
const playbackStore = usePlaybackStore()
const { currentSong } = storeToRefs(playbackStore)

// UI State
const activeFilter = ref('all')

// Bulk operations
const { bulkDelete } = useBulkSongOperations()
const isBulkLoading = computed(() => bulkDelete.isPending.value)
const bulkLoadingMessage = computed(() => {
  if (bulkDelete.isPending.value) return 'Deleting songs...'
  return 'Processing...'
})

// Selection management
const {
  selected: selectedSongs,
  selectedCount,
  hasSelection,
  selectAll,
  deselectAll
} = useSelection(true) // Enable multiple selection

// Toast notifications
const { toasts, success, error, removeToast } = useToast()

// Quick filters
const quickFilters = [
  { key: 'all', label: 'All Songs', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { key: 'recent', label: 'Recently Added', icon: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z' },
  { key: 'favorites', label: 'Favorites', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' }
]

// Build query options based on active filter
const queryOptions = computed(() => {
  const baseOptions = {}
  
  switch (activeFilter.value) {
    case 'recent':
      return { ...baseOptions, sort: 'created_at', order: 'desc' }
    case 'favorites':
      return { ...baseOptions, filters: { is_favorite: true } }
    default:
      return baseOptions
  }
})

// Get songs using Vue Query
const {
  data: songsData,
  isLoading,
  isError,
  error: songsError
} = useSongs(queryOptions)

// Computed properties
const songs = computed(() => songsData.value?.songs || [])
const totalSongs = computed(() => songsData.value?.total || 0)
const totalDuration = computed(() => 
  songs.value.reduce((total, song) => total + (song.duration || 0), 0)
)

// Methods
const setQuickFilter = (filterKey) => {
  activeFilter.value = filterKey
  deselectAll() // Clear selection when changing filters
}

const handleSelectionChange = (newSelection) => {
  // Selection is managed by the composable
}

const handleSongPlay = (song) => {
  success(`Now playing: ${song.title}`)
}

const handleContextMenu = ({ song, event }) => {
  // Context menu handling would go here
  console.log('Context menu for song:', song)
}

const playAll = () => {
  if (songs.value.length > 0) {
    playbackStore.playQueue(songs.value)
    success(`Playing ${songs.value.length} songs`)
  }
}

const shuffleAll = () => {
  if (songs.value.length > 0) {
    const shuffled = shuffleArray(songs.value)
    playbackStore.playQueue(shuffled)
    success(`Shuffling ${songs.value.length} songs`)
  }
}

const playSelected = () => {
  if (selectedSongs.value.length > 0) {
    playbackStore.playQueue(selectedSongs.value)
    success(`Playing ${selectedSongs.value.length} selected songs`)
    deselectAll()
  }
}

const deleteSelected = async () => {
  if (selectedSongs.value.length === 0) return
  
  const count = selectedSongs.value.length
  const confirmed = confirm(`Are you sure you want to delete ${count} songs? This action cannot be undone.`)
  
  if (confirmed) {
    try {
      const songIds = selectedSongs.value.map(song => song.id)
      await bulkDelete.mutateAsync(songIds)
      success(`Successfully deleted ${count} songs`)
      deselectAll()
    } catch (err) {
      error(`Failed to delete songs: ${err.message}`)
    }
  }
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  if (event.target.tagName === 'INPUT') return // Don't interfere with input fields
  
  switch (event.key) {
    case 'Escape':
      if (hasSelection.value) {
        deselectAll()
      }
      break
    case ' ':
      event.preventDefault()
      playbackStore.togglePlayback()
      break
    case 'a':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        selectAll(songs.value)
      }
      break
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Watch for errors
watch(songsError, (error) => {
  if (error) {
    error(`Failed to load songs: ${error.message}`)
  }
})
</script>

<style scoped>
.modern-songs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.view-header {
  padding: 2rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 2rem;
}

.title-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-row {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.stat-item.selection .stat-value {
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 2rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-chip:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.filter-chip svg {
  width: 1rem;
  height: 1rem;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.selection-actions,
.main-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.clear-selection {
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 0.25rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.action-btn svg {
  width: 1rem;
  height: 1rem;
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
}

.action-btn.primary:hover {
  background: var(--color-primary-dark);
}

.action-btn.secondary {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.action-btn.secondary:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.action-btn.danger {
  background: var(--color-danger);
  color: white;
}

.action-btn.danger:hover {
  background: var(--color-danger-dark);
}

.songs-track-list {
  flex: 1;
  min-height: 0;
  padding: 0 2rem 2rem;
}

.bulk-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-card {
  background: var(--color-bg);
  padding: 2rem;
  border-radius: 0.75rem;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.loading-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text);
}

.loading-card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  animation: slideIn 0.3s ease-out;
}

.toast-success {
  background: var(--color-success);
  color: white;
}

.toast-error {
  background: var(--color-danger);
  color: white;
}

.toast-content {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  opacity: 0.7;
}

.toast-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.toast-close svg {
  width: 1rem;
  height: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .view-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .stats-row {
    gap: 1rem;
  }
  
  .quick-filters {
    justify-content: flex-start;
  }
  
  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .selection-actions,
  .main-actions {
    justify-content: center;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .songs-track-list {
    padding: 0 1rem 1rem;
  }
}
</style>