<!-- components/NowPlayingBar.vue -->
<template>
  <div class="now-playing-wrapper">
    <!-- Now Playing Bar -->
    <div class="now-playing-bar glassmorphic">
      <!-- Left Section - Song Info -->
      <div class="player-left">
        <div class="song-cover">
          <img
            v-if="currentSong?.artwork_url"
            :src="currentSong.artwork_url"
            :alt="currentSong?.album_name"
            class="cover-image"
            @error="handleImageError"
          />
          <div v-else class="cover-placeholder">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        </div>

        <div class="song-info">
          <div class="song-details">
            <div class="song-title">{{ currentSong?.name || 'No song playing' }}</div>
            <div class="song-artist" @click="navigateToArtist">
              {{ currentSong?.artist_name || '-' }}
            </div>
          </div>

          <button
            @click="toggleFavorite"
            class="icon-btn favorite-btn"
            :class="{ active: isFavorite }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Center Section - Controls and Progress -->
      <div class="player-center">
        <div class="playback-controls">
          <button
            @click="toggleShuffle"
            class="control-btn small"
            :class="{ active: isShuffled }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>

          <button
            @click="playPrevious"
            class="control-btn"
            :disabled="!hasPrevious"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>

          <button
            @click="togglePlayPause"
            class="control-btn play-btn"
            :disabled="!currentSong || isLoading"
          >
            <div v-if="isLoading" class="loading-spinner">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2v4a8 8 0 1 0 8 8h4a12 12 0 1 1-12-12z"/>
              </svg>
            </div>
            <svg v-else-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>

          <button
            @click="playNext"
            class="control-btn"
            :disabled="!hasNext"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>

          <button
            @click="toggleRepeat"
            class="control-btn small"
            :class="{ active: repeatMode !== 'off' }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>

        <div class="playback-bar">
          <span class="time current">{{ formattedCurrentTime }}</span>

          <div
            ref="progressBar"
            @click="handleSeek"
            @mousedown="startDragging"
            class="progress-bar"
          >
            <div class="progress-bg"></div>
            <div
              class="progress-fill"
              :style="{ width: `${progress}%` }"
            ></div>
            <div
              class="progress-thumb"
              :style="{ left: `${progress}%` }"
            ></div>
          </div>

          <span class="time duration">{{ formattedDuration }}</span>
        </div>
      </div>

      <!-- Right Section - Extra Controls -->
      <div class="player-right">
        <button class="icon-btn" @click="showQueue">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
          </svg>
        </button>

        <button class="icon-btn" @click="showLyrics" v-if="false">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </button>

        <div class="volume-control">
          <button
            @click="toggleMute"
            class="icon-btn"
          >
            <svg v-if="!isMuted && volume > 0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>

          <div
            ref="volumeSlider"
            @click="handleVolumeClick"
            class="volume-slider"
          >
            <div class="volume-bg"></div>
            <div
              class="volume-fill"
              :style="{ width: `${isMuted ? 0 : volume}%` }"
            ></div>
            <div
              class="volume-thumb"
              :style="{ left: `${isMuted ? 0 : volume}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Props
const props = defineProps({
  currentSong: Object,
  isPlaying: Boolean,
  currentTime: Number,
  duration: Number,
  volume: Number,
  isShuffled: Boolean,
  repeatMode: String
})

// Emits
const emit = defineEmits([
  'toggle-playback',
  'seek',
  'previous',
  'next',
  'toggle-shuffle',
  'toggle-repeat',
  'volume-change'
])

// Injected services
const showToast = inject('showToast', () => {})

// Local state
const isFavorite = ref(false)
const progressBar = ref(null)
const volumeSlider = ref(null)
const isDragging = ref(false)
const isMuted = ref(false)
const isLoading = ref(false)

// Computed
const progress = computed(() => {
  if (!props.duration || props.duration === 0) return 0
  return Math.min(100, Math.max(0, (props.currentTime / props.duration) * 100))
})

const formattedCurrentTime = computed(() => formatTime(props.currentTime))
const formattedDuration = computed(() => formatTime(props.duration))

const hasNext = computed(() => {
  // This would need to be passed from parent or store
  return true
})

const hasPrevious = computed(() => {
  // This would need to be passed from parent or store
  return true
})

// Methods
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleImageError = (e) => {
  e.target.style.display = 'none'
}

const togglePlayPause = () => {
  emit('toggle-playback')
}

const playNext = () => {
  emit('next')
}

const playPrevious = () => {
  emit('previous')
}

const toggleShuffle = () => {
  emit('toggle-shuffle')
}

const toggleRepeat = () => {
  emit('toggle-repeat')
}

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
  showToast({
    message: isFavorite.value ? 'Added to favorites' : 'Removed from favorites',
    type: 'success'
  })
}

