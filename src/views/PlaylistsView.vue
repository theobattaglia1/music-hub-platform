<template>
  <div class="playlists-view">
    <!-- Elegant Header with Dynamic Background -->
    <div class="view-header">
      <div class="header-background">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
      </div>

      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Playlists</span>
            <span class="title-accent">{{ filteredPlaylists.length }}</span>
          </h1>
          <p class="view-subtitle">Curate your perfect soundscapes</p>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-pill">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <span>{{ totalSongs }} songs</span>
          </div>
          <div class="stat-pill">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <span>{{ formatDuration(totalDuration) }}</span>
          </div>
        </div>
      </div>

      <!-- Refined Controls -->
      <div class="header-controls">
        <div class="search-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search playlists, moods, or genres..."
            class="search-input"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
          />
          <transition name="fade">
            <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </transition>
        </div>

        <div class="action-buttons">
          <button class="icon-btn" @click="showSortMenu = !showSortMenu" title="Sort">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="6" y1="12" x2="18" y2="12"></line>
              <line x1="9" y1="18" x2="15" y2="18"></line>
            </svg>
          </button>

          <button class="create-btn" @click="showCreateModal = true">
            <div class="btn-glow"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create Playlist</span>
          </button>
        </div>

        <!-- Sort Dropdown -->
        <transition name="dropdown">
          <div v-if="showSortMenu" class="sort-dropdown">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              @click="setSortBy(option.value)"
              :class="['sort-option', { active: sortBy === option.value }]"
            >
              <span>{{ option.label }}</span>
              <svg v-if="sortBy === option.value" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Filter Pills -->
    <div class="filter-section">
      <div class="filter-pills">
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          @click="activeFilter = filter.value"
          :class="['filter-pill', { active: activeFilter === filter.value }]"
        >
          <span>{{ filter.label }}</span>
          <span v-if="filter.count" class="filter-count">{{ filter.count }}</span>
        </button>
      </div>
    </div>

    <!-- Playlists Container -->
    <div class="playlists-container">
      <!-- Empty State -->
      <transition name="fade">
        <div v-if="filteredPlaylists.length === 0 && !loading" class="empty-state">
          <div class="empty-illustration">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="60" stroke="currentColor" stroke-width="2" opacity="0.1"/>
              <path d="M100 60v40M80 80l20 20 20-20" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2"/>
              <rect x="70" y="120" width="60" height="40" rx="4" fill="currentColor" opacity="0.05"/>
              <line x1="85" y1="135" x2="115" y2="135" stroke="currentColor" stroke-width="2" opacity="0.2"/>
              <line x1="85" y1="145" x2="105" y2="145" stroke="currentColor" stroke-width="2" opacity="0.1"/>
            </svg>
          </div>
          <h3 class="empty-title">{{ searchQuery ? 'No playlists found' : 'Start your collection' }}</h3>
          <p class="empty-text">
            {{ searchQuery ? 'Try a different search term' : 'Create playlists to organize your favorite tracks' }}
          </p>
          <button v-if="!searchQuery" class="empty-action-btn" @click="showCreateModal = true">
            <div class="btn-glow"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Create Your First Playlist</span>
          </button>
        </div>
      </transition>

      <!-- Loading State -->
      <transition name="fade">
        <div v-if="loading" class="loading-grid">
          <div v-for="i in 8" :key="i" class="skeleton-card" :style="{ animationDelay: `${i * 0.1}s` }">
            <div class="skeleton-cover"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-subtitle"></div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Playlists Grid -->
      <transition name="fade">
        <div v-if="!loading && filteredPlaylists.length > 0" class="playlists-grid">
          <transition-group name="playlist-list">
            <div
              v-for="(playlist, index) in filteredPlaylists"
              :key="playlist.id"
              class="playlist-card"
              :style="{ animationDelay: `${index * 0.05}s` }"
              @click="navigateToPlaylist(playlist)"
              @mouseenter="hoveredPlaylist = playlist.id"
              @mouseleave="hoveredPlaylist = null"
              @contextmenu.prevent="showPlaylistMenu(playlist, $event)"
            >
              <!-- Cover Art -->
              <div class="playlist-cover">
                <div v-if="playlist.cover_image" class="cover-image">
                  <img :src="playlist.cover_image" :alt="playlist.name" />
                </div>
                <div v-else class="cover-placeholder">
                  <div class="placeholder-grid">
                    <div v-for="i in 4" :key="i" class="grid-item" :style="{ background: getPlaylistColor(playlist, i) }"></div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="currentColor" class="playlist-icon">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                  </svg>
                </div>

                <!-- Play Overlay -->
                <transition name="fade">
                  <div v-if="hoveredPlaylist === playlist.id" class="play-overlay">
                    <button class="play-btn" @click.stop="playPlaylist(playlist)">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </transition>

                <!-- Playlist Badge -->
                <div v-if="playlist.is_public" class="playlist-badge">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>Public</span>
                </div>
              </div>

              <!-- Playlist Info -->
              <div class="playlist-info">
                <h3 class="playlist-name">{{ playlist.name }}</h3>
                <p class="playlist-meta">
                  <span class="meta-item">{{ playlist.song_count || 0 }} songs</span>
                  <span class="meta-dot">•</span>
                  <span class="meta-item">{{ formatPlaylistDuration(playlist) }}</span>
                </p>
                <p v-if="playlist.description" class="playlist-description">{{ playlist.description }}</p>
              </div>

              <!-- Quick Actions -->
              <div class="quick-actions">
                <button class="action-btn" @click.stop="toggleFavorite(playlist)" :class="{ active: playlist.is_favorite }">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>
                <button class="action-btn" @click.stop="showPlaylistMenu(playlist, $event)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </transition>
    </div>

    <!-- Create Playlist Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Create New Playlist</h2>
              <button class="close-btn" @click="showCreateModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form @submit.prevent="createPlaylist" class="modal-body">
              <div class="form-group">
                <label for="playlist-name">Name</label>
                <input
                  id="playlist-name"
                  v-model="newPlaylist.name"
                  type="text"
                  placeholder="My Awesome Playlist"
                  required
                  autofocus
                  maxlength="100"
                />
                <span class="char-count">{{ newPlaylist.name.length }}/100</span>
              </div>

              <div class="form-group">
                <label for="playlist-description">Description</label>
                <textarea
                  id="playlist-description"
                  v-model="newPlaylist.description"
                  placeholder="What's the vibe?"
                  rows="3"
                  maxlength="300"
                ></textarea>
                <span class="char-count">{{ newPlaylist.description.length }}/300</span>
              </div>

              <div class="form-group">
                <label class="toggle-label">
                  <input
                    v-model="newPlaylist.isPublic"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-switch"></span>
                  <span class="toggle-text">
                    <strong>Public Playlist</strong>
                    <small>Anyone can view and follow this playlist</small>
                  </span>
                </label>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-secondary" @click="showCreateModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn-primary" :disabled="!newPlaylist.name.trim()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Create Playlist</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylistsStore } from '@/stores/playlists'

