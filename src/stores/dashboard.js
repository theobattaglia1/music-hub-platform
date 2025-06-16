import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const loading = ref(false)
  const artists = ref([])
  const recentActivity = ref([])
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
    try {
      const authStore = useAuthStore()

      // Get artists where user is a team member or owner
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          artist_team_members!inner(
            role,
            user_id
          )
        `)
        .eq('artist_team_members.user_id', authStore.user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      artists.value = data || []
    } catch (error) {
      console.error('Failed to load artists:', error)
      throw error
    }
  }

  const loadRecentActivity = async () => {
    try {
      const authStore = useAuthStore()

      // Get recent activity from artists user has access to
      const { data, error } = await supabase
        .from('artist_activity')
        .select(`
          *,
          user_profiles(full_name, avatar_url),
          artists(name, slug)
        `)
        .in('artist_id', artists.value.map(a => a.id))
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      recentActivity.value = (data || []).map(activity => ({
        ...activity,
        user_name: activity.user_profiles?.full_name || 'Unknown User'
      }))
    } catch (error) {
      console.error('Failed to load recent activity:', error)
      // Don't throw error for activity - it's not critical
      recentActivity.value = []
    }
  }

  const loadStats = async () => {
    try {
      const authStore = useAuthStore()

      // Calculate stats from available data
      const totalArtists = artists.value.length

      // Get artists created this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const newArtistsThisMonth = artists.value.filter(
        artist => new Date(artist.created_at) >= thisMonth
      ).length

      // Get team members count
      const { data: teamData, error: teamError } = await supabase
        .from('artist_team_members')
        .select('user_id')
        .in('artist_id', artists.value.map(a => a.id))

      const uniqueTeamMembers = teamData
        ? new Set(teamData.map(member => member.user_id)).size
        : 0

      // Get upcoming events count
      const now = new Date()
      const { data: eventsData, error: eventsError } = await supabase
        .from('artist_events')
        .select('id, start_date')
        .in('artist_id', artists.value.map(a => a.id))
        .gte('start_date', now.toISOString())

      const upcomingEvents = eventsData?.length || 0

      // Events this week
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const eventsThisWeek = eventsData?.filter(
        event => new Date(event.start_date) <= weekFromNow
      ).length || 0

      stats.value = {
        totalArtists,
        newArtistsThisMonth,
        activeProjects: Math.floor(totalArtists * 0.7), // Mock calculation
        projectsThisWeek: Math.floor(eventsThisWeek * 1.2), // Mock calculation
        teamMembers: uniqueTeamMembers,
        onlineMembers: Math.floor(uniqueTeamMembers * 0.3), // Mock calculation
        upcomingEvents,
        eventsThisWeek
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      // Use default stats if calculation fails
    }
  }

  const createArtist = async (artistData, avatarFile = null) => {
    try {
      loading.value = true
      const authStore = useAuthStore()

      let avatarUrl = null

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('artist-avatars')
          .upload(fileName, avatarFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('artist-avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      // Create artist record
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: artistData.name,
          slug: artistData.slug,
          bio: artistData.bio,
          genre: artistData.genre,
          location: artistData.location,
          avatar_url: avatarUrl,
          is_public: artistData.is_public,
          allow_collaboration: artistData.allow_collaboration,
          created_by: authStore.user.id
        })
        .select()
        .single()

      if (artistError) throw artistError

      // Add creator as owner to team
      const { error: teamError } = await supabase
        .from('artist_team_members')
        .insert({
          artist_id: artist.id,
          user_id: authStore.user.id,
          role: 'owner',
          permissions: ['all']
        })

      if (teamError) throw teamError

      // Add to local state
      artists.value.unshift(artist)
      stats.value.totalArtists++

      // Log activity
      await logActivity(artist.id, 'artist_created', 'created the artist workspace')

      return artist
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

      let avatarUrl = updates.avatar_url

      // Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('artist-avatars')
          .upload(fileName, avatarFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('artist-avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl
      }

      const { data: artist, error } = await supabase
        .from('artists')
        .update({
          ...updates,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', artistId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      const index = artists.value.findIndex(a => a.id === artistId)
      if (index !== -1) {
        artists.value[index] = artist
      }

      return artist
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

      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId)

      if (error) throw error

      // Remove from local state
      artists.value = artists.value.filter(a => a.id !== artistId)
      stats.value.totalArtists--

      return true
    } catch (error) {
      console.error('Failed to delete artist:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logActivity = async (artistId, type, description, metadata = {}) => {
    try {
      const authStore = useAuthStore()

      const { error } = await supabase
        .from('artist_activity')
        .insert({
          artist_id: artistId,
          user_id: authStore.user.id,
          type,
          description,
          metadata
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to log activity:', error)
      // Don't throw error for activity logging
    }
  }

  const getArtistBySlug = async (slug) => {
    try {
      // Check local cache first
      const cached = artists.value.find(a => a.slug === slug)
      if (cached) return cached

      // Fetch from database
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          artist_team_members(
            role,
            permissions,
            user_profiles(full_name, avatar_url)
          )
        `)
        .eq('slug', slug)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Failed to get artist by slug:', error)
      throw error
    }
  }

  const refreshData = () => {
    return loadDashboardData()
  }

  const clearCache = () => {
    artists.value = []
    recentActivity.value = []
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
    createArtist,
    updateArtist,
    deleteArtist,
    getArtistBySlug,
    logActivity,
    refreshData,
    clearCache
  }
})