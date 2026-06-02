<template>
  <div class="tl-view">

    <!-- ─── Header ─────────────────────────────────────────────────────────── -->
    <div class="tl-header">
      <div class="tl-header-left">
        <h1 class="tl-title">
          Timeline
          <span class="tl-count">{{ filteredEvents.length }}</span>
        </h1>
      </div>
      <div class="tl-header-right">
        <select v-model="filterType" class="tl-select">
          <option value="">All Types</option>
          <option value="release">Releases</option>
          <option value="performance">Performances</option>
          <option value="milestone">Milestones</option>
          <option value="collaboration">Collaborations</option>
        </select>
        <select v-model="timeRange" class="tl-select">
          <option value="all">All Time</option>
          <option value="year">This Year</option>
          <option value="6months">Last 6 Months</option>
          <option value="3months">Last 3 Months</option>
        </select>
        <div class="tl-zoom-bar">
          <button class="tl-zoom-btn" @click="zoomOut" title="Zoom out">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="3" y1="8" x2="13" y2="8"/>
            </svg>
          </button>
          <button class="tl-zoom-pct" @click="fitToEvents" title="Fit to events">
            {{ Math.round(zoom * 100) }}%
          </button>
          <button class="tl-zoom-btn" @click="zoomIn" title="Zoom in">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="8" y1="3" x2="8" y2="13"/>
              <line x1="3" y1="8" x2="13" y2="8"/>
            </svg>
          </button>
        </div>
        <button class="tl-add-btn" @click="addEvent">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="2" x2="8" y2="14"/>
            <line x1="2" y1="8" x2="14" y2="8"/>
          </svg>
          Add Event
        </button>
      </div>
    </div>

    <!-- ─── Ruler ──────────────────────────────────────────────────────────── -->
    <div class="tl-ruler">
      <div
        v-for="tick in rulerTicks"
        :key="tick.key"
        class="tl-tick"
        :class="{ 'is-major': tick.major }"
        :style="{ left: tick.screenX + 'px' }"
      >
        <div class="tick-mark"></div>
        <span class="tick-label">{{ tick.label }}</span>
      </div>
      <!-- Today mark in ruler -->
      <div class="ruler-today" :style="{ left: worldToScreen(todayWorldX) + 'px' }"></div>
    </div>

    <!-- ─── Canvas ─────────────────────────────────────────────────────────── -->
    <div
      class="tl-canvas"
      ref="canvasRef"
      @wheel.prevent="onWheel"
      @mousedown="onMouseDown"
      @mousemove="onCanvasMouseMove"
      @click="onCanvasClick"
      @touchstart.prevent="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend.prevent="onTouchEnd"
      @dragover.prevent="onCanvasDragOver"
      @dragleave="onCanvasDragLeave"
      @drop.prevent="onCanvasDrop"
      :class="{ 'is-dragging': isDragging, 'is-placing': isPlacingEvent, 'is-drop-over': isFileDraggingOver }"
    >
      <!-- Spine -->
      <div class="tl-spine"></div>

      <!-- Placement cursor (follows mouse in add mode) -->
      <Transition name="fade">
        <div v-if="isPlacingEvent" class="tl-placement-cursor" :style="{ left: hoverScreenX + 'px' }">
          <div class="placement-line"></div>
          <div class="placement-date-pill">{{ placementDateLabel }}</div>
        </div>
      </Transition>

      <!-- File drop overlay -->
      <Transition name="fade">
        <div v-if="isFileDraggingOver" class="tl-drop-overlay">
          <div class="drop-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span>Drop files to attach</span>
            <span class="drop-date-hint" v-if="dropDateLabel">at {{ dropDateLabel }}</span>
          </div>
        </div>
      </Transition>

      <!-- Today vertical marker -->
      <div
        class="tl-today-line"
        :style="{ left: worldToScreen(todayWorldX) + 'px' }"
      >
        <span class="tl-today-pip"></span>
      </div>

      <!-- Events -->
      <template v-if="filteredEvents.length > 0">
        <div
          v-for="event in eventsWithPosition"
          :key="event.id"
          class="tl-node"
          :class="[
            'type-' + event.type,
            event.isAbove ? 'is-above' : 'is-below',
            'tier-' + zoomTier,
            { 'is-completed': event.completed }
          ]"
          :style="{ left: worldToScreen(event.worldX) + 'px' }"
          @click.stop="onEventClick(event)"
        >
          <!-- HTML order: dot → stem → card. CSS reverses for .is-above -->
          <div class="node-dot"></div>
          <div class="node-stem"></div>
          <div class="node-card" v-if="zoomTier !== 'micro'">
            <!-- nano: title label only -->
            <template v-if="zoomTier === 'nano'">
              <span class="nano-label">{{ event.title }}</span>
            </template>
            <!-- chip: compact pill -->
            <template v-else-if="zoomTier === 'chip'">
              <span class="chip-badge">{{ formatType(event.type) }}</span>
              <span class="chip-title">{{ event.title }}</span>
              <span class="chip-date">{{ formatDate(event.date) }}</span>
              <span v-if="event.attachments?.length" class="chip-att-badge">
                <svg viewBox="0 0 10 10" width="8" height="8" fill="currentColor">
                  <path d="M5 0.5a3 3 0 0 1 3 3v3a1.5 1.5 0 0 1-3 0V4a.5.5 0 0 1 1 0v2.5a.5.5 0 0 0 1 0V3.5a2 2 0 0 0-4 0v3a3 3 0 0 0 6 0V3.5a.5.5 0 0 1 1 0V6.5a4 4 0 0 1-8 0V3.5a3 3 0 0 1 3-3z"/>
                </svg>
                {{ event.attachments.length }}
              </span>
            </template>
            <!-- full: expanded card -->
            <template v-else>
              <div class="full-badge" :style="{ color: typeColor(event.type), borderColor: typeColor(event.type) + '33' }">
                {{ formatType(event.type) }}
              </div>
              <div class="full-title">{{ event.title }}</div>
              <div class="full-date">{{ formatDate(event.date) }}</div>
              <p v-if="event.description" class="full-desc">{{ event.description }}</p>
              <div v-if="event.details" class="full-details">
                <div v-for="(val, key) in event.details" :key="key" class="full-detail-row">
                  <span class="full-detail-key">{{ formatLabel(key) }}</span>
                  <span class="full-detail-val">{{ val }}</span>
                </div>
              </div>
              <!-- Linked content summary row -->
              <div class="full-linked-row">
                <span v-if="event.attachments?.length" class="full-linked-count">
                  <svg viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
                    <path d="M4.5 3a2.5 2.5 0 0 1 3.54 3.54l-1 1A.75.75 0 0 1 5.98 6.48l1-1A1 1 0 1 0 5.56 4.06l-1 1A.75.75 0 0 1 3.5 3.99l1-1c.28-.28.64-.5 1-.72zm-3 3a2.5 2.5 0 0 1 3.54 0l.06.06A.75.75 0 0 1 4.04 7.12L3.98 7.06A1 1 0 1 0 5.4 8.48l1-1A.75.75 0 0 1 7.46 8.54l-1 1a2.5 2.5 0 0 1-3.54-3.54z"/>
                  </svg>
                  {{ event.attachments.length }} linked
                </span>
                <span v-else class="full-linked-empty">No linked content</span>
                <button class="full-open-btn" @click.stop="openEventDetail(event)">
                  View Details →
                </button>
              </div>
              <div class="full-actions">
                <button class="full-btn" @click.stop="editEvent(event)">Edit</button>
                <button class="full-btn is-danger" @click.stop="deleteEvent(event)">Delete</button>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="tl-empty">
        <svg viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
          <circle cx="40" cy="40" r="4" fill="currentColor" opacity="0.4"/>
          <line x1="10" y1="40" x2="30" y2="40" stroke="currentColor" stroke-width="1" opacity="0.3"/>
          <line x1="50" y1="40" x2="70" y2="40" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
        <p class="tl-empty-text">
          {{ filterType || timeRange !== 'all' ? 'No events match the current filters' : 'No timeline events yet' }}
        </p>
        <button v-if="!filterType && timeRange === 'all'" class="tl-add-btn" @click="addEvent">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="2" x2="8" y2="14"/>
            <line x1="2" y1="8" x2="14" y2="8"/>
          </svg>
          Add First Event
        </button>
      </div>
    </div>

    <!-- ─── Hint bar ────────────────────────────────────────────────────────── -->
    <div class="tl-hint">
      <template v-if="isPlacingEvent">
        Click to place event · <kbd>Esc</kbd> to cancel
      </template>
      <template v-else>
        Pinch or scroll to zoom · Drag to pan · Click event to open
      </template>
      <span class="tl-tier-badge">{{ zoomTier }}</span>
    </div>

    <!-- ─── Quick-add panel ──────────────────────────────────────────────────── -->
    <Transition name="qa-slide">
      <div v-if="quickAddOpen" class="tl-quick-add-panel" @click.stop @keydown.escape.prevent="cancelQuickAdd">
        <div class="qa-header">
          <div class="qa-header-left">
            <span class="qa-new-badge">New Event</span>
            <span class="qa-placed-date">{{ quickAddDisplayDate }}</span>
          </div>
          <button class="qa-close-btn" @click="cancelQuickAdd" title="Cancel">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/>
            </svg>
          </button>
        </div>

        <div class="qa-body">
          <div class="qa-row-main">
            <input
              ref="quickAddTitleRef"
              v-model="quickAddTitle"
              class="qa-title-input"
              placeholder="Event title…"
              @keydown.enter="confirmQuickAdd"
              @keydown.escape.prevent="cancelQuickAdd"
            />
            <select v-model="quickAddType" class="qa-type-select">
              <option value="release">Release</option>
              <option value="performance">Performance</option>
              <option value="milestone">Milestone</option>
              <option value="collaboration">Collaboration</option>
            </select>
            <input type="date" v-model="quickAddDate" class="qa-date-input" />
          </div>

          <!-- File drop zone -->
          <div
            class="qa-drop-zone"
            :class="{ 'is-drag-over': quickAddDropOver }"
            @dragover.prevent="quickAddDropOver = true"
            @dragleave="quickAddDropOver = false"
            @drop.prevent="onQuickAddFileDrop"
            @click="qaFileInputRef?.click()"
          >
            <input ref="qaFileInputRef" type="file" multiple class="qa-file-input" @change="onQuickAddFileSelect" />
            <template v-if="!quickAddFiles.length">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path d="M10 3v9m0 0l-3-3m3 3l3-3M3 14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2H3v2z"/>
              </svg>
              <span class="qa-drop-label">Drop files or click to attach</span>
              <span class="qa-drop-hint">Music · Photos · Docs · Briefs</span>
            </template>
            <div v-else class="qa-files-list">
              <div v-for="(file, i) in quickAddFiles" :key="i" class="qa-file-chip">
                <span class="qa-file-icon">{{ getFileIcon(file) }}</span>
                <span class="qa-file-name">{{ file.name }}</span>
                <button class="qa-file-remove" @click.stop="quickAddFiles.splice(i, 1)" title="Remove">×</button>
              </div>
              <button class="qa-add-more-btn" @click.stop="qaFileInputRef?.click()">+ Add more</button>
            </div>
          </div>
        </div>

        <div class="qa-footer">
          <button class="qa-btn-cancel" @click="cancelQuickAdd">Cancel</button>
          <button
            class="qa-btn-save"
            :disabled="!quickAddTitle.trim()"
            @click="confirmQuickAdd"
          >Add to Timeline</button>
        </div>
      </div>
    </Transition>

    <!-- ─── FAB ──────────────────────────────────────────────────────────────── -->
    <button
      class="tl-fab"
      :class="{ 'is-active': isPlacingEvent }"
      @click="isPlacingEvent ? cancelPlacement() : startPlacement()"
      :title="isPlacingEvent ? 'Cancel placement (Esc)' : 'Add event to timeline'"
      aria-label="Add timeline event"
    >
      <svg v-if="!isPlacingEvent" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
      </svg>
      <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/>
      </svg>
    </button>
  </div>

  <!-- ─── Event detail modal ─────────────────────────────────────────────────── -->
  <TimelineEventModal
    v-if="selectedEvent"
    :event="selectedEvent"
    @close="selectedEvent = null"
    @update-attachments="onEventUpdate"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, watch, nextTick } from 'vue'
