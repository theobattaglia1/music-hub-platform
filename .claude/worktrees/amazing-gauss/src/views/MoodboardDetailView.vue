<template>
  <div class="mb-detail" @keydown.esc="onEsc" tabindex="-1">
    <!-- Top Bar -->
    <div class="mb-topbar">
      <button class="back-btn" @click="router.push('/moodboards')">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        <span>Moodboards</span>
      </button>

      <div class="topbar-center">
        <input
          v-if="board"
          v-model="boardTitle"
          class="title-input"
          @blur="saveTitle"
          @keydown.enter="$event.target.blur()"
          placeholder="Untitled Moodboard"
        />
        <span v-else class="title-placeholder">Loading…</span>
      </div>

      <div class="topbar-actions">
        <span class="save-status" :class="saveStatusClass">{{ saveStatusText }}</span>
        <button class="toolbar-btn" @click="clearSelection" title="Deselect">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
        <button v-if="selectedId" class="toolbar-btn danger" @click="deleteSelected" title="Delete selected">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>

    <!-- Main Area -->
    <div class="mb-main" v-if="board">
      <!-- Left Toolbar -->
      <div class="mb-sidebar">
        <div class="tool-section">
          <div class="tool-label">Add Image</div>
          <div class="url-input-wrap">
            <input v-model="imageUrl" class="tool-input" placeholder="Paste image URL…" @keydown.enter="addImageFromUrl" />
            <button class="tool-action-btn" @click="addImageFromUrl" :disabled="!imageUrl.trim()">Add</button>
          </div>
          <div class="or-divider"><span>or</span></div>
          <label class="file-drop-zone" @dragover.prevent @drop.prevent="onFileDrop">
            <input type="file" accept="image/*" multiple @change="onFileInput" class="sr-only" />
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            <span>Drop or click to upload</span>
          </label>
        </div>

        <div class="tool-section">
          <div class="tool-label">Add Color Block</div>
          <div class="color-row">
            <input type="color" v-model="newColor" class="color-picker" />
            <button class="tool-action-btn" @click="addColorBlock">Add Block</button>
          </div>
          <div class="palette-swatches">
            <button
              v-for="swatch in paletteSwatch"
              :key="swatch"
              class="swatch"
              :style="{ background: swatch }"
              @click="newColor = swatch"
              :title="swatch"
            ></button>
          </div>
        </div>

        <div class="tool-section">
          <div class="tool-label">Add Text</div>
          <textarea v-model="newText" class="tool-input textarea" placeholder="Type something…" rows="3"></textarea>
          <div class="color-row">
            <input type="color" v-model="newTextColor" class="color-picker" />
            <button class="tool-action-btn" @click="addTextBlock" :disabled="!newText.trim()">Add Text</button>
          </div>
        </div>

        <div class="tool-section" v-if="selectedItem">
          <div class="tool-label">Selected</div>
          <div class="selected-info">
            <span class="sel-type">{{ selectedItem.type }}</span>
            <template v-if="selectedItem.type === 'color'">
              <input type="color" v-model="selectedItem.color" @input="markDirty" class="color-picker" />
            </template>
            <template v-if="selectedItem.type === 'text'">
              <input type="color" v-model="selectedItem.color" @input="markDirty" class="color-picker" title="Text color" />
              <input v-model.number="selectedItem.fontSize" type="number" min="10" max="200" class="tool-input" style="width:70px" @input="markDirty" />
            </template>
          </div>
          <div class="action-row">
            <button class="tool-action-btn" @click="bringForward">↑ Forward</button>
            <button class="tool-action-btn" @click="sendBackward">↓ Back</button>
          </div>
          <button class="tool-action-btn danger full-width" @click="deleteSelected">Delete</button>
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="mb-canvas-wrap" ref="canvasWrapRef" @click.self="clearSelection">
        <div
          class="mb-canvas"
          ref="canvasRef"
          :style="{ width: CANVAS_W + 'px', height: CANVAS_H + 'px' }"
          @click.self="clearSelection"
          @dragover.prevent
          @drop.prevent="onCanvasDrop"
          @contextmenu.prevent="onCanvasContextMenu"
        >
          <!-- Items -->
          <div
            v-for="item in sortedItems"
            :key="item.id"
            class="mb-item"
            :class="[`type-${item.type}`, { selected: selectedId === item.id }]"
            :style="{
              left: item.x + 'px',
              top: item.y + 'px',
              width: item.w + 'px',
              height: item.h + 'px',
              zIndex: item.z,
              background: item.type === 'color' ? item.color : undefined
            }"
            @mousedown.left.stop="startDrag(item, $event)"
            @click.stop="selectItem(item.id)"
            @contextmenu.stop.prevent="onItemContextMenu(item, $event)"
          >
            <img v-if="item.type === 'image'" :src="item.src" :alt="item.alt || ''" draggable="false" />
            <textarea
              v-else-if="item.type === 'text'"
              v-model="item.content"
              class="text-content"
              :style="{ color: item.color, fontSize: (item.fontSize || 24) + 'px' }"
              @input="markDirty"
              @mousedown.stop
            ></textarea>

            <!-- Resize handle SE corner -->
            <div
              class="resize-handle"
              @mousedown.stop.left="startResize(item, $event)"
              title="Resize"
            ></div>

            <!-- Delete button (shows on hover/select) -->
            <button class="item-delete-btn" @click.stop="deleteItem(item.id)" title="Delete">×</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-else-if="notFound" class="not-found">
      <p>Moodboard not found.</p>
      <button @click="router.push('/moodboards')">← Back to Moodboards</button>
    </div>
    <div v-else class="loading-screen">Loading…</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMoodboardStore } from '@/stores/moodboards'

