<template>
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
      <aside class="sidebar">
        <div class="sidebar-content">
          <!-- Logo/Brand -->
          <div class="sidebar-header">
            <div class="app-logo">
              <svg
                class="logo-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M10 16.5v-9l6 4.5-6 4.5z" fill="white" />
              </svg>
              <span class="logo-text">Music Hub</span>
            </div>

            <!-- Preferences Gear -->
            <button
              @click="showPreferences = true"
              class="prefs-toggle-btn"
              title="Preferences"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
                />
              </svg>
            </button>
          </div>

          <!-- Navigation -->
          <nav class="sidebar-nav">
            <!-- Main Navigation -->
            <div class="nav-section">
              <router-link
                to="/dashboard"
                class="nav-item"
                :class="{ 'active': $route.path === '/dashboard' }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </router-link>

              <router-link
                to="/artists"
                class="nav-item"
                :class="{ 'active': $route.path.startsWith('/artists') }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
                <span>Artists</span>
              </router-link>

              <router-link
                to="/media"
                class="nav-item"
                :class="{ 'active': $route.path === '/media' }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
                <span>Playlists</span>
              </router-link>

              <router-link
                to="/calendar"
                class="nav-item"
                :class="{ 'active': $route.path === '/calendar' }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>Calendar</span>
              </router-link>
            </div>

            <!-- Library Section -->
            <div class="nav-section">
              <div class="nav-section-header">
                <h3>LIBRARY</h3>
                <button
                  @click="showCreateArtistModal = true"
                  v-if="authStore.canCreateArtist"
                  class="add-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
              </div>

              <div class="nav-items">
                <div class="nav-item">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span>All Songs</span>
                  <span class="item-count">{{ stats.totalSongs || 0 }}</span>
                </div>

                <div class="nav-item">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <span>Artists</span>
                  <span class="item-count">{{ stats.totalArtists || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Recent Artists Section -->
            <div class="nav-section">
              <div class="nav-section-header">
                <h3>RECENT ARTISTS</h3>
              </div>

              <div v-if="recentArtists.length === 0" class="nav-empty-state">
                No recent artists
              </div>

              <div v-else class="nav-items">
                <router-link
                  v-for="artist in recentArtists"
                  :key="artist.id"
                  :to="`/artists/${artist.slug}`"
                  class="nav-item artist-nav-item"
                >
                  <div class="artist-avatar">
                    <img
                      v-if="artist.avatar_url"
                      :src="artist.avatar_url"
                      :alt="artist.name"
                      class="avatar-image"
                    />
                    <span v-else class="avatar-initial">
                      {{ artist.name.charAt(0) }}
                    </span>
                  </div>
                  <span class="truncate">{{ artist.name }}</span>
                </router-link>
              </div>
            </div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import CreateArtistModal from '@/components/modals/CreateArtistModal.vue'
import PreferencesModal from '@/components/PreferencesModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

// Local state
const showUserMenu = ref(false)
const showPreferences = ref(false)
const showCreateArtistModal = ref(false)

// Computed
const recentArtists = computed(() => dashboardStore.recentArtists)
const stats = computed(() => dashboardStore.stats)

// Methods
const handleSignOut = async () => {
  showUserMenu.value = false
  await authStore.signOut()
}

const handleArtistCreated = async (artistData, avatarFile) => {
  try {
    const artist = await dashboardStore.createArtist(artistData, avatarFile)
    showCreateArtistModal.value = false
    router.push(`/artists/${artist.slug}`)
  } catch (error) {
    console.error('Failed to create artist:', error)
  }
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
})
</script>