import { apiService } from '@/shared/services/api'
import TimelineEventModal from '@/views/TimelineEventModal.vue'

const showToast = inject('showToast', () => {})

// ─── Modal state ──────────────────────────────────────────────────────────────
const selectedEvent = ref(null)

const openEventDetail = (event) => {
  selectedEvent.value = event
}

const onEventUpdate = (updatedAtts) => {
  if (!selectedEvent.value) return
  // Write back into the source array so the card badge updates reactively
  const idx = timelineEvents.value.findIndex(e => e.id === selectedEvent.value.id)
  if (idx !== -1) {
    timelineEvents.value[idx] = { ...timelineEvents.value[idx], attachments: updatedAtts }
    selectedEvent.value = timelineEvents.value[idx]
  }
}

// ─── Placement mode ───────────────────────────────────────────────────────────
const isPlacingEvent = ref(false)
const hoverScreenX = ref(0)
const hoverDropScreenX = ref(0)
const isFileDraggingOver = ref(false)

const placementDateLabel = computed(() => {
  if (!canvasRef.value) return ''
  return screenXToDate(hoverScreenX.value, true)
})

const dropDateLabel = computed(() => {
  if (!canvasRef.value) return ''
  return screenXToDate(hoverDropScreenX.value, true)
})

const screenXToDate = (screenX, display = false) => {
  const worldX = screenToWorld(screenX)
  const ms = minDateMs.value + worldX / BASE_PX_PER_DAY * MS_PER_DAY
  const d = new Date(ms)
  if (display) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return d.toISOString().split('T')[0]
}

