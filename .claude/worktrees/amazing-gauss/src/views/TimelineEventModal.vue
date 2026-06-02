<template>
  <Teleport to="body">
    <div class="tem-backdrop" @mousedown.self="$emit('close')">
      <div class="tem-panel" role="dialog" aria-modal="true">

        <!-- ── Event header ──────────────────────────────────────────────── -->
        <div class="tem-header">
          <div class="tem-header-meta">
            <span class="tem-type-pill" :style="{ color: typeColor, borderColor: typeColor + '2a', background: typeColor + '0d' }">
              {{ formatType(event.type) }}
            </span>
            <span class="tem-status" :class="{ done: event.completed }">
              <span class="tem-status-dot"></span>
              {{ event.completed ? 'Completed' : 'Upcoming' }}
            </span>
          </div>
          <button class="tem-close" @click="$emit('close')" aria-label="Close">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
            </svg>
          </button>
        </div>

        <!-- ── Event info ────────────────────────────────────────────────── -->
        <div class="tem-info">
          <h2 class="tem-title">{{ event.title }}</h2>
          <p class="tem-date">{{ formatDate(event.date) }}</p>
          <p v-if="event.description" class="tem-desc">{{ event.description }}</p>

          <div v-if="event.details && Object.keys(event.details).length" class="tem-kv">
            <div v-for="(val, key) in event.details" :key="key" class="tem-kv-row">
              <span class="tem-kv-k">{{ formatLabel(key) }}</span>
              <span class="tem-kv-v">{{ val }}</span>
            </div>
          </div>

          <div v-if="event.links?.length" class="tem-ext-links">
            <a v-for="link in event.links" :key="link.url" :href="link.url" target="_blank" class="tem-ext-link">
              <svg viewBox="0 0 12 12" fill="currentColor">
                <path d="M8 1H11V4M11 1L6 6M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V8" stroke="currentColor" stroke-width="1.25" fill="none"/>
              </svg>
              {{ link.label }}
            </a>
          </div>
        </div>

        <div class="tem-divider"></div>

        <!-- ── Content body: attachment list OR picker ───────────────────── -->
        <div class="tem-body">

          <!-- ─ Attachment list ─ -->
          <template v-if="!showPicker">
            <div class="tem-section-hd">
              <div class="tem-section-title">
                Linked Content
                <span v-if="localAtts.length" class="tem-att-count">{{ localAtts.length }}</span>
              </div>
              <button class="tem-link-btn" @click="openPicker()">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
                </svg>
                Link Content
              </button>
            </div>

            <!-- Attachments -->
            <div v-if="localAtts.length" class="tem-att-list">
              <div v-for="att in localAtts" :key="att.id" class="tem-att-row">
                <div class="tem-att-icon" :class="'tem-icon--' + att.type">
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                    <path :d="attIconPath(att.type)"/>
                  </svg>
                </div>
                <div class="tem-att-body">
                  <span class="tem-att-name">{{ att.label }}</span>
                  <span class="tem-att-sub">{{ att.subtitle }}</span>
                </div>
                <div class="tem-att-actions">
                  <a v-if="att.url" :href="att.url" target="_blank" class="tem-att-btn">Open ↗</a>
                  <button v-else class="tem-att-btn" @click="openAttInApp(att)">Open</button>
                  <button class="tem-att-btn is-unlink" @click="removeAtt(att.id)">Unlink</button>
                </div>
              </div>
            </div>

            <!-- Empty -->
            <div v-else class="tem-att-empty">
              <svg viewBox="0 0 40 40" fill="none">
                <rect x="8" y="8" width="24" height="24" rx="3" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>
                <line x1="14" y1="20" x2="26" y2="20" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
                <line x1="20" y1="14" x2="20" y2="26" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
              </svg>
              <p>No linked content yet</p>
            </div>

            <!-- Smart suggestions -->
            <div class="tem-suggestions">
              <p class="tem-sug-label">Quick links for {{ formatType(event.type) }} events</p>
              <div class="tem-sug-chips">
                <button
                  v-for="s in activeSuggestions"
                  :key="s.label"
                  class="tem-sug-chip"
                  @click="openPicker(s.pickerType)"
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                    <path :d="attIconPath(s.pickerType)"/>
                  </svg>
                  {{ s.label }}
                </button>
              </div>
            </div>
          </template>

          <!-- ─ Content picker ─ -->
          <template v-else>
            <div class="tem-picker-hd">
              <button class="tem-back-btn" @click="closePicker">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="10 3 5 8 10 13"/>
                </svg>
                Back
              </button>
              <span class="tem-picker-title">Link Content</span>
            </div>

            <!-- Type tabs -->
            <div class="tem-tabs" role="tablist">
              <button
                v-for="tab in pickerTabs"
                :key="tab.type"
                role="tab"
                class="tem-tab"
                :class="{ active: activeType === tab.type }"
                @click="activeType = tab.type; search = ''"
              >
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" class="tab-icon">
                  <path :d="attIconPath(tab.type)"/>
                </svg>
                {{ tab.label }}
              </button>
            </div>

            <!-- External link form -->
            <div v-if="activeType === 'link'" class="tem-link-form">
              <label class="tem-form-label">URL</label>
              <input v-model="linkUrl" type="url" placeholder="https://..." class="tem-input" @keydown.enter="addLink"/>
              <label class="tem-form-label">Label <span class="tem-label-opt">(optional)</span></label>
              <input v-model="linkLabel" placeholder="e.g. Spotify, Album Review, Venue…" class="tem-input" @keydown.enter="addLink"/>
              <button class="tem-add-btn" :disabled="!linkUrl.trim()" @click="addLink">
                Add Link
              </button>
            </div>

            <!-- Content browser -->
            <div v-else class="tem-browser">
              <div class="tem-search-wrap">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="search-icon">
                  <circle cx="6.5" cy="6.5" r="4"/><line x1="10" y1="10" x2="14" y2="14"/>
                </svg>
                <input v-model="search" :placeholder="`Search ${activeType}s…`" class="tem-search"/>
              </div>
              <div class="tem-item-list">
                <div
                  v-for="item in filteredItems"
                  :key="item.id"
                  class="tem-item"
                  :class="{ 'is-linked': isLinked(item.id) }"
                  @click="toggleItem(item)"
                >
                  <div class="tem-item-icon" :class="'tem-icon--' + item.type">
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
                      <path :d="attIconPath(item.type)"/>
                    </svg>
                  </div>
                  <div class="tem-item-body">
                    <span class="tem-item-name">{{ item.label }}</span>
                    <span class="tem-item-sub">{{ item.subtitle }}</span>
                  </div>
                  <div class="tem-item-check" :class="{ visible: isLinked(item.id) }">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="2 8 6 12 14 4"/>
                    </svg>
                  </div>
                </div>
                <div v-if="filteredItems.length === 0" class="tem-no-results">
                  No {{ activeType }}s found
                </div>
              </div>
            </div>
          </template>

        </div><!-- /tem-body -->
      </div><!-- /tem-panel -->
    </div><!-- /tem-backdrop -->
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'

