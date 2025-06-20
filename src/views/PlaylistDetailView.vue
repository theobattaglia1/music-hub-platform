<template>
  <div class="playlist-detail-view">
    <!-- Header -->
    <div class="playlist-header">
      <div class="header-background" :style="headerStyle"></div>

      <div class="header-content">
        <div class="playlist-cover">
          <img v-if="playlist.cover_image" :src="playlist.cover_image" :alt="playlist.name">
          <div v-else class="cover-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
          </div>
        </div>

        <div class="playlist-info">
          <p class="playlist-type">Playlist</p>
          <h1 class="playlist-name">{{ playlist.name }}</h1>
          <p v-if="playlist.description" class="playlist-description">{{ playlist.description }}</p>

          <div class="playlist-meta">
            <span class="meta-item">{{ playlist.owner_name || 'Unknown' }}</span>
            <span class="meta-separator">•</span>
            <span class="meta-item">{{ songCount }} songs</span>
            <span class="meta-separator">•</span>
            <span class="meta-item">{{ totalDuration }}</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <button class="play-btn" @click="playAll">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>

        <button class="action-btn" @click="shufflePlay">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
          </svg>
        </button>

        <button class="action-btn" @click="showPlaylistMenu">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Songs List -->
    <div class="playlist-content">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading playlist...</p>
      </div>

      <div v-else-if="songs.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
        <h3>This playlist is empty</h3>
        <p>Add songs to start listening</p>
        <button class="empty-action-btn" @click="browseSongs">
          Browse Songs
        </button>
      </div>

      <AllSongsView
        v-else
        :songs="songs"
        @refresh="loadPlaylist"
        @import-files="handleImportFiles"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AllSongsView from './AllSongsView.vue'
import { usePlaylistsStore } from '@/stores/playlists'
import { useLibraryStore } from '@/stores/library'

const route = useRoute()
const router = useRouter()

// Inject global methods
const showContextMenu = inject('showContextMenu', () => {})
const showToast = inject('showToast', () => {})

// Stores
const playlistsStore = usePlaylistsStore()
const libraryStore = useLibraryStore()

// State
const loading = ref(true)
const playlist = ref({
  id: '',
  name: 'Loading...',
  description: '',
  cover_image: null,
  owner_name: '',
  is_public: false,
  created_at: null,
  song_ids: []
})
const songs = ref([])

// Computed
const songCount = computed(() => songs.value.length)

const totalDuration = computed(() => {
  const totalSeconds = songs.value.reduce((acc, song) => acc + (song.duration || 0), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} hr ${minutes} min`
  }
  return `${minutes} min`
})

const headerStyle = computed(() => {
  if (playlist.value.cover_image) {
    return {
      backgroundImage: `url(${playlist.value.cover_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
})

// Methods
const resolveSongs = () => {
  if (!playlist.value || !playlist.value.song_ids) return []
  const map = new Map(libraryStore.songs.map(s => [s.id, s]))
  return playlist.value.song_ids.map(id => map.get(id)).filter(Boolean)
}

const loadPlaylist = async () => {
  loading.value = true
  try {
    const playlistId = route.params.id

    // Ensure playlists loaded
    if (playlistsStore.playlists.length === 0 && !playlistsStore.loading) {
      await playlistsStore.loadPlaylists()
    }

    let pl = playlistsStore.playlists.find(p => p.id === playlistId)
    if (!pl) {
      pl = await playlistsStore.getPlaylistById(playlistId)
    }
    if (!pl) throw new Error('Playlist not found')

    playlist.value = pl

    // Ensure library songs loaded
    if (libraryStore.songs.length === 0 && !libraryStore.loading) {
      await libraryStore.loadSongs()
    }

    songs.value = resolveSongs()
  } catch (error) {
    console.error('Failed to load playlist:', error)
    showToast({
      message: 'Failed to load playlist',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Update songs when library store changes
watch(
  () => libraryStore.songs,
  () => {
    songs.value = resolveSongs()
  },
  { deep: true }
)

const playAll = async () => {
  if (songs.value.length === 0) return

  // TODO: Play all songs
  showToast({
    message: 'Play functionality coming soon',
    type: 'info'
  })
}

const shufflePlay = async () => {
  if (songs.value.length === 0) return

  // TODO: Shuffle play
  showToast({
    message: 'Shuffle functionality coming soon',
    type: 'info'
  })
}

const showPlaylistMenu = (event) => {
  const menuItems = [
    {
      label: 'Edit Details',
      icon: 'edit',
      action: () => editPlaylist()
    },
    {
      label: 'Add Songs',
      icon: 'add',
      action: () => browseSongs()
    },
    {
      label: 'Share',
      icon: 'share',
      action: () => sharePlaylist()
    },
    { divider: true },
    {
      label: 'Delete Playlist',
      icon: 'delete',
      danger: true,
      action: () => deletePlaylist()
    }
  ]

  showContextMenu(event, menuItems, 'playlist')
}

const editPlaylist = () => {
  // TODO: Show edit modal
  showToast({
    message: 'Edit functionality coming soon',
    type: 'info'
  })
}

const browseSongs = () => {
  router.push('/songs')
}

const sharePlaylist = () => {
  // TODO: Show share modal
  showToast({
    message: 'Share functionality coming soon',
    type: 'info'
  })
}

const deletePlaylist = async () => {
  if (!confirm(`Delete "${playlist.value.name}"? This cannot be undone.`)) return

  try {
    // TODO: Delete via API
    showToast({
      message: `Deleted playlist "${playlist.value.name}"`,
      type: 'success'
    })

    router.push('/playlists')
  } catch (error) {
    console.error('Failed to delete playlist:', error)
    showToast({
      message: 'Failed to delete playlist',
      type: 'error'
    })
  }
}

const handleImportFiles = (filePaths) => {
  // TODO: Import files to playlist
  console.log('Import files:', filePaths)
  showToast({
    message: 'Import functionality coming soon',
    type: 'info'
  })
}

// Lifecycle
onMounted(() => {
  loadPlaylist()
})
</script>

<style scoped>
.playlist-detail-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
}

/* Header */
.playlist-header {
  position: relative;
  padding: 80px 32px 24px;
  background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.8));
  overflow: hidden;
}

.header-background {
  position: absolute;
  inset: 0;
  filter: blur(40px) brightness(0.6);
  transform: scale(1.1);
  z-index: -1;
}

.header-content {
  display: flex;
  gap: 32px;
  align-items: flex-end;
  margin-bottom: 32px;
}

.playlist-cover {
  width: 232px;
  height: 232px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.playlist-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cover-placeholder svg {
  width: 80px;
  height: 80px;
  color: rgba(255, 255, 255, 0.8);
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-type {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  opacity: 0.8;
}

.playlist-name {
  font-size: clamp(32px, 5vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.playlist-description {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
  line-height: 1.5;
}

.playlist-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.meta-separator {
  opacity: 0.5;
}

/* Header Actions */
.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.play-btn {
  width: 56px;
  height: 56px;
  background: #1db954;
  color: black;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.play-btn:hover {
  transform: scale(1.05);
  background: #1ed760;
}

.play-btn svg {
  width: 24px;
  height: 24px;
  margin-left: 2px;
}

.action-btn {
  width: 40px;
  height: 40px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  border-color: white;
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

/* Content */
.playlist-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Loading State */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}

.empty-action-btn {
  padding: 12px 24px;
  background: white;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.empty-action-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}
</style>
