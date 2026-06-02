import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const usePlaylistsStore = defineStore('playlists', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([])
  const searchQuery = ref('')
  const includePublic = ref(true)

  // Query keys
  const queryKeys = {
    playlists: (artistIds = [], search = '', includePublic = true) => [
      'playlists', 
      { artistIds: artistIds.sort(), search, includePublic }
    ]
  }

  // Load playlists for selected artists
  const {
    data: playlists,
    isLoading: loading,
    error: playlistsError,
    refetch: refetchPlaylists
  } = useQuery({
    queryKey: computed(() => queryKeys.playlists(
      selectedArtistIds.value,
      searchQuery.value,
      includePublic.value
    )),
    queryFn: async () => {
      const allPlaylists = []
      
      if (selectedArtistIds.value.length === 0) {
        // Load playlists for all artists user has access to
        const { data: userArtists } = await apiService.getArtistsByUser()
        if (userArtists?.length) {
          for (const artist of userArtists) {
            const { data: artistPlaylists } = await apiService.getArtistPlaylists(artist.id, {
              search: searchQuery.value,
              searchFields: ['title', 'description']
            })
            if (artistPlaylists) allPlaylists.push(...artistPlaylists)
          }
        }
        
        // Include public playlists if requested
        if (includePublic.value) {
          const { data: publicPlaylists } = await apiService.getAll('playlists', {
            filters: { is_public: true },
            search: searchQuery.value,
            searchFields: ['title', 'description']
          })
          if (publicPlaylists) allPlaylists.push(...publicPlaylists)
        }
      } else {
        // Load playlists for selected artists
        for (const artistId of selectedArtistIds.value) {
          const { data: artistPlaylists } = await apiService.getArtistPlaylists(artistId, {
            search: searchQuery.value,
            searchFields: ['title', 'description']
          })
          if (artistPlaylists) allPlaylists.push(...artistPlaylists)
        }
      }
      
      // Remove duplicates based on ID
      const uniquePlaylists = allPlaylists.filter((playlist, index, self) => 
        index === self.findIndex(p => p.id === playlist.id)
      )
      
      return uniquePlaylists
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlistData) => {
      const { data, error } = await apiService.create('playlists', {
        ...playlistData,
        track_ids: playlistData.track_ids || playlistData.song_ids || []
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
    }
  })

  // Update playlist mutation
  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ id, ...playlistData }) => {
      const { data, error } = await apiService.update('playlists', id, {
        ...playlistData,
        track_ids: playlistData.track_ids || playlistData.song_ids || []
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
    }
  })

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId) => {
      const { error } = await apiService.delete('playlists', playlistId)
      if (error) throw error
      return playlistId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
    }
  })

  // Add track to playlist mutation
  const addTrackToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }) => {
      // Get current playlist
      const { data: playlist, error: fetchError } = await apiService.getById('playlists', playlistId)
      if (fetchError) throw fetchError
      
      const currentTrackIds = playlist.track_ids || []
      if (!currentTrackIds.includes(trackId)) {
        const updatedTrackIds = [...currentTrackIds, trackId]
        const { data, error } = await apiService.update('playlists', playlistId, {
          track_ids: updatedTrackIds
        })
        if (error) throw error
        return data
      }
      return playlist
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
    }
  })

  // Remove track from playlist mutation
  const removeTrackFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId }) => {
      // Get current playlist
      const { data: playlist, error: fetchError } = await apiService.getById('playlists', playlistId)
      if (fetchError) throw fetchError
      
      const currentTrackIds = playlist.track_ids || []
      const updatedTrackIds = currentTrackIds.filter(id => id !== trackId)
      
      const { data, error } = await apiService.update('playlists', playlistId, {
        track_ids: updatedTrackIds
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
    }
  })

  // Helper methods
  const setArtistFilter = (artistIds) => {
    selectedArtistIds.value = Array.isArray(artistIds) ? artistIds : [artistIds]
  }

  const clearArtistFilter = () => {
    selectedArtistIds.value = []
  }

  const setSearch = (query) => {
    searchQuery.value = query
  }

  const setIncludePublic = (include) => {
    includePublic.value = include
  }

  // Get playlist by ID
  const getPlaylistById = async (id) => {
    // First check cache
    const cachedPlaylist = playlists.value?.find(p => p.id === id)
    if (cachedPlaylist) return cachedPlaylist
    
    // Otherwise fetch from API
    const { data, error } = await apiService.getById('playlists', id)
    if (error) throw error
    return data
  }

  // Computed helpers for backward compatibility
  const playlistsForArtist = computed(() => {
    return (artistId) => (playlists.value || []).filter(p => p.artist_id === artistId)
  })

  const globalPlaylists = computed(() => {
    return (playlists.value || []).filter(p => !p.artist_id || p.is_public)
  })

  return {
    // State
    playlists: computed(() => playlists.value || []),
    loading,
    playlistsError,
    selectedArtistIds,
    searchQuery,
    includePublic,
    
    // Computed
    playlistsForArtist,
    globalPlaylists,
    
    // Methods
    refetchPlaylists,
    setArtistFilter,
    clearArtistFilter,
    setSearch,
    setIncludePublic,
    getPlaylistById,
    
    // Mutations
    createPlaylist: createPlaylistMutation.mutateAsync,
    updatePlaylist: updatePlaylistMutation.mutateAsync,
    deletePlaylist: deletePlaylistMutation.mutateAsync,
    addTrackToPlaylist: addTrackToPlaylistMutation.mutateAsync,
    removeTrackFromPlaylist: removeTrackFromPlaylistMutation.mutateAsync,
    isCreatingPlaylist: createPlaylistMutation.isPending,
    isUpdatingPlaylist: updatePlaylistMutation.isPending,
    isDeletingPlaylist: deletePlaylistMutation.isPending,
    isModifyingTracks: computed(() => 
      addTrackToPlaylistMutation.isPending.value || 
      removeTrackFromPlaylistMutation.isPending.value
    ),
    
    // Legacy compatibility
    loadPlaylists: refetchPlaylists
  }
})