const props = defineProps({
  event: { type: Object, required: true }
})
const emit = defineEmits(['close', 'update-attachments'])

const showToast = inject('showToast', () => {})

// ─── Local attachment state ────────────────────────────────────────────────────
const localAtts = ref([...(props.event.attachments || [])])

// ─── Picker state ─────────────────────────────────────────────────────────────
const showPicker = ref(false)
const activeType = ref('track')
const search = ref('')
const linkUrl = ref('')
const linkLabel = ref('')

// ─── SVG icon paths (16×16 viewBox) ──────────────────────────────────────────
const ICON_PATHS = {
  track:       'M8 3v6.18A3 3 0 1 0 10 12V5h3V3H8zm-2 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  playlist:    'M2 5h12v2H2V5zm0 4h12v2H2V9zm0 4h8v2H2v-2z',
  image:       'M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 13V2h12v11H2zm2.5-4L6 11l2.5-3L11 11H5l-.5-2z',
  file:        'M9 1H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5L9 1zm0 1.5L12.5 5H9V2.5zM3 14V2h5v4h4v8H3z',
  link:        'M7 5.5a3.5 3.5 0 0 1 4.95 4.95l-1.5 1.5a3.5 3.5 0 0 1-5.196-.303.75.75 0 0 1 1.06-1.06 2 2 0 0 0 2.83 0l1.5-1.5A2 2 0 0 0 7.9 6.16L7 7.06a.75.75 0 0 1-1.06-1.06L7 5.5zM4.5 10.56l-1.5 1.5a2 2 0 1 0 2.83 2.83l1.5-1.5a2 2 0 0 0-2.83-2.83zm.94-1.5a3.5 3.5 0 0 0-4.95 4.95l1.5-1.5a2 2 0 0 1 2.12 2.12l-1.5 1.5a3.5 3.5 0 0 0 4.95-4.95l-1.06 1.06a.75.75 0 0 1-1.06-1.06l-1.06-1.06a.75.75 0 0 1 1.06-1.06z',
  artist:      'M8 1a3 3 0 1 1 0 6A3 3 0 0 1 8 1zm0 8c3.3 0 6 1.34 6 3v1H2v-1c0-1.66 2.7-3 6-3z',
  release:     'M8 3v6.18A3 3 0 1 0 10 12V5h3V3H8z',
  performance: 'M12 2l2.4 4.9L20 7.6l-4 3.9.9 5.5L12 14.5l-4.9 2.5.9-5.5L4 7.6l5.6-.7z',
  milestone:   'M8 1l2 5h5l-4 3 1.5 5L8 11.5 3.5 14 5 9 1 6h5z',
  collaboration: 'M5 1a3 3 0 1 1 0 6A3 3 0 0 1 5 1zm6 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM1 13c0-2.2 1.8-4 4-4 .9 0 1.7.3 2.4.8A5 5 0 0 0 6 13v1H1v-1zm8 0c0-1.5.7-2.8 1.8-3.7A4 4 0 0 1 11 9c2.2 0 4 1.8 4 4v1H9v-1z',
}

