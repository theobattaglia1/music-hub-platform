import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, uploadFile } from '@/lib/supabase'
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
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          artist_team_members!inner(
            user_id,
            role,
            profiles(full_name, avatar_url)
          )
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Transform the data to include team members
      artists.value = data.map(artist => ({
        ...artist,
        team_members: artist.artist_team_members?.map(member => ({
          id: member.user_id,
          name: member.profiles?.full_name || 'Unknown',
          role: member.role,
          avatar_url: member.profiles?.avatar_url
        })) || []
      }))
    } catch (error) {
      console.error('Failed to load artists:', error)
      // Set empty array on error so UI can still render
      artists.value = []
    }
  }

  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles(full_name),
          artists(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      recentActivity.value = data.map(activity => ({
        ...activity,
        user_name: activity.profiles?.full_name || 'Unknown User',
        artist_name: activity.artists?.name || 'Unknown Artist'
      }))
    } catch (error) {
      console.error('Failed to load recent activity:', error)
      recentActivity.value = []
    }
  }

  const loadStats = async () => {
    try {
      // Get total artists count
      const { count: totalArtists, error: artistsError } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })

      if (artistsError) throw artistsError

      // Get artists created this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const { count: newArtistsThisMonth, error: newArtistsError } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString())

      if (newArtistsError) throw newArtistsError

      // Get active projects (artists with recent activity)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const { count: activeProjects, error: activeProjectsError } = await supabase
        .from('activities')
        .select('artist_id', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString())

      if (activeProjectsError) throw activeProjectsError

      // Get team members count
      const { count: teamMembers, error: teamError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      if (teamError) throw teamError

      // Get upcoming events count  
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: upcomingEvents, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', today.toISOString())

      if (eventsError && eventsError.code !== 'PGRST116') {
        console.warn('Calendar events table might not exist yet:', eventsError)
      }

      stats.value = {
        totalArtists: totalArtists || 0,
        newArtistsThisMonth: newArtistsThisMonth || 0,
        activeProjects: activeProjects || 0,
        projectsThisWeek: activeProjects || 0, // Same as active projects for now
        teamMembers: teamMembers || 0,
        onlineMembers: Math.floor((teamMembers || 0) * 0.3), // Mock calculation
        upcomingEvents: upcomingEvents || 0,
        eventsThisWeek: upcomingEvents || 0 // Simplified for now
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      // Keep existing stats on error
    }
  }

  const createArtist = async (artistData, avatarFile = null) => {
    try {
      loading.value = true
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        throw new Error('Must be authenticated to create artist')
      }

      let avatarUrl = null

      // Upload avatar if provided
      if (avatarFile) {
        const { publicUrl } = await uploadFile('covers', avatarFile)
        avatarUrl = publicUrl
      }

      // Create artist in database
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: artistData.name,
          slug: artistData.slug || artistData.name.toLowerCase().replace(/\s+/g, '-'),
          bio: artistData.bio || '',
          genre: artistData.genre || 'Unspecified',
          location: artistData.location || '',
          avatar_url: avatarUrl,
          is_public: artistData.is_public ?? true,
          allow_collaboration: artistData.allow_collaboration ?? true,
          created_by: authStore.user.id
        })
        .select()
        .single()

      if (artistError) throw artistError

      // Add creator as team member with owner role
      const { error: teamError } = await supabase
        .from('artist_team_members')
        .insert({
          artist_id: artist.id,
          user_id: authStore.user.id,
          role: 'owner',
          permissions: ['read', 'write', 'delete', 'manage_team']
        })

      if (teamError) throw teamError

      // Log activity
      await logActivity(artist.id, 'artist_created', 'created the artist workspace')

      // Add to local state
      const newArtist = {
        ...artist,
        team_members: [{
          id: authStore.user.id,
          name: authStore.userName,
          role: 'owner',
          avatar_url: authStore.userAvatar
        }]
      }
      artists.value.unshift(newArtist)
      stats.value.totalArtists++

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

      let avatarUrl = updates.avatar_url

      // Upload new avatar if provided
      if (avatarFile) {
        const { publicUrl } = await uploadFile('covers', avatarFile)
        avatarUrl = publicUrl
      }

      // Update artist in database
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
        artists.value[index] = { ...artists.value[index], ...artist }
      }

      // Log activity
      await logActivity(artistId, 'artist_updated', 'updated artist information')

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

      // Delete artist (cascade will handle related records)
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId)

      if (error) throw error

      // Remove from local state
      const index = artists.value.findIndex(a => a.id === artistId)
      if (index !== -1) {
        artists.value.splice(index, 1)
        stats.value.totalArtists--
      }

      return true
    } catch (error) {
      console.error('Failed to delete artist:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logActivity = async (artistId, type, description, metadata = null) => {
    try {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) return

      const { error } = await supabase
        .from('activities')
        .insert({
          artist_id: artistId,
          user_id: authStore.user.id,
          type,
          description,
          metadata
        })

      if (error) throw error

      // Reload recent activity to include the new entry
      await loadRecentActivity()
    } catch (error) {
      console.error('Failed to log activity:', error)
      // Don't throw error here as activity logging is not critical
    }
  }

  const refreshData = async () => {
    await loadDashboardData()
  }

  const getArtistBySlug = async (slug) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          artist_team_members(
            user_id,
            role,
            profiles(full_name, avatar_url)
          )
        `)
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`Artist with slug '${slug}' not found`)
        }
        throw error
      }

      // Transform the data to include team members
      return {
        ...data,
        team_members: data.artist_team_members?.map(member => ({
          id: member.user_id,
          name: member.profiles?.full_name || 'Unknown',
          role: member.role,
          avatar_url: member.profiles?.avatar_url
        })) || []
      }
    } catch (error) {
      console.error('Failed to get artist by slug:', error)
      throw error
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
    loadRecentActivity,
    loadStats,
    createArtist,
    updateArtist,
    deleteArtist,
    logActivity,
    refreshData,
    getArtistBySlug
  }
})
