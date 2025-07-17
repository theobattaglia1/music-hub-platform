<template>
  <div class="artists-view">
    <!-- Elegant Header with Animated Background -->
    <div class="view-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Artists</span>
            <span class="title-count">{{ filteredArtists.length }}</span>
          </h1>
          <p class="view-subtitle">Your creative roster</p>
        </div>
        <button class="create-btn" @click="handleCreateArtist">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Artist</span>
        </button>
      </div>

      <!-- Dynamic Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">{{ totalSongs }}</div>
          <div class="stat-label">Total Songs</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ activeProjects }}</div>
          <div class="stat-label">Active Projects</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ totalTeamMembers }}</div>
          <div class="stat-label">Team Members</div>
        </div>
      </div>
    </div>

    <!-- Refined Controls -->
    <div class="controls-section">
      <div class="search-container">
        <div class="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, genre, or location..."
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
      </div>

      <div class="filter-group">
        <div class="custom-select">
          <select v-model="sortBy" class="filter-select">
            <option value="name">Name</option>
            <option value="recent">Recently Added</option>
            <option value="active">Most Active</option>
            <option value="listeners">Most Listeners</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="select-icon">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <div class="custom-select">
          <select v-model="filterGenre" class="filter-select">
            <option value="">All Genres</option>
            <option v-for="genre in availableGenres" :key="genre" :value="genre">{{ genre }}</option>
          </select>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="select-icon">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <div class="view-toggles">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            class="view-toggle"
            :class="{ active: viewMode === mode.value }"
            @click="viewMode = mode.value"
            :title="mode.label"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="mode.icon" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <transition name="fade">
      <div v-if="loading" class="loading-state">
        <div class="loading-grid">
          <div v-for="i in 6" :key="i" class="skeleton-card" :style="{ animationDelay: `${i * 0.1}s` }">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-subtitle"></div>
              <div class="skeleton-stats">
                <div class="skeleton-stat"></div>
                <div class="skeleton-stat"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Artists Grid with Stagger Animation -->
    <transition name="fade">
      <div v-if="!loading && filteredArtists.length > 0" :class="['artists-container', viewMode]">
        <transition-group name="artist-list" tag="div" class="artists-grid">
          <div
            v-for="(artist, index) in filteredArtists"
            :key="artist.id"
            class="artist-card"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="navigateToArtist(artist)"
            @mouseenter="hoveredArtist = artist.id"
            @mouseleave="hoveredArtist = null"
          >
            <!-- Dynamic Background Gradient -->
            <div class="card-background" :style="{ background: getArtistGradient(artist) }"></div>

            <div class="artist-visual">
              <div class="image-wrapper">
                <img
                  v-if="artist.avatar_url"
                  :src="artist.avatar_url"
                  :alt="artist.name"
                  class="artist-image"
                />
                <div v-else class="artist-placeholder">
                  <span class="placeholder-initial">{{ artist.name?.charAt(0)?.toUpperCase() }}</span>
                </div>
              </div>

              <!-- Hover Actions -->
              <transition name="fade">
                <div v-if="hoveredArtist === artist.id" class="hover-actions">
                  <button class="action-btn play" @click.stop="handlePlayArtist(artist)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
              </transition>

              <!-- Live Indicator -->
              <div v-if="artist.is_live" class="live-indicator">
                <span class="live-dot"></span>
                <span class="live-text">LIVE</span>
              </div>
            </div>

            <div class="artist-details">
              <div class="artist-header">
                <h3 class="artist-name">{{ artist.name }}</h3>
                <button class="menu-btn" @click.stop="handleArtistMenu(artist, $event)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
              </div>

              <div class="artist-meta">
                <span v-if="artist.genre" class="meta-tag genre">{{ artist.genre }}</span>
                <span v-if="artist.location" class="meta-tag location">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {{ artist.location }}
                </span>
              </div>

              <div class="artist-stats">
                <div class="stat-chip">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span>{{ artist.song_count || 0 }}</span>
                </div>
                <div class="stat-chip">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                  <span>{{ formatNumber(artist.monthly_listeners || 0) }}</span>
                </div>
                <div v-if="artist.active_tasks > 0" class="stat-chip active">
                  <span class="task-dot"></span>
                  <span>{{ artist.active_tasks }} active</span>
                </div>
              </div>

              <!-- Team Members Preview -->
              <div v-if="artist.team_members?.length > 0" class="team-section">
                <div class="team-avatars">
                  <div
                    v-for="(member, idx) in artist.team_members.slice(0, 4)"
                    :key="`${artist.id}-${member.id}`"
                    class="team-avatar"
                    :style="{ '--index': idx }"
                    :title="member.name"
                  >
                    <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" />
                    <span v-else>{{ member.name?.charAt(0) }}</span>
                  </div>
                  <div v-if="artist.team_members.length > 4" class="team-more">
                    +{{ artist.team_members.length - 4 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </transition>

    <!-- Empty State -->
    <transition name="fade">
      <div v-if="!loading && filteredArtists.length === 0" class="empty-state">
        <div class="empty-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" stroke="currentColor" stroke-width="2" opacity="0.1"/>
            <path d="M100 40v60M70 70l30 30 30-30" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
            <circle cx="100" cy="140" r="20" fill="currentColor" opacity="0.1"/>
          </svg>
        </div>
        <h3 class="empty-title">{{ searchQuery ? 'No artists found' : 'Start building your roster' }}</h3>
        <p class="empty-text">
          {{ searchQuery ? 'Try adjusting your search or filters' : 'Add your first artist to get started' }}
        </p>
        <button v-if="!searchQuery" class="create-btn large" @click="handleCreateArtist">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Your First Artist</span>
        </button>
      </div>
    </transition>

    <!-- Floating Context Menu -->
    <transition name="context-menu">
      <div
        v-if="showContextMenu"
        class="context-menu"
        :style="contextMenuStyle"
        @click.stop
      >
        <button class="context-item" @click="handleViewHub">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>View Hub</span>
        </button>
        <button class="context-item" @click="handleEditArtist">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <span>Edit Details</span>
        </button>
        <button class="context-item" @click="handleManageTeam">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          <span>Team</span>
        </button>
        <div class="context-divider"></div>
        <button class="context-item danger" @click="handleDeleteArtist">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </transition>

    <!-- Create Artist Modal -->
    <CreateArtistModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleArtistCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'
import CreateArtistModal from '@/components/modals/CreateArtistModal.vue'

const router = useRouter()
const dashboardStore = useDashboardStore()

// Inject global methods
const showToast = inject('showToast', () => {})

// State
const loading = ref(true)
const artists = ref([])
const searchQuery = ref('')
const searchFocused = ref(false)
const sortBy = ref('name')
const filterGenre = ref('')
const viewMode = ref('grid')
const showCreateModal = ref(false)
const showContextMenu = ref(false)
const contextMenuStyle = ref({})
const selectedArtist = ref(null)
const hoveredArtist = ref(null)

// View modes configuration
const viewModes = [
  { value: 'grid', label: 'Grid View', icon: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z' },
  { value: 'list', label: 'List View', icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' },
  { value: 'compact', label: 'Compact View', icon: 'M3 9h18v2H3V9zm0 4h18v2H3v-2z' }
]

// Computed
const filteredArtists = computed(() => {
  let result = [...artists.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(artist =>
      artist.name?.toLowerCase().includes(query) ||
      artist.genre?.toLowerCase().includes(query) ||
      artist.location?.toLowerCase().includes(query)
    )
  }

  // Genre filter
  if (filterGenre.value) {
    result = result.filter(artist =>
      artist.genre?.toLowerCase() === filterGenre.value.toLowerCase()
    )
  }

  // Sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'recent':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'active':
        return (b.active_tasks || 0) - (a.active_tasks || 0)
      case 'listeners':
        return (b.monthly_listeners || 0) - (a.monthly_listeners || 0)
      default:
        return 0
    }
  })

  return result
})

const availableGenres = computed(() => {
  const genres = new Set()
  artists.value.forEach(artist => {
    if (artist.genre) genres.add(artist.genre)
  })
  return Array.from(genres).sort()
})

const totalSongs = computed(() => {
  return artists.value.reduce((sum, artist) => sum + (artist.song_count || 0), 0)
})

const activeProjects = computed(() => {
  return artists.value.reduce((sum, artist) => sum + (artist.active_tasks || 0), 0)
})

const totalTeamMembers = computed(() => {
  const members = new Set()
  artists.value.forEach(artist => {
    artist.team_members?.forEach(member => members.add(member.id))
  })
  return members.size
})

// Methods
const loadArtists = async () => {
  try {
    loading.value = true
    await dashboardStore.loadArtists()
    artists.value = dashboardStore.artists
  } catch (error) {
    console.error('Failed to load artists:', error)
    showToast({ message: 'Failed to load artists', type: 'error' })
  } finally {
    loading.value = false
  }
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const getArtistGradient = (artist) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  ]
  const index = artist.name.charCodeAt(0) % colors.length
  return colors[index]
}

