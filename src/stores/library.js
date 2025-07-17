import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, uploadFile } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useLibraryStore = defineStore('library', () => {
  const loading = ref(false)
  const songs = ref([])
  const error = ref(null)

  // Computed
  const songsByArtist = computed(() => (artistId) =>
    songs.value.filter(song => song.artist_id === artistId)
  )

  const recentSongs = computed(() =>
    songs.value
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
  )

  const publicSongs = computed(() =>
    songs.value.filter(song => song.is_public)
  )

  // Actions
  const loadSongs = async (artistId = null) => {
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('songs')
        .select(`
          *,
          artists(name, slug),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })

      // Filter by artist if specified
      if (artistId) {
        query = query.eq('artist_id', artistId)
      }

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      // Transform data to include artist and creator names
      songs.value = data.map(song => ({
        ...song,
        artist_name: song.artists?.name || 'Unknown Artist',
        artist_slug: song.artists?.slug || null,
        creator_name: song.profiles?.full_name || 'Unknown'
      }))

    } catch (e) {
      console.error('Failed to load songs:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  const getSongById = async (id) => {
    try {
      // Check if song is already in memory
      let song = songs.value.find(s => s.id === id)
      if (song) return song

      // Fetch from database
      const { data, error: queryError } = await supabase
        .from('songs')
        .select(`
          *,
          artists(name, slug),
          profiles(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (queryError) throw queryError

      // Transform data
      const transformedSong = {
        ...data,
        artist_name: data.artists?.name || 'Unknown Artist',
        artist_slug: data.artists?.slug || null,
        creator_name: data.profiles?.full_name || 'Unknown',
        creator_avatar: data.profiles?.avatar_url || null
      }

      // Add to memory for future access
      const existingIndex = songs.value.findIndex(s => s.id === id)
      if (existingIndex !== -1) {
        songs.value[existingIndex] = transformedSong
      } else {
        songs.value.push(transformedSong)
      }

      return transformedSong
    } catch (e) {
      console.error('Failed to fetch song:', e)
      error.value = e.message
      return null
    }
  }

  const createSong = async (songData, audioFile = null, artworkFile = null) => {
    try {
      loading.value = true
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        throw new Error('Must be authenticated to create song')
      }

      let audioUrl = null
      let artworkUrl = null

      // Upload audio file if provided
      if (audioFile) {
        const { publicUrl } = await uploadFile('audio', audioFile)
        audioUrl = publicUrl
      }

      // Upload artwork if provided
      if (artworkFile) {
        const { publicUrl } = await uploadFile('covers', artworkFile)
        artworkUrl = publicUrl
      }

      // Create song in database
      const { data: song, error: createError } = await supabase
        .from('songs')
        .insert({
          title: songData.title,
          artist_id: songData.artist_id,
          album: songData.album || null,
          genre: songData.genre || null,
          duration: songData.duration || null,
          audio_url: audioUrl,
          artwork_url: artworkUrl,
          lyrics: songData.lyrics || null,
          is_public: songData.is_public ?? true,
          bpm: songData.bpm || null,
          key_signature: songData.key_signature || null,
          created_by: authStore.user.id
        })
        .select(`
          *,
          artists(name, slug),
          profiles(full_name)
        `)
        .single()

      if (createError) throw createError

      // Transform and add to local state
      const newSong = {
        ...song,
        artist_name: song.artists?.name || 'Unknown Artist',
        artist_slug: song.artists?.slug || null,
        creator_name: song.profiles?.full_name || authStore.userName
      }

      songs.value.unshift(newSong)

      return newSong
    } catch (e) {
      console.error('Failed to create song:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateSong = async (songId, updates, audioFile = null, artworkFile = null) => {
    try {
      loading.value = true

      let audioUrl = updates.audio_url
      let artworkUrl = updates.artwork_url

      // Upload new audio file if provided
      if (audioFile) {
        const { publicUrl } = await uploadFile('audio', audioFile)
        audioUrl = publicUrl
      }

      // Upload new artwork if provided
      if (artworkFile) {
        const { publicUrl } = await uploadFile('covers', artworkFile)
        artworkUrl = publicUrl
      }

      // Update song in database
      const { data: song, error: updateError } = await supabase
        .from('songs')
        .update({
          ...updates,
          audio_url: audioUrl,
          artwork_url: artworkUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', songId)
        .select(`
          *,
          artists(name, slug),
          profiles(full_name)
        `)
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = songs.value.findIndex(s => s.id === songId)
      if (index !== -1) {
        songs.value[index] = {
          ...songs.value[index],
          ...song,
          artist_name: song.artists?.name || 'Unknown Artist',
          artist_slug: song.artists?.slug || null,
          creator_name: song.profiles?.full_name || 'Unknown'
        }
      }

      return song
    } catch (e) {
      console.error('Failed to update song:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteSong = async (songId) => {
    try {
      loading.value = true

      // Delete song (cascade will handle related records)
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId)

      if (deleteError) throw deleteError

      // Remove from local state
      const index = songs.value.findIndex(s => s.id === songId)
      if (index !== -1) {
        songs.value.splice(index, 1)
      }

      return true
    } catch (e) {
      console.error('Failed to delete song:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const searchSongs = async (query, artistId = null) => {
    try {
      let searchQuery = supabase
        .from('songs')
        .select(`
          *,
          artists(name, slug),
          profiles(full_name)
        `)
        .or(`title.ilike.%${query}%, album.ilike.%${query}%, genre.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      // Filter by artist if specified
      if (artistId) {
        searchQuery = searchQuery.eq('artist_id', artistId)
      }

      const { data, error: queryError } = await searchQuery

      if (queryError) throw queryError

      return data.map(song => ({
        ...song,
        artist_name: song.artists?.name || 'Unknown Artist',
        artist_slug: song.artists?.slug || null,
        creator_name: song.profiles?.full_name || 'Unknown'
      }))
    } catch (e) {
      console.error('Failed to search songs:', e)
      error.value = e.message
      return []
    }
  }

  const addToPlaylist = async (songId, playlistId) => {
    try {
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId
        })

      if (error) throw error
      return true
    } catch (e) {
      console.error('Failed to add song to playlist:', e)
      error.value = e.message
      throw e
    }
  }

  const getAudioUrl = (song) => {
    return song.audio_url
  }

  const getArtworkUrl = (song) => {
    return song.artwork_url || 'https://via.placeholder.com/300x300?text=No+Artwork'
  }

  return {
    // State
    loading,
    songs,
    error,

    // Computed
    songsByArtist,
    recentSongs,
    publicSongs,

    // Actions
    loadSongs,
    getSongById,
    createSong,
    updateSong,
    deleteSong,
    searchSongs,
    addToPlaylist,
    getAudioUrl,
    getArtworkUrl
  }
})