const router = useRouter()
const store = usePlaylistsStore()

// Inject global methods
const showContextMenu = inject('showContextMenu', () => {})
const showToast = inject('showToast', () => {})

// State
const searchQuery = ref('')
const searchFocused = ref(false)
const showCreateModal = ref(false)
const showSortMenu = ref(false)
const playlists = ref([])
const loading = ref(true)
const hoveredPlaylist = ref(null)
const sortBy = ref('recent')
const activeFilter = ref('all')

const newPlaylist = ref({
  name: '',
  description: '',
  isPublic: false
})

// Sort options
const sortOptions = [
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'songs', label: 'Most Songs' },
  { value: 'duration', label: 'Longest Duration' }
]

// Filter options
const filterOptions = computed(() => [
  { value: 'all', label: 'All Playlists', count: playlists.value.length },
  { value: 'public', label: 'Public', count: playlists.value.filter(p => p.is_public).length },
  { value: 'private', label: 'Private', count: playlists.value.filter(p => !p.is_public).length },
  { value: 'favorites', label: 'Favorites', count: playlists.value.filter(p => p.is_favorite).length }
])

// Computed
const filteredPlaylists = computed(() => {
  let result = [...playlists.value]

  // Apply filter
  switch (activeFilter.value) {
    case 'public':
      result = result.filter(p => p.is_public)
      break
    case 'private':
      result = result.filter(p => !p.is_public)
      break
    case 'favorites':
      result = result.filter(p => p.is_favorite)
      break
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(playlist =>
      playlist.name.toLowerCase().includes(query) ||
      playlist.description?.toLowerCase().includes(query)
    )
  }

  // Apply sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'songs':
        return (b.song_count || 0) - (a.song_count || 0)
      case 'duration':
        return (b.total_duration || 0) - (a.total_duration || 0)
      case 'recent':
      default:
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    }
  })

  return result
})