const SNAP_THRESHOLD_PX = 30
const snapScreenX = (screenX) => {
  if (!rulerTicks.value.length) return screenX
  const nearest = rulerTicks.value.reduce((prev, tick) =>
    Math.abs(tick.screenX - screenX) < Math.abs(prev.screenX - screenX) ? tick : prev
  )
  if (Math.abs(nearest.screenX - screenX) < SNAP_THRESHOLD_PX) return nearest.screenX
  return screenX
}

const startPlacement = () => {
  isPlacingEvent.value = true
  quickAddOpen.value = false
}

const cancelPlacement = () => {
  isPlacingEvent.value = false
}

const onCanvasMouseMove = (e) => {
  if (!canvasRef.value || !isPlacingEvent.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  hoverScreenX.value = snapScreenX(e.clientX - rect.left)
}

const onCanvasClick = (e) => {
  if (!isPlacingEvent.value) return
  if (didDragSession) return
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const snappedX = snapScreenX(e.clientX - rect.left)
  const dateStr = screenXToDate(snappedX)
  openQuickAdd(dateStr)
  isPlacingEvent.value = false
}

// ─── Quick-add panel ──────────────────────────────────────────────────────────
const quickAddOpen = ref(false)
const quickAddDate = ref('')
const quickAddTitle = ref('')
const quickAddType = ref('release')
const quickAddFiles = ref([])
const quickAddDropOver = ref(false)
const quickAddTitleRef = ref(null)
const qaFileInputRef = ref(null)

const quickAddDisplayDate = computed(() => {
  if (!quickAddDate.value) return ''
  return new Date(quickAddDate.value + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

const openQuickAdd = (dateStr, preloadFiles = []) => {
  quickAddDate.value = dateStr
  quickAddTitle.value = ''
  quickAddType.value = 'release'
  quickAddFiles.value = [...preloadFiles]
  quickAddOpen.value = true
  nextTick(() => quickAddTitleRef.value?.focus())
}

const cancelQuickAdd = () => {
  quickAddOpen.value = false
  quickAddFiles.value = []
  quickAddTitle.value = ''
}

const confirmQuickAdd = () => {
  if (!quickAddTitle.value.trim()) return
  const newEvent = {
    id: `event-${Date.now()}`,
    title: quickAddTitle.value.trim(),
    type: quickAddType.value,
    date: new Date(quickAddDate.value + 'T12:00:00').toISOString(),
    completed: false,
    description: '',
    details: {},
    attachments: quickAddFiles.value.map((f, i) => ({
      id: `att-${Date.now()}-${i}`,
      type: guessAttachmentType(f),
      label: f.name,
      subtitle: formatFileSize(f.size),
      file: f
    }))
  }
  timelineEvents.value.push(newEvent)
  showToast({ message: `"${newEvent.title}" added to timeline`, type: 'success' })
  cancelQuickAdd()
  nextTick(fitToEvents)
}

// ─── Quick-add file handlers ──────────────────────────────────────────────────
const onQuickAddFileDrop = (e) => {
  quickAddDropOver.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  quickAddFiles.value.push(...files)
}

const onQuickAddFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  quickAddFiles.value.push(...files)
  if (e.target) e.target.value = ''
}

// ─── Canvas file drag-and-drop ────────────────────────────────────────────────
const onCanvasDragOver = (e) => {
  if (!e.dataTransfer?.types.includes('Files')) return
  isFileDraggingOver.value = true
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  hoverDropScreenX.value = snapScreenX(e.clientX - rect.left)
}

const onCanvasDragLeave = (e) => {
  if (canvasRef.value && !canvasRef.value.contains(e.relatedTarget)) {
    isFileDraggingOver.value = false
  }
}

const onCanvasDrop = (e) => {
  isFileDraggingOver.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const snappedX = snapScreenX(e.clientX - rect.left)
  const dateStr = screenXToDate(snappedX)
  openQuickAdd(dateStr, files)
}

// ─── File type helpers ────────────────────────────────────────────────────────
const getFileIcon = (file) => {
  const t = file.type || ''
  if (t.startsWith('audio/')) return '♪'
  if (t.startsWith('image/')) return '▣'
  if (t.startsWith('video/')) return '▶'
  if (t === 'application/pdf') return '⬡'
  return '◻'
}

const guessAttachmentType = (file) => {
  const t = file.type || ''
  if (t.startsWith('audio/')) return 'track'
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  return 'file'
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Global escape key for placement / quick-add ─────────────────────────────
const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape') {
    if (quickAddOpen.value) { cancelQuickAdd(); return }
    if (isPlacingEvent.value) { cancelPlacement(); return }
  }
}

// ─── Data ────────────────────────────────────────────────────────────────────
const timelineEvents = ref([])
const filterType = ref('')
const timeRange = ref('all')

// ─── Canvas ───────────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const stageWidth = ref(900)
const stageHeight = ref(500)

// World coordinate constants
const MS_PER_DAY = 86_400_000
const BASE_PX_PER_DAY = 4   // at zoom = 1.0, 1 day = 4 world-px
const MIN_ZOOM = 0.03
const MAX_ZOOM = 8.0
const PADDING_DAYS = 75

// ─── Viewport state ───────────────────────────────────────────────────────────
const zoom = ref(0.5)
const panX = ref(0)

// ─── Zoom tier (birds-eye → micro → nano → chip → full) ──────────────────────
const zoomTier = computed(() => {
  if (zoom.value < 0.12) return 'micro'
  if (zoom.value < 0.35) return 'nano'
  if (zoom.value < 0.90) return 'chip'
  return 'full'
})

// ─── Interaction state ────────────────────────────────────────────────────────
const isDragging = ref(false)
let dragStartX = 0
let dragLastX = 0
let dragVelocityX = 0
let dragLastTime = 0
let didDragSession = false
let inertiaFrame = null
let animFrame = null
const FRICTION = 0.88

// Touch
let pinchStartDist = 0
let pinchStartZoom = 1
let pinchStartPanX = 0
let pinchStartMidX = 0
let isTouchPinching = false
let isTouchPanning = false

// Reduced-motion preference
const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false

// ─── Mock data ────────────────────────────────────────────────────────────────
const mockEvents = [
  {
    id: 'event-1',
    title: 'Debut Album Release',
    type: 'release',
    date: new Date('2024-03-15').toISOString(),
    completed: true,
    description: 'Released "Midnight Dreams" across all streaming platforms.',
    details: { tracks: '12 songs', duration: '48 min', producer: 'Alex Johnson' },
    links: [{ label: 'Spotify', url: 'https://spotify.com' }],
    attachments: [
      { id: 's1', type: 'track',   label: 'Midnight Dreams',          subtitle: 'Single · 3:42',    appId: 's1' },
      { id: 'i1', type: 'image',   label: 'Midnight Dreams — Cover',  subtitle: 'JPEG · 3000×3000', appId: 'i1' },
      { id: 'link-sp', type: 'link', label: 'Spotify',               subtitle: 'open.spotify.com',  url: 'https://spotify.com' },
      { id: 'link-am', type: 'link', label: 'Apple Music',           subtitle: 'music.apple.com',   url: 'https://music.apple.com' },
    ]
  },
  {
    id: 'event-2',
    title: 'Summer Festival Tour',
    type: 'performance',
    date: new Date('2024-06-01').toISOString(),
    completed: true,
    description: 'Performed at 15 major festivals across the country.',
    details: { venues: '15 festivals', attendance: '250k+ people', duration: '3 months' },
    attachments: [
      { id: 'p1', type: 'playlist', label: 'Summer Tour Setlist',    subtitle: 'Playlist · 22 tracks', appId: 'p1' },
      { id: 'i2', type: 'image',    label: 'Summer Tour Press Shot', subtitle: 'PNG · 2400×3000',      appId: 'i2' },
      { id: 'f2', type: 'file',     label: 'Tour Rider 2024',        subtitle: 'DOCX · 840 KB',        appId: 'f2' },
    ]
  },
  {
    id: 'event-3',
    title: 'Gold Certification',
    type: 'milestone',
    date: new Date('2024-08-20').toISOString(),
    completed: true,
    description: 'Debut album achieved Gold certification.',
    details: { sales: '500k+ units', certification: 'Gold', country: 'United States' },
    attachments: [
      { id: 'i3',       type: 'image', label: 'Gold Certification Plaque',  subtitle: 'JPEG · 1800×1200', appId: 'i3' },
      { id: 'f4',       type: 'file',  label: 'Gold Cert Press Release',    subtitle: 'PDF · 320 KB',     appId: 'f4' },
      { id: 'link-cert', type: 'link', label: 'RIAA Announcement',          subtitle: 'riaa.com', url: 'https://riaa.com' },
    ]
  },
  {
    id: 'event-4',
    title: 'Collaboration — Taylor Swift',
    type: 'collaboration',
    date: new Date('2024-11-10').toISOString(),
    completed: false,
    description: 'Recording new single featuring Taylor Swift for upcoming EP.',
    details: { artist: 'Taylor Swift', role: 'Featured Artist', status: 'In Progress' },
    attachments: [
      { id: 'a1', type: 'artist', label: 'Taylor Swift',             subtitle: 'Featured Artist',  appId: 'a1' },
      { id: 's4', type: 'track',  label: 'The Collab (feat. T.S.)', subtitle: 'Single (unreleased) · 3:55', appId: 's4' },
      { id: 'f1', type: 'file',   label: 'Collaboration Agreement', subtitle: 'PDF · 2.4 MB',     appId: 'f1' },
    ]
  },
  {
    id: 'event-5',
    title: 'Holiday EP',
    type: 'release',
    date: new Date('2024-12-15').toISOString(),
    completed: false,
    description: 'Holiday-themed EP with 5 original tracks.',
    details: { tracks: '5 songs', format: 'Digital EP' },
    attachments: [
      { id: 'i4', type: 'image', label: 'Holiday EP Artwork', subtitle: 'PNG · 3000×3000', appId: 'i4' },
    ]
  },
  {
    id: 'event-6',
    title: 'World Tour Announced',
    type: 'performance',
    date: new Date('2025-02-01').toISOString(),
    completed: false,
    description: '30-city world tour announced across 4 continents.',
    details: { cities: '30', continents: '4', duration: '6 months' },
    attachments: []
  },
  {
    id: 'event-7',
    title: 'Platinum Certification',
    type: 'milestone',
    date: new Date('2025-06-15').toISOString(),
    completed: false,
    description: 'Debut album reaches platinum with 1M+ streams.',
    details: { streams: '1M+', certification: 'Platinum' },
    attachments: []
  }
]

// ─── Filtered + sorted events ─────────────────────────────────────────────────
const filteredEvents = computed(() => {
  let res = [...timelineEvents.value]
  if (filterType.value) res = res.filter(e => e.type === filterType.value)
  if (timeRange.value !== 'all') {
    const now = new Date()
    const cutoff = new Date()
    if (timeRange.value === 'year')     cutoff.setFullYear(now.getFullYear() - 1)
    else if (timeRange.value === '6months') cutoff.setMonth(now.getMonth() - 6)
    else if (timeRange.value === '3months') cutoff.setMonth(now.getMonth() - 3)
    res = res.filter(e => new Date(e.date) >= cutoff)
  }
  return res.slice().sort((a, b) => new Date(a.date) - new Date(b.date))
})

// ─── World coordinate math ────────────────────────────────────────────────────
const minDateMs = computed(() => {
  if (!filteredEvents.value.length) return Date.now() - 30 * MS_PER_DAY
  return Math.min(...filteredEvents.value.map(e => new Date(e.date).getTime())) - PADDING_DAYS * MS_PER_DAY
})

const maxDateMs = computed(() => {
  if (!filteredEvents.value.length) return Date.now() + 30 * MS_PER_DAY
  return Math.max(...filteredEvents.value.map(e => new Date(e.date).getTime())) + PADDING_DAYS * MS_PER_DAY
})

const worldWidth = computed(() =>
  (maxDateMs.value - minDateMs.value) / MS_PER_DAY * BASE_PX_PER_DAY
)

const todayWorldX = computed(() =>
  (Date.now() - minDateMs.value) / MS_PER_DAY * BASE_PX_PER_DAY
)

const dateToWorldX = (dateStr) => {
  const ms = new Date(dateStr).getTime()
  return (ms - minDateMs.value) / MS_PER_DAY * BASE_PX_PER_DAY
}

const worldToScreen = (wx) => wx * zoom.value + panX.value
const screenToWorld = (sx) => (sx - panX.value) / zoom.value

// ─── Events with position ─────────────────────────────────────────────────────
const eventsWithPosition = computed(() =>
  filteredEvents.value.map((event, i) => ({
    ...event,
    worldX: dateToWorldX(event.date),
    isAbove: i % 2 === 0
  }))
)

// ─── Ruler ticks ──────────────────────────────────────────────────────────────
const rulerTicks = computed(() => {
  const ticks = []
  const visStartMs = minDateMs.value + screenToWorld(-60) / BASE_PX_PER_DAY * MS_PER_DAY
  const visEndMs   = minDateMs.value + screenToWorld(stageWidth.value + 60) / BASE_PX_PER_DAY * MS_PER_DAY
  const spanDays = (visEndMs - visStartMs) / MS_PER_DAY

  const inView = (ms) => {
    const wx = (ms - minDateMs.value) / MS_PER_DAY * BASE_PX_PER_DAY
    const sx = worldToScreen(wx)
    return sx >= -80 && sx <= stageWidth.value + 80
  }

  const pushTick = (ms, label, major) => {
    const wx = (ms - minDateMs.value) / MS_PER_DAY * BASE_PX_PER_DAY
    const sx = worldToScreen(wx)
    ticks.push({ key: `${ms}`, screenX: sx, label, major })
  }

  if (spanDays > 365 * 4) {
    // Years
    const y0 = new Date(visStartMs).getFullYear()
    const y1 = new Date(visEndMs).getFullYear() + 1
    for (let y = y0; y <= y1; y++) {
      const ms = new Date(y, 0, 1).getTime()
      if (inView(ms)) pushTick(ms, String(y), true)
    }
  } else if (spanDays > 365) {
    // Quarters
    const y0 = new Date(visStartMs).getFullYear()
    const y1 = new Date(visEndMs).getFullYear() + 1
    for (let y = y0; y <= y1; y++) {
      for (let q = 0; q < 4; q++) {
        const ms = new Date(y, q * 3, 1).getTime()
        if (inView(ms)) pushTick(ms, q === 0 ? String(y) : `Q${q + 1} '${String(y).slice(2)}`, q === 0)
      }
    }
  } else if (spanDays > 60) {
    // Months
    const d = new Date(new Date(visStartMs).getFullYear(), new Date(visStartMs).getMonth(), 1)
    const end = new Date(new Date(visEndMs).getFullYear(), new Date(visEndMs).getMonth() + 2, 1)
    while (d < end) {
      if (inView(d.getTime())) {
        const isMajor = d.getMonth() === 0
        const label = isMajor
          ? d.toLocaleDateString('en-US', { year: 'numeric' })
          : d.toLocaleDateString('en-US', { month: 'short' })
        pushTick(d.getTime(), label, isMajor)
      }
      d.setMonth(d.getMonth() + 1)
    }
  } else if (spanDays > 14) {
    // Weeks (snap to Monday)
    const d = new Date(visStartMs)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday
    d.setHours(0, 0, 0, 0)
    const end = new Date(visEndMs)
    while (d <= end) {
      if (inView(d.getTime())) {
        const isMajor = d.getDate() <= 7
        pushTick(d.getTime(), d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isMajor)
      }
      d.setDate(d.getDate() + 7)
    }
  } else {
    // Days
    const d = new Date(visStartMs)
    d.setHours(0, 0, 0, 0)
    const end = new Date(visEndMs)
    while (d <= end) {
      if (inView(d.getTime())) {
        const isMajor = d.getDate() === 1
        pushTick(d.getTime(), d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isMajor)
      }
      d.setDate(d.getDate() + 1)
    }
  }
  return ticks
})

// ─── Pan clamping ─────────────────────────────────────────────────────────────
const clampPan = () => {
  const sw = worldWidth.value * zoom.value
  const margin = 100
  panX.value = Math.max(-(sw - stageWidth.value + margin), Math.min(margin, panX.value))
}

// ─── Zoom with focal point ─────────────────────────────────────────────────────
const applyZoom = (factor, focalScreenX) => {
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value * factor))
  if (newZoom === zoom.value) return
  panX.value = focalScreenX - (focalScreenX - panX.value) * (newZoom / zoom.value)
  zoom.value = newZoom
  clampPan()
}

