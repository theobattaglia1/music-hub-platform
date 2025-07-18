<template>
  <div class="timeline-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Timeline</span>
            <span class="title-count">{{ timelineEvents.length }}</span>
          </h1>
          <p class="view-subtitle">Track career milestones and project progress</p>
        </div>
        <button class="create-btn" @click="addEvent">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Event</span>
        </button>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <div class="filter-group">
        <div class="custom-select">
          <select v-model="filterType" class="filter-select">
            <option value="">All Events</option>
            <option value="release">Releases</option>
            <option value="performance">Performances</option>
            <option value="milestone">Milestones</option>
            <option value="collaboration">Collaborations</option>
          </select>
        </div>

        <div class="custom-select">
          <select v-model="timeRange" class="filter-select">
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="6months">Last 6 Months</option>
            <option value="3months">Last 3 Months</option>
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

    <!-- Timeline Content -->
    <div class="timeline-container">
      <div v-if="filteredEvents.length > 0" :class="['timeline-content', viewMode]">
        
        <!-- Vertical Timeline -->
        <div v-if="viewMode === 'timeline'" class="timeline-vertical">
          <div
            v-for="(event, index) in filteredEvents"
            :key="event.id"
            class="timeline-item"
            :class="[event.type, { completed: event.completed }]"
          >
            <div class="timeline-marker">
              <div class="marker-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path :d="getEventIcon(event.type)" />
                </svg>
              </div>
              <div v-if="index < filteredEvents.length - 1" class="timeline-line"></div>
            </div>

            <div class="timeline-card">
              <div class="event-header">
                <h3 class="event-title">{{ event.title }}</h3>
                <div class="event-meta">
                  <span class="event-date">{{ formatDate(event.date) }}</span>
                  <span class="event-type" :class="event.type">{{ formatType(event.type) }}</span>
                </div>
              </div>

              <p v-if="event.description" class="event-description">{{ event.description }}</p>

              <div v-if="event.details" class="event-details">
                <div v-for="(value, key) in event.details" :key="key" class="detail-item">
                  <span class="detail-label">{{ formatLabel(key) }}:</span>
                  <span class="detail-value">{{ value }}</span>
                </div>
              </div>

              <div v-if="event.links?.length > 0" class="event-links">
                <a
                  v-for="link in event.links"
                  :key="link.url"
                  :href="link.url"
                  target="_blank"
                  class="event-link"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                  </svg>
                  {{ link.label }}
                </a>
              </div>

              <div class="event-actions">
                <button class="action-btn" @click="editEvent(event)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="action-btn danger" @click="deleteEvent(event)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid View -->
        <div v-else class="timeline-grid">
          <div
            v-for="event in filteredEvents"
            :key="event.id"
            class="event-card"
            :class="[event.type, { completed: event.completed }]"
          >
            <div class="card-header">
              <div class="event-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path :d="getEventIcon(event.type)" />
                </svg>
              </div>
              <div class="event-type-badge" :class="event.type">{{ formatType(event.type) }}</div>
            </div>

            <div class="card-content">
              <h3 class="event-title">{{ event.title }}</h3>
              <p class="event-date">{{ formatDate(event.date) }}</p>
              <p v-if="event.description" class="event-description">{{ event.description }}</p>
            </div>

            <div class="card-actions">
              <button class="action-btn" @click="editEvent(event)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button class="action-btn danger" @click="deleteEvent(event)">
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
            <circle cx="100" cy="50" r="8" fill="currentColor" opacity="0.3"/>
            <line x1="100" y1="58" x2="100" y2="90" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <circle cx="100" cy="100" r="8" fill="currentColor" opacity="0.4"/>
            <line x1="100" y1="108" x2="100" y2="140" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <circle cx="100" cy="150" r="8" fill="currentColor" opacity="0.3"/>
          </svg>
        </div>
        <h3 class="empty-title">No timeline events found</h3>
        <p class="empty-text">
          {{ filterType || timeRange !== 'all' ? 'Try adjusting your filters' : 'Start documenting your journey' }}
        </p>
        <button v-if="!filterType && timeRange === 'all'" class="create-btn large" @click="addEvent">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add First Event</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { apiService } from '@/shared/services/api'

const showToast = inject('showToast', () => {})

// State
const timelineEvents = ref([])
const filterType = ref('')
const timeRange = ref('all')
const viewMode = ref('timeline')