const totalSongs = computed(() => {
  return playlists.value.reduce((sum, p) => sum + (p.song_count || 0), 0)
})

const totalDuration = computed(() => {
  return playlists.value.reduce((sum, p) => sum + (p.total_duration || 0), 0)
})

// Methods
const createPlaylist = async () => {
  if (!newPlaylist.value.name.trim()) return

  try {
    // TODO: Create playlist via API
    const playlist = {
      id: Date.now().toString(),
      name: newPlaylist.value.name,
      description: newPlaylist.value.description,
      is_public: newPlaylist.value.isPublic,
      is_favorite: false,
      song_count: 0,
      song_ids: [],
      total_duration: 0,
      cover_image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    playlists.value.unshift(playlist)
    store.playlists.unshift(playlist)
    showCreateModal.value = false

    // Reset form
    newPlaylist.value = {
      name: '',
      description: '',
      isPublic: false
    }

    showToast({
      message: `Created playlist "${playlist.name}"`,
      type: 'success'
    })

    // Navigate to the new playlist
    router.push(`/playlists/${playlist.id}`)
  } catch (error) {
    console.error('Failed to create playlist:', error)
    showToast({
      message: 'Failed to create playlist',
      type: 'error'
    })
  }
}

const navigateToPlaylist = (playlist) => {
  router.push(`/playlists/${playlist.id}`)
}

const playPlaylist = async (playlist) => {
  showToast({
    message: `Playing "${playlist.name}"`,
    type: 'info'
  })
  // TODO: Load and play playlist songs
}

const toggleFavorite = async (playlist) => {
  playlist.is_favorite = !playlist.is_favorite
  showToast({
    message: playlist.is_favorite ? 'Added to favorites' : 'Removed from favorites',
    type: 'success'
  })
  // TODO: Update via API
}

const showPlaylistMenu = (playlist, event) => {
  const menuItems = [
    {
      label: 'Play',
      icon: 'play',
      action: () => playPlaylist(playlist)
    },
    {
      label: 'Play Next',
      icon: 'queue',
      action: () => queuePlaylist(playlist, 'next')
    },
    {
      label: 'Add to Queue',
      icon: 'queue',
      action: () => queuePlaylist(playlist, 'end')
    },
    { divider: true },
    {
      label: playlist.is_favorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: 'favorite',
      action: () => toggleFavorite(playlist)
    },
    {
      label: 'Edit Details',
      icon: 'edit',
      action: () => editPlaylist()
    },
    {
      label: 'Share',
      icon: 'share',
      action: () => sharePlaylist()
    },
    { divider: true },
    {
      label: 'Delete',
      icon: 'delete',
      danger: true,
      action: () => deletePlaylist(playlist)
    }
  ]

  showContextMenu(event, menuItems)
}

const queuePlaylist = async (playlist, position) => {
  showToast({
    message: position === 'next' ? 'Added to play next' : 'Added to queue',
    type: 'info'
  })
}

const editPlaylist = () => {
  showToast({
    message: 'Edit functionality coming soon',
    type: 'info'
  })
}

const sharePlaylist = () => {
  showToast({
    message: 'Share functionality coming soon',
    type: 'info'
  })
}

const deletePlaylist = async (playlist) => {
  if (!confirm(`Delete "${playlist.name}"? This cannot be undone.`)) return

  try {
    const index = playlists.value.findIndex(p => p.id === playlist.id)
    if (index > -1) {
      playlists.value.splice(index, 1)
    }

    showToast({
      message: `Deleted playlist "${playlist.name}"`,
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to delete playlist:', error)
    showToast({
      message: 'Failed to delete playlist',
      type: 'error'
    })
  }
}

const setSortBy = (value) => {
  sortBy.value = value
  showSortMenu.value = false
}

const formatDuration = (seconds) => {
  if (!seconds) return '0 min'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  }
  return `${minutes} min`
}

const formatPlaylistDuration = (playlist) => {
  return formatDuration(playlist.total_duration || 0)
}

const getPlaylistColor = (playlist, index) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  ]
  const baseIndex = playlist.name.charCodeAt(0) % colors.length
  return colors[(baseIndex + index) % colors.length]
}

