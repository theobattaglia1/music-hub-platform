// stores/activity.js - Production Supabase integration
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useActivityStore = defineStore('activity', () => {
  // State
  const activities = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed getters
  const recentActivities = computed(() => {
    return activities.value
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20)
  })

  const activitiesByArtist = (artistId) => {
    return activities.value.filter(activity => activity.artist_id === artistId)
  }

  const activitiesByUser = (userId) => {
    return activities.value.filter(activity => activity.user_id === userId)
  }

  // Actions
  const loadActivities = async (artistId = null) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          profiles(full_name, avatar_url),
          artists(name, slug)
        `)
        .order('created_at', { ascending: false })

      // Filter by artist if specified
      if (artistId) {
        query = query.eq('artist_id', artistId)
      }

      const { data, error: queryError } = await query.limit(100)

      if (queryError) throw queryError

      // Transform data to include user and artist names
      activities.value = data.map(activity => ({
        ...activity,
        user_name: activity.profiles?.full_name || 'Unknown User',
        user_avatar: activity.profiles?.avatar_url,
        artist_name: activity.artists?.name || 'Unknown Artist',
        artist_slug: activity.artists?.slug
      }))

      return activities.value
    } catch (err) {
      console.error('Failed to load activities:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const logActivity = async (artistId, type, description, metadata = null) => {
    try {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        console.warn('Cannot log activity: user not authenticated')
        return
      }

      const { data, error: insertError } = await supabase
        .from('activities')
        .insert({
          artist_id: artistId,
          user_id: authStore.user.id,
          type,
          description,
          metadata
        })
        .select(`
          *,
          profiles(full_name, avatar_url),
          artists(name, slug)
        `)
        .single()

      if (insertError) throw insertError

      // Add to local state
      const newActivity = {
        ...data,
        user_name: data.profiles?.full_name || authStore.userName,
        user_avatar: data.profiles?.avatar_url || authStore.userAvatar,
        artist_name: data.artists?.name || 'Unknown Artist',
        artist_slug: data.artists?.slug
      }

      activities.value.unshift(newActivity)

      // Keep only recent activities in memory (limit to 100)
      if (activities.value.length > 100) {
        activities.value = activities.value.slice(0, 100)
      }

      return newActivity
    } catch (err) {
      console.error('Failed to log activity:', err)
      error.value = err.message
      // Don't throw error for activity logging as it's not critical
    }
  }

  const deleteActivity = async (activityId) => {
    try {
      loading.value = true

      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)

      if (deleteError) throw deleteError

      // Remove from local state
      const index = activities.value.findIndex(a => a.id === activityId)
      if (index !== -1) {
        activities.value.splice(index, 1)
      }

      return true
    } catch (err) {
      console.error('Failed to delete activity:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearActivities = () => {
    activities.value = []
    error.value = null
  }

  // Real-time subscription for activities
  const subscribeToActivities = (artistId = null) => {
    let channel = supabase.channel('activities')

    if (artistId) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `artist_id=eq.${artistId}`
        },
        handleActivityChange
      )
    } else {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities'
        },
        handleActivityChange
      )
    }

    channel.subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleActivityChange = async (payload) => {
    console.log('Activity change received:', payload)

    if (payload.eventType === 'INSERT') {
      // Fetch the complete activity data with joins
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          profiles(full_name, avatar_url),
          artists(name, slug)
        `)
        .eq('id', payload.new.id)
        .single()

      if (!error && data) {
        const newActivity = {
          ...data,
          user_name: data.profiles?.full_name || 'Unknown User',
          user_avatar: data.profiles?.avatar_url,
          artist_name: data.artists?.name || 'Unknown Artist',
          artist_slug: data.artists?.slug
        }

        // Add to beginning of activities array
        activities.value.unshift(newActivity)

        // Keep only recent activities in memory
        if (activities.value.length > 100) {
          activities.value = activities.value.slice(0, 100)
        }
      }
    } else if (payload.eventType === 'DELETE') {
      // Remove from local state
      const index = activities.value.findIndex(a => a.id === payload.old.id)
      if (index !== -1) {
        activities.value.splice(index, 1)
      }
    } else if (payload.eventType === 'UPDATE') {
      // Update in local state
      const index = activities.value.findIndex(a => a.id === payload.new.id)
      if (index !== -1) {
        activities.value[index] = { ...activities.value[index], ...payload.new }
      }
    }
  }

  return {
    // State
    activities,
    loading,
    error,

    // Computed
    recentActivities,

    // Actions
    loadActivities,
    logActivity,
    deleteActivity,
    clearActivities,
    subscribeToActivities,
    activitiesByArtist,
    activitiesByUser
  }
})