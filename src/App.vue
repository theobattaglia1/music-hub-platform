<template>
  <div id="app" class="app-container">
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
    <div v-else-if="authStore.isAuthenticated" class="app-layout">
      <!-- Sidebar Navigation -->
      <aside class="sidebar">
        <div class="sidebar-content">
          <!-- Logo/Brand -->
          <div class="sidebar-header">
            <div class="flex items-center space-x-3">
              <div class="brand-icon">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.1.9 2 2 2s2-.9 2-2M9 19c0-1.1-.9-2-2-2s-2 .9-2 2M21 19c0 1.1-.9 2-2 2s-2-.9-2-2M21 19c0-1.1.9-2.1-2-2s-2 .9-2 2"/>
                </svg>
              </div>
              <div>
                <h1 class="sidebar-title">Music Hub</h1>
                <p class="sidebar-subtitle">Creative Platform</p>
              </div>
            </div>

            <!-- Preferences Gear -->
            <button
              @click="showPreferences = true"
              class="preferences-btn"
              title="Preferences"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
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
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                </svg>
                <span>Dashboard</span>
              </router-link>

              <router-link
                to="/artists"
                class="nav-item"
                :class="{ 'active': $route.path.startsWith('/artists') }"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span>Artists</span>
              </router-link>

              <router-link
                to="/media"
                class="nav-item"
                :class="{ 'active': $route.path === '/media' }"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>Media Library</span>
              </router-link>

              <router-link
                to="/calendar"
                class="nav-item"
                :class="{ 'active': $route.path === '/calendar' }"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"/>
                </svg>
                <span>Calendar</span>
              </router-link>
            </div>

            <!-- Recent Artists Section -->
            <div class="nav-section">
              <div class="nav-section-header">
                <h3>Recent Artists</h3>
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
                    {{ artist.name.charAt(0) }}
                  </div>
                  <span class="truncate">{{ artist.name }}</span>
                </router-link>
              </div>
            </div>
          </nav>

          <!-- User Section -->
          <div class="sidebar-footer">
            <div class="user-info">
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
              <button
                @click="showUserMenu = !showUserMenu"
                class="user-menu-btn"
              >
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
                  Profile Settings
                </router-link>
                <router-link
                  to="/preferences"
                  class="context-menu-item"
                  @click="showUserMenu = false"
                >
                  Preferences
                </router-link>
                <hr class="menu-divider">
                <button
                  @click="handleSignOut"
                  class="context-menu-item danger"
                >
                  Sign Out
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Top Navigation Bar -->
        <header class="view-header">
          <div class="header-content">
            <div class="header-left">
              <h2 class="view-title">{{ getPageTitle() }}</h2>
            </div>

            <!-- Quick Actions -->
            <div class="header-actions">
              <!-- Search -->
              <div class="search-container">
                <input
                  type="text"
                  placeholder="Search..."
                  class="search-input"
                />
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <!-- Notifications -->
              <button class="notification-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.07 14C10.41 13.62 10.74 13.08 11 12.5v-.5L9 10h2l2 2h2l-2-2h2l-2-2V6l-4-4H7z"/>
                </svg>
                <span class="notification-badge"></span>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <router-view />
        </div>
      </main>
    </div>

    <!-- Authentication Views -->
    <div v-else class="auth-container">
      <router-view />
    </div>

    <!-- Click outside to close user menu -->
    <div
      v-if="showUserMenu"
      class="menu-backdrop"
      @click="showUserMenu = false"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Local state
const showUserMenu = ref(false)
const showPreferences = ref(false)

// Recent artists (placeholder - will be implemented later)
const recentArtists = ref([])

// Computed
const getPageTitle = () => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/artists': 'Artists',
    '/media': 'Media Library',
    '/calendar': 'Calendar',
    '/profile': 'Profile Settings',
    '/preferences': 'Preferences'
  }

  // Check for dynamic routes
  if (route.path.startsWith('/artists/')) {
    return 'Artist Workspace'
  }

  return titles[route.path] || 'Music Hub'
}

// Methods
const handleSignOut = async () => {
  showUserMenu.value = false
  await authStore.signOut()
}

// Initialize auth on mount
onMounted(async () => {
  await authStore.initialize()

  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated && !route.path.startsWith('/auth')) {
    router.push('/auth/login')
  }
})
</script>

<style scoped>
/* App Container */
.app-container {
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

.app-layout {
  display: flex;
  height: 100vh;
}

/* Sidebar Styling */
.sidebar {
  width: 280px;
  background: var(--sidebar-bg);
  backdrop-filter: blur(var(--blur-amount));
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--brand-color), var(--accent-color));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.sidebar-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.preferences-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--text-muted);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preferences-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 32px;
}

.nav-section-header {
  margin-bottom: 12px;
}

.nav-section-header h3 {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  padding: 0 12px;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-empty-state {
  font-size: 13px;
  color: var(--text-muted);
  padding: 0 12px;
}

.artist-nav-item {
  font-size: 13px;
}

.artist-avatar {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--brand-color), var(--accent-color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin-right: 12px;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu-btn {
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: var(--text-muted);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-menu-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.user-dropdown {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  margin-bottom: 8px;
  z-index: 100;
}

.menu-divider {
  margin: 4px 0;
  border: none;
  border-top: 1px solid var(--border-color);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.view-header {
  background: rgba(18, 18, 18, 0.8);
  backdrop-filter: blur(var(--blur-amount));
  border-bottom: 1px solid var(--border-color);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
}

.header-left {
  flex: 1;
}

.view-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-container {
  position: relative;
}

.search-input {
  width: 280px;
  padding: 8px 16px 8px 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-color);
  box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.notification-btn {
  position: relative;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: var(--text-muted);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.notification-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: var(--accent-color);
  border-radius: 50%;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-primary);
}

.auth-container {
  width: 100vw;
  height: 100vh;
  background: var(--bg-primary);
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
}

/* SVG Icons */
svg {
  width: 18px;
  height: 18px;
}

.notification-btn svg {
  width: 20px;
  height: 20px;
}

.search-icon {
  width: 16px !important;
  height: 16px !important;
}
</style>