// Click outside handler
const handleClickOutside = (event) => {
  if (showSortMenu.value && !event.target.closest('.sort-dropdown') && !event.target.closest('.icon-btn')) {
    showSortMenu.value = false
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  if (store.playlists.length === 0 && !store.loading) {
    await store.loadPlaylists()
  }

  // Add mock data for demo
  playlists.value = store.globalPlaylists().map(p => ({
    ...p,
    is_favorite: Math.random() > 0.7,
    total_duration: Math.floor(Math.random() * 7200) + 600,
    updated_at: p.updated_at || p.created_at
  }))

  loading.value = false
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Keep local reactive copy for search/filter UI
watch(
  () => store.playlists,
  () => {
    if (!loading.value) {
      playlists.value = store.globalPlaylists().map(p => ({
        ...p,
        is_favorite: p.is_favorite || false,
        total_duration: p.total_duration || 0,
        updated_at: p.updated_at || p.created_at
      }))
    }
  },
  { deep: true }
)
</script>

<style scoped>
.playlists-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
  overflow: hidden;
}

/* Header Section */
.view-header {
  position: relative;
  padding: 48px 48px 32px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.2;
}

.orb-1 {
  background: radial-gradient(circle, #667eea 0%, transparent 70%);
  top: -300px;
  left: -200px;
  animation: float 20s ease-in-out infinite;
}

.orb-2 {
  background: radial-gradient(circle, #f093fb 0%, transparent 70%);
  bottom: -300px;
  right: -200px;
  animation: float 20s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.1); }
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.title-section {
  flex: 1;
}

.view-title {
  display: flex;
  align-items: baseline;
  gap: 16px;
  font-size: 48px;
  font-weight: 200;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.title-accent {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
}

.view-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Quick Stats */
.quick-stats {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-pill svg {
  width: 16px;
  height: 16px;
  opacity: 0.6;
}

/* Header Controls */
.header-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
}

.search-container {
  position: relative;
  width: 400px;
}

.search-input {
  width: 100%;
  padding: 14px 48px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 50%;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.clear-btn svg {
  width: 16px;
  height: 16px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icon-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: white;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.create-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.create-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.btn-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-btn:hover .btn-glow {
  width: 200%;
  height: 200%;
}

.create-btn svg {
  width: 20px;
  height: 20px;
}

/* Sort Dropdown */
.sort-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 10;
  min-width: 200px;
}

.sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.sort-option:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.sort-option.active {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

.sort-option svg {
  width: 16px;
  height: 16px;
  color: #4ade80;
}

/* Filter Section */
.filter-section {
  padding: 0 48px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-pills {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.filter-pills::-webkit-scrollbar {
  height: 4px;
}

.filter-pills::-webkit-scrollbar-track {
  background: transparent;
}

.filter-pills::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-pill:hover {
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.02);
}

.filter-pill.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.filter-count {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  font-size: 11px;
}

/* Playlists Container */
.playlists-container {
  flex: 1;
  overflow-y: auto;
  padding: 48px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.empty-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: 32px;
  color: rgba(255, 255, 255, 0.1);
}

.empty-title {
  font-size: 28px;
  font-weight: 300;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.empty-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 32px;
  max-width: 400px;
}

.empty-action-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.empty-action-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.empty-action-btn svg {
  width: 20px;
  height: 20px;
}

/* Loading Grid */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.skeleton-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  overflow: hidden;
  animation: skeletonWave 1.5s ease-in-out infinite;
}

@keyframes skeletonWave {
  0% { opacity: 0.5; transform: translateX(-3px); }
  50% { opacity: 1; transform: translateX(3px); }
  100% { opacity: 0.5; transform: translateX(-3px); }
}

.skeleton-cover {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-content {
  padding: 20px;
}

.skeleton-title {
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-subtitle {
  height: 16px;
  width: 60%;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

/* Playlists Grid */
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* Playlist Card */
.playlist-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.playlist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Playlist Cover */
.playlist-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.playlist-card:hover .cover-image img {
  transform: scale(1.1);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.grid-item {
  opacity: 0.3;
}

.playlist-icon {
  position: relative;
  z-index: 1;
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.3);
}

/* Play Overlay */
.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.play-btn:hover {
  transform: scale(1.1);
  background: white;
}

.play-btn svg {
  width: 28px;
  height: 28px;
  color: black;
  margin-left: 3px;
}

/* Playlist Badge */
.playlist-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(74, 222, 128, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  color: black;
}

.playlist-badge svg {
  width: 14px;
  height: 14px;
}

/* Playlist Info */
.playlist-info {
  padding: 20px;
}

.playlist-name {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.meta-dot {
  width: 3px;
  height: 3px;
  background: currentColor;
  border-radius: 50%;
}

.playlist-description {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

/* Quick Actions */
.quick-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.playlist-card:hover .quick-actions {
  opacity: 1;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  transform: scale(1.1);
}

.action-btn.active {
  color: #ef4444;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 32px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-header h2 {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.01em;
  margin: 0;
}

.close-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 32px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 28px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.char-count {
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
}

.toggle-input {
  position: absolute;
  opacity: 0;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-input:checked + .toggle-switch {
  background: rgba(74, 222, 128, 0.2);
  border-color: rgba(74, 222, 128, 0.4);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(24px);
  background: #4ade80;
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-text strong {
  font-size: 14px;
  font-weight: 500;
}

.toggle-text small {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: white;
  color: black;
}

.btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary svg,
.btn-secondary svg {
  width: 18px;
  height: 18px;
}

.btn-secondary {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.playlist-list-move,
.playlist-list-enter-active,
.playlist-list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.playlist-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.playlist-list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.playlist-list-leave-active {
  position: absolute;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

/* Scrollbar */
.playlists-container::-webkit-scrollbar {
  width: 12px;
}

.playlists-container::-webkit-scrollbar-track {
  background: transparent;
}

.playlists-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.playlists-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}

/* Responsive */
@media (max-width: 1200px) {
  .playlists-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .view-header {
    padding: 32px 24px 24px;
  }

  .header-content {
    flex-direction: column;
    gap: 24px;
  }

  .view-title {
    font-size: 36px;
  }

  .header-controls {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .search-container {
    width: 100%;
  }

  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .filter-section {
    padding: 0 24px 20px;
  }

  .playlists-container {
    padding: 24px;
  }

  .playlists-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .view-title {
    font-size: 28px;
  }

  .quick-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .playlists-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    border-radius: 16px;
  }

  .modal-header,
  .modal-body {
    padding: 24px;
  }
}
</style>
