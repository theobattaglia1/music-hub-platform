<template>
  <div class="files-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Files</span>
            <span class="title-count">{{ totalFiles }}</span>
          </h1>
          <p class="view-subtitle">Organize and manage all your project files</p>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="createFolder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            <span>New Folder</span>
          </button>
          <button class="action-btn primary" @click="triggerFileUpload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>Upload</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div class="breadcrumb-section">
      <nav class="breadcrumb">
        <button
          v-for="(crumb, index) in breadcrumbs"
          :key="index"
          class="breadcrumb-item"
          :class="{ active: index === breadcrumbs.length - 1 }"
          @click="navigateToFolder(crumb.path)"
        >
          <svg v-if="index === 0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span>{{ crumb.name }}</span>
          <svg v-if="index < breadcrumbs.length - 1" viewBox="0 0 24 24" fill="currentColor" class="breadcrumb-arrow">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </nav>
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
            placeholder="Search files and folders..."
            class="search-input"
          />
        </div>
      </div>

      <div class="filter-group">
        <div class="custom-select">
          <select v-model="sortBy" class="filter-select">
            <option value="name">Name</option>
            <option value="date">Date Modified</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
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

    <!-- File Explorer -->
    <div class="file-explorer">
      <div v-if="loading" class="loading-state">
        <div class="skeleton-items">
          <div v-for="i in 6" :key="i" class="skeleton-item"></div>
        </div>
      </div>

      <div v-else-if="filteredItems.length > 0" :class="['items-container', viewMode]">
        <div class="items-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="file-item"
            :class="{ folder: item.type === 'folder' }"
            @click="handleItemClick(item)"
            @contextmenu.prevent="handleItemMenu(item, $event)"
          >
            <div class="item-icon">
              <svg v-if="item.type === 'folder'" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
              </svg>
              <svg v-else-if="item.type === 'audio'" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <svg v-else-if="item.type === 'video'" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else-if="item.type === 'image'" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </div>

            <div class="item-details">
              <h3 class="item-name">{{ item.name }}</h3>
              <div class="item-meta">
                <span v-if="item.type !== 'folder'" class="item-size">{{ formatFileSize(item.size) }}</span>
                <span class="item-date">{{ formatDate(item.modified_at) }}</span>
              </div>
            </div>

            <div class="item-actions">
              <button class="action-btn-sm" @click.stop="downloadItem(item)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
              </button>
              <button class="action-btn-sm" @click.stop="handleItemMenu(item, $event)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 120h100v60H50z" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"/>
            <path d="M40 110h120v70H40z" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
            <path d="M60 100l15-15h45l15 15v50H60z" stroke="currentColor" stroke-width="2" fill="none" opacity="0.4"/>
          </svg>
        </div>
        <h3 class="empty-title">{{ searchQuery ? 'No files found' : 'This folder is empty' }}</h3>
        <p class="empty-text">
          {{ searchQuery ? 'Try adjusting your search terms' : 'Upload files or create folders to get started' }}
        </p>
        <div v-if="!searchQuery" class="empty-actions">
          <button class="action-btn" @click="createFolder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
            <span>Create Folder</span>
          </button>
          <button class="action-btn primary" @click="triggerFileUpload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>Upload Files</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      multiple
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
const items = ref([])
const currentPath = ref('/')
const searchQuery = ref('')
const sortBy = ref('name')
const viewMode = ref('grid')
const fileInput = ref(null)