// View modes
const viewModes = [
  { value: 'timeline', label: 'Timeline View', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { value: 'grid', label: 'Grid View', icon: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z' }
]

// Mock data
const mockEvents = [
  {
    id: 'event-1',
    title: 'Debut Album Release',
    type: 'release',
    date: new Date('2024-03-15').toISOString(),
    completed: true,
    description: 'Released our first studio album "Midnight Dreams" across all streaming platforms.',
    details: {
      tracks: '12 songs',
      duration: '48 minutes',
      producer: 'Alex Johnson'
    },
    links: [
      { label: 'Spotify', url: 'https://spotify.com' },
      { label: 'Apple Music', url: 'https://music.apple.com' }
    ]
  },
  {
    id: 'event-2',
    title: 'Summer Festival Tour',
    type: 'performance',
    date: new Date('2024-06-01').toISOString(),
    completed: true,
    description: 'Performed at 15 major festivals across the country during summer tour.',
    details: {
      venues: '15 festivals',
      attendance: '250,000+ people',
      duration: '3 months'
    }
  },
  {
    id: 'event-3',
    title: 'Gold Certification',
    type: 'milestone',
    date: new Date('2024-08-20').toISOString(),
    completed: true,
    description: 'Debut album achieved Gold certification with over 500,000 sales.',
    details: {
      sales: '500,000+ units',
      certification: 'Gold',
      country: 'United States'
    }
  },
  {
    id: 'event-4',
    title: 'Collaboration with Taylor Swift',
    type: 'collaboration',
    date: new Date('2024-11-10').toISOString(),
    completed: false,
    description: 'Recording new single featuring Taylor Swift for upcoming EP.',
    details: {
      artist: 'Taylor Swift',
      role: 'Featured Artist',
      status: 'In Progress'
    }
  },
  {
    id: 'event-5',
    title: 'Holiday EP Release',
    type: 'release',
    date: new Date('2024-12-15').toISOString(),
    completed: false,
    description: 'Upcoming holiday-themed EP with 5 original tracks.',
    details: {
      tracks: '5 songs',
      theme: 'Holiday',
      format: 'Digital EP'
    }
  }
]

// Computed
const filteredEvents = computed(() => {
  let result = [...timelineEvents.value]

  // Type filter
  if (filterType.value) {
    result = result.filter(event => event.type === filterType.value)
  }

  // Time range filter
  if (timeRange.value !== 'all') {
    const now = new Date()
    const cutoff = new Date()
    
    switch (timeRange.value) {
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1)
        break
      case '6months':
        cutoff.setMonth(now.getMonth() - 6)
        break
      case '3months':
        cutoff.setMonth(now.getMonth() - 3)
        break
    }
    
    result = result.filter(event => new Date(event.date) >= cutoff)
  }

  // Sort by date (newest first)
  result.sort((a, b) => new Date(b.date) - new Date(a.date))

  return result
})

// Methods
const loadEvents = async () => {
  try {
    const result = await apiService.getAll('timeline_events')
    timelineEvents.value = result.data?.length > 0 ? result.data : mockEvents
  } catch (error) {
    console.error('Failed to load timeline events:', error)
    timelineEvents.value = mockEvents
  }
}

const addEvent = () => {
  showToast({ message: 'Add event form coming soon', type: 'info' })
}

const editEvent = (event) => {
  showToast({ message: `Editing ${event.title}`, type: 'info' })
}

const deleteEvent = async (event) => {
  if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
    try {
      await apiService.delete('timeline_events', event.id)
      timelineEvents.value = timelineEvents.value.filter(e => e.id !== event.id)
      showToast({ message: 'Event deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete event:', error)
      showToast({ message: 'Failed to delete event', type: 'error' })
    }
  }
}

const getEventIcon = (type) => {
  const icons = {
    release: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    performance: 'M12 3l3.01 6.01L22 9.98l-5.02 4.9L18.02 21 12 17.77 5.98 21l1.04-6.12L2 9.98l6.99-.97L12 3z',
    milestone: 'M9 11H7v8h2v-8zm4-4h-2v12h2V7zm4-4h-2v16h2V3z',
    collaboration: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
  }
  return icons[type] || icons.milestone
}

const formatType = (type) => {
  const types = {
    release: 'Release',
    performance: 'Performance',
    milestone: 'Milestone',
    collaboration: 'Collaboration'
  }
  return types[type] || type
}

const formatLabel = (key) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

const formatDate = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.timeline-view {
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
  background: radial-gradient(ellipse at top, rgba(34, 197, 94, 0.15) 0%, transparent 50%);
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
  justify-content: flex-end;
  align-items: center;
  padding: 0 48px;
  margin-bottom: 32px;
  gap: 32px;
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

/* Timeline Container */
.timeline-container {
  flex: 1;
  padding: 0 48px 48px;
  overflow-y: auto;
}

/* Vertical Timeline */
.timeline-vertical {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  position: relative;
}

.timeline-marker {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.marker-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 2;
}

.timeline-item.release .marker-icon {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.timeline-item.performance .marker-icon {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.timeline-item.milestone .marker-icon {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
  color: #a855f7;
}

.timeline-item.collaboration .marker-icon {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.timeline-item.completed .marker-icon {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
}

.marker-icon svg {
  width: 24px;
  height: 24px;
}

.timeline-line {
  width: 2px;
  height: 60px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
  margin-top: 8px;
  position: relative;
  z-index: 1;
}

.timeline-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.event-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.event-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.event-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.event-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-type.release {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.event-type.performance {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.event-type.milestone {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.event-type.collaboration {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.event-description {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 16px;
  line-height: 1.5;
}

.event-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: white;
}

.event-links {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.event-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s;
}

.event-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.event-link svg {
  width: 14px;
  height: 14px;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
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
  width: 16px;
  height: 16px;
}

/* Grid View */
.timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.event-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0;
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.event-card.release .event-icon {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.event-card.performance .event-icon {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.event-card.milestone .event-icon {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
  color: #a855f7;
}

.event-card.collaboration .event-icon {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.event-icon svg {
  width: 20px;
  height: 20px;
}

.event-type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-content {
  padding: 20px;
}

.card-content .event-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
}

.card-content .event-date {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
}

.card-content .event-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 0 20px 20px;
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

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .timeline-container {
    padding: 0 24px 24px;
  }

  .timeline-item {
    gap: 16px;
  }

  .timeline-card {
    padding: 20px;
  }

  .event-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .event-meta {
    align-items: flex-start;
  }

  .timeline-grid {
    grid-template-columns: 1fr;
  }
}
</style>