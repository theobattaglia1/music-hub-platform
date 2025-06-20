<!-- components/ContextMenu.vue -->
<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="context-menu-overlay"
      @click="close"
      @contextmenu.prevent
    >
      <div
        class="context-menu glassmorphic"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
        @click.stop
        ref="menuEl"
      >
        <!-- Header with selection count -->
        <div v-if="items.length > 1" class="context-menu-header">
          {{ items.length }} items selected
        </div>

        <!-- Menu Items -->
        <template v-for="(action, index) in visibleActions" :key="index">
          <hr v-if="action.separator" class="context-menu-separator" />

          <button
            v-else
            class="context-menu-item"
            :class="{
              'with-submenu': action.submenu,
              'destructive': action.destructive
            }"
            @click="handleAction(action)"
            @mouseenter="showSubmenu(action)"
            @mouseleave="hideSubmenu"
          >
            <svg v-if="action.icon" viewBox="0 0 24 24" fill="currentColor">
              <path :d="action.icon"/>
            </svg>
            <span>{{ action.label }}</span>
            <svg v-if="action.submenu" class="submenu-arrow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </button>
        </template>

        <!-- Playlist Submenu -->
        <div
          v-if="showPlaylistSubmenu"
          class="playlist-submenu glassmorphic"
          @click.stop
        >
          <div class="playlist-submenu-header">Add to Playlist</div>

          <!-- Existing Playlists -->
          <template v-if="playlists.length > 0">
            <button
              v-for="playlist in playlists"
              :key="playlist.id"
              class="playlist-item"
              @click="addToPlaylist(playlist)"
            >
              <div
                class="playlist-color"
                :style="{ backgroundColor: playlist.color || '#1db954' }"
              ></div>
              <span class="playlist-name">{{ playlist.name }}</span>
              <span class="playlist-count">{{ playlist.song_count || 0 }} songs</span>
            </button>
            <hr class="context-menu-separator" />
          </template>

          <!-- Create New Playlist -->
          <button class="playlist-item new" @click="createNewPlaylist">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <span>Create New Playlist</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, nextTick, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useHighlightsStore } from '@/stores/highlights'
import { useRouter } from 'vue-router'

// Injected services
const showToast = inject('showToast', () => {})

// State
const visible = ref(false)
const position = ref({ x: 0, y: 0 })
const items = ref([])
const itemType = ref('')
const menuEl = ref(null)
const showPlaylistSubmenu = ref(false)

// Mock playlists - in real app, inject from store
const playlists = ref([
  { id: 1, name: 'Favorites', color: '#1db954', song_count: 24 },
  { id: 2, name: 'Workout Mix', color: '#e22856', song_count: 18 },
  { id: 3, name: 'Chill Vibes', color: '#4ecdc4', song_count: 32 }
])

const authStore = useAuthStore()
const highlightsStore = useHighlightsStore()
const router = useRouter()

// Detect dev environment
const devMode = import.meta.env.DEV

// Action definitions based on item type
const buildActionsWithPin = (base) => {
  if (authStore.isManager) {
    return [
      ...base,
      { separator: true },
      { label: 'Pin to Highlights', action: 'pin-highlight', icon: 'M12 2l3 7h7l-5.5 4.5L18 22l-6-3.5L6 22l1.5-8.5L2 9h7l3-7z' }
    ]
  }
  return base
}