// ─── Wheel ────────────────────────────────────────────────────────────────────
const onWheel = (e) => {
  cancelInertia()
  if (e.ctrlKey || e.metaKey) {
    // Trackpad pinch → zoom
    const rect = canvasRef.value.getBoundingClientRect()
    const focalX = e.clientX - rect.left
    const delta = Math.max(-80, Math.min(80, e.deltaY))
    applyZoom(Math.exp(-delta * 0.013), focalX)
  } else {
    // Scroll → pan
    panX.value -= (e.deltaX || 0) * 1.2
    panX.value -= e.deltaY * 0.65
    clampPan()
  }
}

// ─── Mouse drag ───────────────────────────────────────────────────────────────
const onMouseDown = (e) => {
  if (e.button !== 0) return
  if (isPlacingEvent.value) return  // don't start pan drag in placement mode
  cancelInertia()
  isDragging.value = true
  didDragSession = false
  dragStartX = e.clientX
  dragLastX = e.clientX
  dragVelocityX = 0
  dragLastTime = performance.now()
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onMouseMove = (e) => {
  if (!isDragging.value) return
  const now = performance.now()
  const dt = Math.max(1, now - dragLastTime)
  const dx = e.clientX - dragLastX
  if (Math.abs(e.clientX - dragStartX) > 4) didDragSession = true
  dragVelocityX = (dx / dt) * 16   // px-per-frame at 60 fps
  panX.value += dx
  dragLastX = e.clientX
  dragLastTime = now
  clampPan()
}

const onMouseUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  if (Math.abs(dragVelocityX) > 0.5) startInertia()
}