const attIconPath = (type) => ICON_PATHS[type] || ICON_PATHS.file

// ─── Type colors ──────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  release: 'var(--color-accent)',
  performance: '#b45309',
  milestone: '#7c3aed',
  collaboration: '#2563eb',
}
const typeColor = computed(() => TYPE_COLORS[props.event.type] || 'var(--color-text-secondary)')

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatType = (type) =>
  ({ release: 'Release', performance: 'Performance', milestone: 'Milestone', collaboration: 'Collaboration' }[type] || type)

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const formatLabel = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

// ─── Picker tabs (reordered by event type) ────────────────────────────────────
const TAB_PRIORITY = {
  release:       ['track', 'image', 'link', 'file', 'playlist', 'artist'],
  performance:   ['playlist', 'image', 'link', 'track', 'file', 'artist'],
  milestone:     ['link', 'image', 'track', 'file', 'playlist', 'artist'],
  collaboration: ['artist', 'track', 'file', 'link', 'image', 'playlist'],
}

const ALL_TABS = [
  { type: 'track',    label: 'Tracks' },
  { type: 'playlist', label: 'Playlists' },
  { type: 'image',    label: 'Images' },
  { type: 'file',     label: 'Files' },
  { type: 'link',     label: 'Link' },
  { type: 'artist',   label: 'Artists' },
]

const pickerTabs = computed(() => {
  const order = TAB_PRIORITY[props.event.type] || TAB_PRIORITY.release
  return order.map(t => ALL_TABS.find(a => a.type === t)).filter(Boolean)
})

