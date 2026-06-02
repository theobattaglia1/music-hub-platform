<!-- components/DragDropProvider.vue -->
<template>
  <div class="drag-drop-provider">
    <!-- Slot for content -->
    <slot
      :dragState="dragState"
      :startDrag="startDrag"
      :endDrag="endDrag"
      :setDropTarget="setDropTarget"
      :removeDropTarget="removeDropTarget"
    />

    <!-- Drag Preview -->
    <teleport to="body">
      <div
        v-if="dragState.isDragging"
        class="drag-preview"
        :style="dragPreviewStyle"
        ref="dragPreview"
      >
        <div class="drag-preview-content glassmorphic">
          <div class="drag-preview-icon">
            <svg v-if="dragState.type === 'songs'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            <svg v-else-if="dragState.type === 'playlist'" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>

          <div class="drag-preview-text">
            <div class="drag-count">{{ dragState.items.length }}</div>
            <div class="drag-label">{{ getDragLabel() }}</div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Drop Zones Overlay -->
    <teleport to="body">
      <div
        v-if="dragState.isDragging && dropZones.length > 0"
        class="drop-zones-overlay"
      >
        <div
          v-for="zone in visibleDropZones"
          :key="zone.id"
          class="drop-zone-indicator"
          :class="{
            'drop-zone-active': zone.id === activeDropZone,
            [`drop-zone-${zone.type}`]: true
          }"
          :style="zone.bounds"
        >
          <div class="drop-zone-content">
            <div class="drop-zone-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path :d="getDropZoneIcon(zone.type)"/>
              </svg>
            </div>
            <div class="drop-zone-text">{{ zone.label }}</div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Global Drop Overlay for File Uploads -->
    <div
      v-if="showFileDropOverlay"
      class="file-drop-overlay"
      @dragover.prevent
      @drop.prevent="handleFileDrop"
      @dragleave="handleFileDropLeave"
    >
      <div class="file-drop-content">
        <div class="file-drop-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        <h3>Drop files to upload</h3>
        <p>Release to add music files to your library</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, inject } from 'vue'

// Injected services
const showToast = inject('showToast', () => {})

// Emits
const emit = defineEmits(['drag-start', 'drag-end', 'drop', 'file-drop'])

// State
const dragState = reactive({
  isDragging: false,
  type: '', // 'songs', 'playlist', 'artist', 'files'
  items: [],
  sourceId: null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 }
})

const dropZones = ref([])
const activeDropZone = ref(null)
const showFileDropOverlay = ref(false)
const dragPreview = ref(null)

// Computed
const dragPreviewStyle = computed(() => ({
  left: `${dragState.currentPosition.x + 10}px`,
  top: `${dragState.currentPosition.y - 10}px`,
  pointerEvents: 'none',
  zIndex: 10000
}))

const visibleDropZones = computed(() => {
  return dropZones.value.filter(zone => {
    // Only show compatible drop zones
    if (dragState.type === 'songs') {
      return ['playlist', 'artist', 'folder'].includes(zone.type)
    }
    if (dragState.type === 'playlist') {
      return ['folder'].includes(zone.type)
    }
    return true
  })
})

