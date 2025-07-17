/**
 * Vue Query (TanStack Query) configuration and setup
 */

import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { API_CONFIG } from '@/core/constants'

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: API_CONFIG.RETRY_ATTEMPTS,
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch interval (10 minutes)
      refetchInterval: 10 * 60 * 1000,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Mutation retry delay
      retryDelay: 1000,
    },
  },
})

// Plugin configuration
export const vueQueryPluginOptions = {
  queryClient,
  enableDevtoolsV6Plugin: process.env.NODE_ENV === 'development',
}

// Vue Query plugin
export { VueQueryPlugin }

// Query key factory for consistent key generation
export const queryKeys = {
  // User queries
  user: {
    all: ['user'],
    profile: (userId) => [...queryKeys.user.all, 'profile', userId],
    preferences: (userId) => [...queryKeys.user.all, 'preferences', userId],
  },

  // Artist queries
  artists: {
    all: ['artists'],
    lists: () => [...queryKeys.artists.all, 'list'],
    list: (filters) => [...queryKeys.artists.lists(), filters],
    details: () => [...queryKeys.artists.all, 'detail'],
    detail: (id) => [...queryKeys.artists.details(), id],
    songs: (id) => [...queryKeys.artists.detail(id), 'songs'],
    events: (id) => [...queryKeys.artists.detail(id), 'events'],
  },

  // Song queries
  songs: {
    all: ['songs'],
    lists: () => [...queryKeys.songs.all, 'list'],
    list: (filters) => [...queryKeys.songs.lists(), filters],
    details: () => [...queryKeys.songs.all, 'detail'],
    detail: (id) => [...queryKeys.songs.details(), id],
    recent: () => [...queryKeys.songs.all, 'recent'],
  },

  // Playlist queries
  playlists: {
    all: ['playlists'],
    lists: () => [...queryKeys.playlists.all, 'list'],
    list: (filters) => [...queryKeys.playlists.lists(), filters],
    details: () => [...queryKeys.playlists.all, 'detail'],
    detail: (id) => [...queryKeys.playlists.details(), id],
    songs: (id) => [...queryKeys.playlists.detail(id), 'songs'],
  },

  // Dashboard queries
  dashboard: {
    all: ['dashboard'],
    data: () => [...queryKeys.dashboard.all, 'data'],
    activity: () => [...queryKeys.dashboard.all, 'activity'],
    stats: () => [...queryKeys.dashboard.all, 'stats'],
  },

  // Calendar queries
  calendar: {
    all: ['calendar'],
    events: (filters) => [...queryKeys.calendar.all, 'events', filters],
    event: (id) => [...queryKeys.calendar.all, 'event', id],
  },
}

// Cache invalidation helpers
export const invalidateQueries = {
  // Invalidate all user-related queries
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.all }),
  
  // Invalidate specific user profile
  userProfile: (userId) => queryClient.invalidateQueries({ 
    queryKey: queryKeys.user.profile(userId) 
  }),

  // Invalidate all artist queries
  artists: () => queryClient.invalidateQueries({ queryKey: queryKeys.artists.all }),
  
  // Invalidate specific artist
  artist: (id) => queryClient.invalidateQueries({ 
    queryKey: queryKeys.artists.detail(id) 
  }),

  // Invalidate all song queries
  songs: () => queryClient.invalidateQueries({ queryKey: queryKeys.songs.all }),
  
  // Invalidate specific song
  song: (id) => queryClient.invalidateQueries({ 
    queryKey: queryKeys.songs.detail(id) 
  }),

  // Invalidate all playlist queries
  playlists: () => queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all }),
  
  // Invalidate specific playlist
  playlist: (id) => queryClient.invalidateQueries({ 
    queryKey: queryKeys.playlists.detail(id) 
  }),

  // Invalidate dashboard
  dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),

  // Invalidate calendar
  calendar: () => queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all }),
}

// Prefetch helpers
export const prefetchQueries = {
  // Prefetch artist details
  artistDetail: (id) => 
    queryClient.prefetchQuery({
      queryKey: queryKeys.artists.detail(id),
      queryFn: () => import('@/features/artists/services/artistService').then(
        module => module.artistService.getArtist(id)
      ),
    }),

  // Prefetch song details
  songDetail: (id) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.songs.detail(id),
      queryFn: () => import('@/features/music/services/songService').then(
        module => module.songService.getSong(id)
      ),
    }),

  // Prefetch playlist details
  playlistDetail: (id) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.playlists.detail(id),
      queryFn: () => import('@/features/playlists/services/playlistService').then(
        module => module.playlistService.getPlaylist(id)
      ),
    }),
}

// Optimistic update helpers
export const optimisticUpdates = {
  // Update artist in cache
  updateArtist: (id, updater) => {
    queryClient.setQueryData(queryKeys.artists.detail(id), updater)
    // Also update in lists
    queryClient.setQueriesData(
      { queryKey: queryKeys.artists.lists() },
      (oldData) => {
        if (!oldData?.data) return oldData
        return {
          ...oldData,
          data: oldData.data.map(artist => 
            artist.id === id ? { ...artist, ...updater(artist) } : artist
          )
        }
      }
    )
  },

  // Update song in cache
  updateSong: (id, updater) => {
    queryClient.setQueryData(queryKeys.songs.detail(id), updater)
    // Also update in lists
    queryClient.setQueriesData(
      { queryKey: queryKeys.songs.lists() },
      (oldData) => {
        if (!oldData?.data) return oldData
        return {
          ...oldData,
          data: oldData.data.map(song => 
            song.id === id ? { ...song, ...updater(song) } : song
          )
        }
      }
    )
  },

  // Update playlist in cache
  updatePlaylist: (id, updater) => {
    queryClient.setQueryData(queryKeys.playlists.detail(id), updater)
    queryClient.setQueriesData(
      { queryKey: queryKeys.playlists.lists() },
      (oldData) => {
        if (!oldData?.data) return oldData
        return {
          ...oldData,
          data: oldData.data.map(playlist => 
            playlist.id === id ? { ...playlist, ...updater(playlist) } : playlist
          )
        }
      }
    )
  },
}

// Error handling
export const queryErrorHandler = (error) => {
  console.error('Query Error:', error)
  
  // Handle specific error types
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login or refresh token
    queryClient.clear()
  }
  
  // You can add toast notifications here
  // or any other global error handling
}

// Set default error handler
queryClient.setMutationDefaults(['default'], {
  onError: queryErrorHandler,
})

export default queryClient