// ─── Mock content library ─────────────────────────────────────────────────────
const MOCK_LIBRARY = {
  track: [
    { id: 's1', type: 'track',    label: 'Midnight Dreams',            subtitle: 'Single · 3:42' },
    { id: 's2', type: 'track',    label: 'Summer Vibes',               subtitle: 'Single · 4:15' },
    { id: 's3', type: 'track',    label: 'Golden Hour',                subtitle: 'Album track · 5:01' },
    { id: 's4', type: 'track',    label: 'The Collab (feat. T.S.)',    subtitle: 'Single (unreleased) · 3:55' },
    { id: 's5', type: 'track',    label: 'Holiday Wishes',             subtitle: 'EP track · 3:28' },
    { id: 's6', type: 'track',    label: 'Acoustic Midnight',          subtitle: 'Demo · 3:12' },
  ],
  playlist: [
    { id: 'p1', type: 'playlist', label: 'Summer Tour Setlist',        subtitle: 'Playlist · 22 tracks' },
    { id: 'p2', type: 'playlist', label: 'Holiday EP — Full Set',      subtitle: 'Playlist · 5 tracks' },
    { id: 'p3', type: 'playlist', label: 'Acoustic Sessions',          subtitle: 'Playlist · 8 tracks' },
    { id: 'p4', type: 'playlist', label: 'Festival Warmup Mix',        subtitle: 'Playlist · 12 tracks' },
  ],
  image: [
    { id: 'i1', type: 'image',    label: 'Midnight Dreams — Cover',   subtitle: 'JPEG · 3000×3000' },
    { id: 'i2', type: 'image',    label: 'Summer Tour Press Shot',    subtitle: 'PNG · 2400×3000' },
    { id: 'i3', type: 'image',    label: 'Gold Certification Plaque', subtitle: 'JPEG · 1800×1200' },
    { id: 'i4', type: 'image',    label: 'Holiday EP Artwork',        subtitle: 'PNG · 3000×3000' },
    { id: 'i5', type: 'image',    label: 'Festival Stage Photo',      subtitle: 'JPEG · 4000×2667' },
  ],
  file: [
    { id: 'f1', type: 'file',     label: 'Collaboration Agreement',   subtitle: 'PDF · 2.4 MB' },
    { id: 'f2', type: 'file',     label: 'Tour Rider 2024',           subtitle: 'DOCX · 840 KB' },
    { id: 'f3', type: 'file',     label: 'Distribution Contract',     subtitle: 'PDF · 1.1 MB' },
    { id: 'f4', type: 'file',     label: 'Gold Cert Press Release',   subtitle: 'PDF · 320 KB' },
    { id: 'f5', type: 'file',     label: 'Sync License — Track 1',    subtitle: 'PDF · 540 KB' },
  ],
  artist: [
    { id: 'a1', type: 'artist',   label: 'Taylor Swift',              subtitle: 'Featured Artist' },
    { id: 'a2', type: 'artist',   label: 'Alex Johnson',              subtitle: 'Producer' },
    { id: 'a3', type: 'artist',   label: 'Sarah Chen',                subtitle: 'Co-writer' },
    { id: 'a4', type: 'artist',   label: 'Marcus Davis',              subtitle: 'Session Musician' },
  ],
}

const filteredItems = computed(() => {
  const items = MOCK_LIBRARY[activeType.value] || []
  const q = search.value.toLowerCase().trim()
  return q ? items.filter(i => i.label.toLowerCase().includes(q)) : items
})

