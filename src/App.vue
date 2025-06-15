<template>
  <div id="app" class="min-h-screen bg-dark-950">
    <!-- Loading Screen -->
    <div
      v-if="!authStore.isInitialized"
      class="min-h-screen flex items-center justify-center bg-dark-950"
    >
      <div class="text-center">
        <div class="animate-spin-slow w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-dark-300 text-sm">Initializing Music Hub...</p>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else-if="authStore.isAuthenticated" class="min-h-screen flex">
      <!-- Sidebar Navigation -->
      <aside class="w-64 bg-dark-900/50 backdrop-blur-xl border-r border-dark-700">
        <div class="h-full flex flex-col">
          <!-- Logo/Brand -->
          <div class="p-6 border-b border-dark-700">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.1.9 2 2 2s2-.9 2-2M9 19c0-1.1-.9-2-2-2s-2 .9-2 2M21 19c0 1.1-.9 2-2 2s-2-.9-2-2M21 19c0-1.1.9-2.1-2-2s-2 .9-2 2"/>
                </svg>
              </div>
              <div>
                <h1 class="text-lg font-semibold text-white">Music Hub</h1>
                <p class="text-xs text-dark-400">Creative Platform</p>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-4 py-6 space-y-2">
            <router-link
              to="/dashboard"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              :class="{ 'bg-dark-800 text-white': $route.path === '/dashboard' }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
              </svg>
              <span>Dashboard</span>
            </router-link>

            <router-link
              to="/artists"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              :class="{ 'bg-dark-800 text-white': $route.path.startsWith('/artists') }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>Artists</span>
            </router-link>

            <router-link
              to="/media"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              :class="{ 'bg-dark-800 text-white': $route.path === '/media' }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>Media Library</span>
            </router-link>

            <router-link
              to="/calendar"
              class="flex items-center space-x-3 px-3 py-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              :class="{ 'bg-dark-800 text-white': $route.path === '/calendar' }"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"/>
              </svg>
              <span>Calendar</span>
            </router-link>

            <!-- Divider -->
            <div class="border-t border-dark-700 my-4"></div>

            <!-- Recent Artists -->
            <div class="px-3">
              <p class="text-xs font-medium text-dark-400 uppercase tracking-wider mb-3">Recent Artists</p>
              <div v-if="recentArtists.length === 0" class="text-sm text-dark-500">
                No recent artists
              </div>
              <div v-else class="space-y-1">
                <router-link
                  v-for="artist in recentArtists"
                  :key="artist.id"
                  :to="`/artists/${artist.slug}`"
                  class="flex items-center space-x-3 px-3 py-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors text-sm"
                >
                  <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-medium text-white">
                    {{ artist.name.charAt(0) }}
                  </div>
                  <span class="truncate">{{ artist.name }}</span>
                </router-link>
              </div>
            </div>
          </nav>

          <!-- User Menu -->
          <div class="p-4 border-t border-dark-700">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <img
                  v-if="authStore.userAvatar"
                  :src="authStore.userAvatar"
                  :alt="authStore.userName"
                  class="w-8 h-8 rounded-full object-cover"
                />
                <span v-else class="text-sm font-medium text-white">
                  {{ authStore.userName.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ authStore.userName }}</p>
                <p class="text-xs text-dark-400 truncate">{{ authStore.userEmail }}</p>
              </div>
              <button
                @click="showUserMenu = !showUserMenu"
                class="p-1 text-dark-400 hover:text-white transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              </button>
            </div>

            <!-- User Dropdown Menu -->
            <div
              v-if="showUserMenu"
              class="absolute bottom-16 left-4 right-4 bg-dark-800 rounded-lg border border-dark-700 shadow-xl py-2 z-50"
            >
              <router-link
                to="/profile"
                class="block px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                @click="showUserMenu = false"
              >
                Profile Settings
              </router-link>
              <router-link
                to="/preferences"
                class="block px-4 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                @click="showUserMenu = false"
              >
                Preferences
              </router-link>
              <div class="border-t border-dark-700 my-1"></div>
              <button
                @click="handleSignOut"
                class="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col min-h-screen overflow-hidden">
        <!-- Top Navigation Bar -->
        <header class="bg-dark-900/30 backdrop-blur-xl border-b border-dark-700 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <!-- Breadcrumbs or page title will go here -->
              <h2 class="text-xl font-semibold text-white">
                {{ getPageTitle() }}
              </h2>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center space-x-4">
              <!-- Search -->
              <div class="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  class="w-64 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <svg class="absolute right-3 top-2.5 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <!-- Notifications -->
              <button class="p-2 text-dark-400 hover:text-white transition-colors relative">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5c-5 5-10 10-15 0l5-5z"/>
                </svg>
                <span class="absolute top-0 right-0 w-2 h-2 bg-accent-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="flex-1 overflow-auto">
          <router-view />
        </div>
      </main>
    </div>

    <!-- Authentication Views -->
    <div v-else class="min-h-screen">
      <router-view />
    </div>

    <!-- Click outside to close user menu -->
    <div
      v-if="showUserMenu"
      class="fixed inset-0 z-40"
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
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}
</style>