const route = useRoute()
const router = useRouter()
const store = useMoodboardStore()
const showContextMenu = inject('showContextMenu', () => {})
const showToast = inject('showToast', () => {})

// Canvas size
const CANVAS_W = 1400
const CANVAS_H = 900

// Refs
const canvasRef = ref(null)
const canvasWrapRef = ref(null)
const board = ref(null)
const notFound = ref(false)
const boardTitle = ref('')
const selectedId = ref(null)
const dirty = ref(false)
const saveTimer = ref(null)

// Toolbar state
const imageUrl = ref('')
const newColor = ref('#a855f7')
const newText = ref('')
const newTextColor = ref('#ffffff')

const paletteSwatch = ['#a855f7', '#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#1f2937', '#111827', '#ffffff']

// Computed
const sortedItems = computed(() => {
  if (!board.value?.items) return []
  return [...board.value.items].sort((a, b) => (a.z || 0) - (b.z || 0))
})

const selectedItem = computed(() => {
  if (!selectedId.value || !board.value?.items) return null
  return board.value.items.find(it => it.id === selectedId.value) || null
})

const saveStatusText = computed(() => {
  if (dirty.value) return 'Unsaved changes'
  return 'Saved'
})
const saveStatusClass = computed(() => dirty.value ? 'unsaved' : 'saved')

// Init
onMounted(() => {
  const id = route.params.id
  const found = store.getBoard(id)
  if (found) {
    board.value = JSON.parse(JSON.stringify(found)) // local working copy
    boardTitle.value = found.title
  } else {
    notFound.value = true
  }
})

onUnmounted(() => {
  if (dirty.value) persistSave()
  if (saveTimer.value) clearTimeout(saveTimer.value)
})

// Title save
const saveTitle = () => {
  if (!board.value || !boardTitle.value.trim()) return
  store.renameBoard(board.value.id, boardTitle.value)
  board.value.title = boardTitle.value
}

// Item management
const selectItem = (id) => { selectedId.value = id }
const clearSelection = () => { selectedId.value = null }

const markDirty = () => {
  dirty.value = true
  if (saveTimer.value) clearTimeout(saveTimer.value)
  saveTimer.value = setTimeout(persistSave, 1500)
}

const persistSave = () => {
  if (!board.value) return
  store.updateItems(board.value.id, board.value.items)
  dirty.value = false
}

const addItem = (itemData) => {
  if (!board.value) return
  if (!board.value.items) board.value.items = []
  const item = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    z: board.value.items.length + 1,
    ...itemData
  }
  board.value.items.push(item)
  selectedId.value = item.id
  markDirty()
  return item
}

const deleteItem = (id) => {
  if (!board.value?.items) return
  board.value.items = board.value.items.filter(it => it.id !== id)
  if (selectedId.value === id) selectedId.value = null
  markDirty()
  showToast({ message: 'Item removed', type: 'info' })
}

const deleteSelected = () => {
  if (selectedId.value) deleteItem(selectedId.value)
}

const bringForward = () => {
  if (!selectedItem.value) return
  selectedItem.value.z = (selectedItem.value.z || 1) + 1
  markDirty()
}

const sendBackward = () => {
  if (!selectedItem.value) return
  selectedItem.value.z = Math.max(0, (selectedItem.value.z || 1) - 1)
  markDirty()
}

// Add helpers
const addImageFromUrl = () => {
  if (!imageUrl.value.trim()) return
  addItem({ type: 'image', src: imageUrl.value.trim(), alt: '', x: 80, y: 80, w: 320, h: 220 })
  imageUrl.value = ''
  showToast({ message: 'Image added', type: 'success' })
}