// View modes
const viewModes = [
  { value: 'grid', label: 'Grid View', icon: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z' },
  { value: 'list', label: 'List View', icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' }
]

// Computed
const breadcrumbs = computed(() => {
  const paths = currentPath.value.split('/').filter(Boolean)
  const crumbs = [{ name: 'Home', path: '/' }]
  
  let accumPath = ''
  paths.forEach(path => {
    accumPath += `/${path}`
    crumbs.push({ name: path, path: accumPath })
  })
  
  return crumbs
})

const filteredItems = computed(() => {
  let result = [...items.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }

  // Sorting
  result.sort((a, b) => {
    // Always put folders first
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1

    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(b.modified_at) - new Date(a.modified_at)
      case 'size':
        return (b.size || 0) - (a.size || 0)
      case 'type':
        return a.type.localeCompare(b.type)
      default:
        return 0
    }
  })

  return result
})

const totalFiles = computed(() => {
  return items.value.filter(item => item.type !== 'folder').length
})

// Methods
const loadItems = async (path = '/') => {
  try {
    loading.value = true
    
    // Mock file structure
    const mockItems = [
      {
        id: 'folder-1',
        name: 'Audio Files',
        type: 'folder',
        path: '/audio-files',
        modified_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'folder-2',
        name: 'Images',
        type: 'folder',
        path: '/images',
        modified_at: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: 'folder-3',
        name: 'Videos',
        type: 'folder',
        path: '/videos',
        modified_at: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 'file-1',
        name: 'Project Notes.txt',
        type: 'document',
        size: 1024,
        path: '/project-notes.txt',
        modified_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'file-2',
        name: 'Demo Track.mp3',
        type: 'audio',
        size: 4500000,
        path: '/demo-track.mp3',
        modified_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'file-3',
        name: 'Cover Art.jpg',
        type: 'image',
        size: 1200000,
        path: '/cover-art.jpg',
        modified_at: new Date(Date.now() - 14400000).toISOString()
      }
    ]

    items.value = mockItems
  } catch (error) {
    console.error('Failed to load items:', error)
    showToast({ message: 'Failed to load files', type: 'error' })
  } finally {
    loading.value = false
  }
}

const handleItemClick = (item) => {
  if (item.type === 'folder') {
    navigateToFolder(item.path)
  } else {
    showToast({ message: `Opening ${item.name}`, type: 'info' })
  }
}

const navigateToFolder = (path) => {
  currentPath.value = path
  loadItems(path)
}

const handleItemMenu = (item, event) => {
  // Context menu functionality would go here
  showToast({ message: `Menu for ${item.name}`, type: 'info' })
}

const createFolder = () => {
  const folderName = prompt('Enter folder name:')
  if (folderName) {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      type: 'folder',
      path: `${currentPath.value}/${folderName}`,
      modified_at: new Date().toISOString()
    }
    items.value.unshift(newFolder)
    showToast({ message: `Created folder: ${folderName}`, type: 'success' })
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
      const uploadResult = await apiService.uploadFile('files', file)
      
      const newFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: file.name,
        type: getFileType(file.type),
        size: file.size,
        path: `${currentPath.value}/${file.name}`,
        modified_at: new Date().toISOString()
      }

      items.value.unshift(newFile)
    }

    showToast({ 
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`, 
      type: 'success' 
    })
    
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

const downloadItem = (item) => {
  if (item.type === 'folder') {
    showToast({ message: 'Folder download coming soon', type: 'info' })
  } else {
    showToast({ message: `Downloading ${item.name}`, type: 'info' })
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
  loadItems()
})
</script>

<style scoped>
.files-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
  color: white;
  overflow: hidden;
}

/* Header styles */
.view-header {
  position: relative;
  padding: 48px 48px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  pointer-events: none;
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

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.4);
}

.action-btn.primary {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.action-btn.primary:hover {
  background: rgba(59, 130, 246, 0.2);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

/* Breadcrumb */
.breadcrumb-section {
  padding: 0 48px 24px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.breadcrumb-item:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.breadcrumb-item.active {
  color: white;
  cursor: default;
}

.breadcrumb-item svg {
  width: 16px;
  height: 16px;
}

.breadcrumb-arrow {
  width: 12px;
  height: 12px;
  color: rgba(255, 255, 255, 0.3);
}

/* Controls */
.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 48px 24px;
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
  padding: 12px 16px 12px 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
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
  padding: 10px 32px 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  min-width: 120px;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.05);
}

.view-toggles {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 2px;
}

.view-toggle {
  width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
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
  width: 16px;
  height: 16px;
}

/* File Explorer */
.file-explorer {
  flex: 1;
  padding: 0 48px 48px;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.skeleton-item {
  height: 60px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  animation: skeleton 1.5s ease-in-out infinite alternate;
}

@keyframes skeleton {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

.items-container {
  width: 100%;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.items-container.list .items-grid {
  grid-template-columns: 1fr;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.file-item.folder {
  border-left: 3px solid #3b82f6;
}

.item-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-shrink: 0;
}

.item-icon svg {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.7);
}

.file-item.folder .item-icon {
  background: rgba(59, 130, 246, 0.1);
}

.file-item.folder .item-icon svg {
  color: #3b82f6;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.file-item:hover .item-actions {
  opacity: 1;
}

.action-btn-sm {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn-sm:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn-sm svg {
  width: 14px;
  height: 14px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
}

.empty-illustration {
  width: 160px;
  height: 160px;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.1);
}

.empty-title {
  font-size: 24px;
  font-weight: 300;
  margin: 0 0 8px;
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 24px;
  max-width: 320px;
}

.empty-actions {
  display: flex;
  gap: 12px;
}

.hidden-input {
  display: none;
}

/* Responsive */
@media (max-width: 768px) {
  .view-header {
    padding: 32px 24px 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 20px;
  }

  .view-title {
    font-size: 32px;
  }

  .header-actions {
    align-self: stretch;
  }

  .breadcrumb-section {
    padding: 0 24px 16px;
  }

  .controls-section {
    flex-direction: column;
    padding: 0 24px 16px;
    gap: 16px;
  }

  .search-container {
    max-width: none;
  }

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .file-explorer {
    padding: 0 24px 24px;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .empty-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>