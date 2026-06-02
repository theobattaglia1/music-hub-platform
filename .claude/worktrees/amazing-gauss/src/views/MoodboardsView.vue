<template>
  <div class="moodboards-view" @contextmenu.prevent="onGridContextMenu($event)">
    <!-- Header -->
    <div class="view-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Moodboards</span>
            <span class="title-count">{{ moodboards.length }}</span>
          </h1>
          <p class="view-subtitle">Visual collaboration for creative inspiration</p>
        </div>
        <button class="create-btn" @click="showCreateModal = true">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Moodboard</span>
        </button>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <div class="search-container">
        <div class="search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Search moodboards..." class="search-input" />
          <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">×</button>
        </div>
      </div>
      <div class="filter-group">
        <div class="custom-select">
          <select v-model="sortBy" class="filter-select">
            <option value="recent">Recently Updated</option>
            <option value="name">Name A–Z</option>
            <option value="created">Date Created</option>
            <option value="items">Most Items</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Moodboards Grid -->
    <div v-if="filteredMoodboards.length > 0" class="moodboards-container">
      <div class="moodboards-grid">
        <div
          v-for="moodboard in filteredMoodboards"
          :key="moodboard.id"
          class="moodboard-card"
          @click="openMoodboard(moodboard)"
          @contextmenu.stop.prevent="showMoodboardMenu(moodboard, $event)"
        >
          <div class="moodboard-preview">
            <div class="preview-canvas">
              <div
                v-for="(item, index) in moodboard.preview_items"
                :key="index"
                class="preview-item"
                :style="{
                  left: item.x + '%',
                  top: item.y + '%',
                  width: item.width + '%',
                  height: item.height + '%'
                }"
              >
                <img v-if="item.type === 'image'" :src="item.src" :alt="item.alt || ''" />
                <div v-else-if="item.type === 'text'" class="text-item" :style="{ color: item.color }">{{ item.content }}</div>
                <div v-else-if="item.type === 'color'" class="color-item" :style="{ backgroundColor: item.color }"></div>
              </div>
            </div>
            <!-- Open overlay -->
            <div class="preview-overlay">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
              <span>Open Editor</span>
            </div>
          </div>

          <div class="moodboard-details">
            <h3 class="moodboard-title">{{ moodboard.title }}</h3>
            <div class="moodboard-meta">
              <span class="item-count">{{ moodboard.item_count || 0 }} items</span>
              <span class="meta-dot">·</span>
              <span class="last-updated">{{ formatDate(moodboard.updated_at) }}</span>
            </div>
            <div v-if="moodboard.collaborators?.length" class="collaborators">
              <div
                v-for="(c, idx) in moodboard.collaborators.slice(0, 3)"
                :key="`${moodboard.id}-${c.id}`"
                class="collaborator-avatar"
                :style="{ '--index': idx }"
                :title="c.name"
              >
                <img v-if="c.avatar" :src="c.avatar" :alt="c.name" />
                <span v-else>{{ c.name?.charAt(0) }}</span>
              </div>
              <div v-if="moodboard.collaborators.length > 3" class="collaborator-more">+{{ moodboard.collaborators.length - 3 }}</div>
            </div>
          </div>

          <!-- Quick action buttons on hover -->
          <div class="moodboard-actions">
            <button class="action-btn" @click.stop="showMoodboardMenu(moodboard, $event)" title="More options">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            <button class="action-btn" @click.stop="duplicateMoodboard(moodboard.id)" title="Duplicate">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-illustration">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="40" width="120" height="120" rx="8" stroke="currentColor" stroke-width="2" opacity="0.2"/>
          <rect x="60" y="60" width="30" height="20" rx="4" fill="currentColor" opacity="0.3"/>
          <rect x="100" y="60" width="40" height="30" rx="4" fill="currentColor" opacity="0.2"/>
          <rect x="60" y="100" width="25" height="25" rx="4" fill="currentColor" opacity="0.4"/>
          <rect x="95" y="105" width="45" height="15" rx="4" fill="currentColor" opacity="0.25"/>
        </svg>
      </div>
      <h3 class="empty-title">{{ searchQuery ? 'No moodboards found' : 'Create your first moodboard' }}</h3>
      <p class="empty-text">{{ searchQuery ? 'Try a different search term' : 'Right-click anywhere or click below to start' }}</p>
      <button v-if="!searchQuery" class="create-btn large" @click="showCreateModal = true">
        <div class="btn-bg"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Create Moodboard</span>
      </button>
    </div>

    <!-- Create Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>New Moodboard</h2>
              <button class="modal-close" @click="closeCreateModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form @submit.prevent="confirmCreate" class="modal-body">
              <div class="form-group">
                <label>Title</label>
                <input
                  ref="createInputRef"
                  v-model="newTitle"
                  type="text"
                  placeholder="Album Aesthetic, Tour Concepts…"
                  required
                  maxlength="80"
                  autofocus
                />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" @click="closeCreateModal">Cancel</button>
                <button type="submit" class="btn-primary" :disabled="!newTitle.trim()">Create &amp; Open</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- Rename Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="renameTarget" class="modal-overlay" @click.self="renameTarget = null">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Rename Moodboard</h2>
              <button class="modal-close" @click="renameTarget = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form @submit.prevent="confirmRename" class="modal-body">
              <div class="form-group">
                <label>New Title</label>
                <input v-model="renameValue" type="text" required maxlength="80" />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" @click="renameTarget = null">Cancel</button>
                <button type="submit" class="btn-primary" :disabled="!renameValue.trim()">Rename</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useMoodboardStore } from '@/stores/moodboards'