// ─── Smart suggestions by event type ─────────────────────────────────────────
const SUGGESTIONS = {
  release: [
    { label: 'Track',           pickerType: 'track',    description: 'Connect the released track or album' },
    { label: 'Cover Art',       pickerType: 'image',    description: 'Upload or link the artwork' },
    { label: 'Streaming Link',  pickerType: 'link',     description: 'Spotify, Apple Music, etc.' },
    { label: 'Press Release',   pickerType: 'file',     description: 'Attach the announcement doc' },
  ],
  performance: [
    { label: 'Setlist',         pickerType: 'playlist', description: 'Playlist of songs performed' },
    { label: 'Photos',          pickerType: 'image',    description: 'Performance photography' },
    { label: 'Venue Link',      pickerType: 'link',     description: 'Venue website or ticket link' },
    { label: 'Tour Rider',      pickerType: 'file',     description: 'Technical & hospitality rider' },
  ],
  milestone: [
    { label: 'Press Coverage',  pickerType: 'link',     description: 'Articles, reviews, write-ups' },
    { label: 'Certificate',     pickerType: 'image',    description: 'Award or certification scan' },
    { label: 'Related Track',   pickerType: 'track',    description: 'The track that hit this milestone' },
    { label: 'Chart Link',      pickerType: 'link',     description: 'Link to the chart or platform' },
  ],
  collaboration: [
    { label: 'Collaborator',    pickerType: 'artist',   description: 'Artist profile for co-creator' },
    { label: 'Resulting Track', pickerType: 'track',    description: 'The song that came out of this' },
    { label: 'Agreement',       pickerType: 'file',     description: 'Partnership or split sheet' },
    { label: 'Announcement',    pickerType: 'link',     description: 'Press announcement or social post' },
  ],
}

const activeSuggestions = computed(() =>
  SUGGESTIONS[props.event.type] || SUGGESTIONS.milestone
)

// ─── Picker open/close ────────────────────────────────────────────────────────
const openPicker = (type) => {
  activeType.value = type || pickerTabs.value[0]?.type || 'track'
  search.value = ''
  linkUrl.value = ''
  linkLabel.value = ''
  showPicker.value = true
}

const closePicker = () => {
  showPicker.value = false
  search.value = ''
}

// ─── Attachment CRUD ──────────────────────────────────────────────────────────
const isLinked = (id) => localAtts.value.some(a => a.id === id)

const toggleItem = (item) => {
  if (isLinked(item.id)) {
    localAtts.value = localAtts.value.filter(a => a.id !== item.id)
  } else {
    localAtts.value.push({ ...item })
  }
  emit('update-attachments', [...localAtts.value])
}

const addLink = () => {
  const url = linkUrl.value.trim()
  if (!url) return
  let label = linkLabel.value.trim()
  if (!label) {
    try { label = new URL(url).hostname.replace('www.', '') } catch { label = url }
  }
  const att = {
    id: `link-${Date.now()}`,
    type: 'link',
    label,
    subtitle: url,
    url
  }
  localAtts.value.push(att)
  emit('update-attachments', [...localAtts.value])
  linkUrl.value = ''
  linkLabel.value = ''
  closePicker()
}

const removeAtt = (id) => {
  localAtts.value = localAtts.value.filter(a => a.id !== id)
  emit('update-attachments', [...localAtts.value])
}

const openAttInApp = (att) => {
  if (att.url) {
    window.open(att.url, '_blank')
  } else {
    const typeLabel = { track: 'track', playlist: 'playlist', image: 'image', file: 'file', artist: 'artist profile' }[att.type] || 'item'
    showToast({ message: `Opening ${typeLabel}: ${att.label}`, type: 'info' })
  }
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
onMounted(() => {
  const onKey = (e) => {
    if (e.key === 'Escape') {
      if (showPicker.value) closePicker()
      else emit('close')
    }
  }
  window.addEventListener('keydown', onKey)
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})
</script>

<style scoped>
/* ─── Backdrop ─────────────────────────────────────────────────────────────── */
.tem-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
  backdrop-filter: blur(2px);
  animation: tem-fade-in 0.15s ease;
}