const navigateToArtist = () => {
  if (props.currentSong?.artist_id) {
    router.push(`/artists/${props.currentSong.artist_id}`)
  }
}

const handleSeek = (event) => {
  if (!progressBar.value || !props.duration) return

  const rect = progressBar.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = (clickX / rect.width) * 100
  const seekTime = (percentage / 100) * props.duration

  emit('seek', seekTime)
}

const startDragging = (event) => {
  isDragging.value = true
  handleSeek(event)

  const handleMouseMove = (e) => {
    if (isDragging.value) {
      handleSeek(e)
    }
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleVolumeClick = (event) => {
  if (!volumeSlider.value) return

  const rect = volumeSlider.value.getBoundingClientRect()
  const percentage = ((event.clientX - rect.left) / rect.width) * 100
  const newVolume = Math.max(0, Math.min(100, percentage))
  emit('volume-change', newVolume)
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    emit('volume-change', 0)
  } else {
    emit('volume-change', props.volume || 70)
  }
}

const showQueue = () => {
  showToast({ message: 'Queue view coming soon', type: 'info' })
}

const showLyrics = () => {
  showToast({ message: 'Lyrics view coming soon', type: 'info' })
}
</script>

<style scoped>
/* Now playing bar — sits in the app-container row, below main content */
.now-playing-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--now-playing-height);
  z-index: var(--z-sticky);
}

.now-playing-bar {
  height: 100%;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: var(--space-4);
}

/* ── Left Section ─────────────────────────────────────── */
.player-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  flex: 0 1 280px;
}

.song-cover {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.cover-image {
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
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.cover-placeholder svg {
  width: 20px;
  height: 20px;
}

.song-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  flex: 1;
}

.song-details {
  min-width: 0;
  flex: 1;
}

.song-title {
  font-size: var(--text-small);
  font-weight: var(--weight-medium);
  color: var(--color-text);
  margin-bottom: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--motion-fast);
}

.song-artist:hover {
  color: var(--color-text);
  text-decoration: underline;
}

/* ── Center Section ───────────────────────────────────── */
.player-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  max-width: 580px;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.control-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all var(--motion-fast);
}

.control-btn:hover:not(:disabled) {
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.06);
}

.control-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn svg {
  width: 18px;
  height: 18px;
}

.control-btn.small svg {
  width: 14px;
  height: 14px;
}

.control-btn.play-btn {
  width: 36px;
  height: 36px;
  background: var(--color-text);
  color: var(--color-surface);
  border-radius: 50%;
}

.control-btn.play-btn:hover:not(:disabled) {
  transform: scale(1.06);
  background: #2C2B28;
}

.control-btn.active {
  color: var(--color-accent);
}

.loading-spinner svg {
  animation: spin 0.8s linear infinite;
}

.playback-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  max-width: 480px;
}

.time {
  font-size: 11px;
  color: var(--color-text-tertiary);
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  flex: 1;
  height: 18px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.progress-bg {
  position: absolute;
  width: 100%;
  height: 3px;
  background: var(--color-border);
  border-radius: 2px;
}

.progress-fill {
  position: absolute;
  height: 3px;
  background: var(--color-text);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--color-text);
  border-radius: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity var(--motion-fast);
  box-shadow: var(--shadow-sm);
}

.progress-bar:hover .progress-fill {
  background: var(--color-accent);
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

/* ── Right Section ────────────────────────────────────── */
.player-right {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 0 1 280px;
  justify-content: flex-end;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: all var(--motion-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.06);
}

.icon-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.icon-btn.active {
  color: var(--color-accent);
}

.icon-btn.favorite-btn.active {
  color: var(--color-accent);
}

.icon-btn svg {
  width: 15px;
  height: 15px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.volume-slider {
  width: 72px;
  height: 18px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.volume-bg {
  position: absolute;
  width: 100%;
  height: 3px;
  background: var(--color-border);
  border-radius: 2px;
}

.volume-fill {
  position: absolute;
  height: 3px;
  background: var(--color-text-secondary);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.volume-thumb {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--color-text);
  border-radius: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity var(--motion-fast);
  box-shadow: var(--shadow-sm);
}

.volume-slider:hover .volume-fill {
  background: var(--color-accent);
}

.volume-slider:hover .volume-thumb {
  opacity: 1;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 768px) {
  .now-playing-bar {
    padding: 0 var(--space-3);
    gap: var(--space-2);
  }

  .player-left { flex: 0 1 180px; }
  .player-right { flex: 0 1 80px; }
  .volume-control { display: none; }
  .playback-controls { gap: var(--space-2); }
  .playback-bar { max-width: 280px; }
}
</style>