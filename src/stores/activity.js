import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const useActivityStore = defineStore('activity', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([])
  const activityTypes = ref([]) // Filter by activity types
  const limit = ref(50)

  // Query keys
  const queryKeys = {
    activities: (artistIds = [], types = [], limit = 50) => [
      'activities', 
      { artistIds: artistIds.sort(), types: types.sort(), limit }
    ]
  }

  // Since we don't have a dedicated activity table yet, we'll use file_access_logs
  // and other sources to create activity feed
  const {
    data: activities,
    isLoading: loading,
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery({
    queryKey: computed(() => queryKeys.activities(
      selectedArtistIds.value,
      activityTypes.value,
      limit.value
    )),
    queryFn: async () => {
      const allActivities = []
      
      try {
        // Get file access logs as activities
        if (selectedArtistIds.value.length === 0) {
          // Get activities for all artists user has access to
          const { data: userArtists } = await apiService.getArtistsByUser()
          if (userArtists?.length) {
            for (const artist of userArtists) {
              await loadArtistActivities(artist.id, allActivities)
            }
          }
        } else {
          // Get activities for selected artists
          for (const artistId of selectedArtistIds.value) {
            await loadArtistActivities(artistId, allActivities)
          }
        }
        
        // Sort by timestamp descending
        allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        
        // Apply limit
        return allActivities.slice(0, limit.value)
      } catch (error) {
        console.error('Failed to load activities:', error)
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  // Helper function to load activities for a specific artist
  const loadArtistActivities = async (artistId, activitiesArray) => {
    try {
      // Get recent media uploads
      const { data: recentMedia } = await apiService.getArtistMedia(artistId, {
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 10
      })
      
      if (recentMedia) {
        recentMedia.forEach(media => {
          activitiesArray.push({
            id: `media-${media.id}`,
            type: 'media_upload',
            action: 'uploaded',
            target_type: 'media',
            target_id: media.id,
            description: `Uploaded ${media.title}`,
            artist_id: artistId,
            user_id: media.uploaded_by,
            metadata: {
              media_type: media.media_type,
              file_name: media.file_name,
              file_size: media.file_size
            },
            created_at: media.created_at,
            user: null, // Will be populated by UI if needed
            artist: null // Will be populated by UI if needed
          })
        })
      }

      // Get recent events
      const { data: recentEvents } = await apiService.getArtistEvents(artistId, {
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 10
      })
      
      if (recentEvents) {
        recentEvents.forEach(event => {
          activitiesArray.push({
            id: `event-${event.id}`,
            type: 'event_created',
            action: 'created',
            target_type: 'event',
            target_id: event.id,
            description: `Created event "${event.title}"`,
            artist_id: artistId,
            user_id: event.created_by,
            metadata: {
              event_type: event.event_type,
              start_time: event.start_time,
              location: event.location
            },
            created_at: event.created_at,
            user: null,
            artist: null
          })
        })
      }

      // Get recent notes
      const { data: recentNotes } = await apiService.getArtistNotes(artistId, {
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 10
      })
      
      if (recentNotes) {
        recentNotes.forEach(note => {
          activitiesArray.push({
            id: `note-${note.id}`,
            type: 'note_added',
            action: 'created',
            target_type: 'note',
            target_id: note.id,
            description: `Added note "${note.title}"`,
            artist_id: artistId,
            user_id: note.created_by,
            metadata: {
              status: note.status,
              priority: note.priority
            },
            created_at: note.created_at,
            user: null,
            artist: null
          })
        })
      }

      // Get recent playlists
      const { data: recentPlaylists } = await apiService.getArtistPlaylists(artistId, {
        sortBy: 'created_at',
        sortOrder: 'desc',
        limit: 5
      })
      
      if (recentPlaylists) {
        recentPlaylists.forEach(playlist => {
          activitiesArray.push({
            id: `playlist-${playlist.id}`,
            type: 'playlist_created',
            action: 'created',
            target_type: 'playlist',
            target_id: playlist.id,
            description: `Created playlist "${playlist.title}"`,
            artist_id: artistId,
            user_id: playlist.created_by,
            metadata: {
              track_count: playlist.track_ids?.length || 0,
              is_public: playlist.is_public
            },
            created_at: playlist.created_at,
            user: null,
            artist: null
          })
        })
      }

    } catch (error) {
      console.error(`Failed to load activities for artist ${artistId}:`, error)
    }
  }

  // Log activity mutation (stores in file_access_logs for now)
  const logActivityMutation = useMutation({
    mutationFn: async (activityData) => {
      // For now, just log to console and API service
      await apiService.logActivity(
        activityData.artist_id,
        activityData.type,
        activityData.metadata
      )
      return activityData
    },
    onSuccess: () => {
      // Refresh activities
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })

  // Computed getters
  const recentActivities = computed(() => {
    return activities.value?.slice(0, 20) || []
  })

  const activitiesByArtist = computed(() => {
    return (artistId) => (activities.value || []).filter(activity => activity.artist_id === artistId)
  })

  const activitiesByUser = computed(() => {
    return (userId) => (activities.value || []).filter(activity => activity.user_id === userId)
  })

  const activitiesByType = computed(() => {
    return (type) => (activities.value || []).filter(activity => activity.type === type)
  })

  // Helper methods
  const setArtistFilter = (artistIds) => {
    selectedArtistIds.value = Array.isArray(artistIds) ? artistIds : [artistIds]
  }

  const clearArtistFilter = () => {
    selectedArtistIds.value = []
  }

  const setActivityTypeFilter = (types) => {
    activityTypes.value = Array.isArray(types) ? types : [types]
  }

  const clearActivityTypeFilter = () => {
    activityTypes.value = []
  }

  const setLimit = (newLimit) => {
    limit.value = newLimit
  }

  // Convenience methods for logging specific activities
  const logMediaUpload = async (artistId, fileName, fileType, metadata = {}) => {
    return logActivityMutation.mutateAsync({
      artist_id: artistId,
      type: 'media_upload',
      action: 'uploaded',
      target_type: 'media',
      description: `Uploaded ${fileName}`,
      metadata: {
        file_name: fileName,
        file_type: fileType,
        upload_time: new Date().toISOString(),
        ...metadata
      }
    })
  }

  const logEventCreated = async (artistId, eventId, eventName, metadata = {}) => {
    return logActivityMutation.mutateAsync({
      artist_id: artistId,
      type: 'event_created',
      action: 'created',
      target_type: 'event',
      target_id: eventId,
      description: `Created event "${eventName}"`,
      metadata: {
        event_name: eventName,
        event_id: eventId,
        ...metadata
      }
    })
  }

  const logTeamJoined = async (artistId, userId, userName, role, metadata = {}) => {
    return logActivityMutation.mutateAsync({
      artist_id: artistId,
      type: 'team_joined',
      action: 'joined',
      target_type: 'user',
      target_id: userId,
      description: `${userName} joined as ${role}`,
      metadata: {
        user_name: userName,
        role: role,
        joined_at: new Date().toISOString(),
        ...metadata
      }
    })
  }

  const logNoteAdded = async (artistId, noteId, noteTitle, metadata = {}) => {
    return logActivityMutation.mutateAsync({
      artist_id: artistId,
      type: 'note_added',
      action: 'created',
      target_type: 'note',
      target_id: noteId,
      description: `Added note "${noteTitle}"`,
      metadata: {
        note_title: noteTitle,
        note_id: noteId,
        ...metadata
      }
    })
  }

  const logPlaylistCreated = async (artistId, playlistId, playlistName, metadata = {}) => {
    return logActivityMutation.mutateAsync({
      artist_id: artistId,
      type: 'playlist_created',
      action: 'created',
      target_type: 'playlist',
      target_id: playlistId,
      description: `Created playlist "${playlistName}"`,
      metadata: {
        playlist_name: playlistName,
        playlist_id: playlistId,
        ...metadata
      }
    })
  }

  return {
    // State
    activities: computed(() => activities.value || []),
    loading,
    activitiesError,
    selectedArtistIds,
    activityTypes,
    limit,
    
    // Computed
    recentActivities,
    activitiesByArtist,
    activitiesByUser,
    activitiesByType,
    
    // Methods
    refetchActivities,
    setArtistFilter,
    clearArtistFilter,
    setActivityTypeFilter,
    clearActivityTypeFilter,
    setLimit,
    
    // Activity logging
    logActivity: logActivityMutation.mutateAsync,
    logMediaUpload,
    logEventCreated,
    logTeamJoined,
    logNoteAdded,
    logPlaylistCreated,
    isLoggingActivity: logActivityMutation.isPending,
    
    // Legacy compatibility
    loadActivities: refetchActivities,
    clearActivities: () => queryClient.removeQueries({ queryKey: ['activities'] })
  }
})