// Methods
const startDrag = (items, type, sourceId, event) => {
  dragState.isDragging = true
  dragState.type = type
  dragState.items = Array.isArray(items) ? items : [items]
  dragState.sourceId = sourceId
  dragState.startPosition = { x: event.clientX, y: event.clientY }
  dragState.currentPosition = { x: event.clientX, y: event.clientY }

  // Set data for native drag and drop
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: dragState.type,
      items: dragState.items,
      sourceId: dragState.sourceId
    }))

    // Create custom drag image
    createDragImage(event)
  }

  // Highlight compatible drop zones
  highlightDropZones()

  emit('drag-start', {
    type: dragState.type,
    items: dragState.items,
    sourceId: dragState.sourceId
  })

  // Add global mouse listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const endDrag = () => {
  dragState.isDragging = false
  dragState.type = ''
  dragState.items = []
  dragState.sourceId = null
  activeDropZone.value = null

  // Clear drop zones
  dropZones.value = []

  emit('drag-end')

  // Remove global listeners
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const setDropTarget = (element, options) => {
  const bounds = element.getBoundingClientRect()
  const zone = {
    id: options.id,
    type: options.type,
    label: options.label,
    element: element,
    bounds: {
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`
    }
  }

  // Add or update drop zone
  const existingIndex = dropZones.value.findIndex(z => z.id === options.id)
  if (existingIndex >= 0) {
    dropZones.value[existingIndex] = zone
  } else {
    dropZones.value.push(zone)
  }

  // Add event listeners
  element.addEventListener('dragenter', (e) => handleDropZoneEnter(zone, e))
  element.addEventListener('dragleave', (e) => handleDropZoneLeave(zone, e))
  element.addEventListener('drop', (e) => handleDropZoneDrop(zone, e))
}

const removeDropTarget = (id) => {
  dropZones.value = dropZones.value.filter(zone => zone.id !== id)
}

const createDragImage = (event) => {
  const dragImage = document.createElement('div')
  dragImage.className = 'custom-drag-image'
  dragImage.innerHTML = `
    <div class="drag-count">${dragState.items.length}</div>
    <div class="drag-label">${getDragLabel()}</div>
  `

  // Style the drag image
  dragImage.style.position = 'absolute'
  dragImage.style.top = '-1000px'
  dragImage.style.left = '-1000px'

  document.body.appendChild(dragImage)

  // Set as drag image
  if (event.dataTransfer.setDragImage) {
    event.dataTransfer.setDragImage(dragImage, 0, 0)
  }

  // Clean up after drag
  setTimeout(() => {
    if (document.body.contains(dragImage)) {
      document.body.removeChild(dragImage)
    }
  }, 0)
}

const highlightDropZones = () => {
  // Add visual indicators for valid drop zones
  nextTick(() => {
    dropZones.value.forEach(zone => {
      if (zone.element) {
        zone.element.classList.add('drop-target-highlighted')
      }
    })
  })
}

const handleMouseMove = (event) => {
  if (!dragState.isDragging) return

  dragState.currentPosition = { x: event.clientX, y: event.clientY }

  // Check if over a drop zone
  const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY)
  const dropZone = findDropZoneForElement(elementUnderMouse)

  if (dropZone && dropZone.id !== activeDropZone.value) {
    activeDropZone.value = dropZone.id
  } else if (!dropZone && activeDropZone.value) {
    activeDropZone.value = null
  }
}

const handleMouseUp = (event) => {
  if (!dragState.isDragging) return

  // Check if dropped on a valid zone
  if (activeDropZone.value) {
    const zone = dropZones.value.find(z => z.id === activeDropZone.value)
    if (zone) {
      handleDrop(zone, event)
    }
  }

  endDrag()
}

const handleDropZoneEnter = (zone, event) => {
  event.preventDefault()
  activeDropZone.value = zone.id
  zone.element.classList.add('drop-zone-hover')
}

const handleDropZoneLeave = (zone, event) => {
  // Only remove hover if actually leaving the element
  if (!zone.element.contains(event.relatedTarget)) {
    zone.element.classList.remove('drop-zone-hover')
    if (activeDropZone.value === zone.id) {
      activeDropZone.value = null
    }
  }
}

const handleDropZoneDrop = (zone, event) => {
  event.preventDefault()
  event.stopPropagation()

  zone.element.classList.remove('drop-zone-hover')
  handleDrop(zone, event)
}

const handleDrop = (zone, event) => {
  let dropData = null

  // Try to get data from dataTransfer
  try {
    const jsonData = event.dataTransfer?.getData('application/json')
    if (jsonData) {
      dropData = JSON.parse(jsonData)
    }
  } catch (e) {
    console.warn('Failed to parse drop data:', e)
  }

  // Fallback to drag state
  if (!dropData && dragState.isDragging) {
    dropData = {
      type: dragState.type,
      items: dragState.items,
      sourceId: dragState.sourceId
    }
  }

  if (dropData) {
    emit('drop', {
      zone: zone,
      data: dropData,
      event: event
    })

    showToast({
      message: `Moved ${dropData.items.length} item${dropData.items.length > 1 ? 's' : ''} to ${zone.label}`,
      type: 'success'
    })
  }
}

const findDropZoneForElement = (element) => {
  if (!element) return null

  // Walk up the DOM tree to find a drop zone
  let current = element
  while (current && current !== document.body) {
    const zone = dropZones.value.find(z => z.element === current)
    if (zone) return zone
    current = current.parentElement
  }
  return null
}

const getDragLabel = () => {
  const count = dragState.items.length
  switch (dragState.type) {
    case 'songs':
      return count === 1 ? 'song' : 'songs'
    case 'playlist':
      return count === 1 ? 'playlist' : 'playlists'
    case 'artist':
      return count === 1 ? 'artist' : 'artists'
    case 'files':
      return count === 1 ? 'file' : 'files'
    default:
      return count === 1 ? 'item' : 'items'
  }
}

const getDropZoneIcon = (type) => {
  const icons = {
    playlist: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z',
    artist: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
    folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    queue: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z'
  }
  return icons[type] || icons.folder
}

// File drop handling
const handleFileDropEnter = (event) => {
  if (event.dataTransfer.types.includes('Files')) {
    showFileDropOverlay.value = true
  }
}

const handleFileDropLeave = (event) => {
  // Only hide if leaving the entire window
  if (!event.relatedTarget || event.relatedTarget === document.documentElement) {
    showFileDropOverlay.value = false
  }
}

const handleFileDrop = (event) => {
  event.preventDefault()
  showFileDropOverlay.value = false

  const files = Array.from(event.dataTransfer.files)
  if (files.length > 0) {
    emit('file-drop', files)
  }
}

// Reorder functionality
const startReorder = (items, container, onReorder) => {
  let draggedElement = null
  let placeholder = null
  let startIndex = -1

  const handleDragStart = (event, index) => {
    draggedElement = event.target
    startIndex = index

    // Create placeholder
    placeholder = document.createElement('div')
    placeholder.className = 'reorder-placeholder'
    placeholder.style.height = draggedElement.offsetHeight + 'px'

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', draggedElement.outerHTML)

    setTimeout(() => {
      draggedElement.style.opacity = '0.5'
    }, 0)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'

    const afterElement = getDragAfterElement(container, event.clientY)
    if (afterElement == null) {
      container.appendChild(placeholder)
    } else {
      container.insertBefore(placeholder, afterElement)
    }
  }

  const handleDragEnd = (event) => {
    event.target.style.opacity = ''

    // Calculate new index
    const placeholderIndex = Array.from(container.children).indexOf(placeholder)

    // Remove placeholder
    if (placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder)
    }

    // Call reorder callback if position changed
    if (placeholderIndex !== startIndex && placeholderIndex !== -1) {
      onReorder(startIndex, placeholderIndex)
    }

    // Reset
    draggedElement = null
    placeholder = null
    startIndex = -1
  }

  const getDragAfterElement = (container, y) => {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')]

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child }
      } else {
        return closest
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDragEnd
  }
}

// Global event listeners
onMounted(() => {
  // File drop listeners
  document.addEventListener('dragenter', handleFileDropEnter)
  document.addEventListener('dragleave', handleFileDropLeave)
  document.addEventListener('dragover', (e) => e.preventDefault())
  document.addEventListener('drop', (e) => e.preventDefault())
})

onUnmounted(() => {
  document.removeEventListener('dragenter', handleFileDropEnter)
  document.removeEventListener('dragleave', handleFileDropLeave)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

// Expose methods
defineExpose({
  startDrag,
  endDrag,
  setDropTarget,
  removeDropTarget,
  startReorder
})
</script>

<style scoped>
.drag-drop-provider {
  width: 100%;
  height: 100%;
}

.drag-preview {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
}

.drag-preview-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(78, 205, 196, 0.5);
}

.drag-preview-icon svg {
  width: 20px;
  height: 20px;
  color: #4ECDC4;
}

.drag-preview-text {
  display: flex;
  align-items: center;
  gap: 4px;
}

.drag-count {
  font-size: 18px;
  font-weight: 700;
  color: #4ECDC4;
}

.drag-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* Drop Zones */
.drop-zones-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.drop-zone-indicator {
  position: absolute;
  border: 2px dashed transparent;
  border-radius: 8px;
  transition: all 0.2s ease;
  pointer-events: none;
}

.drop-zone-indicator.drop-zone-active {
  border-color: #4ECDC4;
  background: rgba(78, 205, 196, 0.1);
}

.drop-zone-indicator.drop-zone-playlist {
  border-color: #1db954;
}

.drop-zone-indicator.drop-zone-artist {
  border-color: #e22856;
}

.drop-zone-indicator.drop-zone-folder {
  border-color: #4ecdc4;
}

.drop-zone-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.drop-zone-icon svg {
  width: 24px;
  height: 24px;
  color: #4ECDC4;
}

.drop-zone-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

/* File Drop Overlay */
.file-drop-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-drop-content {
  text-align: center;
  padding: 48px;
  border: 2px dashed #4ECDC4;
  border-radius: 16px;
  background: rgba(78, 205, 196, 0.1);
  max-width: 400px;
}

.file-drop-icon {
  margin-bottom: 24px;
}

.file-drop-icon svg {
  width: 64px;
  height: 64px;
  color: #4ECDC4;
}

.file-drop-content h3 {
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.file-drop-content p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
}

/* Reorder Placeholder */
.reorder-placeholder {
  background: rgba(78, 205, 196, 0.2);
  border: 2px dashed #4ECDC4;
  border-radius: 4px;
  margin: 2px 0;
  transition: all 0.2s ease;
}

/* Global Drag States */
:global(.drop-target-highlighted) {
  outline: 2px dashed rgba(78, 205, 196, 0.5);
  outline-offset: 2px;
  transition: outline 0.2s ease;
}

:global(.drop-zone-hover) {
  background: rgba(78, 205, 196, 0.1) !important;
  outline: 2px solid #4ECDC4;
  outline-offset: -2px;
}

:global(.dragging) {
  opacity: 0.5;
  transform: rotate(5deg);
  transition: all 0.2s ease;
}

/* Custom Drag Image Styles */
:global(.custom-drag-image) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(78, 205, 196, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:global(.custom-drag-image .drag-count) {
  font-size: 18px;
  font-weight: 700;
  color: #4ECDC4;
}

:global(.custom-drag-image .drag-label) {
  color: rgba(255, 255, 255, 0.8);
}
</style>