// ─── Touch ────────────────────────────────────────────────────────────────────
const onTouchStart = (e) => {
  cancelInertia()
  if (e.touches.length === 2) {
    isTouchPinching = true
    isTouchPanning = false
    const [t1, t2] = e.touches
    pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    pinchStartZoom = zoom.value
    pinchStartPanX = panX.value
    const rect = canvasRef.value.getBoundingClientRect()
    pinchStartMidX = (t1.clientX + t2.clientX) / 2 - rect.left
  } else if (e.touches.length === 1) {
    isTouchPinching = false
    isTouchPanning = true
    didDragSession = false
    dragStartX = e.touches[0].clientX
    dragLastX = e.touches[0].clientX
    dragVelocityX = 0
    dragLastTime = performance.now()
  }
}

const onTouchMove = (e) => {
  if (isTouchPinching && e.touches.length === 2) {
    const [t1, t2] = e.touches
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    const scaleFactor = dist / pinchStartDist
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStartZoom * scaleFactor))
    const midWorldX = (pinchStartMidX - pinchStartPanX) / pinchStartZoom
    const rect = canvasRef.value.getBoundingClientRect()
    const currentMidX = (t1.clientX + t2.clientX) / 2 - rect.left
    panX.value = currentMidX - midWorldX * newZoom
    zoom.value = newZoom
    clampPan()
  } else if (isTouchPanning && e.touches.length === 1) {
    const now = performance.now()
    const dt = Math.max(1, now - dragLastTime)
    const dx = e.touches[0].clientX - dragLastX
    if (Math.abs(e.touches[0].clientX - dragStartX) > 4) didDragSession = true
    dragVelocityX = (dx / dt) * 16
    panX.value += dx
    dragLastX = e.touches[0].clientX
    dragLastTime = now
    clampPan()
  }
}

