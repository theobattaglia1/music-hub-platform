<template>
  <div class="moodboards-view">
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
        <button class="create-btn" @click="createMoodboard">
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
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search moodboards..."
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <div class="custom-select">
          <select v-model="sortBy" class="filter-select">
            <option value="recent">Recently Updated</option>
            <option value="name">Name</option>
            <option value="created">Date Created</option>
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
                <img v-if="item.type === 'image'" :src="item.src" :alt="item.alt" />
                <div v-else-if="item.type === 'text'" class="text-item" :style="{ color: item.color }">
                  {{ item.content }}
                </div>
                <div v-else-if="item.type === 'color'" class="color-item" :style="{ backgroundColor: item.color }"></div>
              </div>
            </div>
          </div>

          <div class="moodboard-details">
            <h3 class="moodboard-title">{{ moodboard.title }}</h3>
            <div class="moodboard-meta">
              <span class="item-count">{{ moodboard.item_count }} items</span>
              <span class="last-updated">{{ formatDate(moodboard.updated_at) }}</span>
            </div>
            
            <div v-if="moodboard.collaborators?.length > 0" class="collaborators">
              <div
                v-for="(collaborator, idx) in moodboard.collaborators.slice(0, 3)"
                :key="`${moodboard.id}-${collaborator.id}`"
                class="collaborator-avatar"
                :style="{ '--index': idx }"
                :title="collaborator.name"
              >
                <img v-if="collaborator.avatar" :src="collaborator.avatar" :alt="collaborator.name" />
                <span v-else>{{ collaborator.name?.charAt(0) }}</span>
              </div>
              <div v-if="moodboard.collaborators.length > 3" class="collaborator-more">
                +{{ moodboard.collaborators.length - 3 }}
              </div>
            </div>
          </div>

          <div class="moodboard-actions">
            <button class="action-btn" @click.stop="shareMoodboard(moodboard)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z"/>
              </svg>
            </button>
            <button class="action-btn" @click.stop="duplicateMoodboard(moodboard)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
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
      <p class="empty-text">
        {{ searchQuery ? 'Try adjusting your search terms' : 'Start collecting visual inspiration and ideas' }}
      </p>
      <button v-if="!searchQuery" class="create-btn large" @click="createMoodboard">
        <div class="btn-bg"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Create Moodboard</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { apiService } from '@/shared/services/api'

const showToast = inject('showToast', () => {})

// State
const moodboards = ref([])
const searchQuery = ref('')
const sortBy = ref('recent')

// Mock data
const mockMoodboards = [
  {
    id: 'mood-1',
    title: 'Album Aesthetic',
    item_count: 12,
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    collaborators: [
      { id: 'user-1', name: 'Alex Smith', avatar: 'https://ui-avatars.com/api/?name=Alex+Smith&background=6366f1&color=fff&size=32' },
      { id: 'user-2', name: 'Sam Johnson', avatar: null }
    ],
    preview_items: [
      { type: 'image', src: 'https://ui-avatars.com/api/?name=Preview&background=a855f7&color=fff&size=100', x: 10, y: 15, width: 35, height: 25 },
      { type: 'color', color: '#a855f7', x: 55, y: 10, width: 20, height: 15 },
      { type: 'text', content: 'NEON VIBES', color: '#22c55e', x: 15, y: 50, width: 40, height: 10 },
      { type: 'image', src: 'https://ui-avatars.com/api/?name=Art&background=22c55e&color=fff&size=80', x: 60, y: 40, width: 30, height: 35 }
    ]
  },
  {
    id: 'mood-2',
    title: 'Tour Concepts',
    item_count: 8,
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    collaborators: [
      { id: 'user-3', name: 'Jordan Lee', avatar: 'https://ui-avatars.com/api/?name=Jordan+Lee&background=ef4444&color=fff&size=32' }
    ],
    preview_items: [
      { type: 'color', color: '#ef4444', x: 5, y: 5, width: 40, height: 30 },
      { type: 'image', src: 'https://ui-avatars.com/api/?name=Stage&background=3b82f6&color=fff&size=120', x: 50, y: 20, width: 45, height: 40 },
      { type: 'text', content: 'WORLD TOUR', color: '#ffffff', x: 10, y: 70, width: 50, height: 15 }
    ]
  },
  {
    id: 'mood-3',
    title: 'Brand Identity',
    item_count: 15,
    updated_at: new Date(Date.now() - 14400000).toISOString(),
    collaborators: [],
    preview_items: [
      { type: 'text', content: 'LOGO', color: '#000000', x: 20, y: 20, width: 25, height: 20 },
      { type: 'color', color: '#f59e0b', x: 55, y: 15, width: 25, height: 25 },
      { type: 'image', src: 'https://ui-avatars.com/api/?name=Brand&background=f59e0b&color=000&size=100', x: 25, y: 50, width: 35, height: 30 }
    ]
  }
]

