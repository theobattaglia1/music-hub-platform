<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">Artists</h1>
        <p class="text-dark-400">Manage your artist workspaces and collaborations</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <!-- Search -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search artists..."
            class="w-64 px-4 py-2 pl-10 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <svg class="absolute left-3 top-2.5 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        <!-- Filter -->
        <select
          v-model="selectedFilter"
          class="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Artists</option>
          <option value="owner">Owned by Me</option>
          <option value="member">Team Member</option>
          <option value="recent">Recently Active</option>
        </select>

        <!-- Create Button -->
        <button
          @click="showCreateModal = true"
          v-if="authStore.canCreateArtist"
          class="btn-primary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          New Artist
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="glassmorphic rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ filteredArtists.length }}</p>
            <p class="text-dark-400 text-sm">Total Artists</p>
          </div>
        </div>
      </div>

      <div class="glassmorphic rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ ownedArtists.length }}</p>
            <p class="text-dark-400 text-sm">Owned</p>
          </div>
        </div>
      </div>

      <div class="glassmorphic rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ collaboratingArtists.length }}</p>
            <p class="text-dark-400 text-sm">Collaborating</p>
          </div>
        </div>
      </div>

      <div class="glassmorphic rounded-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ activeArtists.length }}</p>
            <p class="text-dark-400 text-sm">Active</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Artists Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="glassmorphic rounded-xl p-6 animate-pulse">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-16 h-16 bg-dark-700 rounded-full"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-dark-700 rounded w-3/4"></div>
            <div class="h-3 bg-dark-700 rounded w-1/2"></div>
          </div>
        </div>
        <div class="space-y-2">
          <div class="h-3 bg-dark-700 rounded"></div>
          <div class="h-3 bg-dark-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <div v-else-if="filteredArtists.length === 0" class="text-center py-16">
      <svg class="w-20 h-20 text-dark-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="80" height="80">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <h3 class="text-xl font-medium text-dark-300 mb-2">
        {{ searchQuery ? 'No artists found' : 'No artists yet' }}
      </h3>
      <p class="text-dark-500 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first artist workspace' }}
      </p>
      <button
        v-if="!searchQuery && authStore.canCreateArtist"
        @click="showCreateModal = true"
        class="btn-primary"
      >
        Create Your First Artist
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="artist in filteredArtists"
        :key="artist.id"
        class="glassmorphic rounded-xl p-6 hover:bg-dark-800/50 transition-all cursor-pointer group"
        @click="navigateToArtist(artist)"
      >
        <!-- Artist Header -->
        <div class="flex items-center space-x-4 mb-4">
          <div class="relative">
            <img
              v-if="artist.avatar_url"
              :src="artist.avatar_url"
              :alt="artist.name"
              class="w-16 h-16 rounded-full object-cover border-2 border-dark-600"
            />
            <div
              v-else
              class="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-dark-600"
            >
              {{ artist.name.charAt(0) }}
            </div>

            <!-- Online Status -->
            <div
              v-if="artist.is_online"
              class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-dark-900 rounded-full"
            ></div>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors truncate">
              {{ artist.name }}
            </h3>
            <p class="text-dark-400 text-sm">{{ artist.genre || 'No genre set' }}</p>
            <div class="flex items-center space-x-2 mt-1">
              <span
                class="text-xs px-2 py-1 rounded-full"
                :class="getRoleBadgeClass(artist.user_role)"
              >
                {{ artist.user_role }}
              </span>
              <span v-if="artist.is_public" class="text-xs text-green-400">Public</span>
            </div>
          </div>
        </div>

        <!-- Artist Info -->
        <div class="space-y-3">
          <p v-if="artist.bio" class="text-dark-300 text-sm line-clamp-2">
            {{ artist.bio }}
          </p>

          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center space-x-4 text-dark-500">
              <span class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span>{{ artist.team_count || 0 }}</span>
              </span>

              <span class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"/>
                </svg>
                <span>{{ artist.events_count || 0 }}</span>
              </span>
            </div>

            <span class="text-dark-500 text-xs">
              {{ formatLastActivity(artist.last_activity || artist.updated_at) }}
            </span>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-dark-700">
            <div class="flex items-center space-x-2">
              <button
                @click.stop="navigateToArtist(artist)"
                class="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
              >
                Open Workspace
              </button>
            </div>

            <div class="flex items-center space-x-1">
              <button
                v-if="canManageArtist(artist)"
                @click.stop="editArtist(artist)"
                class="p-2 text-dark-500 hover:text-white transition-colors rounded"
                title="Edit Artist"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>

              <button
                @click.stop="shareArtist(artist)"
                class="p-2 text-dark-500 hover:text-white transition-colors rounded"
                title="Share Artist"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Artist Modal -->
    <CreateArtistModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="handleArtistCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import CreateArtistModal from '@/components/modals/CreateArtistModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

// State
const searchQuery = ref('')
const selectedFilter = ref('all')
const showCreateModal = ref(false)

// Computed
const loading = computed(() => dashboardStore.loading)
const artists = computed(() => dashboardStore.artists)

const filteredArtists = computed(() => {
  let filtered = artists.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(artist =>
      artist.name.toLowerCase().includes(query) ||
      artist.genre?.toLowerCase().includes(query) ||
      artist.bio?.toLowerCase().includes(query)
    )
  }

  // Apply category filter
  switch (selectedFilter.value) {
    case 'owner':
      filtered = filtered.filter(artist => artist.user_role === 'owner')
      break
    case 'member':
      filtered = filtered.filter(artist => artist.user_role !== 'owner')
      break
    case 'recent':
      filtered = filtered.filter(artist => {
        const lastActivity = new Date(artist.last_activity || artist.updated_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return lastActivity > weekAgo
      })
      break
  }

  return filtered
})

const ownedArtists = computed(() =>
  artists.value.filter(artist => artist.user_role === 'owner')
)

const collaboratingArtists = computed(() =>
  artists.value.filter(artist => artist.user_role !== 'owner')
)

const activeArtists = computed(() => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return artists.value.filter(artist => {
    const lastActivity = new Date(artist.last_activity || artist.updated_at)
    return lastActivity > weekAgo
  })
})

// Methods
const navigateToArtist = (artist) => {
  router.push(`/artists/${artist.slug}`)
}

const handleArtistCreated = async (artistData, avatarFile) => {
  try {
    const artist = await dashboardStore.createArtist(artistData, avatarFile)
    showCreateModal.value = false
    router.push(`/artists/${artist.slug}`)
  } catch (error) {
    console.error('Failed to create artist:', error)
  }
}

const canManageArtist = (artist) => {
  return artist.user_role === 'owner' || authStore.canManageUsers
}

const editArtist = (artist) => {
  // TODO: Implement edit modal
  console.log('Edit artist:', artist.name)
}

const shareArtist = (artist) => {
  // TODO: Implement share functionality
  console.log('Share artist:', artist.name)
}

const getRoleBadgeClass = (role) => {
  const classes = {
    owner: 'bg-primary-500/20 text-primary-400',
    admin: 'bg-red-500/20 text-red-400',
    manager: 'bg-yellow-500/20 text-yellow-400',
    member: 'bg-green-500/20 text-green-400',
    viewer: 'bg-gray-500/20 text-gray-400'
  }
  return classes[role] || classes.member
}

const formatLastActivity = (date) => {
  const now = new Date()
  const activity = new Date(date)
  const diff = now - activity
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

// Lifecycle
onMounted(() => {
  if (!dashboardStore.hasArtists) {
    dashboardStore.loadDashboardData()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