const navigateToArtist = (artist) => {
  router.push(`/artists/${artist.slug}`)
}

const handleCreateArtist = () => {
  showCreateModal.value = true
}

const handleArtistCreated = (artist) => {
  // Add new artist to local state for immediate UI update
  artists.value.push(artist)
  showCreateModal.value = false
  showToast({ message: 'Artist created successfully', type: 'success' })
  // Navigate to the new artist's page for better UX
  navigateToArtist(artist)
}

const handlePlayArtist = (artist) => {
  showToast({ message: `Playing ${artist.name}'s music`, type: 'info' })
  // TODO: Implement actual music playback functionality
  // This would integrate with the music player component
}

const handleArtistMenu = (artist, event) => {
  event.preventDefault()
  selectedArtist.value = artist

  const rect = event.currentTarget.getBoundingClientRect()
  const menuWidth = 200
  const menuHeight = 200

  let top = rect.bottom + 8
  let left = rect.left

  // Adjust if menu would go off screen
  if (left + menuWidth > window.innerWidth) {
    left = rect.right - menuWidth
  }
  if (top + menuHeight > window.innerHeight) {
    top = rect.top - menuHeight - 8
  }

  contextMenuStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  }

  showContextMenu.value = true
}

const handleEditArtist = () => {
  showToast({ message: 'Edit artist coming soon', type: 'info' })
  closeContextMenu()
}