const router = useRouter()
const store = useMoodboardStore()
const showToast = inject('showToast', () => {})
const showContextMenu = inject('showContextMenu', () => {})

// State
const searchQuery = ref('')
const sortBy = ref('recent')
const showCreateModal = ref(false)
const newTitle = ref('')
const createInputRef = ref(null)
const renameTarget = ref(null)
const renameValue = ref('')

// Use store's reactive boards array directly
const moodboards = computed(() => store.boards)

const filteredMoodboards = computed(() => {
  let result = [...moodboards.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(b => b.title.toLowerCase().includes(q))
  }
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name': return a.title.localeCompare(b.title)
      case 'created': return new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at)
      case 'items': return (b.item_count || 0) - (a.item_count || 0)
      default: return new Date(b.updated_at) - new Date(a.updated_at)
    }
  })
  return result
})

// Actions
const openMoodboard = (board) => {
  router.push(`/moodboards/${board.id}`)
}

const closeCreateModal = () => {
  showCreateModal.value = false
  newTitle.value = ''
}

const confirmCreate = () => {
  if (!newTitle.value.trim()) return
  const board = store.createBoard(newTitle.value)
  closeCreateModal()
  showToast({ message: `Created "${board.title}"`, type: 'success' })
  router.push(`/moodboards/${board.id}`)
}

const duplicateMoodboard = (id) => {
  const copy = store.duplicateBoard(id)
  if (copy) showToast({ message: `Duplicated as "${copy.title}"`, type: 'success' })
}

const startRename = (board) => {
  renameTarget.value = board
  renameValue.value = board.title
}

const confirmRename = () => {
  if (!renameTarget.value || !renameValue.value.trim()) return
  store.renameBoard(renameTarget.value.id, renameValue.value)
  showToast({ message: `Renamed to "${renameValue.value.trim()}"`, type: 'success' })
  renameTarget.value = null
}

const deleteMoodboard = (board) => {
  if (!confirm(`Delete "${board.title}"? This cannot be undone.`)) return
  store.deleteBoard(board.id)
  showToast({ message: `Deleted "${board.title}"`, type: 'error' })
}

const shareMoodboard = (board) => {
  const url = `${window.location.origin}/moodboards/${board.id}`
  navigator.clipboard?.writeText(url).then(() =>
    showToast({ message: 'Link copied to clipboard', type: 'success' })
  ).catch(() => showToast({ message: url, type: 'info' }))
}