@keyframes tem-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ─── Panel ────────────────────────────────────────────────────────────────── */
.tem-panel {
  width: 100%;
  max-width: 540px;
  max-height: 88vh;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-xl, 0 24px 64px rgba(0,0,0,0.18));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: tem-slide-up 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tem-slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* ─── Header ───────────────────────────────────────────────────────────────── */
.tem-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.tem-header-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.tem-type-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border: 1px solid;
  border-radius: 100px;
  font-size: 10px;
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.tem-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.tem-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border-strong);
}

.tem-status.done .tem-status-dot {
  background: #22c55e;
}

.tem-status.done {
  color: #16a34a;
}

.tem-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast);
}
.tem-close svg { width: 13px; height: 13px; }
.tem-close:hover { background: var(--color-surface-raised); color: var(--color-text); }

/* ─── Event info ───────────────────────────────────────────────────────────── */
.tem-info {
  flex-shrink: 0;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tem-title {
  font-size: 22px;
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.2;
}

.tem-date {
  font-size: 13px;
  color: var(--color-text-tertiary);
  margin: 0;
}

.tem-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.55;
  margin: 4px 0 0;
}

.tem-kv {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-top: var(--space-2);
}

.tem-kv-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tem-kv-k {
  font-size: 10px;
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
}

.tem-kv-v {
  font-size: 13px;
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.tem-ext-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.tem-ext-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--motion-fast);
}
.tem-ext-link svg { width: 11px; height: 11px; opacity: 0.6; }
.tem-ext-link:hover { color: var(--color-accent); border-color: rgba(200,75,17,0.2); background: var(--color-accent-subtle); }

/* ─── Divider ──────────────────────────────────────────────────────────────── */
.tem-divider {
  flex-shrink: 0;
  height: 1px;
  background: var(--color-border);
}

/* ─── Body (scrollable) ────────────────────────────────────────────────────── */
.tem-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 0;
}

/* scrollbar */
.tem-body::-webkit-scrollbar { width: 4px; }
.tem-body::-webkit-scrollbar-track { background: transparent; }
.tem-body::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 2px; }

/* ─── Section header ───────────────────────────────────────────────────────── */
.tem-section-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tem-section-title {
  font-size: 11px;
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.tem-att-count {
  padding: 0 6px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
}

.tem-link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 5px 12px;
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast);
}
.tem-link-btn svg { width: 11px; height: 11px; }
.tem-link-btn:hover { background: #2c2b28; }

/* ─── Attachment list ──────────────────────────────────────────────────────── */
.tem-att-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tem-att-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color var(--motion-fast);
}
.tem-att-row:hover { border-color: var(--color-border-strong); }

