import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const useLibraryStore = defineStore('library', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([])
  const searchQuery = ref('')
  const mediaType = ref('all') // 'all', 'audio', 'video', 'image', 'document'
  const sortBy = ref('created_at')
  const sortOrder = ref('desc')

  // Query keys
  const queryKeys = {
    media: (artistIds = [], type = 'all', search = '', sort = 'created_at', order = 'desc') => [
      'media', 
      'library', 
      { artistIds: artistIds.sort(), type, search, sort, order }
    ]
  }

  // Load media for selected artists
  const {
    data: media,
    isLoading: loading,
    error: mediaError,
    refetch: refetchMedia
  } = useQuery({
    queryKey: computed(() => queryKeys.media(
      selectedArtistIds.value,
      mediaType.value,
      searchQuery.value,
      sortBy.value,
      sortOrder.value
    )),
    queryFn: async () => {
      const allMedia = []
      
      if (selectedArtistIds.value.length === 0) {
        // Load media for all artists user has access to
        const { data: userArtists } = await apiService.getArtistsByUser()
        if (userArtists?.length) {
          for (const artist of userArtists) {
            const { data: artistMedia } = await apiService.getArtistMedia(artist.id, {
              filters: mediaType.value !== 'all' ? { media_type: mediaType.value } : {},
              search: searchQuery.value,
              searchFields: ['title', 'description'],
              sortBy: sortBy.value,
              sortOrder: sortOrder.value
            })
            if (artistMedia) allMedia.push(...artistMedia)
          }
        }
      } else {
        // Load media for selected artists
        for (const artistId of selectedArtistIds.value) {
          const { data: artistMedia } = await apiService.getArtistMedia(artistId, {
            filters: mediaType.value !== 'all' ? { media_type: mediaType.value } : {},
            search: searchQuery.value,
            searchFields: ['title', 'description'],
            sortBy: sortBy.value,
            sortOrder: sortOrder.value
          })
          if (artistMedia) allMedia.push(...artistMedia)
        }
      }
      
      return allMedia
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // Computed properties for backward compatibility
  const songs = computed(() => {
    return (media.value || [])
      .filter(item => item.media_type === 'audio')
      .map(item => ({
        id: item.id,
        name: item.title,
        artist: item.artist?.name || 'Unknown Artist',
        artist_id: item.artist_id,
        album: item.metadata?.album || 'Unknown Album',
        duration: item.duration || 0,
        artwork_path: item.thumbnail_path,
        date_added: new Date(item.created_at).getTime(),
        file_path: item.file_path,
        file_name: item.file_name,
        mime_type: item.mime_type,
        metadata: item.metadata
      }))
  })

  const audioFiles = computed(() => (media.value || []).filter(item => item.media_type === 'audio'))
  const videoFiles = computed(() => (media.value || []).filter(item => item.media_type === 'video'))
  const imageFiles = computed(() => (media.value || []).filter(item => item.media_type === 'image'))
  const documentFiles = computed(() => (media.value || []).filter(item => item.media_type === 'document'))

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async ({ artistId, file, metadata = {} }) => {
      const { data, error } = await apiService.uploadArtistMedia(artistId, file, metadata)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    }
  })

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (mediaId) => {
      const { error } = await apiService.delete('media', mediaId)
      if (error) throw error
      return mediaId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    }
  })

  // Update media mutation
  const updateMediaMutation = useMutation({
    mutationFn: async ({ id, ...mediaData }) => {
      const { data, error } = await apiService.update('media', id, mediaData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
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

  const setMediaType = (type) => {
    mediaType.value = type
  }

  const setSorting = (field, order = 'desc') => {
    sortBy.value = field
    sortOrder.value = order
  }

  return {
    // State
    media: computed(() => media.value || []),
    loading,
    mediaError,
    selectedArtistIds,
    searchQuery,
    mediaType,
    sortBy,
    sortOrder,
    
    // Computed
    songs, // For backward compatibility
    audioFiles,
    videoFiles,
    imageFiles,
    documentFiles,
    
    // Methods
    refetchMedia,
    setArtistFilter,
    clearArtistFilter,
    setSearch,
    setMediaType,
    setSorting,
    
    // Mutations
    uploadMedia: uploadMediaMutation.mutateAsync,
    deleteMedia: deleteMediaMutation.mutateAsync,
    updateMedia: updateMediaMutation.mutateAsync,
    isUploadingMedia: uploadMediaMutation.isPending,
    isDeletingMedia: deleteMediaMutation.isPending,
    isUpdatingMedia: updateMediaMutation.isPending,
    
    // Legacy compatibility
    loadSongs: refetchMedia
  }
})
