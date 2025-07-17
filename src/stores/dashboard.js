import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

// MOCK MODE: Local reactive data for UI testing
const LOCAL_ARTISTS = ref([
  {
    id: '1',
    name: 'Taylor Swift',
    slug: 'taylor-swift',
    genre: 'Pop',
    location: 'Nashville, TN',
    bio: 'Singer-songwriter known for narrative songs',
    avatar_url: 'https://ui-avatars.com/api/?name=Taylor+Swift&background=FF6B6B&color=fff&size=256',
    song_count: 12,
    active_tasks: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    team_members: [
      { id: 1, name: 'John Producer', role: 'Producer', avatar_url: null },
      { id: 2, name: 'Jane Manager', role: 'Manager', avatar_url: null }
    ]
  },
  {
    id: '2',
    name: 'The Weeknd',
    slug: 'the-weeknd',
    genre: 'R&B',
    location: 'Toronto, Canada',
    bio: 'Canadian singer, songwriter, and record producer',
    avatar_url: 'https://ui-avatars.com/api/?name=The+Weeknd&background=4ECDC4&color=fff&size=256',
    song_count: 8,
    active_tasks: 5,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    team_members: [
      { id: 3, name: 'Mike Engineer', role: 'Engineer', avatar_url: null }
    ]
  },
  {
    id: '3',
    name: 'Billie Eilish',
    slug: 'billie-eilish',
    genre: 'Alternative',
    location: 'Los Angeles, CA',
    bio: 'American singer and songwriter',
    avatar_url: 'https://ui-avatars.com/api/?name=Billie+Eilish&background=95E1D3&color=fff&size=256',
    song_count: 15,
    active_tasks: 2,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    team_members: [
      { id: 4, name: 'Sarah Creative', role: 'Creative Director', avatar_url: null },
      { id: 5, name: 'Tom Assistant', role: 'Assistant', avatar_url: null },
      { id: 6, name: 'Lisa Marketing', role: 'Marketing', avatar_url: null }
    ]
  }
])

