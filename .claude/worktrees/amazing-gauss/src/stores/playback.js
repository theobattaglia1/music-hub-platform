import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlaybackStore = defineStore('playback', () => {
  // State
  const currentSong = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(80)
  const isShuffled = ref(false)
  const repeatMode = ref('off') // 'off', 'all', 'one'
  const queue = ref([])
  const queueIndex = ref(-1)

  // Computed
  const hasNext = computed(() => {
    if (repeatMode.value === 'all') return true
    return queueIndex.value < queue.value.length - 1
  })

  const hasPrevious = computed(() => {
    return queueIndex.value > 0
  })

  // Actions
  const playSong = (song) => {
    currentSong.value = song
    isPlaying.value = true
    currentTime.value = 0
    duration.value = song.duration || 180 // Default 3 minutes
  }

  const togglePlayback = () => {
    if (!currentSong.value) return
    isPlaying.value = !isPlaying.value
  }

  const pause = () => {
    isPlaying.value = false
  }

  const play = () => {
    if (!currentSong.value) return
    isPlaying.value = true
  }

  const seek = (time) => {
    currentTime.value = Math.max(0, Math.min(time, duration.value))
  }

  const setVolume = (newVolume) => {
    volume.value = Math.max(0, Math.min(100, newVolume))
  }

  const toggleShuffle = () => {
    isShuffled.value = !isShuffled.value
  }

  const toggleRepeat = () => {
    const modes = ['off', 'all', 'one']
    const currentIndex = modes.indexOf(repeatMode.value)
    repeatMode.value = modes[(currentIndex + 1) % modes.length]
  }

  const playNext = () => {
    if (!hasNext.value) return

    if (repeatMode.value === 'one') {
      seek(0)
      play()
      return
    }

    if (queueIndex.value < queue.value.length - 1) {
      queueIndex.value++
      playSong(queue.value[queueIndex.value])
    } else if (repeatMode.value === 'all' && queue.value.length > 0) {
      queueIndex.value = 0
      playSong(queue.value[0])
    }
  }

  const playPrevious = () => {
    if (!hasPrevious.value) return

    if (currentTime.value > 3) {
      seek(0)
      return
    }

    if (queueIndex.value > 0) {
      queueIndex.value--
      playSong(queue.value[queueIndex.value])
    }
  }

  const addToQueue = (songs) => {
    const songsArray = Array.isArray(songs) ? songs : [songs]
    queue.value.push(...songsArray)
  }

  const clearQueue = () => {
    queue.value = []
    queueIndex.value = -1
    currentSong.value = null
    isPlaying.value = false
  }

  const playArtist = (artist, songs) => {
    clearQueue()
    queue.value = isShuffled.value ? shuffleArray([...songs]) : songs
    queueIndex.value = 0
    if (queue.value.length > 0) {
      playSong(queue.value[0])
    }
  }

  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  return {
    // State
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    queue,
    queueIndex,

    // Computed
    hasNext,
    hasPrevious,

    // Actions
    playSong,
    togglePlayback,
    pause,
    play,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrevious,
    addToQueue,
    clearQueue,
    playArtist
  }
})