// Computed
const filteredMoodboards = computed(() => {
  let result = [...moodboards.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(board =>
      board.title.toLowerCase().includes(query)
    )
  }

  // Sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'recent':
        return new Date(b.updated_at) - new Date(a.updated_at)
      case 'created':
        return new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at)
      default:
        return 0
    }
  })

  return result
})

// Methods
const loadMoodboards = async () => {
  try {
    const result = await apiService.getAll('moodboards')
    moodboards.value = result.data?.length > 0 ? result.data : mockMoodboards
  } catch (error) {
    console.error('Failed to load moodboards:', error)
    moodboards.value = mockMoodboards
  }
}

const createMoodboard = () => {
  const title = prompt('Enter moodboard title:')
  if (title) {
    const newMoodboard = {
      id: `mood-${Date.now()}`,
      title,
      item_count: 0,
      updated_at: new Date().toISOString(),
      collaborators: [],
      preview_items: []
    }
    moodboards.value.unshift(newMoodboard)
    showToast({ message: `Created moodboard: ${title}`, type: 'success' })
  }
}

const openMoodboard = (moodboard) => {
  showToast({ message: `Opening ${moodboard.title} (Canvas editor coming soon)`, type: 'info' })
}

const shareMoodboard = (moodboard) => {
  showToast({ message: `Sharing ${moodboard.title}`, type: 'info' })
}

const duplicateMoodboard = (moodboard) => {
  const newMoodboard = {
    ...moodboard,
    id: `mood-${Date.now()}`,
    title: `${moodboard.title} (Copy)`,
    updated_at: new Date().toISOString()
  }
  moodboards.value.unshift(newMoodboard)
  showToast({ message: `Duplicated ${moodboard.title}`, type: 'success' })
}

const formatDate = (isoString) => {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  loadMoodboards()
})
</script>

<style scoped>
.moodboards-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
  overflow: hidden;
}

/* Header styles - reusing patterns */
.view-header {
  position: relative;
  padding: 48px 48px 0;
  margin-bottom: 32px;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: radial-gradient(ellipse at top, rgba(245, 158, 11, 0.15) 0%, transparent 50%);
  pointer-events: none;
  animation: pulse 20s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.title-section {
  flex: 1;
}

.view-title {
  display: flex;
  align-items: baseline;
  gap: 16px;
  font-size: 48px;
  font-weight: 200;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.title-count {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
}

.view-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.create-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.create-btn.large {
  padding: 16px 32px;
  font-size: 16px;
}

.create-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.btn-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-btn:hover .btn-bg {
  width: 200%;
  height: 200%;
}

.create-btn svg {
  width: 20px;
  height: 20px;
}

/* Controls */
.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px;
  margin-bottom: 32px;
  gap: 32px;
}

.search-container {
  flex: 1;
  max-width: 400px;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 14px 48px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: white;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.custom-select {
  position: relative;
}

.filter-select {
  padding: 10px 40px 10px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  min-width: 140px;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Moodboards Container */
.moodboards-container {
  flex: 1;
  padding: 0 48px 48px;
  overflow-y: auto;
}

.moodboards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.moodboard-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.moodboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

.moodboard-preview {
  height: 200px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
  position: relative;
  overflow: hidden;
}

.preview-canvas {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-item {
  position: absolute;
  border-radius: 4px;
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.text-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  height: 100%;
}

.color-item {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.moodboard-details {
  padding: 20px;
}

.moodboard-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.moodboard-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 16px;
}

.collaborators {
  display: flex;
  align-items: center;
  gap: -8px;
}

.collaborator-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.5);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin-left: calc(var(--index) * -8px);
  position: relative;
  z-index: calc(10 - var(--index));
}

.collaborator-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collaborator-more {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  margin-left: -8px;
}

.moodboard-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.moodboard-card:hover .moodboard-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.4);
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.empty-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: 32px;
  color: rgba(255, 255, 255, 0.1);
}

.empty-title {
  font-size: 28px;
  font-weight: 300;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.empty-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 32px;
  max-width: 400px;
}

/* Responsive */
@media (max-width: 768px) {
  .view-header {
    padding: 32px 24px 0;
  }

  .header-content {
    flex-direction: column;
    gap: 24px;
  }

  .view-title {
    font-size: 36px;
  }

  .controls-section {
    flex-direction: column;
    padding: 0 24px;
    gap: 16px;
  }

  .search-container {
    max-width: none;
  }

  .moodboards-container {
    padding: 0 24px 24px;
  }

  .moodboards-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .moodboards-grid {
    grid-template-columns: 1fr;
  }
}
</style>