const addColorBlock = () => {
  addItem({ type: 'color', color: newColor.value, x: 80, y: 80, w: 200, h: 200 })
  showToast({ message: 'Color block added', type: 'success' })
}

const addTextBlock = () => {
  if (!newText.value.trim()) return
  addItem({ type: 'text', content: newText.value.trim(), color: newTextColor.value, fontSize: 28, x: 80, y: 80, w: 320, h: 120 })
  newText.value = ''
  showToast({ message: 'Text added', type: 'success' })
}

// File handling
const processFiles = (files) => {
  [...files].filter(f => f.type.startsWith('image/')).forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      addItem({ type: 'image', src: e.target.result, alt: file.name, x: 80 + Math.random()*200, y: 80 + Math.random()*100, w: 320, h: 220 })
    }
    reader.readAsDataURL(file)
  })
}

const onFileDrop = (e) => processFiles(e.dataTransfer?.files || [])
const onFileInput = (e) => processFiles(e.target.files || [])
const onCanvasDrop = (e) => processFiles(e.dataTransfer?.files || [])

// Drag to move
let dragState = null
const startDrag = (item, e) => {
  e.preventDefault()
  selectItem(item.id)
  const startX = e.clientX - item.x
  const startY = e.clientY - item.y

  const onMove = (me) => {
    item.x = Math.max(0, Math.min(CANVAS_W - item.w, me.clientX - startX))
    item.y = Math.max(0, Math.min(CANVAS_H - item.h, me.clientY - startY))
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    markDirty()
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// Resize handle SE
const startResize = (item, e) => {
  e.preventDefault()
  e.stopPropagation()
  const startX = e.clientX
  const startY = e.clientY
  const startW = item.w
  const startH = item.h

  const onMove = (me) => {
    item.w = Math.max(80, startW + me.clientX - startX)
    item.h = Math.max(40, startH + me.clientY - startY)
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    markDirty()
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// Context menus
const onItemContextMenu = (item, e) => {
  selectItem(item.id)
  const menuItems = [
    { label: 'Bring Forward', action: () => { bringForward() } },
    { label: 'Send Backward', action: () => { sendBackward() } },
    { divider: true },
    { label: 'Duplicate', action: () => {
      const copy = { ...JSON.parse(JSON.stringify(item)), id: `item-${Date.now()}`, x: item.x + 20, y: item.y + 20, z: (item.z || 1) + 1 }
      if (!board.value.items) board.value.items = []
      board.value.items.push(copy)
      selectedId.value = copy.id
      markDirty()
    }},
    { divider: true },
    { label: 'Delete', danger: true, action: () => deleteItem(item.id) }
  ]
  showContextMenu(e, menuItems, 'custom')
}

const onCanvasContextMenu = (e) => {
  const menuItems = [
    { label: 'Add Color Block', action: addColorBlock },
    { label: 'Add Text', action: () => {
      const t = prompt('Enter text:')
      if (t) {
        const rect = canvasRef.value?.getBoundingClientRect()
        const x = rect ? e.clientX - rect.left : 80
        const y = rect ? e.clientY - rect.top : 80
        addItem({ type: 'text', content: t, color: newTextColor.value, fontSize: 28, x: Math.max(0, x - 100), y: Math.max(0, y - 30), w: 320, h: 120 })
      }
    }},
    { divider: true },
    { label: 'Select All', action: () => { /* could implement multi-select */ showToast({ message: 'Single selection mode', type: 'info' }) } },
    { label: 'Clear Canvas', danger: true, action: () => {
      if (confirm('Remove all items from this moodboard?')) {
        board.value.items = []
        selectedId.value = null
        markDirty()
      }
    }}
  ]
  showContextMenu(e, menuItems, 'custom')
}

// Keyboard
const onEsc = () => { clearSelection() }

// Watch for route change (leaving page)
watch(() => route.path, (newPath) => {
  if (!newPath.includes(route.params.id) && dirty.value) {
    persistSave()
  }
})
</script>

<style scoped>
.mb-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
  outline: none;
}

/* Top Bar */
.mb-topbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  height: 52px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--motion-fast);
  white-space: nowrap;
}
.back-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }
.back-btn svg { width: 16px; height: 16px; }

.topbar-center { flex: 1; display: flex; justify-content: center; }

.title-input {
  background: none;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--color-text);
  font-size: 16px;
  font-weight: var(--weight-medium);
  text-align: center;
  padding: 4px 8px;
  max-width: 360px;
  width: 100%;
  transition: border-color var(--motion-fast);
}
.title-input:focus { outline: none; border-bottom-color: var(--color-accent); }