const onTouchEnd = (e) => {
  if (isTouchPanning && e.touches.length === 0 && Math.abs(dragVelocityX) > 0.5) {
    startInertia()
  }
  if (e.touches.length < 2) isTouchPinching = false
  if (e.touches.length === 0) isTouchPanning = false
}

// ─── Inertia (momentum) ───────────────────────────────────────────────────────
const startInertia = () => {
  cancelInertia()
  const tick = () => {
    panX.value += dragVelocityX
    dragVelocityX *= FRICTION
    clampPan()
    if (Math.abs(dragVelocityX) > 0.25) inertiaFrame = requestAnimationFrame(tick)
    else inertiaFrame = null
  }
  inertiaFrame = requestAnimationFrame(tick)
}

const cancelInertia = () => {
  if (inertiaFrame !== null) { cancelAnimationFrame(inertiaFrame); inertiaFrame = null }
  dragVelocityX = 0
}

// ─── Smooth animated pan/zoom ─────────────────────────────────────────────────
const animateTo = (targetZoom, targetPanX, duration = 400) => {
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  if (prefersReducedMotion) {
    zoom.value = targetZoom
    panX.value = targetPanX
    clampPan()
    return
  }
  const startZ = zoom.value, startP = panX.value
  const t0 = performance.now()
  const ease = (t) => 1 - Math.pow(1 - t, 3) // easeOutCubic

  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration)
    zoom.value = startZ + (targetZoom - startZ) * ease(t)
    panX.value = startP + (targetPanX - startP) * ease(t)
    if (t < 1) animFrame = requestAnimationFrame(step)
    else { animFrame = null; clampPan() }
  }
  animFrame = requestAnimationFrame(step)
}

// ─── Fit all events ────────────────────────────────────────────────────────────
const fitToEvents = () => {
  const pad = 140
  const targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM,
    (stageWidth.value - pad * 2) / worldWidth.value
  ))
  const scaledW = worldWidth.value * targetZoom
  const targetPanX = (stageWidth.value - scaledW) / 2
  animateTo(targetZoom, targetPanX)
}

// ─── Zoom controls ────────────────────────────────────────────────────────────
const zoomIn  = () => applyZoom(1.6, stageWidth.value / 2)
const zoomOut = () => applyZoom(1 / 1.6, stageWidth.value / 2)

// ─── Click on event ───────────────────────────────────────────────────────────
const onEventClick = (event) => {
  if (didDragSession) return
  if (zoomTier.value === 'full') {
    // Open detail/attachment modal
    openEventDetail(event)
  } else {
    // Zoom into this event
    const targetZoom = Math.min(MAX_ZOOM, Math.max(1.2, zoom.value * 4))
    const targetPanX = stageWidth.value / 2 - event.worldX * targetZoom
    const clamped = Math.max(-(worldWidth.value * targetZoom - stageWidth.value + 100), Math.min(100, targetPanX))
    animateTo(targetZoom, clamped)
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const formatType = (type) =>
  ({ release: 'Release', performance: 'Performance', milestone: 'Milestone', collaboration: 'Collab' }[type] || type)

const formatLabel = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

const typeColor = (type) => ({
  release:       'var(--color-accent)',
  performance:   '#b45309',
  milestone:     '#7c3aed',
  collaboration: '#2563eb'
}[type] || 'var(--color-text-secondary)')

// ─── Data loading ─────────────────────────────────────────────────────────────
const loadEvents = async () => {
  try {
    const result = await apiService.getAll('timeline_events')
    timelineEvents.value = result.data?.length > 0 ? result.data : mockEvents
  } catch {
    timelineEvents.value = mockEvents
  }
  await nextTick()
  fitToEvents()
}

const addEvent = () => showToast({ message: 'Add event form coming soon', type: 'info' })
const editEvent = (event) => showToast({ message: `Editing: ${event.title}`, type: 'info' })

const deleteEvent = async (event) => {
  if (!confirm(`Delete "${event.title}"?`)) return
  try {
    await apiService.delete('timeline_events', event.id)
    timelineEvents.value = timelineEvents.value.filter(e => e.id !== event.id)
    showToast({ message: 'Event deleted', type: 'success' })
  } catch {
    showToast({ message: 'Failed to delete event', type: 'error' })
  }
}

// ─── Resize observer ──────────────────────────────────────────────────────────
let resizeObserver = null
const updateSize = () => {
  if (!canvasRef.value) return
  const r = canvasRef.value.getBoundingClientRect()
  stageWidth.value  = r.width
  stageHeight.value = r.height
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  updateSize()
  resizeObserver = new ResizeObserver(updateSize)
  if (canvasRef.value) resizeObserver.observe(canvasRef.value)
  await loadEvents()
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  cancelInertia()
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  if (resizeObserver) resizeObserver.disconnect()
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('keydown', handleGlobalKeydown)
})

watch([filterType, timeRange], async () => {
  await nextTick()
  fitToEvents()
})
</script>

<style scoped>
/* ─── Layout shell ─────────────────────────────────────────────────────────── */
.tl-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
  position: relative; /* needed for FAB + quick-add absolute positioning */
  user-select: none;
}

/* ─── Header ───────────────────────────────────────────────────────────────── */
.tl-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-8);
  height: 64px;
  border-bottom: 1px solid var(--color-border);
  gap: var(--space-4);
}

.tl-header-left { display: flex; align-items: center; gap: var(--space-4); }
.tl-header-right { display: flex; align-items: center; gap: var(--space-3); }

.tl-title {
  font-size: 20px;
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--color-text);
}

.tl-count {
  font-size: 13px;
  font-weight: var(--weight-normal);
  color: var(--color-text-tertiary);
}

.tl-select {
  padding: 6px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: border-color var(--motion-fast);
  appearance: none;
  min-width: 120px;
}
.tl-select:hover { border-color: var(--color-border-strong); }
.tl-select:focus { outline: none; border-color: var(--color-accent); }

/* Zoom bar */
.tl-zoom-bar {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.tl-zoom-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast);
}
.tl-zoom-btn svg { width: 14px; height: 14px; }
.tl-zoom-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }

