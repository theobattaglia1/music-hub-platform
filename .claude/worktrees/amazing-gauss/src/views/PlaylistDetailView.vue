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
  background: var(--color-bg);
}

/* Header */
.playlist-header {
  position: relative;
  padding: var(--space-10) var(--space-8) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}

.header-background {
  position: absolute;
  inset: 0;
  filter: blur(40px) saturate(0.3) brightness(1.4);
  transform: scale(1.1);
  z-index: -1;
  opacity: 0.15;
}

.header-content {
  display: flex;
  gap: var(--space-8);
  align-items: flex-end;
  margin-bottom: var(--space-8);
}

.playlist-cover {
  width: 192px;
  height: 192px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
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
  background: var(--color-surface-raised);
}

.cover-placeholder svg {
  width: 64px;
  height: 64px;
  color: var(--color-text-tertiary);
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-type {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-2);
}

.playlist-name {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: var(--space-3);
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.playlist-description {
  font-size: var(--text-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
  line-height: 1.5;
}

.playlist-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-small);
  color: var(--color-text-secondary);
}

.meta-separator {
  opacity: 0.4;
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--motion-fast), transform var(--motion-fast);
}

.play-btn:hover {
  transform: scale(1.05);
  background: #2C2B28;
}

.play-btn svg {
  width: 22px;
  height: 22px;
  margin-left: 2px;
}

.action-btn {
  width: 36px;
  height: 36px;
  background: none;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.action-btn:hover {
  border-color: var(--color-text);
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.04);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.playlist-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: var(--text-body);
  color: var(--color-text-secondary);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
}

.empty-state svg {
  width: 56px;
  height: 56px;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-6);
}

.empty-state h3 {
  font-size: var(--text-subheading);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.empty-state p {
  font-size: var(--text-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

.empty-action-btn {
  padding: var(--space-2) var(--space-5);
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast);
}

.empty-action-btn:hover {
  background: #2C2B28;
}
</style>
