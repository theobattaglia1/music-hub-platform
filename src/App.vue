<template>
  <DragDropProvider>
    <div id="app">
      <!-- Loading Screen -->
      <div
        v-if="!authStore.isInitialized"
        class="min-h-screen flex items-center justify-center"
      >
        <div class="text-center">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="caption-text">Initializing Music Hub...</p>
        </div>
      </div>

      <!-- Main Application -->
      <div v-else-if="authStore.isAuthenticated" class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar" @contextmenu.prevent="handleSidebarContextMenu">
          <div class="sidebar-content">
            <!-- Logo/Brand -->
            <div class="sidebar-header">
              <div class="app-logo">
                <div class="logo-container">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    class="logo-image"
                    @error="(e) => e.target.style.display = 'none'"
                  />
                </div>
                <div class="logo-text-container">
                  <span class="logo-line">EVERYTHING</span>
                  <span class="logo-line">IN</span>
                  <span class="logo-line">ONE</span>
                  <span class="logo-line">PLACE</span>
                </div>
              </div>

              <!-- Preferences Gear -->
              <button
                @click="showPreferences = true"
                class="prefs-toggle-btn"
                title="Preferences"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                </svg>
              </button>
            </div>

            <!-- Navigation -->
            <nav class="sidebar-nav">
              <!-- HOME -->
              <router-link
                to="/dashboard"
                class="nav-item primary"
                :class="{ 'active': $route.path === '/dashboard' }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </router-link>

              <!-- MUSIC Section -->
              <div class="nav-section">
                <h3 class="nav-section-title">MUSIC</h3>
                <router-link to="/songs" class="nav-item" :class="{ 'active': $route.path === '/songs' }">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span>Songs</span>
                </router-link>
                <router-link to="/playlists" class="nav-item" :class="{ 'active': $route.path.startsWith('/playlists') }">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                  </svg>
                  <span>Playlists</span>
                </router-link>
              </div>

              <!-- ARTISTS Section -->
              <div class="nav-section expandable">
                <div class="nav-section-header clickable" @click="expandedSections.artists = !expandedSections.artists">
                  <h3>ARTISTS</h3>
                  <div class="section-actions">
                    <button
                      v-if="authStore.canCreateArtist"
                      @click.stop="showCreateArtistModal = true"
                      class="add-btn"
                      title="Create Artist"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </button>
                    <svg
                      class="expand-icon"
                      :class="{ 'expanded': expandedSections.artists }"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </div>
                </div>

                <router-link
                  to="/artists"
                  class="nav-item"
                  :class="{ 'active': $route.path === '/artists' }"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <span>All Artists</span>
                </router-link>

                <!-- Nested Artists List -->
                <transition name="expand">
                  <div v-if="expandedSections.artists" class="nested-items">
                    <div v-if="recentArtists.length === 0" class="nav-empty-state">
                      No artists yet
                    </div>
                    <router-link
                      v-else
                      v-for="artist in recentArtists"
                      :key="artist.id"
                      :to="`/artists/${artist.slug}`"
                      class="nav-item nested"
                      :class="{ 'active': $route.path === `/artists/${artist.slug}` }"
                    >
                      <div class="artist-avatar mini">
                        <img
                          v-if="artist.avatar_url"
                          :src="artist.avatar_url"
                          :alt="artist.name"
                        />
                        <span v-else>{{ artist.name.charAt(0) }}</span>
                      </div>
                      <span class="truncate">{{ artist.name }}</span>
                    </router-link>
                  </div>
                </transition>
              </div>

              <!-- CALENDAR -->
              <router-link
                to="/calendar"
                class="nav-item primary"
                :class="{ 'active': $route.path === '/calendar' }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>Calendar</span>
              </router-link>

              <!-- MEDIA LIBRARY -->
              <router-link
                to="/media-library"
                class="nav-item primary"
                :class="{ 'active': $route.path === '/media-library' }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
                </svg>
                <span>Media Library</span>
              </router-link>

              <!-- FILES -->
              <router-link
                to="/files"
                class="nav-item primary"
                :class="{ 'active': $route.path === '/files' }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
                <span>Files</span>
              </router-link>
            </nav>

            <!-- User Section -->
            <div class="sidebar-footer">
              <div class="user-info" @click="showUserMenu = !showUserMenu">
                <div class="user-avatar">
                  <img
                    v-if="authStore.userAvatar"
                    :src="authStore.userAvatar"
                    :alt="authStore.userName"
                    class="avatar-image"
                  />
                  <span v-else class="avatar-initial">
                    {{ authStore.userName.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="user-details">
                  <p class="user-name">{{ authStore.userName }}</p>
                  <p class="user-email">{{ authStore.userEmail }}</p>
                </div>
                <button class="user-menu-btn">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                  </svg>
                </button>
              </div>

              <!-- User Dropdown Menu -->
              <Transition name="fade">
                <div
                  v-if="showUserMenu"
                  class="context-menu user-dropdown"
                >
                  <router-link
                    to="/profile"
                    class="context-menu-item"
                    @click="showUserMenu = false"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                    Profile Settings
                  </router-link>
                  <div class="context-menu-item" @click="showPreferences = true; showUserMenu = false">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
                    </svg>
                    Preferences
                  </div>
                  <hr class="menu-divider">
                  <button
                    @click="handleSignOut"
                    class="context-menu-item danger"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="main-content">
          <!-- Page Content -->
          <div class="content-scroll">
            <router-view />
          </div>
        </main>

        <!-- Now Playing Bar -->
        <NowPlayingBar
          v-if="playbackStore.currentSong"
          :currentSong="playbackStore.currentSong"
          :isPlaying="playbackStore.isPlaying"
          :currentTime="playbackStore.currentTime"
          :duration="playbackStore.duration"
          :volume="playbackStore.volume"
          :isShuffled="playbackStore.isShuffled"
          :repeatMode="playbackStore.repeatMode"
          @toggle-playback="playbackStore.togglePlayback"
          @seek="playbackStore.seek"
          @previous="playbackStore.playPrevious"
          @next="playbackStore.playNext"
          @toggle-shuffle="playbackStore.toggleShuffle"
          @toggle-repeat="playbackStore.toggleRepeat"
          @volume-change="playbackStore.setVolume"
        />
      </div>

      <!-- Authentication Views -->
      <div v-else class="auth-container">
        <router-view />
      </div>

      <!-- Create Artist Modal -->
      <CreateArtistModal
        v-if="showCreateArtistModal"
        @close="showCreateArtistModal = false"
        @created="handleArtistCreated"
      />

      <!-- Preferences Modal -->
      <PreferencesModal
        v-if="showPreferences"
        @close="showPreferences = false"
      />

      <!-- Click outside to close user menu -->
      <div
        v-if="showUserMenu"
        class="menu-backdrop"
        @click="showUserMenu = false"
      ></div>

      <!-- Global Components -->
      <ContextMenu ref="contextMenu" />
      <ToastNotification ref="toastRef" />
    </div>
  </DragDropProvider>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { usePlaybackStore } from '@/stores/playback'
import { useActivityStore } from '@/stores/activity'
import DragDropProvider from '@/components/DragDropProvider.vue'
import CreateArtistModal from '@/components/modals/CreateArtistModal.vue'
import PreferencesModal from '@/components/PreferencesModal.vue'
import NowPlayingBar from '@/components/NowPlayingBar.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const playbackStore = usePlaybackStore()
const activityStore = useActivityStore()

// Local state
const showUserMenu = ref(false)
const showPreferences = ref(false)
const showCreateArtistModal = ref(false)
const expandedSections = ref({
  artists: true // Default to expanded to show artists
})

// Context menu ref
const contextMenu = ref(null)

// Toast ref
const toastRef = ref(null)

// Provide context menu globally
provide('showContextMenu', (event, items, type) => {
  contextMenu.value?.show(event, items, type)
})

// Provide toast globally
provide('showToast', (options) => {
  toastRef.value?.show(options)
})

// Computed
const recentArtists = computed(() => dashboardStore.recentArtists)

// Methods
const handleSignOut = async () => {
  showUserMenu.value = false
  await authStore.signOut()
}

const handleArtistCreated = async (artistData, avatarFile) => {
  try {
    const artist = await dashboardStore.createArtist(artistData, avatarFile)
    showCreateArtistModal.value = false

    // Log activity
    await activityStore.logActivity({
      artist_id: artist.id,
      action_type: 'artist_created',
      target_type: 'artist',
      target_id: artist.id,
      description: `Created artist "${artist.name}"`
    })

    router.push(`/artists/${artist.slug}`)
  } catch (error) {
    console.error('Failed to create artist:', error)
  }
}

const handleSidebarContextMenu = (event) => {
  // Build a dummy item containing the current route which can be used by the context menu actions
  const navItem = { link: route.path, name: route.name || 'Navigation' }
  contextMenu.value?.show(event, navItem, 'navigation')
}

// Global context menu handler (fallback)
const handleGlobalContextMenu = (event) => {
  // Do not override context menu for editable fields
  const tag = (event.target?.tagName || '').toLowerCase()
  if (['input', 'textarea', 'select'].includes(tag) || event.target?.isContentEditable) {
    return
  }

  // If another custom menu is already open, do nothing
  if (contextMenu.value?.isVisible && contextMenu.value.isVisible()) {
    return
  }

  // Prevent browser menu and show a generic one
  event.preventDefault()
  const pageItem = { link: route.path, name: document.title || 'Page' }
  contextMenu.value?.show(event, pageItem, 'navigation')
}

// Initialize auth on mount
onMounted(async () => {
  await authStore.initialize()

  // Load dashboard data for sidebar
  if (authStore.isAuthenticated) {
    dashboardStore.loadDashboardData()
  }

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated && !route.path.startsWith('/auth')) {
    router.push('/auth/login')
  }

  // Listen for context menu globally (after app init)
  window.addEventListener('contextmenu', handleGlobalContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('contextmenu', handleGlobalContextMenu)
})
</script>

<style scoped>
/* Navigation Sections */
.nav-section {
  margin-bottom: 24px;
}

.nav-section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  margin: 0 0 12px 0;
  padding: 0 16px;
}

/* Expandable Section Header */
.nav-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  margin-bottom: 12px;
}

.nav-section-header.clickable {
  cursor: pointer;
  user-select: none;
}

.nav-section-header.clickable:hover h3 {
  color: rgba(255, 255, 255, 0.6);
}

.nav-section-header h3 {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  margin: 0;
  transition: color 0.2s;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Add Button */
.add-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.add-btn svg {
  width: 14px;
  height: 14px;
}

/* Expand Icon */
.expand-icon {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* Primary Nav Items */
.nav-item.primary {
  margin-bottom: 8px;
}

/* Nested Items Container */
.nested-items {
  margin-top: 4px;
  margin-bottom: 16px;
  padding-left: 16px;
}

/* Nested Nav Items */
.nav-item.nested {
  padding: 8px 16px;
  font-size: 13px;
  opacity: 0.8;
  transition: all 0.2s;
}

.nav-item.nested:hover {
  opacity: 1;
  padding-left: 20px;
}

.nav-item.nested.active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}

/* Mini Artist Avatar */
.artist-avatar.mini {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.artist-avatar.mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Empty State */
.nav-empty-state {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

/* Expand Transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  transform-origin: top;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.8) translateY(-10px);
}

/* Override default nav-item styles for consistency */
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Sidebar adjustments */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 24px 8px;
}

.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