const LOCAL_ACTIVITIES = ref([
  {
    id: '1',
    artist_id: '1',
    user_id: 'mock-user-123',
    type: 'media_upload',
    description: 'Uploaded new demo track',
    metadata: { file_name: 'demo-track.mp3' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user_name: 'Demo User'
  },
  {
    id: '2', 
    artist_id: '2',
    user_id: 'mock-user-123',
    type: 'event_created',
    description: 'Created studio session for Friday',
    metadata: { event_name: 'Recording Session' },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    user_name: 'Demo User'
  },
  {
    id: '3',
    artist_id: '3',
    user_id: 'mock-user-123',
    type: 'moodboard_updated',
    description: 'Updated visual concepts',
    metadata: { moodboard_name: 'Album Artwork Ideas' },
    created_at: new Date(Date.now() - 10800000).toISOString(),
    user_name: 'Demo User'
  }
])

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const loading = ref(false)
  const artists = computed(() => LOCAL_ARTISTS.value)
  const recentActivity = computed(() => LOCAL_ACTIVITIES.value)
  const stats = ref({
    totalArtists: 0,
    newArtistsThisMonth: 0,
    activeProjects: 0,
    projectsThisWeek: 0,
    teamMembers: 0,
    onlineMembers: 0,
    upcomingEvents: 0,
    eventsThisWeek: 0
  })

  // Computed
  const recentArtists = computed(() => {
    return artists.value
      .sort((a, b) => new Date(b.last_activity || b.updated_at) - new Date(a.last_activity || a.updated_at))
      .slice(0, 5)
  })

  const hasArtists = computed(() => artists.value.length > 0)

  // Actions
  const loadDashboardData = async () => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Loading dashboard data locally')

      await Promise.all([
        loadArtists(),
        loadRecentActivity(),
        loadStats()
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadArtists = async () => {
    console.log('🎭 MOCK MODE: Using local artists data')
    // Data is already reactive via computed
  }

  const loadRecentActivity = async () => {
    console.log('🎭 MOCK MODE: Using local activity data')
    // Data is already reactive via computed
  }

  const loadStats = async () => {
    try {
      // Calculate stats from local data
      const totalArtists = artists.value.length

      // Get artists created this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const newArtistsThisMonth = artists.value.filter(
        artist => new Date(artist.created_at) >= thisMonth
      ).length

      // Calculate mock stats
      const uniqueTeamMembers = new Set(
        artists.value.flatMap(artist => artist.team_members?.map(member => member.id) || [])
      ).size

      stats.value = {
        totalArtists,
        newArtistsThisMonth,
        activeProjects: Math.floor(totalArtists * 0.7), // Mock calculation
        projectsThisWeek: 3, // Mock data
        teamMembers: uniqueTeamMembers,
        onlineMembers: Math.floor(uniqueTeamMembers * 0.3), // Mock calculation
        upcomingEvents: 5, // Mock data
        eventsThisWeek: 2 // Mock data
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      // Use default stats if calculation fails
    }
  }

  const createArtist = async (artistData, avatarFile = null) => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Creating artist locally', artistData.name)

      let avatarUrl = null

      // Mock avatar upload
      if (avatarFile) {
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistData.name)}&background=6366f1&color=fff&size=256`
      }

      // Create new artist
      const newArtist = {
        id: `mock-${Date.now()}`,
        name: artistData.name,
        slug: artistData.slug || artistData.name.toLowerCase().replace(/\s+/g, '-'),
        bio: artistData.bio || '',
        genre: artistData.genre || 'Unspecified',
        location: artistData.location || '',
        avatar_url: avatarUrl,
        is_public: artistData.is_public ?? true,
        allow_collaboration: artistData.allow_collaboration ?? true,
        song_count: 0,
        active_tasks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        team_members: [
          { id: 'demo-user', name: 'Demo User', role: 'owner', avatar_url: null }
        ]
      }

      // Add to local state
      LOCAL_ARTISTS.value.unshift(newArtist)
      stats.value.totalArtists++

      // Log activity
      await logActivity(newArtist.id, 'artist_created', 'created the artist workspace')

      return newArtist
    } catch (error) {
      console.error('Failed to create artist:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateArtist = async (artistId, updates, avatarFile = null) => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Updating artist locally', artistId)

      let avatarUrl = updates.avatar_url

      // Mock avatar upload
      if (avatarFile) {
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(updates.name || 'Artist')}&background=6366f1&color=fff&size=256`
      }

      // Find and update the artist
      const index = LOCAL_ARTISTS.value.findIndex(a => a.id === artistId)
      if (index !== -1) {
        LOCAL_ARTISTS.value[index] = {
          ...LOCAL_ARTISTS.value[index],
          ...updates,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        }
        
        await logActivity(artistId, 'artist_updated', 'updated artist information')
        return LOCAL_ARTISTS.value[index]
      }

      throw new Error('Artist not found')
    } catch (error) {
      console.error('Failed to update artist:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteArtist = async (artistId) => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Deleting artist locally', artistId)

      // Remove from local state
      const index = LOCAL_ARTISTS.value.findIndex(a => a.id === artistId)
      if (index !== -1) {
        LOCAL_ARTISTS.value.splice(index, 1)
        stats.value.totalArtists--
        
        // Remove related activities
        LOCAL_ACTIVITIES.value = LOCAL_ACTIVITIES.value.filter(a => a.artist_id !== artistId)
        
        return true
      }

      throw new Error('Artist not found')
    } catch (error) {
      console.error('Failed to delete artist:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logActivity = async (artistId, type, description, metadata = {}) => {
    try {
      console.log('🎭 MOCK MODE: Logging activity locally', type)

      const newActivity = {
        id: `activity-${Date.now()}`,
        artist_id: artistId,
        user_id: 'mock-user-123',
        type,
        description,
        metadata,
        created_at: new Date().toISOString(),
        user_name: 'Demo User'
      }

      // Add to local activities
      LOCAL_ACTIVITIES.value.unshift(newActivity)

      // Keep only recent activities (limit to 50)
      if (LOCAL_ACTIVITIES.value.length > 50) {
        LOCAL_ACTIVITIES.value = LOCAL_ACTIVITIES.value.slice(0, 50)
      }
    } catch (error) {
      console.error('Failed to log activity:', error)
      // Don't throw error for activity logging
    }
  }

  const getArtistBySlug = async (slug) => {
    try {
      console.log('🎭 MOCK MODE: Getting artist by slug locally', slug)
      
      // Find in local data
      const artist = LOCAL_ARTISTS.value.find(a => a.slug === slug)
      if (artist) {
        return artist
      }

      throw new Error(`Artist with slug '${slug}' not found`)
    } catch (error) {
      console.error('Failed to get artist by slug:', error)
      throw error
    }
  }

  const refreshData = () => {
    console.log('🎭 MOCK MODE: Refreshing local data')
    return loadDashboardData()
  }

  const clearCache = () => {
    console.log('🎭 MOCK MODE: Clearing local cache')
    LOCAL_ARTISTS.value = []
    LOCAL_ACTIVITIES.value = []
    stats.value = {
      totalArtists: 0,
      newArtistsThisMonth: 0,
      activeProjects: 0,
      projectsThisWeek: 0,
      teamMembers: 0,
      onlineMembers: 0,
      upcomingEvents: 0,
      eventsThisWeek: 0
    }
  }

  return {
    // State
    loading,
    artists,
    recentActivity,
    stats,

    // Computed
    recentArtists,
    hasArtists,

    // Actions
    loadDashboardData,
    loadArtists,
    createArtist,
    updateArtist,
    deleteArtist,
    getArtistBySlug,
    logActivity,
    refreshData,
    clearCache
  }
})
