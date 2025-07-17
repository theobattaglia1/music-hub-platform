/**
 * Song-related Vue Query composables
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { songService } from '../services/songService'
import { queryKeys, invalidateQueries, optimisticUpdates } from '@/shared/services/queryClient'

// Get all songs with pagination and filtering
export function useSongs(options = {}) {
  return useQuery({
    queryKey: queryKeys.songs.list(options),
    queryFn: () => songService.getSongs(options),
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => ({
      ...data,
      songs: data.data || []
    })
  })
}

// Get single song by ID
export function useSong(songId) {
  return useQuery({
    queryKey: queryKeys.songs.detail(songId),
    queryFn: () => songService.getSong(songId),
    enabled: computed(() => !!songId),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Get recent songs
export function useRecentSongs(limit = 50) {
  return useQuery({
    queryKey: queryKeys.songs.recent(),
    queryFn: () => songService.getRecentSongs(limit),
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}

// Search songs
export function useSearchSongs(query, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.songs.lists(), 'search', query, options],
    queryFn: () => songService.searchSongs(query, options),
    enabled: computed(() => !!query && query.length >= 2),
    staleTime: 1 * 60 * 1000 // 1 minute
  })
}

// Get songs by genre
export function useSongsByGenre(genre, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.songs.lists(), 'genre', genre, options],
    queryFn: () => songService.getSongsByGenre(genre, options),
    enabled: computed(() => !!genre),
    staleTime: 5 * 60 * 1000
  })
}

// Get songs by artist
export function useSongsByArtist(artistId, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.songs.lists(), 'artist', artistId, options],
    queryFn: () => songService.getSongsByArtist(artistId, options),
    enabled: computed(() => !!artistId),
    staleTime: 5 * 60 * 1000
  })
}

// Create song mutation
export function useCreateSong() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ songData, coverFile, audioFile }) => 
      songService.createSong(songData, coverFile, audioFile),
    onSuccess: (newSong) => {
      // Invalidate and refetch songs list
      invalidateQueries.songs()
      
      // Add to cache
      queryClient.setQueryData(
        queryKeys.songs.detail(newSong.id),
        newSong
      )

      // Invalidate artist songs if applicable
      if (newSong.artist_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.artists.songs(newSong.artist_id)
        })
      }
    },
    onError: (error) => {
      console.error('Failed to create song:', error)
    }
  })
}

// Update song mutation
export function useUpdateSong() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, songData, coverFile, audioFile }) => 
      songService.updateSong(id, songData, coverFile, audioFile),
    onMutate: async ({ id, songData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.songs.detail(id) })

      // Snapshot previous value
      const previousSong = queryClient.getQueryData(queryKeys.songs.detail(id))

      // Optimistically update
      optimisticUpdates.updateSong(id, (old) => ({ ...old, ...songData }))

      return { previousSong, id }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSong) {
        queryClient.setQueryData(
          queryKeys.songs.detail(context.id),
          context.previousSong
        )
      }
    },
    onSuccess: (updatedSong, { id }) => {
      // Update cache with server response
      queryClient.setQueryData(
        queryKeys.songs.detail(id),
        updatedSong
      )
      invalidateQueries.songs()

      // Invalidate artist songs if applicable
      if (updatedSong.artist_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.artists.songs(updatedSong.artist_id)
        })
      }
    }
  })
}

// Delete song mutation
export function useDeleteSong() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (songId) => songService.deleteSong(songId),
    onMutate: async (songId) => {
      // Get song data before deletion to know which artist to invalidate
      const songData = queryClient.getQueryData(queryKeys.songs.detail(songId))
      return { songData }
    },
    onSuccess: (_, songId, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.songs.detail(songId) })
      
      // Invalidate lists
      invalidateQueries.songs()

      // Invalidate artist songs if applicable
      if (context?.songData?.artist_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.artists.songs(context.songData.artist_id)
        })
      }
    },
    onError: (error) => {
      console.error('Failed to delete song:', error)
    }
  })
}

// Bulk operations
export function useBulkSongOperations() {
  const queryClient = useQueryClient()

  const bulkDelete = useMutation({
    mutationFn: (songIds) => Promise.all(
      songIds.map(id => songService.deleteSong(id))
    ),
    onSuccess: (_, songIds) => {
      // Remove from cache
      songIds.forEach(id => {
        queryClient.removeQueries({ queryKey: queryKeys.songs.detail(id) })
      })
      
      // Invalidate lists
      invalidateQueries.songs()
      invalidateQueries.artists()
    }
  })

  const bulkUpdateGenre = useMutation({
    mutationFn: ({ songIds, genre }) => Promise.all(
      songIds.map(id => songService.updateSong(id, { genre }))
    ),
    onSuccess: () => {
      invalidateQueries.songs()
    }
  })

  return {
    bulkDelete,
    bulkUpdateGenre
  }
}

// Prefetch songs
export function usePrefetchSong() {
  const queryClient = useQueryClient()

  return {
    prefetchSong: (songId) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.songs.detail(songId),
        queryFn: () => songService.getSong(songId),
        staleTime: 10 * 60 * 1000
      })
    }
  }
}