.tem-att-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Icon color per type */
.tem-icon--track       { background: rgba(200,75,17,0.08);  color: var(--color-accent); }
.tem-icon--playlist    { background: rgba(245,158,11,0.08); color: #b45309; }
.tem-icon--image       { background: rgba(168,85,247,0.08); color: #7c3aed; }
.tem-icon--file        { background: rgba(59,130,246,0.08); color: #2563eb; }
.tem-icon--link        { background: rgba(20,184,166,0.08); color: #0d9488; }
.tem-icon--artist      { background: rgba(236,72,153,0.08); color: #db2777; }

.tem-att-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.tem-att-name {
  font-size: 13px;
  font-weight: var(--weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tem-att-sub {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.tem-att-actions {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

.tem-att-btn {
  padding: 3px 8px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all var(--motion-fast);
  white-space: nowrap;
}
.tem-att-btn:hover { background: var(--color-border); color: var(--color-text); }
.tem-att-btn.is-unlink:hover { background: rgba(192,57,43,0.08); color: var(--color-danger); border-color: rgba(192,57,43,0.2); }

/* ─── Empty attachments ────────────────────────────────────────────────────── */
.tem-att-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-4);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
}
.tem-att-empty svg { width: 40px; height: 40px; opacity: 0.5; }
.tem-att-empty p  { font-size: 13px; margin: 0; color: var(--color-text-tertiary); }

/* ─── Suggestions ──────────────────────────────────────────────────────────── */
.tem-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tem-sug-label {
  font-size: 10px;
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  margin: 0;
}

.tem-sug-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tem-sug-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  font-size: 12px;
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast);
}
.tem-sug-chip svg { opacity: 0.6; }
.tem-sug-chip:hover {
  background: var(--color-accent-subtle);
  border-color: rgba(200,75,17,0.25);
  color: var(--color-accent);
}
.tem-sug-chip:hover svg { opacity: 1; }

/* ─── Picker header ────────────────────────────────────────────────────────── */
.tem-picker-hd {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.tem-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast);
}
.tem-back-btn svg { width: 12px; height: 12px; }
.tem-back-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }

.tem-picker-title {
  font-size: 13px;
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

/* ─── Tabs ─────────────────────────────────────────────────────────────────── */
.tem-tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow-x: auto;
}
.tem-tabs::-webkit-scrollbar { height: 0; }

.tem-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-sans);
  color: var(--color-text-tertiary);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--motion-fast);
}
.tab-icon { opacity: 0.6; }
.tem-tab:hover { color: var(--color-text-secondary); background: var(--color-surface-raised); }
.tem-tab.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}
.tem-tab.active .tab-icon { opacity: 1; }

/* ─── Link form ────────────────────────────────────────────────────────────── */
.tem-link-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.tem-form-label {
  font-size: 11px;
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: -4px;
}

.tem-label-opt { color: var(--color-text-tertiary); font-weight: var(--weight-normal); }

.tem-input {
  padding: 8px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-sans);
  transition: border-color var(--motion-fast);
}
.tem-input:focus { outline: none; border-color: var(--color-accent); }
.tem-input::placeholder { color: var(--color-text-tertiary); }

.tem-add-btn {
  padding: 8px 16px;
  background: var(--color-text);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast);
  align-self: flex-start;
  margin-top: var(--space-1);
}
.tem-add-btn:hover:not(:disabled) { background: #2c2b28; }
.tem-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ─── Browser / search ─────────────────────────────────────────────────────── */
.tem-browser {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-height: 0;
}

.tem-search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.4;
  pointer-events: none;
  width: 14px;
  height: 14px;
}

.tem-search {
  width: 100%;
  padding: 8px 12px 8px 32px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 13px;
  font-family: var(--font-sans);
  box-sizing: border-box;
  transition: border-color var(--motion-fast);
}
.tem-search:focus { outline: none; border-color: var(--color-accent); }
.tem-search::placeholder { color: var(--color-text-tertiary); }

.tem-item-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  max-height: 260px;
}
.tem-item-list::-webkit-scrollbar { width: 4px; }
.tem-item-list::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 2px; }

.tem-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--motion-fast);
}
.tem-item:hover { background: var(--color-surface-raised); border-color: var(--color-border); }
.tem-item.is-linked { background: var(--color-accent-subtle); border-color: rgba(200,75,17,0.15); }

.tem-item-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tem-item-body {
  flex: 1;
  min-width: 0;
}

.tem-item-name {
  font-size: 13px;
  font-weight: var(--weight-medium);
  color: var(--color-text);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tem-item-sub {
  font-size: 11px;
  color: var(--color-text-tertiary);
  display: block;
}

.tem-item-check {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  background: var(--color-accent);
  transition: opacity var(--motion-fast);
}
.tem-item-check.visible { opacity: 1; }
.tem-item-check svg { width: 10px; height: 10px; stroke: white; }

.tem-no-results {
  padding: var(--space-5) var(--space-4);
  text-align: center;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .tem-backdrop { padding: 0; align-items: flex-end; }
  .tem-panel { max-width: 100%; border-radius: var(--radius-xl) var(--radius-xl) 0 0; max-height: 92vh; }
}
</style>