const showMoodboardMenu = (board, event) => {
  event.stopPropagation()
  const menuItems = [
    { label: 'Open Editor', action: () => openMoodboard(board) },
    { divider: true },
    { label: 'Rename', action: () => startRename(board) },
    { label: 'Duplicate', action: () => duplicateMoodboard(board.id) },
    { label: 'Copy Link', action: () => shareMoodboard(board) },
    { divider: true },
    { label: 'Delete', danger: true, action: () => deleteMoodboard(board) }
  ]
  showContextMenu(event, menuItems, 'custom')
}

const onGridContextMenu = (event) => {
  if (event.target.closest('.moodboard-card')) return
  const menuItems = [
    { label: 'New Moodboard', action: () => { showCreateModal.value = true } },
    { divider: true },
    { label: 'Sort: Recently Updated', action: () => { sortBy.value = 'recent' } },
    { label: 'Sort: Name A–Z', action: () => { sortBy.value = 'name' } },
    { label: 'Sort: Most Items', action: () => { sortBy.value = 'items' } }
  ]
  showContextMenu(event, menuItems, 'custom')
}

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3600000)
  const days = Math.floor(h / 24)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

onMounted(() => {
  store.load()
})
</script>

<style scoped>
.moodboards-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
}

.view-header {
  position: relative;
  padding: 48px 48px 0;
  margin-bottom: 32px;
}

.header-background {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 200%;
  background: radial-gradient(ellipse at top, rgba(200,75,17,0.06) 0%, transparent 50%);
  pointer-events: none;
  animation: pulse 20s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.title-section { flex: 1; }

.view-title {
  display: flex;
  align-items: baseline;
  gap: 16px;
  font-size: 48px;
  font-weight: 200;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.title-count { font-size: 24px; color: var(--color-text-tertiary); font-weight: 300; }
.view-subtitle { font-size: 16px; color: var(--color-text-secondary); margin: 0; }

.create-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: 100px;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  white-space: nowrap;
}

.create-btn.large { padding: 16px 32px; font-size: 16px; }

.create-btn:hover { border-color: var(--color-accent); color: var(--color-accent); transform: translateY(-2px); }

.btn-bg {
  position: absolute; top: 50%; left: 50%;
  width: 0; height: 0;
  background: rgba(0,0,0,0.04);
  border-radius: 50%;
  transform: translate(-50%,-50%);
  transition: all 0.5s cubic-bezier(0.4,0,0.2,1);
}
.create-btn:hover .btn-bg { width: 200%; height: 200%; }
.create-btn svg { width: 20px; height: 20px; }

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px;
  margin-bottom: 32px;
  gap: 32px;
}

.search-container { flex: 1; max-width: 400px; }
.search-wrapper { position: relative; }

.search-input {
  width: 100%;
  padding: 10px 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text);
  font-size: 14px;
  transition: all var(--motion-default);
  box-sizing: border-box;
}
.search-input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-subtle); }
.search-input::placeholder { color: var(--color-text-tertiary); }

.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 18px; color: var(--color-text-tertiary); pointer-events: none;
}

.clear-search {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--color-text-tertiary);
  font-size: 18px; cursor: pointer; padding: 2px 6px; line-height: 1;
}
.clear-search:hover { color: var(--color-text); }

.filter-select {
  padding: 10px 36px 10px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all var(--motion-default);
  min-width: 160px;
}
.filter-select:hover { background: var(--color-surface-raised); }

.moodboards-container { flex: 1; padding: 0 48px 48px; overflow-y: auto; }

.moodboards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.moodboard-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.moodboard-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--color-border-strong); }

.moodboard-preview {
  height: 200px;
  background: linear-gradient(135deg, rgba(200,75,17,0.06) 0%, rgba(168,85,247,0.06) 100%);
  position: relative;
  overflow: hidden;
}