const handleViewHub = () => {
  if (selectedArtist.value) {
    navigateToArtist(selectedArtist.value)
  }
  closeContextMenu()
}

const handleManageTeam = () => {
  showToast({ message: 'Team management coming soon', type: 'info' })
  closeContextMenu()
}

const handleDeleteArtist = () => {
  showToast({ message: 'Delete artist coming soon', type: 'info' })
  closeContextMenu()
}

const closeContextMenu = () => {
  showContextMenu.value = false
  selectedArtist.value = null
}

// Click outside handler for context menu accessibility
const handleClickOutside = (event) => {
  if (showContextMenu.value && !event.target.closest('.context-menu')) {
    closeContextMenu()
  }
}

// Lifecycle - Clean setup and teardown
onMounted(() => {
  loadArtists()
  // Add click outside listener for context menu - using passive for better performance
  document.addEventListener('click', handleClickOutside, { passive: true })
})

onUnmounted(() => {
  // Always clean up event listeners to prevent memory leaks
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.artists-view {
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
  padding: 48px 48px 0;
  margin-bottom: 32px;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: radial-gradient(ellipse at top, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
  pointer-events: none;
  animation: pulse 20s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
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

.title-count {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
}

.view-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Create Button */
.create-btn {
  position: relative;
  display: inline-flex;
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

.create-btn.large {
  padding: 16px 32px;
  font-size: 16px;
}

.btn-bg {
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

.create-btn:hover .btn-bg {
  width: 200%;
  height: 200%;
}

.create-btn svg {
  width: 20px;
  height: 20px;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

/* Controls Section */
.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px;
  margin-bottom: 32px;
  gap: 32px;
}

.search-container {
  flex: 1;
  max-width: 500px;
}

.search-wrapper {
  position: relative;
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

/* Filter Group */
.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.custom-select {
  position: relative;
}

.filter-select {
  padding: 10px 40px 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  min-width: 140px;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.filter-select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
}

/* View Toggles */
.view-toggles {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 2px;
}

.view-toggle {
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.view-toggle:hover {
  color: rgba(255, 255, 255, 0.8);
}

.view-toggle.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.view-toggle svg {
  width: 18px;
  height: 18px;
}

/* Loading State */
.loading-state {
  flex: 1;
  padding: 0 48px 48px;
  overflow: hidden;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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

.skeleton-image {
  width: 100%;
  height: 240px;
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
  padding: 24px;
}

.skeleton-title {
  height: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-subtitle {
  height: 16px;
  width: 60%;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  margin-bottom: 16px;
}

.skeleton-stats {
  display: flex;
  gap: 12px;
}

.skeleton-stat {
  height: 28px;
  width: 80px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
}

/* Artists Container */
.artists-container {
  flex: 1;
  padding: 0 48px 48px;
  overflow-y: auto;
  overflow-x: hidden;
}

.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.artists-container.list .artists-grid {
  grid-template-columns: 1fr;
  gap: 16px;
}

.artists-container.compact .artists-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

/* Artist Card */
.artist-card {
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

.artist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  opacity: 0.1;
  transition: opacity 0.3s;
}

.artist-card:hover .card-background {
  opacity: 0.15;
}

/* Artist Visual */
.artist-visual {
  position: relative;
  height: 240px;
  overflow: hidden;
}

.list .artist-visual {
  height: 120px;
  width: 120px;
  flex-shrink: 0;
}

.compact .artist-visual {
  height: 180px;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.artist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.artist-card:hover .artist-image {
  transform: scale(1.1);
}

.artist-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
}

.placeholder-initial {
  font-size: 64px;
  font-weight: 200;
  color: rgba(255, 255, 255, 0.3);
}

.list .placeholder-initial {
  font-size: 36px;
}

/* Hover Actions */
.hover-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  transform: scale(1.1);
  background: white;
}

.action-btn svg {
  width: 24px;
  height: 24px;
  color: black;
}

/* Live Indicator */
.live-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 100px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.live-text {
  font-size: 11px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.05em;
}

/* Artist Details */
.artist-details {
  padding: 24px;
}

.list .artist-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compact .artist-details {
  padding: 20px;
}

.artist-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.artist-name {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.01em;
}

.list .artist-name {
  font-size: 18px;
}

.compact .artist-name {
  font-size: 16px;
}

.menu-btn {
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
  margin: -4px -8px;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.menu-btn svg {
  width: 20px;
  height: 20px;
}

/* Artist Meta */
.artist-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.meta-tag.genre {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.2);
  color: rgba(168, 85, 247, 0.9);
}

.meta-tag svg {
  width: 12px;
  height: 12px;
}

/* Artist Stats */
.artist-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 100px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-chip.active {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
  color: rgba(34, 197, 94, 0.9);
}

.stat-chip svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.task-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

/* Team Section */
.team-section {
  margin-top: auto;
}

.team-avatars {
  display: flex;
  align-items: center;
}

.team-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.5);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin-left: calc(var(--index) * -8px);
  transition: all 0.2s;
}

.team-avatar:hover {
  transform: translateY(-2px);
  z-index: 10;
}

.team-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.team-more {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin-left: -8px;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
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

/* Context Menu */
.context-menu {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  min-width: 200px;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.context-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.context-item.danger {
  color: #ef4444;
}

.context-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.context-item svg {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.context-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 0;
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

.artist-list-move,
.artist-list-enter-active,
.artist-list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.artist-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.artist-list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.artist-list-leave-active {
  position: absolute;
}

.context-menu-enter-active,
.context-menu-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

/* Responsive */
@media (max-width: 1200px) {
  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .view-header {
    padding: 32px 24px 0;
  }

  .header-content {
    flex-direction: column;
    gap: 24px;
  }

  .view-title {
    font-size: 36px;
  }

  .stats-bar {
    gap: 24px;
  }

  .controls-section {
    flex-direction: column;
    padding: 0 24px;
    gap: 16px;
  }

  .search-container {
    max-width: none;
  }

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .artists-container {
    padding: 0 24px 24px;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .view-title {
    font-size: 28px;
  }

  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stat-divider {
    display: none;
  }

  .filter-group {
    flex-wrap: wrap;
  }

  .artists-grid {
    grid-template-columns: 1fr;
  }
}
</style>
