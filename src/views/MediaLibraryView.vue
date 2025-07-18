<template>
  <div class="media-library-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Media Library</span>
            <span class="title-count">{{ totalFiles }}</span>
          </h1>
          <p class="view-subtitle">Manage your audio, video, and image files</p>
        </div>
        <button class="upload-btn" @click="triggerFileUpload">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <span>Upload Files</span>
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">{{ audioFiles.length }}</div>
          <div class="stat-label">Audio Files</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ videoFiles.length }}</div>
          <div class="stat-label">Video Files</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ imageFiles.length }}</div>
          <div class="stat-label">Images</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ formatFileSize(totalSize) }}</div>
          <div class="stat-label">Total Size</div>
        </div>
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
            placeholder="Search files by name or type..."
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <div class="custom-select">
          <select v-model="filterType" class="filter-select">
            <option value="">All Types</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="image">Images</option>
          </select>
        </div>

        <div class="custom-select">
          <select v-model="sortBy" class="filter-select">
            <option value="name">Name</option>
            <option value="date">Date Added</option>
            <option value="size">File Size</option>
            <option value="type">File Type</option>
          </select>
        </div>

        <div class="view-toggles">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            class="view-toggle"
            :class="{ active: viewMode === mode.value }"
            @click="viewMode = mode.value"
            :title="mode.label"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path :d="mode.icon" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-grid">
        <div v-for="i in 8" :key="i" class="skeleton-file"></div>
      </div>
    </div>

    <!-- File Grid -->
    <div v-else-if="filteredFiles.length > 0" :class="['files-container', viewMode]">
      <div class="files-grid">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="file-card"
          @click="handleFileSelect(file)"
          @contextmenu.prevent="handleFileMenu(file, $event)"
        >
          <div class="file-preview">
            <div v-if="file.type === 'audio'" class="file-icon audio">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div v-else-if="file.type === 'video'" class="file-icon video">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div v-else-if="file.type === 'image'" class="file-thumbnail">
              <img :src="file.thumbnail || file.url" :alt="file.name" />
            </div>
            <div v-else class="file-icon document">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>
          </div>

          <div class="file-details">
            <h3 class="file-name">{{ file.name }}</h3>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-date">{{ formatDate(file.created_at) }}</span>
            </div>
          </div>

          <div class="file-actions">
            <button class="action-btn" @click.stop="handleDownload(file)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
            <button class="action-btn danger" @click.stop="handleDelete(file)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
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
          <circle cx="100" cy="100" r="80" stroke="currentColor" stroke-width="2" opacity="0.1"/>
          <path d="M70 70h60v60H70z" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"/>
          <path d="M80 110l20-20 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
        </svg>
      </div>
      <h3 class="empty-title">{{ searchQuery ? 'No files found' : 'Upload your first media file' }}</h3>
      <p class="empty-text">
        {{ searchQuery ? 'Try adjusting your search or filters' : 'Drag and drop files here or use the upload button' }}
      </p>
      <button v-if="!searchQuery" class="upload-btn large" @click="triggerFileUpload">
        <div class="btn-bg"></div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <span>Upload Your First File</span>
      </button>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="audio/*,video/*,image/*"
      class="hidden-input"
      @change="handleFileUpload"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { apiService } from '@/shared/services/api'

const showToast = inject('showToast', () => {})

// State
const loading = ref(true)
const files = ref([])
const searchQuery = ref('')
const filterType = ref('')
const sortBy = ref('name')
const viewMode = ref('grid')
const fileInput = ref(null)

// View modes
const viewModes = [
  { value: 'grid', label: 'Grid View', icon: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z' },
  { value: 'list', label: 'List View', icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' }
]

// Computed
const filteredFiles = computed(() => {
  let result = [...files.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(file =>
      file.name.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
    )
  }

  // Type filter
  if (filterType.value) {
    result = result.filter(file => file.type === filterType.value)
  }

  // Sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'size':
        return b.size - a.size
      case 'type':
        return a.type.localeCompare(b.type)
      default:
        return 0
    }
  })

  return result
})

const audioFiles = computed(() => files.value.filter(f => f.type === 'audio'))
const videoFiles = computed(() => files.value.filter(f => f.type === 'video'))
const imageFiles = computed(() => files.value.filter(f => f.type === 'image'))
const totalFiles = computed(() => files.value.length)
const totalSize = computed(() => files.value.reduce((sum, file) => sum + file.size, 0))