// Replace actionMap creation to use builder
const actionMap = {
  song: buildActionsWithPin([
    {
      label: 'Play Now',
      action: 'play',
      icon: 'M8 5v14l11-7z'
    },
    {
      label: 'Add to Queue',
      action: 'queue',
      icon: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'
    },
    {
      label: 'Add to Playlist',
      action: 'add-to-playlist',
      icon: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
      submenu: true
    },
    { separator: true },
    {
      label: 'Go to Artist',
      action: 'go-to-artist',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'
    },
    {
      label: 'Show in Folder',
      action: 'show-in-folder',
      icon: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'
    },
    { separator: true },
    {
      label: 'Edit Metadata',
      action: 'edit',
      icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
    },
    {
      label: 'Download',
      action: 'download',
      icon: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'
    },
    { separator: true },
    {
      label: 'Remove from Library',
      action: 'delete',
      icon: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
      destructive: true
    }
  ]),
  playlist: buildActionsWithPin([
    {
      label: 'Play Playlist',
      action: 'play',
      icon: 'M8 5v14l11-7z'
    },
    {
      label: 'Shuffle Play',
      action: 'shuffle-play',
      icon: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'
    },
    { separator: true },
    {
      label: 'Add to Queue',
      action: 'queue',
      icon: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'
    },
    { separator: true },
    {
      label: 'Edit Playlist',
      action: 'edit',
      icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
    },
    {
      label: 'Duplicate Playlist',
      action: 'duplicate',
      icon: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'
    },
    {
      label: 'Share Playlist',
      action: 'share',
      icon: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z'
    },
    { separator: true },
    {
      label: 'Delete Playlist',
      action: 'delete',
      icon: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
      destructive: true
    }
  ]),
  artist: buildActionsWithPin([
    {
      label: 'Play Artist',
      action: 'play',
      icon: 'M8 5v14l11-7z'
    },
    {
      label: 'Shuffle Artist',
      action: 'shuffle-play',
      icon: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'
    },
    { separator: true },
    {
      label: 'Go to Artist Page',
      action: 'go-to-artist',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'
    },
    { separator: true },
    {
      label: 'Edit Artist Info',
      action: 'edit',
      icon: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'
    }
  ]),
  // Context menu for navigation/sidebar items
  navigation: buildActionsWithPin([
    { label: 'Back', action: 'go-back', icon: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' },
    { label: 'Forward', action: 'go-forward', icon: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z' },
    { separator: true },
    { label: 'Reload', action: 'reload', icon: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6a6 6 0 01-6-6H4a8 8 0 108-8z' },
    { label: 'Toggle Dark Mode', action: 'toggle-dark', icon: 'M12 3.1a9 9 0 000 17.8 7 7 0 010-17.8z' },
    { separator: true },
    { label: 'Open in New Tab', action: 'open-new-tab', icon: 'M14 3H5c-1.1 0-2 .9-2 2v14c0 1.1 .9 2 2 2h14c1.1 0 2-.9 2-2v-9l-8-8zM14 3v6h6' },
    { label: 'Split View', action: 'split-view', icon: 'M3 3h18v18H3V3zm2 2v14h14V5H5zm7 0h7v7h-7V5z' },
    { label: 'Copy Link', action: 'copy-link', icon: 'M3 13h2v-2H3v2zm3 0h8v-2H6v2zm0 4h8v-2H6v2zm0-8h8V7H6v2zm9 4h2v-2h-2v2zm0 4h2v-2h-2v2zm0-8h2V7h-2v2z' },
    { label: 'Copy Embed Code', action: 'copy-embed', icon: 'M4 4h16v2H4zm0 14h16v2H4zM4 8h16v8H4z' },
    ...(devMode ? [ { separator: true }, { label: 'Dev Utilities', action: 'dev-utils', icon: 'M3 3h2v2H3zm0 4h2v2H3zm0 4h2v2H3zm0 4h2v2H3zm14-12h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z' } ] : [])
  ])
}

// Computed
const visibleActions = computed(() => {
  return actionMap[itemType.value] || []
})

// Methods
const show = async (event, menuItems, type = 'song') => {
  items.value = Array.isArray(menuItems) ? menuItems : [menuItems]
  itemType.value = type

  // Position menu relative to cursor
  const x = Math.min(event.clientX, window.innerWidth - 250)
  const y = Math.min(event.clientY, window.innerHeight - 400)

  position.value = { x, y }
  visible.value = true
  showPlaylistSubmenu.value = false

  // Focus menu for keyboard navigation
  await nextTick()
  if (menuEl.value) {
    menuEl.value.focus()
  }
}

const close = () => {
  visible.value = false
  showPlaylistSubmenu.value = false
  items.value = []
  itemType.value = ''
}

const handleAction = (action) => {
  if (action.submenu && action.action === 'add-to-playlist') {
    showPlaylistSubmenu.value = !showPlaylistSubmenu.value
    return
  }

  // Execute the action
  executeAction(action.action, items.value)
  close()
}

const executeAction = (action, targetItems) => {
  switch (action) {
    case 'play':
      showToast({
        message: `Playing ${targetItems.length} item${targetItems.length > 1 ? 's' : ''}`,
        type: 'info'
      })
      break

    case 'queue':
      showToast({
        message: `Added ${targetItems.length} item${targetItems.length > 1 ? 's' : ''} to queue`,
        type: 'success'
      })
      break

    case 'shuffle-play':
      showToast({
        message: `Shuffling ${targetItems.length} item${targetItems.length > 1 ? 's' : ''}`,
        type: 'info'
      })
      break

    case 'edit':
      showToast({
        message: 'Edit modal would open here',
        type: 'info'
      })
      break

    case 'delete':
      showToast({
        message: `Deleted ${targetItems.length} item${targetItems.length > 1 ? 's' : ''}`,
        type: 'error'
      })
      break

    case 'duplicate':
      showToast({
        message: 'Duplicated successfully',
        type: 'success'
      })
      break

    case 'share':
      showToast({
        message: 'Share modal would open here',
        type: 'info'
      })
      break

    case 'download':
      showToast({
        message: 'Download started',
        type: 'success'
      })
      break

    case 'go-to-artist':
      showToast({
        message: 'Navigating to artist page',
        type: 'info'
      })
      break

    case 'show-in-folder':
      showToast({
        message: 'Revealing in file browser',
        type: 'info'
      })
      break

    case 'pin-highlight': {
      const first = items.value[0]
      highlightsStore.addHighlight({
        id: `${itemType.value}-${first.id || first.name}`,
        title: first.name || first.title || 'Item',
        description: itemType.value,
        link: window.location.pathname,
        date_added: Date.now()
      })
      showToast({ message: 'Pinned to Highlights', type: 'success' })
      close()
      break
    }

    case 'toggle-dark': {
      const root = document.documentElement
      root.classList.toggle('dark')
      localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light')
      showToast({ message: `Switched to ${root.classList.contains('dark') ? 'Dark' : 'Light'} mode`, type: 'success' })
      break
    }

    case 'reload':
      window.location.reload()
      break

    case 'go-back':
      router.back()
      break

    case 'go-forward':
      router.forward()
      break

    case 'split-view': {
      const target = targetItems[0]
      const link = target.link || '/'
      const width = Math.floor(screen.availWidth / 2)
      const height = screen.availHeight || window.innerHeight
      window.open(link, '_blank', `width=${width},height=${height},left=${width}`)
      break
    }

    case 'copy-embed': {
      const target = targetItems[0]
      const link = target.link || '/'
      const embed = `<iframe src="${window.location.origin + link}" width="100%" height="380" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>`
      navigator.clipboard?.writeText(embed).then(() => {
        showToast({ message: 'Embed code copied', type: 'success' })
      })
      break
    }

    case 'dev-utils':
      router.push('/dev')
      break

    default:
      console.log('Context action:', action, targetItems)
  }
}

const showSubmenu = (action) => {
  if (action.submenu && action.action === 'add-to-playlist') {
    // Position submenu logic would go here
  }
}

const hideSubmenu = () => {
  // Hide submenu logic
}

const addToPlaylist = (playlist) => {
  showToast({
    message: `Added ${items.value.length} song${items.value.length > 1 ? 's' : ''} to "${playlist.name}"`,
    type: 'success'
  })
  close()
}

const createNewPlaylist = () => {
  showToast({
    message: 'Create playlist modal would open here',
    type: 'info'
  })
  close()
}

// Keyboard navigation
const handleKeydown = (event) => {
  if (!visible.value) return

  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowDown':
      // Navigate down
      event.preventDefault()
      break
    case 'ArrowUp':
      // Navigate up
      event.preventDefault()
      break
    case 'Enter':
      // Execute focused action
      event.preventDefault()
      break
  }
}

// Expose methods for parent components
defineExpose({ show, close, isVisible: () => visible.value })

// Global event listeners
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
}

.context-menu {
  position: absolute;
  min-width: 240px;
  max-width: 320px;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
  overflow: hidden;
  outline: none;
}

.context-menu-header {
  padding: 8px 12px;
  font-weight: 600;
  opacity: 0.7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
}

.context-menu-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 8px;
  border: none;
}

.context-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  gap: 12px;
  background: none;
  border: none;
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  position: relative;
}

.context-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.with-submenu:hover {
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.destructive {
  color: #ff6b6b;
}

.context-menu-item.destructive:hover {
  background: rgba(255, 107, 107, 0.1);
}

.context-menu-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.8;
}

.submenu-arrow {
  margin-left: auto;
  opacity: 0.5;
}

/* Playlist submenu */
.playlist-submenu {
  position: absolute;
  top: -4px;
  left: calc(100% + 4px);
  border-radius: 8px;
  padding: 4px;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 10001;
}

.playlist-submenu-header {
  padding: 8px 12px;
  font-weight: 600;
  opacity: 0.7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: left;
  transition: all 0.15s ease;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.playlist-item.new {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 4px;
  padding-top: 12px;
  color: var(--accent-primary);
}

.playlist-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.playlist-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.playlist-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-count {
  font-size: 12px;
  opacity: 0.6;
  flex-shrink: 0;
}

/* Scrollbar */
.playlist-submenu::-webkit-scrollbar {
  width: 6px;
}

.playlist-submenu::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-submenu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.playlist-submenu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
