import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useLibraryStore = defineStore('library', () => {
  const loading = ref(false)
  const songs = ref([])

  const loadSongs = async () => {
    try {
      loading.value = true
      // Fetch all songs (assumes a songs table)
      const { data, error } = await supabase.from('songs').select('*')
      if (error) throw error

      if (!data || data.length === 0) {
        // Mock data for development
        songs.value = [
          {
            id: 's1',
            name: 'Love Story',
            artist: 'Taylor Swift',
            artist_id: '1',
            album: 'Fearless',
            duration: 230,
            artwork_path: null,
            date_added: Date.now()
          },
          {
            id: 's2',
            name: 'Blinding Lights',
            artist: 'The Weeknd',
            artist_id: '2',
            album: 'After Hours',
            duration: 200,
            artwork_path: null,
            date_added: Date.now() - 86400000
          },
          {
            id: 's3',
            name: 'Bad Guy',
            artist: 'Billie Eilish',
            artist_id: '3',
            album: 'When We All Fall Asleep, Where Do We Go?',
            duration: 194,
            artwork_path: null,
            date_added: Date.now() - 172800000
          }
        ]
      } else {
        songs.value = data
      }
    } catch (error) {
      console.error('Failed to load songs:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    songs,
    loadSongs
  }
})
