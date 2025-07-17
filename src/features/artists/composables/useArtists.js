/**
 * Artist-related Vue Query composables
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { artistService } from '../services/artistService'
import { queryKeys, invalidateQueries, optimisticUpdates } from '@/shared/services/queryClient'

// Get all artists with pagination and filtering
export function useArtists(options = {}) {
  return useQuery({
    queryKey: queryKeys.artists.list(options),
    queryFn: () => artistService.getArtists(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => ({
      ...data,
      artists: data.data || []
    })
  })
}

// Get single artist by ID
export function useArtist(artistId) {
  return useQuery({
    queryKey: queryKeys.artists.detail(artistId),
    queryFn: () => artistService.getArtist(artistId),
    enabled: computed(() => !!artistId),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}

// Get artist by slug
export function useArtistBySlug(slug) {
  return useQuery({
    queryKey: [...queryKeys.artists.details(), 'slug', slug],
    queryFn: () => artistService.getArtistBySlug(slug),
    enabled: computed(() => !!slug),
    staleTime: 10 * 60 * 1000
  })
}

// Get artist's songs
export function useArtistSongs(artistId, options = {}) {
  return useQuery({
    queryKey: queryKeys.artists.songs(artistId),
    queryFn: () => artistService.getArtistSongs(artistId, options),
    enabled: computed(() => !!artistId),
    staleTime: 3 * 60 * 1000 // 3 minutes
  })
}

// Get artist's events
export function useArtistEvents(artistId, options = {}) {
  return useQuery({
    queryKey: queryKeys.artists.events(artistId),
    queryFn: () => artistService.getArtistEvents(artistId, options),
    enabled: computed(() => !!artistId),
    staleTime: 5 * 60 * 1000
  })
}

// Get recent artists for sidebar
export function useRecentArtists(limit = 10) {
  return useQuery({
    queryKey: [...queryKeys.artists.all, 'recent', limit],
    queryFn: () => artistService.getRecentArtists(limit),
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}

// Search artists
export function useSearchArtists(query, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.artists.lists(), 'search', query, options],
    queryFn: () => artistService.searchArtists(query, options),
    enabled: computed(() => !!query && query.length >= 2),
    staleTime: 1 * 60 * 1000 // 1 minute
  })
}

// Create artist mutation
export function useCreateArtist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ artistData, avatarFile }) => 
      artistService.createArtist(artistData, avatarFile),
    onSuccess: (newArtist) => {
      // Invalidate and refetch artists list
      invalidateQueries.artists()
      
      // Add to cache
      queryClient.setQueryData(
        queryKeys.artists.detail(newArtist.id),
        newArtist
      )
    },
    onError: (error) => {
      console.error('Failed to create artist:', error)
    }
  })
}

// Update artist mutation
export function useUpdateArtist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, artistData, avatarFile }) => 
      artistService.updateArtist(id, artistData, avatarFile),
    onMutate: async ({ id, artistData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.artists.detail(id) })

      // Snapshot previous value
      const previousArtist = queryClient.getQueryData(queryKeys.artists.detail(id))

      // Optimistically update
      optimisticUpdates.updateArtist(id, (old) => ({ ...old, ...artistData }))

      return { previousArtist, id }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousArtist) {
        queryClient.setQueryData(
          queryKeys.artists.detail(context.id),
          context.previousArtist
        )
      }
    },
    onSuccess: (updatedArtist, { id }) => {
      // Update cache with server response
      queryClient.setQueryData(
        queryKeys.artists.detail(id),
        updatedArtist
      )
      invalidateQueries.artists()
    }
  })
}

// Delete artist mutation
export function useDeleteArtist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (artistId) => artistService.deleteArtist(artistId),
    onSuccess: (_, artistId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.artists.detail(artistId) })
      
      // Invalidate lists
      invalidateQueries.artists()
    },
    onError: (error) => {
      console.error('Failed to delete artist:', error)
    }
  })
}

// Prefetch artist details
export function usePrefetchArtist() {
  const queryClient = useQueryClient()

  return {
    prefetchArtist: (artistId) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.artists.detail(artistId),
        queryFn: () => artistService.getArtist(artistId),
        staleTime: 10 * 60 * 1000
      })
    },
    prefetchArtistSongs: (artistId) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.artists.songs(artistId),
        queryFn: () => artistService.getArtistSongs(artistId),
        staleTime: 5 * 60 * 1000
      })
    }
  }
}