// Methods
const loadFiles = async () => {
  try {
    loading.value = true
    const result = await apiService.getAll('media_files')
    files.value = result.data || []
    
    // Add some mock files for demo
    if (files.value.length === 0) {
      files.value = [
        {
          id: 'demo-1',
          name: 'Demo Track.mp3',
          type: 'audio',
          size: 4500000,
          url: 'https://mock-storage.example.com/demo-track.mp3',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'demo-2',
          name: 'Artist Photo.jpg',
          type: 'image',
          size: 1200000,
          url: 'https://ui-avatars.com/api/?name=Demo+Artist&background=6366f1&color=fff&size=400',
          thumbnail: 'https://ui-avatars.com/api/?name=Demo+Artist&background=6366f1&color=fff&size=200',
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'demo-3',
          name: 'Music Video.mp4',
          type: 'video',
          size: 25000000,
          url: 'https://mock-storage.example.com/music-video.mp4',
          created_at: new Date(Date.now() - 259200000).toISOString()
        }
      ]
    }
  } catch (error) {
    console.error('Failed to load files:', error)
    showToast({ message: 'Failed to load media files', type: 'error' })
  } finally {
    loading.value = false
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event) => {
  const uploadedFiles = event.target.files
  if (!uploadedFiles.length) return

  try {
    for (const file of uploadedFiles) {
      // Mock upload
      const uploadResult = await apiService.uploadFile('media', file)
      
      const newFile = {
        id: `uploaded-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: file.name,
        type: getFileType(file.type),
        size: file.size,
        url: uploadResult.publicUrl,
        created_at: new Date().toISOString()
      }

      files.value.unshift(newFile)
    }

    showToast({ 
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`, 
      type: 'success' 
    })
    
    // Clear input
    event.target.value = ''
  } catch (error) {
    console.error('Upload failed:', error)
    showToast({ message: 'Upload failed', type: 'error' })
  }
}

const getFileType = (mimeType) => {
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('image/')) return 'image'
  return 'document'
}

const handleFileSelect = (file) => {
  showToast({ message: `Selected: ${file.name}`, type: 'info' })
}

const handleFileMenu = (file, event) => {
  // Context menu functionality would go here
  console.log('File menu for:', file.name)
}

const handleDownload = (file) => {
  showToast({ message: `Downloading ${file.name}`, type: 'info' })
  // In a real app, this would trigger an actual download
}

const handleDelete = async (file) => {
  if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
    try {
      await apiService.delete('media_files', file.id)
      files.value = files.value.filter(f => f.id !== file.id)
      showToast({ message: 'File deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Delete failed:', error)
      showToast({ message: 'Failed to delete file', type: 'error' })
    }
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString()
}

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.media-library-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
  overflow: hidden;
}

/* Header styles - reusing patterns from ArtistsView */
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
  background: radial-gradient(ellipse at top, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
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

.upload-btn, .upload-btn.large {
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

.upload-btn.large {
  padding: 16px 32px;
  font-size: 16px;
}

.upload-btn:hover {
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

.upload-btn:hover .btn-bg {
  width: 200%;
  height: 200%;
}

.upload-btn svg {
  width: 20px;
  height: 20px;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
}

/* Controls - reusing patterns */
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
  max-width: 500px;
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

.view-toggles {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 2px;
}

.view-toggle {
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.view-toggle:hover {
  color: rgba(255, 255, 255, 0.8);
}

.view-toggle.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.view-toggle svg {
  width: 18px;
  height: 18px;
}

/* Loading State */
.loading-state {
  flex: 1;
  padding: 0 48px 48px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.skeleton-file {
  height: 320px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  animation: skeleton 1.5s ease-in-out infinite alternate;
}

@keyframes skeleton {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Files Container */
.files-container {
  flex: 1;
  padding: 0 48px 48px;
  overflow-y: auto;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.files-container.list .files-grid {
  grid-template-columns: 1fr;
  gap: 16px;
}

/* File Card */
.file-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.file-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

.file-preview {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  position: relative;
}

.files-container.list .file-preview {
  height: 80px;
  width: 80px;
  flex-shrink: 0;
}

.file-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.file-icon.audio {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.file-icon.video {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.file-icon.document {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.file-icon svg {
  width: 32px;
  height: 32px;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.file-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-details {
  padding: 20px;
}

.files-container.list .file-details {
  flex: 1;
  padding: 16px;
}

.file-name {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.file-actions {
  display: flex;
  gap: 8px;
  padding: 0 20px 20px;
}

.files-container.list .file-actions {
  padding: 16px;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.action-btn svg {
  width: 18px;
  height: 18px;
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

.hidden-input {
  display: none;
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

  .stats-bar {
    gap: 24px;
  }

  .controls-section {
    flex-direction: column;
    padding: 0 24px;
    gap: 16px;
  }

  .search-container {
    max-width: none;
  }

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .files-container {
    padding: 0 24px 24px;
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .view-title {
    font-size: 28px;
  }

  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stat-divider {
    display: none;
  }

  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style>