.tl-zoom-pct {
  padding: 0 var(--space-2);
  height: 30px;
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-family: var(--font-mono, monospace);
  cursor: pointer;
  min-width: 44px;
  justify-content: center;
  transition: background var(--motion-fast), color var(--motion-fast);
}
.tl-zoom-pct:hover { background: var(--color-surface-raised); color: var(--color-text); }

.tl-add-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px 14px;
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast);
}
.tl-add-btn svg { width: 12px; height: 12px; }
.tl-add-btn:hover { background: #2C2B28; }

/* ─── Ruler ────────────────────────────────────────────────────────────────── */
.tl-ruler {
  flex-shrink: 0;
  position: relative;
  height: 32px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}

.tl-tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.tick-mark {
  width: 1px;
  height: 6px;
  background: var(--color-border-strong);
  margin-top: 4px;
}

.tl-tick.is-major .tick-mark {
  height: 10px;
  background: var(--color-text-tertiary);
}

.tick-label {
  font-size: 10px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  margin-top: 2px;
  letter-spacing: 0.02em;
}

.tl-tick.is-major .tick-label {
  color: var(--color-text-secondary);
  font-weight: var(--weight-medium);
}

.ruler-today {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-accent);
  opacity: 0.6;
  transform: translateX(-50%);
  pointer-events: none;
}

/* ─── Canvas ───────────────────────────────────────────────────────────────── */
.tl-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
  min-height: 0;
}
.tl-canvas.is-dragging { cursor: grabbing; }

/* Spine (horizontal center line) */
.tl-spine {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-50%);
  background: var(--color-border-strong);
  pointer-events: none;
}

/* Today vertical line */
.tl-today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-accent);
  opacity: 0.5;
  transform: translateX(-50%);
  pointer-events: none;
}

.tl-today-pip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  opacity: 1;
}

/* ─── Timeline node ────────────────────────────────────────────────────────── */
.tl-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

/* Above-spine: node grows upward from spine center */
.tl-node.is-above {
  flex-direction: column-reverse; /* visual order (bottom→top): dot, stem, card */
  bottom: 50%;
}

/* Below-spine: node grows downward from spine center */
.tl-node.is-below {
  top: 50%;
}

/* ─── Dot ──────────────────────────────────────────────────────────────────── */
.node-dot {
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: var(--color-surface);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  z-index: 2;
}

/* dot size per tier */
.tier-micro .node-dot { width: 6px;  height: 6px;  border-width: 1.5px; }
.tier-nano  .node-dot { width: 8px;  height: 8px; }
.tier-chip  .node-dot { width: 10px; height: 10px; }
.tier-full  .node-dot { width: 12px; height: 12px; border-width: 2.5px; }

.tl-node:hover .node-dot {
  transform: scale(1.4);
  box-shadow: 0 0 0 4px rgba(0,0,0,0.08);
}

.is-completed .node-dot { background: currentColor; }

/* ─── Stem ─────────────────────────────────────────────────────────────────── */
.node-stem {
  flex-shrink: 0;
  width: 1px;
  background: currentColor;
  opacity: 0.25;
}

/* stem height per tier */
.tier-micro .node-stem { height: 0; }
.tier-nano  .node-stem { height: 28px; }
.tier-chip  .node-stem { height: 44px; }
.tier-full  .node-stem { height: 64px; }

/* ─── Card ─────────────────────────────────────────────────────────────────── */
.node-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
}

/* micro: no card */
.tier-micro .node-card { display: none; }

/* ─── nano card ────────────────────────────────────────────────────────────── */
.nano-label {
  font-size: 9px;
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
  text-align: center;
  padding: 2px 4px;
}

/* ─── chip card ────────────────────────────────────────────────────────────── */
.tier-chip .node-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  width: 130px;
  gap: 2px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.tl-node.tier-chip:hover .node-card {
  border-color: currentColor;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chip-badge {
  font-size: 9px;
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: currentColor;
  opacity: 0.8;
}

.chip-title {
  font-size: 11px;
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 110px;
  display: block;
}

.chip-date {
  font-size: 10px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.chip-att-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 5px;
  background: currentColor;
  border-radius: 100px;
  font-size: 9px;
  font-weight: var(--weight-semibold);
  color: var(--color-surface) !important;
  opacity: 0.75;
  margin-top: 1px;
  align-self: flex-start;
}

/* ─── full card ────────────────────────────────────────────────────────────── */
.tier-full .node-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  width: 220px;
  align-items: flex-start;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.tl-node.tier-full:hover .node-card {
  border-color: currentColor;
  box-shadow: var(--shadow-md);
}

.full-badge {
  font-size: 10px;
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border: 1px solid currentColor;
  border-radius: 100px;
}

.full-title {
  font-size: 13px;
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  line-height: 1.3;
}

.full-date {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.full-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.full-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding-top: var(--space-1);
  border-top: 1px solid var(--color-border);
}

.full-detail-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.full-detail-key {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.full-detail-val {
  font-size: 10px;
  color: var(--color-text-secondary);
  font-weight: var(--weight-medium);
  text-align: right;
}

/* Linked content summary row inside full card */
.full-linked-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--color-border);
  width: 100%;
}

.full-linked-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
}

.full-linked-count svg { opacity: 0.6; }

.full-linked-empty {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.full-open-btn {
  font-size: 11px;
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  color: var(--color-accent);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  transition: opacity var(--motion-fast);
}
.full-open-btn:hover { opacity: 0.75; }

.full-actions {
  display: flex;
  gap: var(--space-2);
  padding-top: var(--space-2);
  width: 100%;
}

.full-btn {
  flex: 1;
  padding: 4px 8px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast);
  text-align: center;
}
.full-btn:hover { background: var(--color-border); color: var(--color-text); }
.full-btn.is-danger:hover { background: rgba(192,57,43,0.08); color: var(--color-danger); border-color: rgba(192,57,43,0.2); }

