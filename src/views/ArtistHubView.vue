<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <div class="animate-pulse">
        <div class="flex items-center space-x-4 mb-6">
          <div class="w-20 h-20 bg-dark-700 rounded-full"></div>
          <div class="space-y-2">
            <div class="h-6 bg-dark-700 rounded w-48"></div>
            <div class="h-4 bg-dark-700 rounded w-32"></div>
          </div>
        </div>
        <div class="flex space-x-4 mb-6">
          <div v-for="i in 6" :key="i" class="h-10 bg-dark-700 rounded w-20"></div>
        </div>
        <div class="h-64 bg-dark-700 rounded"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-16">
      <div class="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-white mb-2">Artist Not Found</h2>
      <p class="text-dark-400 mb-4">{{ error }}</p>
      <router-link to="/artists" class="btn-primary">
        Back to Artists
      </router-link>
    </div>

    <!-- Artist Hub Content -->
    <div v-else-if="artist" class="space-y-6">
      <!-- Hero Section -->
      <div class="glassmorphic rounded-2xl p-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-6">
            <div class="relative">
              <img
                v-if="artist.avatar_url"
                :src="artist.avatar_url"
                :alt="artist.name"
                class="w-20 h-20 rounded-full object-cover border-2 border-dark-600"
              />
              <div
                v-else
                class="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-dark-600"
              >
                {{ artist.name.charAt(0) }}
              </div>
              <div
                v-if="artist.is_online"
                class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-3 border-dark-900 rounded-full"
              ></div>
            </div>

            <div>
              <h1 class="text-3xl font-bold text-white mb-2">{{ artist.name }}</h1>
              <div class="flex items-center space-x-4 text-dark-400">
                <span v-if="artist.genre" class="flex items-center space-x-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.1.9 2 2 2s2-.9 2-2M9 19c0-1.1-.9-2-2-2s-2 .9-2 2M21 19c0 1.1-.9 2-2 2s-2-.9-2-2M21 19c0-1.1.9-2.1-2-2s-2 .9-2 2"/>
                  </svg>
                  <span>{{ artist.genre }}</span>
                </span>
                <span v-if="artist.location" class="flex items-center space-x-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>{{ artist.location }}</span>
                </span>
              </div>
              <p v-if="artist.bio" class="text-dark-300 mt-2 max-w-2xl">{{ artist.bio }}</p>
            </div>
          </div>

          <!-- Role Badge -->
          <div class="text-right">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              :class="getRoleBadgeClass(userRole)"
            >
              {{ userRole }}
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="glassmorphic rounded-xl">
        <nav class="flex space-x-1 p-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors"
            :class="activeTab === tab.id
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white hover:bg-dark-800'"
          >
            <component :is="tab.icon" class="w-5 h-5" />
            <span>{{ tab.name }}</span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="glassmorphic rounded-xl p-6 min-h-96">
        <div class="text-center py-16">
          <div class="w-16 h-16 bg-dark-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg class="w-8 h-8 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-dark-300 mb-2">{{ getActiveTabName() }} Coming Soon</h3>
          <p class="text-dark-500">This feature is currently under development.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

// Props
const props = defineProps({
  slug: {
    type: String,
    required: true
  }
})

// State
const loading = ref(true)
const error = ref('')
const artist = ref(null)
const activeTab = ref('overview')
const userRole = ref('member')

// Tab configuration
const tabs = [
  { id: 'overview', name: 'Overview', icon: 'svg' },
  { id: 'calendar', name: 'Calendar', icon: 'svg' },
  { id: 'media', name: 'Media', icon: 'svg' },
  { id: 'moodboards', name: 'Moodboards', icon: 'svg' },
  { id: 'timeline', name: 'Timeline', icon: 'svg' },
  { id: 'notes', name: 'Notes', icon: 'svg' },
  { id: 'team', name: 'Team', icon: 'svg' }
]

// Methods
const loadArtist = async () => {
  try {
    loading.value = true
    error.value = ''

    const artistData = await dashboardStore.getArtistBySlug(props.slug)

    if (!artistData) {
      error.value = 'Artist not found or you don\'t have access to this workspace.'
      return
    }

    artist.value = artistData

    // Determine user role (mock for now)
    userRole.value = artistData.artist_team_members?.[0]?.role || 'viewer'

  } catch (err) {
    console.error('Failed to load artist:', err)
    error.value = 'Failed to load artist workspace. Please try again.'
  } finally {
    loading.value = false
  }
}

const getRoleBadgeClass = (role) => {
  const classes = {
    owner: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
    manager: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    member: 'bg-green-500/20 text-green-400 border border-green-500/30',
    viewer: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
  }
  return classes[role] || classes.viewer
}

const getActiveTabName = () => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab?.name || 'Feature'
}

// Lifecycle
onMounted(() => {
  loadArtist()
})
</script>