<template>
  <div class="p-6 space-y-8">
    <!-- Welcome Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">
          Welcome back, {{ authStore.userName }}!
        </h1>
        <p class="text-dark-400">
          Here's what's happening in your creative workspace
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center space-x-3">
        <button
          @click="showCreateArtistModal = true"
          v-if="authStore.canCreateArtist"
          class="btn-primary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          New Artist
        </button>

        <button
          @click="refreshDashboard"
          :disabled="loading"
          class="btn-secondary"
        >
          <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stats-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm font-medium">Total Artists</p>
            <p class="text-3xl font-bold text-white mt-1">{{ stats.totalArtists }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        </div>
        <div class="flex items-center mt-4 text-sm">
          <span class="text-green-400 font-medium">+{{ stats.newArtistsThisMonth }}</span>
          <span class="text-dark-400 ml-1">this month</span>
        </div>
      </div>

      <div class="glassmorphic rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm font-medium">Active Projects</p>
            <p class="text-3xl font-bold text-white mt-1">{{ stats.activeProjects }}</p>
          </div>
          <div class="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
        </div>
        <div class="flex items-center mt-4 text-sm">
          <span class="text-blue-400 font-medium">{{ stats.projectsThisWeek }}</span>
          <span class="text-dark-400 ml-1">updated this week</span>
        </div>
      </div>

      <div class="glassmorphic rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm font-medium">Team Members</p>
            <p class="text-3xl font-bold text-white mt-1">{{ stats.teamMembers }}</p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
        </div>
        <div class="flex items-center mt-4 text-sm">
          <span class="text-green-400 font-medium">{{ stats.onlineMembers }}</span>
          <span class="text-dark-400 ml-1">online now</span>
        </div>
      </div>

      <div class="glassmorphic rounded-xl p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-dark-400 text-sm font-medium">Upcoming Events</p>
            <p class="text-3xl font-bold text-white mt-1">{{ stats.upcomingEvents }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
        <div class="flex items-center mt-4 text-sm">
          <span class="text-purple-400 font-medium">{{ stats.eventsThisWeek }}</span>
          <span class="text-dark-400 ml-1">this week</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Recent Artists -->
      <div class="lg:col-span-2">
        <div class="glassmorphic rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-white">Recent Artists</h2>
            <router-link
              to="/artists"
              class="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              View All
            </router-link>
          </div>

          <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div class="flex items-center space-x-4 p-4 bg-dark-800/50 rounded-lg">
                <div class="w-12 h-12 bg-dark-700 rounded-full"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-dark-700 rounded w-1/4"></div>
                  <div class="h-3 bg-dark-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="recentArtists.length === 0" class="text-center py-12">
            <svg class="w-16 h-16 text-dark-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <h3 class="text-lg font-medium text-dark-300 mb-2">No artists yet</h3>
            <p class="text-dark-500 mb-4">Get started by creating your first artist workspace</p>
            <button
              @click="showCreateArtistModal = true"
              v-if="authStore.canCreateArtist"
              class="btn-primary"
            >
              Create Artist
            </button>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="artist in recentArtists"
              :key="artist.id"
              class="flex items-center justify-between p-4 bg-dark-800/30 hover:bg-dark-800/50 rounded-lg transition-colors cursor-pointer group"
              @click="navigateToArtist(artist)"
            >
              <div class="flex items-center space-x-4">
                <div class="relative">
                  <img
                    v-if="artist.avatar_url"
                    :src="artist.avatar_url"
                    :alt="artist.name"
                    class="w-12 h-12 rounded-full object-cover"
                  />
                  <div
                    v-else
                    class="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-medium"
                  >
                    {{ artist.name.charAt(0) }}
                  </div>
                  <div
                    v-if="artist.is_online"
                    class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-dark-900 rounded-full"
                  ></div>
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-medium truncate">{{ artist.name }}</h3>
                  <p class="text-dark-400 text-sm">{{ formatLastActivity(artist.last_activity) }}</p>
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <span class="text-xs text-dark-500 bg-dark-700 px-2 py-1 rounded-full">
                  {{ artist.role }}
                </span>
                <svg class="w-5 h-5 text-dark-600 group-hover:text-dark-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="space-y-6">
        <!-- Recent Activity -->
        <div class="glassmorphic rounded-xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-white">Recent Activity</h2>
            <button class="text-dark-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
          </div>

          <div v-if="loading" class="space-y-4">
            <div v-for="i in 4" :key="i" class="animate-pulse">
              <div class="flex space-x-3">
                <div class="w-8 h-8 bg-dark-700 rounded-full"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-dark-700 rounded w-3/4"></div>
                  <div class="h-2 bg-dark-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="recentActivity.length === 0" class="text-center py-8">
            <svg class="w-12 h-12 text-dark-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p class="text-dark-500 text-sm">No recent activity</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex space-x-3"
            >
              <div class="flex-shrink-0">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  :class="getActivityIconBg(activity.type)"
                >
                  <component :is="getActivityIcon(activity.type)" class="w-4 h-4" />
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm text-dark-300">
                  <span class="text-white font-medium">{{ activity.user_name }}</span>
                  {{ activity.description }}
                </p>
                <p class="text-xs text-dark-500 mt-1">{{ formatTimeAgo(activity.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="glassmorphic rounded-xl p-6">
          <h2 class="text-xl font-semibold text-white mb-6">Quick Links</h2>

          <div class="space-y-3">
            <router-link
              to="/calendar"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-dark-800/50 transition-colors group"
            >
              <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium group-hover:text-blue-400 transition-colors">Calendar</p>
                <p class="text-dark-400 text-sm">Manage events & schedules</p>
              </div>
            </router-link>

            <router-link
              to="/media"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-dark-800/50 transition-colors group"
            >
              <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium group-hover:text-purple-400 transition-colors">Media Library</p>
                <p class="text-dark-400 text-sm">Audio, images & videos</p>
              </div>
            </router-link>

            <router-link
              to="/artists"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-dark-800/50 transition-colors group"
            >
              <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium group-hover:text-green-400 transition-colors">All Artists</p>
                <p class="text-dark-400 text-sm">Browse artist workspaces</p>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Artist Modal -->
    <CreateArtistModal
      v-if="showCreateArtistModal"
      @close="showCreateArtistModal = false"
      @created="handleArtistCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import CreateArtistModal from '@/components/modals/CreateArtistModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

// State
const showCreateArtistModal = ref(false)

// Computed
const loading = computed(() => dashboardStore.loading)
const recentArtists = computed(() => dashboardStore.recentArtists)
const recentActivity = computed(() => dashboardStore.recentActivity)
const stats = computed(() => dashboardStore.stats)

// Methods
const refreshDashboard = () => {
  dashboardStore.refreshData()
}

const navigateToArtist = (artist) => {
  router.push(`/artists/${artist.slug}`)
}

const handleArtistCreated = async (artistData, avatarFile) => {
  try {
    const artist = await dashboardStore.createArtist(artistData, avatarFile)
    showCreateArtistModal.value = false
    router.push(`/artists/${artist.slug}`)
  } catch (error) {
    console.error('Failed to create artist:', error)
    // Error handling is done in the modal
  }
}

const formatLastActivity = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `Active ${minutes}m ago`
  if (hours < 24) return `Active ${hours}h ago`
  return `Active ${days}d ago`
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const getActivityIconBg = (type) => {
  const backgrounds = {
    media_upload: 'bg-purple-500',
    event_created: 'bg-blue-500',
    team_joined: 'bg-green-500',
    moodboard_updated: 'bg-yellow-500',
    note_added: 'bg-pink-500'
  }
  return backgrounds[type] || 'bg-gray-500'
}

const getActivityIcon = () => {
  // This would return the appropriate icon component based on type
  // For now, returning a generic activity icon
  return 'svg'
}

// Lifecycle
onMounted(() => {
  dashboardStore.loadDashboardData()
})
</script>