<!-- components/DynamicCard.vue -->
<template>
  <div
    class="dynamic-card"
    :class="[
      `card-${variant}`,
      `card-${size}`,
      {
        'card-interactive': interactive,
        'card-selected': selected,
        'card-draggable': draggable
      }
    ]"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @dragstart="handleDragStart"
    :draggable="draggable"
  >
    <!-- Card Cover/Image -->
    <div v-if="coverImage || showCoverPlaceholder" class="card-cover">
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="title"
        class="cover-image"
        @error="handleImageError"
        @load="handleImageLoad"
      />
      <div v-else class="cover-placeholder" :style="placeholderStyle">
        <div class="placeholder-icon">
          <component :is="getPlaceholderIcon()" />
        </div>
        <div v-if="showInitial && title" class="placeholder-initial">
          {{ title.charAt(0).toUpperCase() }}
        </div>
      </div>

      <!-- Overlay Actions -->
      <div class="cover-overlay" v-if="interactive">
        <button
          v-if="showPlayButton"
          @click.stop="$emit('play', item)"
          class="play-button"
          :class="{ 'play-active': isPlaying }"
        >
          <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>

        <div class="overlay-actions">
          <button
            v-if="showFavoriteButton"
            @click.stop="toggleFavorite"
            class="overlay-btn favorite-btn"
            :class="{ active: isFavorite }"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>

          <button
            v-if="showMoreButton"
            @click.stop="$emit('more', item, $event)"
            class="overlay-btn more-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Status Indicators -->
      <div class="card-indicators" v-if="hasIndicators">
        <div v-if="isOnline" class="status-indicator online" title="Online"></div>
        <div v-if="isNew" class="status-indicator new" title="New">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div v-if="isPrivate" class="status-indicator private" title="Private">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V18H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Card Content -->
    <div class="card-content" :class="{ 'no-cover': !coverImage && !showCoverPlaceholder }">
      <!-- Header -->
      <div class="card-header">
        <h3 class="card-title" :title="title">{{ title }}</h3>
        <div v-if="badge" class="card-badge" :class="`badge-${badge.type}`">
          {{ badge.text }}
        </div>
      </div>

      <!-- Subtitle/Meta -->
      <p v-if="subtitle" class="card-subtitle" :title="subtitle">{{ subtitle }}</p>

      <!-- Custom Content Slot -->
      <div v-if="$slots.content" class="card-custom-content">
        <slot name="content" :item="item" />
      </div>

      <!-- Metadata -->
      <div v-if="metadata.length > 0" class="card-metadata">
        <div
          v-for="(meta, index) in visibleMetadata"
          :key="index"
          class="metadata-item"
          :class="`metadata-${meta.type}`"
        >
          <svg v-if="meta.icon" viewBox="0 0 24 24" fill="currentColor">
            <path :d="meta.icon"/>
          </svg>
          <span>{{ meta.value }}</span>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="tags.length > 0" class="card-tags">
        <span
          v-for="tag in visibleTags"
          :key="tag"
          class="card-tag"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Actions Footer -->
      <div v-if="actions.length > 0" class="card-actions">
        <button
          v-for="action in actions"
          :key="action.key"
          @click.stop="$emit('action', action.key, item)"
          class="card-action-btn"
          :class="`action-${action.type}`"
          :title="action.tooltip"
        >
          <svg v-if="action.icon" viewBox="0 0 24 24" fill="currentColor">
            <path :d="action.icon"/>
          </svg>
          <span v-if="action.label">{{ action.label }}</span>
        </button>
      </div>
    </div>

    <!-- Selection Checkbox -->
    <div v-if="selectable" class="card-selection">
      <label class="selection-checkbox">
        <input
          type="checkbox"
          :checked="selected"
          @change="$emit('toggle-selection', item)"
        />
        <span class="checkbox-visual"></span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, h } from 'vue'

// Props
const props = defineProps({
  // Item data
  item: {
    type: Object,
    required: true
  },

  // Display properties
  title: {
    type: String,
    required: true
  },
  subtitle: String,
  coverImage: String,
  showCoverPlaceholder: {
    type: Boolean,
    default: true
  },
  showInitial: {
    type: Boolean,
    default: true
  },

  // Card configuration
  variant: {
    type: String,
    default: 'default', // 'default', 'compact', 'list', 'hero'
    validator: (value) => ['default', 'compact', 'list', 'hero'].includes(value)
  },
  size: {
    type: String,
    default: 'medium', // 'small', 'medium', 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },

  // Interaction
  interactive: {
    type: Boolean,
    default: true
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  },
  draggable: {
    type: Boolean,
    default: false
  },

  // Status
  isPlaying: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },

  // Content
  badge: Object, // { text: string, type: string }
  metadata: {
    type: Array,
    default: () => []
  },
  tags: {
    type: Array,
    default: () => []
  },
  actions: {
    type: Array,
    default: () => []
  },

  // Button visibility
  showPlayButton: {
    type: Boolean,
    default: true
  },
  showFavoriteButton: {
    type: Boolean,
    default: true
  },
  showMoreButton: {
    type: Boolean,
    default: true
  },

  // Colors
  accentColor: String,
  placeholderColor: String
})

// Emits
const emit = defineEmits([
  'click',
  'contextmenu',
  'play',
  'favorite',
  'more',
  'action',
  'toggle-selection',
  'drag-start'
])