.topbar-actions { display: flex; align-items: center; gap: var(--space-2); }

.save-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 100px;
  font-weight: var(--weight-medium);
}
.save-status.saved { color: var(--color-text-tertiary); }
.save-status.unsaved { color: var(--color-accent); background: var(--color-accent-subtle); }

.toolbar-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text-secondary);
  cursor: pointer; transition: all var(--motion-fast);
}
.toolbar-btn svg { width: 16px; height: 16px; }
.toolbar-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }
.toolbar-btn.danger:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; color: #ef4444; }

/* Main Layout */
.mb-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left Sidebar */
.mb-sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.tool-section { display: flex; flex-direction: column; gap: var(--space-2); }

.tool-label {
  font-size: 10px;
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
}

.tool-input {
  width: 100%;
  padding: 7px 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 13px;
  box-sizing: border-box;
}
.tool-input:focus { outline: none; border-color: var(--color-accent); }
.tool-input.textarea { resize: vertical; min-height: 60px; font-family: inherit; }

.url-input-wrap { display: flex; gap: var(--space-2); }
.url-input-wrap .tool-input { flex: 1; }

.or-divider {
  display: flex; align-items: center; gap: var(--space-2);
  font-size: 11px; color: var(--color-text-tertiary);
}
.or-divider::before, .or-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--color-border);
}

.file-drop-zone {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px; color: var(--color-text-tertiary);
  text-align: center;
  transition: all var(--motion-fast);
}
.file-drop-zone:hover { border-color: var(--color-accent); color: var(--color-accent); }
.file-drop-zone svg { width: 20px; height: 20px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

.color-row { display: flex; align-items: center; gap: var(--space-2); }
.color-picker { width: 36px; height: 32px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; padding: 2px; background: none; }

.palette-swatches { display: flex; flex-wrap: wrap; gap: 6px; }
.swatch { width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--color-border); cursor: pointer; transition: transform var(--motion-fast); }
.swatch:hover { transform: scale(1.2); }

.tool-action-btn {
  padding: 6px 12px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 12px;
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: all var(--motion-fast);
  white-space: nowrap;
}
.tool-action-btn:hover:not(:disabled) { background: var(--color-border); }
.tool-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tool-action-btn.danger { color: #ef4444; }
.tool-action-btn.danger:hover { background: rgba(239,68,68,0.1); border-color: #ef4444; }
.tool-action-btn.full-width { width: 100%; justify-content: center; }

.selected-info { display: flex; align-items: center; gap: var(--space-2); }
.sel-type { font-size: 11px; color: var(--color-text-tertiary); text-transform: uppercase; }
.action-row { display: flex; gap: var(--space-2); }
.action-row .tool-action-btn { flex: 1; text-align: center; }

/* Canvas Area */
.mb-canvas-wrap {
  flex: 1;
  overflow: auto;
  background: var(--color-bg);
  padding: var(--space-6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.mb-canvas {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  flex-shrink: 0;
  overflow: hidden;
}

/* Canvas Items */
.mb-item {
  position: absolute;
  cursor: move;
  user-select: none;
  border-radius: 4px;
  transition: box-shadow var(--motion-fast);
}
.mb-item:hover, .mb-item.selected {
  box-shadow: 0 0 0 2px var(--color-accent), 0 4px 16px rgba(0,0,0,0.15);
}
.mb-item.selected { z-index: 9999 !important; }

.mb-item.type-image img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 4px;
  pointer-events: none;
  display: block;
}

.mb-item.type-text { background: rgba(0,0,0,0.06); border-radius: 4px; }

.text-content {
  width: 100%; height: 100%;
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  padding: 8px 10px;
  resize: none;
  cursor: text;
  box-sizing: border-box;
}
.text-content:focus { outline: none; }

.resize-handle {
  position: absolute;
  bottom: 0; right: 0;
  width: 16px; height: 16px;
  cursor: se-resize;
  background: var(--color-accent);
  border-radius: 4px 0 4px 0;
  opacity: 0;
  transition: opacity var(--motion-fast);
  display: flex; align-items: center; justify-content: center;
}
.mb-item:hover .resize-handle,
.mb-item.selected .resize-handle { opacity: 1; }

.item-delete-btn {
  position: absolute;
  top: -10px; right: -10px;
  width: 20px; height: 20px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--motion-fast);
  display: flex; align-items: center; justify-content: center;
  z-index: 1;
}
.mb-item:hover .item-delete-btn,
.mb-item.selected .item-delete-btn { opacity: 1; }

/* States */
.not-found, .loading-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: var(--space-4); color: var(--color-text-secondary);
}
</style>