/* ─── Type colors (applied as currentColor) ────────────────────────────────── */
.type-release      { color: var(--color-accent); }
.type-performance  { color: #b45309; }
.type-milestone    { color: #7c3aed; }
.type-collaboration{ color: #2563eb; }

/* chip card border matches type — all classes live on .tl-node, so compound selectors */
.tl-node.type-release.tier-chip      .node-card { border-color: rgba(200,75,17,0.2); }
.tl-node.type-performance.tier-chip  .node-card { border-color: rgba(180,83,9,0.2); }
.tl-node.type-milestone.tier-chip    .node-card { border-color: rgba(124,58,237,0.2); }
.tl-node.type-collaboration.tier-chip .node-card { border-color: rgba(37,99,235,0.2); }

/* ─── Empty state ──────────────────────────────────────────────────────────── */
.tl-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.tl-empty svg { width: 64px; height: 64px; }

.tl-empty .tl-add-btn { pointer-events: auto; }

.tl-empty-text {
  font-size: var(--text-small);
  color: var(--color-text-tertiary);
  margin: 0;
}

/* ─── Hint bar ─────────────────────────────────────────────────────────────── */
.tl-hint {
  flex-shrink: 0;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  font-size: 11px;
  color: var(--color-text-tertiary);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  letter-spacing: 0.01em;
}

.tl-tier-badge {
  padding: 1px 6px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .tl-header { padding: 0 var(--space-4); height: 56px; }
  .tl-select { display: none; }
  .tl-title { font-size: 17px; }
}

/* ─── Placement mode cursor ─────────────────────────────────────────────────── */
.tl-canvas.is-placing { cursor: crosshair; }

.tl-placement-cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.placement-line {
  width: 1px;
  flex: 1;
  background: var(--color-accent);
  opacity: 0.6;
}

.placement-date-pill {
  position: absolute;
  top: 8px;
  background: var(--color-accent);
  color: #fff;
  font-size: 11px;
  font-weight: var(--weight-medium);
  padding: 3px 8px;
  border-radius: 100px;
  white-space: nowrap;
  letter-spacing: 0.01em;
  box-shadow: 0 2px 6px rgba(200,75,17,0.3);
}

/* ─── Canvas file drop overlay ──────────────────────────────────────────────── */
.tl-canvas.is-drop-over { outline: 2px dashed var(--color-accent); outline-offset: -4px; }

.tl-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 75, 17, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 30;
}

.drop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-8);
  background: var(--color-surface);
  border: 1.5px dashed var(--color-accent);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  font-size: 14px;
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.drop-inner svg { width: 24px; height: 24px; color: var(--color-accent); }

.drop-date-hint {
  font-size: 12px;
  color: var(--color-accent);
  font-weight: var(--weight-semibold);
}

/* ─── FAB ──────────────────────────────────────────────────────────────────── */
.tl-fab {
  position: absolute;
  bottom: 52px;   /* above hint bar */
  right: var(--space-6);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: background var(--motion-fast), transform var(--motion-fast), box-shadow var(--motion-fast);
  z-index: 10;
}

.tl-fab:hover { background: #2C2B28; box-shadow: var(--shadow-lg); transform: scale(1.05); }

.tl-fab.is-active {
  background: var(--color-accent);
  transform: rotate(45deg);
}

.tl-fab.is-active:hover { background: var(--color-accent-hover); }

.tl-fab svg { width: 16px; height: 16px; }

/* ─── Quick-add panel ──────────────────────────────────────────────────────── */
.tl-quick-add-panel {
  position: absolute;
  bottom: 28px;   /* above hint bar */
  left: 50%;
  transform: translateX(-50%);
  width: min(560px, calc(100% - 48px));
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 50;
  overflow: hidden;
}

.qa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  gap: var(--space-3);
}

.qa-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.qa-new-badge {
  font-size: 11px;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.qa-placed-date {
  font-size: 12px;
  font-weight: var(--weight-medium);
  color: var(--color-accent);
  padding: 1px 7px;
  background: var(--color-accent-subtle);
  border-radius: 100px;
}

.qa-close-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast);
}

.qa-close-btn svg { width: 12px; height: 12px; }
.qa-close-btn:hover { background: var(--color-border); color: var(--color-text); }

.qa-body {
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.qa-row-main {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.qa-title-input {
  flex: 1;
  height: 34px;
  padding: 0 var(--space-3);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 14px;
  font-family: var(--font-sans);
  font-weight: var(--weight-medium);
  transition: border-color var(--motion-fast);
  min-width: 0;
}

.qa-title-input::placeholder { color: var(--color-text-tertiary); font-weight: var(--weight-regular); }
.qa-title-input:focus { outline: none; border-color: var(--color-accent); }

.qa-type-select {
  height: 34px;
  padding: 0 var(--space-3);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-sans);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.qa-type-select:focus { outline: none; border-color: var(--color-accent); }

.qa-date-input {
  height: 34px;
  padding: 0 var(--space-3);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-sans);
  cursor: pointer;
  flex-shrink: 0;
}

.qa-date-input:focus { outline: none; border-color: var(--color-accent); }

/* Drop zone */
.qa-drop-zone {
  min-height: 64px;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  padding: var(--space-3);
  transition: border-color var(--motion-fast), background var(--motion-fast);
}

.qa-drop-zone:hover { border-color: var(--color-border-strong); background: var(--color-surface-raised); }
.qa-drop-zone.is-drag-over { border-color: var(--color-accent); background: var(--color-accent-subtle); }
.qa-drop-zone svg { width: 18px; height: 18px; color: var(--color-text-tertiary); }

.qa-drop-label { font-size: 13px; color: var(--color-text-secondary); font-weight: var(--weight-medium); }
.qa-drop-hint { font-size: 11px; color: var(--color-text-tertiary); }

.qa-file-input { display: none; }

.qa-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  width: 100%;
}

.qa-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 6px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 12px;
  color: var(--color-text-secondary);
  max-width: 180px;
}

.qa-file-icon { flex-shrink: 0; font-style: normal; }
.qa-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }

.qa-file-remove {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border);
  border: none;
  border-radius: 50%;
  font-size: 10px;
  color: var(--color-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
  padding: 0;
}

.qa-file-remove:hover { background: var(--color-danger-subtle); color: var(--color-danger); }

.qa-add-more-btn {
  background: transparent;
  border: none;
  font-size: 12px;
  color: var(--color-accent);
  cursor: pointer;
  padding: 3px 4px;
  white-space: nowrap;
}

.qa-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-raised);
}

.qa-btn-cancel {
  height: 32px;
  padding: 0 var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast);
}

.qa-btn-cancel:hover { background: var(--color-border); color: var(--color-text); }

.qa-btn-save {
  height: 32px;
  padding: 0 var(--space-4);
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-surface);
  font-size: 13px;
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast);
}

.qa-btn-save:hover:not(:disabled) { background: #2C2B28; }
.qa-btn-save:disabled { opacity: 0.4; cursor: default; }

/* ─── Hint bar keyboard hint ─────────────────────────────────────────────────── */
kbd {
  display: inline-block;
  padding: 0 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  color: var(--color-text-secondary);
}

/* ─── Transitions ────────────────────────────────────────────────────────────── */
.qa-slide-enter-active { transition: transform 200ms ease, opacity 200ms ease; }
.qa-slide-leave-active { transition: transform 150ms ease, opacity 150ms ease; }
.qa-slide-enter-from  { transform: translateX(-50%) translateY(16px); opacity: 0; }
.qa-slide-leave-to    { transform: translateX(-50%) translateY(16px); opacity: 0; }
.qa-slide-enter-to    { transform: translateX(-50%) translateY(0); }
.qa-slide-leave-from  { transform: translateX(-50%) translateY(0); }

.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