.preview-canvas { position: relative; width: 100%; height: 100%; }
.preview-item { position: absolute; border-radius: 4px; overflow: hidden; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
.text-item {
  display: flex; align-items: center; justify-content: center;
  font-size: 7px; font-weight: 700; text-align: center;
  background: rgba(0,0,0,0.08); border-radius: 4px; height: 100%;
}
.color-item { width: 100%; height: 100%; border-radius: 4px; }

.preview-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px;
  color: #fff;
  opacity: 0;
  transition: opacity var(--motion-default);
  font-size: 14px; font-weight: 500;
}
.preview-overlay svg { width: 24px; height: 24px; }
.moodboard-card:hover .preview-overlay { opacity: 1; }

.moodboard-details { padding: 20px; }
.moodboard-title { font-size: 17px; font-weight: 500; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.moodboard-meta { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--color-text-tertiary); margin-bottom: 14px; }
.meta-dot { opacity: 0.4; }

.collaborators { display: flex; align-items: center; }
.collaborator-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 2px solid var(--color-surface);
  overflow: hidden;
  background: var(--color-surface-raised);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; color: var(--color-text-secondary);
  margin-left: calc(var(--index) * -8px);
  position: relative;
  z-index: calc(10 - var(--index));
}
.collaborator-avatar img { width: 100%; height: 100%; object-fit: cover; }
.collaborator-more {
  width: 26px; height: 26px;
  border-radius: 50%; border: 2px solid var(--color-surface);
  background: var(--color-surface-raised);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; color: var(--color-text-secondary);
  margin-left: -8px;
}

.moodboard-actions {
  position: absolute; top: 12px; right: 12px;
  display: flex; gap: 6px;
  opacity: 0;
  transition: opacity var(--motion-default);
}
.moodboard-card:hover .moodboard-actions { opacity: 1; }

.action-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-default);
}
.action-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }
.action-btn svg { width: 16px; height: 16px; }

/* Empty State */
.empty-state {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 48px; text-align: center;
}
.empty-illustration { width: 160px; height: 160px; margin-bottom: 28px; color: var(--color-border-strong); }
.empty-title { font-size: 26px; font-weight: 300; margin: 0 0 10px; }
.empty-text { font-size: 15px; color: var(--color-text-secondary); margin: 0 0 28px; max-width: 380px; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.modal-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  width: 100%; max-width: 420px;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border);
}
.modal-header h2 { margin: 0; font-size: 18px; font-weight: var(--weight-semibold); }
.modal-close {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-tertiary);
  padding: 4px; border-radius: var(--radius-sm);
  display: flex;
}
.modal-close svg { width: 18px; height: 18px; }
.modal-close:hover { color: var(--color-text); background: var(--color-surface-raised); }

.modal-body { padding: 20px 24px 24px; }
.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.form-group label { font-size: 13px; font-weight: var(--weight-medium); color: var(--color-text-secondary); }
.form-group input {
  padding: 10px 14px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 15px;
}
.form-group input:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-subtle); }

.modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

.btn-secondary {
  padding: 9px 18px;
  background: none; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text-secondary);
  font-size: 14px; cursor: pointer;
  transition: all var(--motion-fast);
}
.btn-secondary:hover { background: var(--color-surface-raised); color: var(--color-text); }

.btn-primary {
  padding: 9px 18px;
  background: var(--color-text); border: 1px solid var(--color-text);
  border-radius: var(--radius-sm); color: var(--color-bg);
  font-size: 14px; font-weight: var(--weight-medium); cursor: pointer;
  transition: all var(--motion-fast);
}
.btn-primary:hover:not(:disabled) { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

@media (max-width: 768px) {
  .view-header { padding: 32px 24px 0; }
  .header-content { flex-direction: column; gap: 20px; }
  .view-title { font-size: 36px; }
  .controls-section { flex-direction: column; padding: 0 24px; gap: 12px; }
  .search-container { max-width: none; }
  .moodboards-container { padding: 0 24px 24px; }
  .moodboards-grid { grid-template-columns: 1fr; gap: 16px; }
}
</style>
