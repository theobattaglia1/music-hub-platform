import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, uploadFile } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const usePlaylistsStore = defineStore('playlists', () => {
  const loading = ref(false)
  const playlists = ref([])
  const error = ref(null)

  // Computed
  const playlistsForArtist = computed(() => (artistId) => 
    playlists.value.filter(p => p.artist_id === artistId)
  )
  
  const globalPlaylists = computed(() => 
    playlists.value.filter(p => !p.artist_id)
  )

  const publicPlaylists = computed(() =>
    playlists.value.filter(p => p.is_public)
  )

  // Actions
  const loadPlaylists = async (artistId = null) => {
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('playlists')
        .select(`
          *,
          profiles(full_name),
          artists(name, slug),
          playlist_songs(
            song_id,
            position,
            songs(*)
          )
        `)
        .order('created_at', { ascending: false })

      // Filter by artist if specified
      if (artistId) {
        query = query.eq('artist_id', artistId)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      // Transform data to include song count and other computed fields
      playlists.value = data.map(playlist => ({
        ...playlist,
        song_count: playlist.playlist_songs?.length || 0,
        songs: playlist.playlist_songs?.map(ps => ps.songs) || [],
        creator_name: playlist.profiles?.full_name || 'Unknown',
        artist_name: playlist.artists?.name || null,
        artist_slug: playlist.artists?.slug || null
      }))

    } catch (e) {
      console.error('Failed to load playlists:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const getPlaylistById = async (id) => {
    try {
      // Check if playlist is already in memory
      let playlist = playlists.value.find(p => p.id === id)
      if (playlist) return playlist

      // Fetch from database with detailed song information
      const { data, error: queryError } = await supabase
        .from('playlists')
        .select(`
          *,
          profiles(full_name, avatar_url),
          artists(name, slug),
          playlist_songs(
            song_id,
            position,
            added_at,
            songs(*)
          )
        `)
        .eq('id', id)
        .single()

      if (queryError) throw queryError

      // Transform data
      const transformedPlaylist = {
        ...data,
        song_count: data.playlist_songs?.length || 0,
        songs: data.playlist_songs
          ?.sort((a, b) => a.position - b.position)
          ?.map(ps => ({ ...ps.songs, added_at: ps.added_at, position: ps.position })) || [],
        creator_name: data.profiles?.full_name || 'Unknown',
        creator_avatar: data.profiles?.avatar_url || null,
        artist_name: data.artists?.name || null,
        artist_slug: data.artists?.slug || null
      }

      // Add to memory for future access
      const existingIndex = playlists.value.findIndex(p => p.id === id)
      if (existingIndex !== -1) {
        playlists.value[existingIndex] = transformedPlaylist
      } else {
        playlists.value.push(transformedPlaylist)
      }

      return transformedPlaylist
    } catch (e) {
      console.error('Failed to fetch playlist:', e)
      error.value = e.message
      return null
    }
  }

  const createPlaylist = async (playlistData, coverImage = null) => {
    try {
      loading.value = true
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        throw new Error('Must be authenticated to create playlist')
      }

      let coverImageUrl = null

      // Upload cover image if provided
      if (coverImage) {
        const { publicUrl } = await uploadFile('covers', coverImage)
        coverImageUrl = publicUrl
      }

      // Create playlist in database
      const { data: playlist, error: createError } = await supabase
        .from('playlists')
        .insert({
          name: playlistData.name,
          description: playlistData.description || '',
          artist_id: playlistData.artist_id || null,
          cover_image: coverImageUrl,
          is_public: playlistData.is_public ?? true,
          created_by: authStore.user.id
        })
        .select(`
          *,
          profiles(full_name),
          artists(name, slug)
        `)
        .single()

      if (createError) throw createError

      // Transform and add to local state
      const newPlaylist = {
        ...playlist,
        song_count: 0,
        songs: [],
        creator_name: playlist.profiles?.full_name || authStore.userName,
        artist_name: playlist.artists?.name || null,
        artist_slug: playlist.artists?.slug || null
      }

      playlists.value.unshift(newPlaylist)

      return newPlaylist
    } catch (e) {
      console.error('Failed to create playlist:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const updatePlaylist = async (playlistId, updates, coverImage = null) => {
    try {
      loading.value = true

      let coverImageUrl = updates.cover_image

      // Upload new cover image if provided
      if (coverImage) {
        const { publicUrl } = await uploadFile('covers', coverImage)
        coverImageUrl = publicUrl
      }

      // Update playlist in database
      const { data: playlist, error: updateError } = await supabase
        .from('playlists')
        .update({
          ...updates,
          cover_image: coverImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', playlistId)
        .select(`
          *,
          profiles(full_name),
          artists(name, slug)
        `)
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = playlists.value.findIndex(p => p.id === playlistId)
      if (index !== -1) {
        playlists.value[index] = {
          ...playlists.value[index],
          ...playlist,
          creator_name: playlist.profiles?.full_name || 'Unknown',
          artist_name: playlist.artists?.name || null,
          artist_slug: playlist.artists?.slug || null
        }
      }

      return playlist
    } catch (e) {
      console.error('Failed to update playlist:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const deletePlaylist = async (playlistId) => {
    try {
      loading.value = true

      // Delete playlist (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)

      if (deleteError) throw deleteError

      // Remove from local state
      const index = playlists.value.findIndex(p => p.id === playlistId)
      if (index !== -1) {
        playlists.value.splice(index, 1)
      }

      return true
    } catch (e) {
      console.error('Failed to delete playlist:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const addSongToPlaylist = async (playlistId, songId, position = null) => {
    try {
      // Get current songs count for positioning
      const playlist = await getPlaylistById(playlistId)
      if (!playlist) throw new Error('Playlist not found')

      const nextPosition = position ?? playlist.songs.length

      // Add song to playlist
      const { error: addError } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          position: nextPosition
        })

      if (addError) throw addError

      // Reload playlist data
      await getPlaylistById(playlistId)

      return true
    } catch (e) {
      console.error('Failed to add song to playlist:', e)
      error.value = e.message
      throw e
    }
  }

  const removeSongFromPlaylist = async (playlistId, songId) => {
    try {
      // Remove song from playlist
      const { error: removeError } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId)

      if (removeError) throw removeError

      // Reload playlist data
      await getPlaylistById(playlistId)

      return true
    } catch (e) {
      console.error('Failed to remove song from playlist:', e)
      error.value = e.message
      throw e
    }
  }

  const reorderPlaylistSongs = async (playlistId, songOrder) => {
    try {
      // Update positions for all songs in the playlist
      const updates = songOrder.map((songId, index) => ({
        playlist_id: playlistId,
        song_id: songId,
        position: index
      }))

      const { error: updateError } = await supabase
        .from('playlist_songs')
        .upsert(updates, {
          onConflict: 'playlist_id,song_id'
        })

      if (updateError) throw updateError

      // Reload playlist data
      await getPlaylistById(playlistId)

      return true
    } catch (e) {
      console.error('Failed to reorder playlist songs:', e)
      error.value = e.message
      throw e
    }
  }

  return {
    // State
    loading,
    playlists,
    error,

    // Computed
    playlistsForArtist,
    globalPlaylists,
    publicPlaylists,

    // Actions
    loadPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs
  }
})
