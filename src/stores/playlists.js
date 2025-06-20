import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const usePlaylistsStore = defineStore('playlists', () => {
  const loading = ref(false)
  const playlists = ref([])

  const loadPlaylists = async () => {
    try {
      loading.value = true
      const { data, error } = await supabase.from('playlists').select('*')
      if (error) throw error

      if (!data || data.length === 0) {
        // moco
        playlists.value = [
          {
            id: 'p1',
            name: 'Top Hits',
            description: 'Trending tracks across the platform',
            cover_image: null,
            artist_id: null,
            song_ids: ['s1', 's2', 's3'],
            song_count: 3,
            created_at: Date.now()
          },
          {
            id: 'p2',
            name: 'Chill Vibes',
            description: 'Relaxing tunes',
            cover_image: null,
            artist_id: null,
            song_ids: ['s2'],
            song_count: 1,
            created_at: Date.now() - 86400000
          },
          {
            id: 'p3',
            name: 'Taylor Swift Acoustic',
            description: 'Acoustic versions of Taylor Swift songs',
            cover_image: null,
            artist_id: '1',
            song_ids: ['s1'],
            song_count: 1,
            created_at: Date.now() - 172800000
          }
        ]
      } else {
        playlists.value = data
      }
    } catch (e) {
      console.error('Failed to load playlists', e)
    } finally {
      loading.value = false
    }
  }

  const getPlaylistById = async (id) => {
    let playlist = playlists.value.find(p => p.id === id)
    if (playlist) return playlist
    // else try fetch from db
    try {
      const { data, error } = await supabase.from('playlists').select('*').eq('id', id).single()
      if (error) throw error
      return data
    } catch (e) {
      console.error('Failed fetching playlist', e)
      return null
    }
  }

  const playlistsForArtist = (artistId) => playlists.value.filter(p => p.artist_id === artistId)
  const globalPlaylists = () => playlists.value.filter(p => !p.artist_id)

  return {
    loading,
    playlists,
    loadPlaylists,
    getPlaylistById,
    playlistsForArtist,
    globalPlaylists
  }
})