// Injected services
const showToast = inject('showToast', () => {})

// Computed
const hasIndicators = computed(() => {
  return props.isOnline || props.isNew || props.isPrivate
})

const placeholderStyle = computed(() => {
  const color = props.placeholderColor || props.accentColor || '#1db954'
  return {
    background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -20)})`
  }
})

const visibleMetadata = computed(() => {
  // Limit metadata items based on card size
  const limits = { small: 2, medium: 3, large: 5 }
  const limit = limits[props.size] || 3
  return props.metadata.slice(0, limit)
})

const visibleTags = computed(() => {
  // Limit tags based on card size
  const limits = { small: 2, medium: 4, large: 6 }
  const limit = limits[props.size] || 4
  return props.tags.slice(0, limit)
})

// Methods
const handleClick = (event) => {
  if (props.interactive) {
    emit('click', props.item, event)
  }
}

const handleContextMenu = (event) => {
  emit('contextmenu', props.item, event)
}

const handleDragStart = (event) => {
  if (props.draggable) {
    emit('drag-start', props.item, event)
  }
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const handleImageLoad = (event) => {
  event.target.style.opacity = '1'
}

const toggleFavorite = () => {
  emit('favorite', props.item, !props.isFavorite)
  showToast({
    message: props.isFavorite ? 'Removed from favorites' : 'Added to favorites',
    type: 'success'
  })
}

const getPlaceholderIcon = () => {
  // Return appropriate icon based on item type
  const iconMap = {
    song: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' })),
    artist: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' })),
    playlist: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z' })),
    album: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' },
      h('path', { d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z' }))
  }

  const type = props.item?.type || 'song'
  return iconMap[type] || iconMap.song
}

const adjustColor = (color, amount) => {
  // Simple color adjustment utility
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
</script>

<style scoped>
.dynamic-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  position: relative;
  backdrop-filter: blur(var(--blur-amount));
  -webkit-backdrop-filter: blur(var(--blur-amount));
}

/* Card Variants */
.card-default {
  display: flex;
  flex-direction: column;
}

.card-compact {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px;
}

.card-list {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
}

.card-hero {
  aspect-ratio: 16/9;
  position: relative;
}

/* Card Sizes */
.card-small {
  min-width: 120px;
}

.card-medium {
  min-width: 160px;
}

.card-large {
  min-width: 200px;
}

/* Interactive States */
.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.card-selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.3);
}

.card-draggable:active {
  transform: rotate(5deg) scale(0.95);
  opacity: 0.8;
}

/* Cover Section */
.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.card-compact .card-cover,
.card-list .card-cover {
  width: 48px;
  height: 48px;
  aspect-ratio: 1;
  border-radius: 4px;
  flex-shrink: 0;
}

.card-hero .card-cover {
  position: absolute;
  inset: 0;
  aspect-ratio: 16/9;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: white;
}

.placeholder-icon {
  width: 40%;
  height: 40%;
  opacity: 0.8;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.placeholder-initial {
  position: absolute;
  font-size: 1.5em;
  font-weight: 700;
  opacity: 0.9;
}

/* Cover Overlay */
.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-cover:hover .cover-overlay {
  opacity: 1;
}

.play-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: black;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  transform: scale(0.8);
}

.cover-overlay:hover .play-button {
  transform: scale(1);
}

.play-button.play-active {
  background: var(--accent-primary);
  color: white;
}

.play-button svg {
  width: 20px;
  height: 20px;
  margin-left: 2px;
}

.overlay-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.overlay-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.8;
}

.overlay-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  opacity: 1;
  transform: scale(1.1);
}

.overlay-btn.active {
  background: var(--accent-primary);
}

.overlay-btn svg {
  width: 16px;
  height: 16px;
}

/* Card Indicators */
.card-indicators {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.status-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.status-indicator.online {
  background: #10b981;
}

.status-indicator.new {
  background: #f59e0b;
}

.status-indicator.private {
  background: #8b5cf6;
}

.status-indicator svg {
  width: 12px;
  height: 12px;
}

/* Card Content */
.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-compact .card-content,
.card-list .card-content {
  padding: 0 12px;
  gap: 4px;
}

.card-content.no-cover {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.card-large .card-title {
  font-size: 16px;
}

.card-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.badge-primary {
  background: var(--accent-primary);
  color: white;
}

.badge-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.badge-success {
  background: #10b981;
  color: white;
}

.badge-warning {
  background: #f59e0b;
  color: white;
}

.badge-error {
  background: #ef4444;
  color: white;
}

/* Custom Content */
.card-custom-content {
  flex: 1;
}

/* Metadata */
.card-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.metadata-item svg {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}

/* Tags */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  color: var(--text-secondary);
}

/* Actions */
.card-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.card-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-primary {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.card-action-btn svg {
  width: 12px;
  height: 12px;
}

/* Selection */
.card-selection {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}

.selection-checkbox {
  display: flex;
  cursor: pointer;
}

.selection-checkbox input {
  display: none;
}

.checkbox-visual {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  transition: all 0.2s ease;
  position: relative;
}

.selection-checkbox input:checked + .checkbox-visual {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.selection-checkbox input:checked + .checkbox-visual::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 3px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-content {
    padding: 12px;
  }

  .card-metadata {
    display: none;
  }

  .card-tags {
    display: none;
  }

  .overlay-actions {
    display: none;
  }
}
</style>