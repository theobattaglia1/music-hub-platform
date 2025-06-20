<template>
  <div class="artist-hub-view">
    <!-- Artist Header -->
    <header class="artist-header">
      <div class="header-background">
        <img v-if="artist?.avatar_url" :src="artist.avatar_url" :alt="artist.name" class="bg-image" />
        <div class="bg-gradient"></div>
      </div>

      <div class="header-content">
        <div class="artist-identity">
          <div class="artist-avatar">
            <img v-if="artist?.avatar_url" :src="artist.avatar_url" :alt="artist.name" />
            <span v-else class="avatar-fallback">{{ artist?.name?.charAt(0) || 'A' }}</span>
          </div>
          <div class="artist-details">
            <h1 class="artist-name">{{ artist?.name || 'Artist' }}</h1>
            <p class="artist-genre">{{ artist?.genre || 'Music' }}</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="action-btn primary" @click="handleNewRelease">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Release</span>
          </button>
          <button class="action-btn" @click="handleUpload">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="artist-nav">
      <div class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['nav-tab', { active: activeTab === tab.id }]"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="artist-content">
      <!-- Insights Bar with Ticker -->
      <section class="insights-bar">
        <div class="insight-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
          <span>{{ formatNumber(monthlyListeners) }} monthly listeners</span>
        </div>

        <div class="insights-divider"></div>

        <!-- Workflow Ticker -->
        <div class="workflow-ticker" ref="workflowTicker">
          <div
            class="ticker-track"
            ref="tickerTrack"
            @mousedown="startDrag"
            @touchstart="startDrag"
            :style="{ transform: `translateX(${tickerPosition}px)` }"
          >
            <div
              v-for="(task, index) in artistTasks"
              :key="`${task.id}-${index}`"
              class="ticker-item"
              @click="handleTaskClick(task)"
            >
              <div class="task-priority-dot" :class="task.priority"></div>
              <span class="task-text">
                <strong>{{ task.title }}</strong> • Due {{ formatDate(task.due_date) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Tab Content -->
      <div v-if="activeTab === 'overview'">
        <!-- Hero Stats -->
        <section class="hero-stats compact">
          <div class="stat-item">
            <div class="stat-content">
              <div class="stat-header">
                <h2 class="stat-number">{{ stats.totalReleases }}</h2>
              </div>
              <p class="stat-label">Releases</p>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-content">
              <div class="stat-header">
                <h2 class="stat-number">{{ formatNumber(stats.totalStreams) }}</h2>
              </div>
              <p class="stat-label">Total Streams</p>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-content">
              <div class="stat-header">
                <h2 class="stat-number">{{ stats.activeProjects }}</h2>
              </div>
              <p class="stat-label">Active Projects</p>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-content">
              <div class="stat-header">
                <h2 class="stat-number">{{ stats.teamSize }}</h2>
              </div>
              <p class="stat-label">Team Members</p>
            </div>
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="recent-uploads-inline">
          <div class="section-header">
            <h2 class="section-title">Recent Activity</h2>
            <button @click="viewAllActivity" class="see-more-btn">
              <span>View All Activity</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <!-- Activity Filters -->
          <div class="activity-filters">
            <button
              v-for="filter in activityFilters"
              :key="filter.type"
              @click="activeActivityFilter = filter.type"
              :class="['filter-pill', { active: activeActivityFilter === filter.type }]"
            >
              <svg v-if="filter.icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path :d="filter.icon" />
              </svg>
              <span>{{ filter.label }}</span>
            </button>
          </div>

          <div class="uploads-carousel">
            <button class="carousel-nav prev" @click="scrollUploads('prev')" v-if="showPrevButton">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <div class="uploads-track" ref="uploadsTrack" @scroll="checkScrollButtons">
              <!-- Music Items -->
              <div
                v-for="item in filteredMusic"
                :key="'music-' + item.id"
                class="upload-item music"
                @click="playTrack(item)"
                v-show="shouldShowItem('music')"
              >
                <div class="item-cover">
                  <img v-if="item.cover_url" :src="item.cover_url" :alt="item.title" />
                  <div v-else class="cover-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <div class="item-type-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <div class="play-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div class="item-info">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.subtitle || 'Track' }}</p>
                  <time>{{ formatTimeAgo(item.uploaded_at) }}</time>
                </div>
              </div>

              <!-- Photo Items -->
              <div
                v-for="item in filteredPhotos"
                :key="'photo-' + item.id"
                class="upload-item photo"
                @click="viewPhoto(item)"
                v-show="shouldShowItem('photo')"
              >
                <div class="item-cover">
                  <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.caption" />
                  <div v-else class="cover-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <div class="item-type-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                </div>
                <div class="item-info">
                  <h4>{{ item.caption }}</h4>
                  <p>Photo</p>
                  <time>{{ formatTimeAgo(item.uploaded_at) }}</time>
                </div>
              </div>

              <!-- Update Items -->
              <div
                v-for="item in filteredUpdates"
                :key="'update-' + item.id"
                class="upload-item update"
                @click="viewUpdate(item)"
                v-show="shouldShowItem('all')"
              >
                <div class="item-cover update-cover" :class="item.type">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path :d="getActivityIcon(item.type)" />
                  </svg>
                </div>
                <div class="item-info">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.type }}</p>
                  <time>{{ formatTimeAgo(item.created_at) }}</time>
                </div>
              </div>
            </div>

            <button class="carousel-nav next" @click="scrollUploads('next')" v-if="showNextButton">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </section>

        <!-- Two Column Layout -->
        <div class="content-grid">
          <!-- Main Column -->
          <div class="main-column">
            <!-- Quick Actions -->
            <section class="priority-actions">
              <h2 class="section-title">Quick Actions</h2>
              <div class="actions-grid">
                <button class="action-card" @click="handleNewRelease">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                    </svg>
                  </div>
                  <span class="action-label">New Release</span>
                  <span class="action-hint">Start a new project</span>
                </button>

                <button class="action-card" @click="handleSchedule">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                    </svg>
                  </div>
                  <span class="action-label">Schedule</span>
                  <span class="action-hint">Plan releases</span>
                </button>

                <button class="action-card" @click="handleAnalytics">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                    </svg>
                  </div>
                  <span class="action-label">Analytics</span>
                  <span class="action-hint">View insights</span>
                </button>

                <button class="action-card" @click="handleTeam">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <span class="action-label">Team</span>
                  <span class="action-hint">Manage access</span>
                </button>
              </div>
            </section>

            <!-- Active Projects -->
            <section class="projects-section">
              <div class="section-header">
                <h2 class="section-title">Active Projects</h2>
                <button @click="viewAllProjects" class="view-all">View all →</button>
              </div>

              <div class="projects-grid">
                <article
                  v-for="project in activeProjects"
                  :key="project.id"
                  class="project-card"
                  @click="openProject(project)"
                >
                  <div class="project-header">
                    <h3>{{ project.name }}</h3>
                    <span class="project-status" :class="project.status">{{ project.status }}</span>
                  </div>
                  <div class="project-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
                    </div>
                    <span class="progress-text">{{ project.progress }}% complete</span>
                  </div>
                  <div class="project-meta">
                    <span>Due {{ formatDate(project.deadline) }}</span>
                    <span>{{ project.tasks.completed }}/{{ project.tasks.total }} tasks</span>
                  </div>
                </article>
              </div>
            </section>
          </div>

          <!-- Side Column -->
          <aside class="side-column">
            <!-- Highlights -->
            <section v-if="highlights.length > 0" class="highlights-section compact">
              <h3 class="section-subtitle">Pinned</h3>
              <div class="highlights-list horizontal">
                <div
                  v-for="highlight in highlights"
                  :key="highlight.id"
                  class="highlight-item mini"
                  @click="goToHighlight(highlight)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="pin-icon">
                    <path d="M16 9V4l1 0c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1l1 0v5c0 1.66-1.34 3-3 3h0v2h5.97v7l1 1l1-1v-7H19v-2h0C17.34 12 16 10.66 16 9z"/>
                  </svg>
                  <span class="highlight-text">{{ highlight.title }}</span>
                </div>
              </div>
            </section>

            <!-- Team Activity -->
            <section class="team-activity">
              <h3 class="section-subtitle">Team Activity</h3>
              <div class="activity-list">
                <div
                  v-for="activity in teamActivity"
                  :key="activity.id"
                  class="activity-item"
                >
                  <img v-if="activity.user.avatar" :src="activity.user.avatar" class="user-avatar" />
                  <div v-else class="user-avatar-placeholder">{{ activity.user.initials }}</div>
                  <div class="activity-content">
                    <p><strong>{{ activity.user.name }}</strong> {{ activity.action }}</p>
                    <time>{{ formatTimeAgo(activity.timestamp) }}</time>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <!-- Projects Tab -->
      <div v-if="activeTab === 'projects'" class="tab-content">
        <h2 class="tab-title">Projects</h2>
        <p>Projects content coming soon...</p>
      </div>

      <!-- Activity Tab -->
      <div v-if="activeTab === 'activity'" class="tab-content">
        <h2 class="tab-title">Activity</h2>
        <p>Activity timeline coming soon...</p>
      </div>

      <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'" class="tab-content">
        <h2 class="tab-title">Analytics</h2>
        <p>Analytics dashboard coming soon...</p>
      </div>

      <!-- Team Tab -->
      <div v-if="activeTab === 'team'" class="tab-content">
        <h2 class="tab-title">Team</h2>
        <p>Team management coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHighlightsStore } from '@/stores/highlights'

const router = useRouter()
const route = useRoute()
const highlightsStore = useHighlightsStore()

// State
const activeTab = ref('overview')
const activeActivityFilter = ref('all')
const uploadsTrack = ref(null)
const showPrevButton = ref(false)
const showNextButton = ref(true)

// Ticker state
const tickerTrack = ref(null)
const tickerPosition = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startScrollLeft = ref(0)
const animationId = ref(null)
const autoScrollSpeed = ref(0.5)
const lastInteractionTime = ref(0)

// Tabs configuration
const tabs = computed(() => [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects', count: 3 },
  { id: 'activity', label: 'Activity', count: 12 },
  { id: 'analytics', label: 'Analytics' },
  { id: 'team', label: 'Team', count: 8 }
])

// Activity filters
const activityFilters = [
  { type: 'all', label: 'All' },
  { type: 'music', label: 'Music', icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' },
  { type: 'photo', label: 'Photos', icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' },
  { type: 'update', label: 'Updates', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' }
]

// Computed
const artist = computed(() => ({
  id: route.params.id || '1',
  slug: route.params.slug || 'artist',
  name: 'Taylor Swift',
  genre: 'Pop',
  avatar_url: null
}))

const monthlyListeners = computed(() => 1250000)

const stats = computed(() => ({
  totalReleases: 12,
  totalStreams: 850000000,
  activeProjects: 3,
  teamSize: 8
}))

const artistTasks = computed(() => [
  { id: 1, title: 'Approve final master', due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), priority: 'high' },
  { id: 2, title: 'Review music video edit', due_date: new Date(Date.now() + 48 * 60 * 60 * 1000), priority: 'medium' },
  { id: 3, title: 'Social media campaign', due_date: new Date(Date.now() + 72 * 60 * 60 * 1000), priority: 'medium' },
  { id: 4, title: 'Press release approval', due_date: new Date(Date.now() + 96 * 60 * 60 * 1000), priority: 'low' }
])

// Mock activity data
const recentMusic = computed(() => [
  { id: 1, title: 'Midnight Dreams - Final Mix', cover_url: null, uploaded_at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 2, title: 'Love Story (Taylor\'s Version)', cover_url: null, uploaded_at: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: 3, title: 'Acoustic Demo', cover_url: null, uploaded_at: new Date(Date.now() - 12 * 60 * 60 * 1000) }
])

const recentPhotos = computed(() => [
  { id: 1, caption: 'Studio Session', thumbnail_url: null, uploaded_at: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: 2, caption: 'Behind the Scenes', thumbnail_url: null, uploaded_at: new Date(Date.now() - 8 * 60 * 60 * 1000) },
  { id: 3, caption: 'Album Cover Shoot', thumbnail_url: null, uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000) }
])

const recentUpdates = computed(() => [
  { id: 1, type: 'release', title: 'New Single Released', created_at: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: 2, type: 'tour', title: 'Tour Dates Announced', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: 3, type: 'award', title: 'Grammy Nomination', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000) }
])

// Filtered activity items
const filteredMusic = computed(() =>
  activeActivityFilter.value === 'all' || activeActivityFilter.value === 'music' ? recentMusic.value : []
)

const filteredPhotos = computed(() =>
  activeActivityFilter.value === 'all' || activeActivityFilter.value === 'photo' ? recentPhotos.value : []
)

const filteredUpdates = computed(() =>
  activeActivityFilter.value === 'all' || activeActivityFilter.value === 'update' ? recentUpdates.value : []
)

const activeProjects = computed(() => [
  {
    id: 1,
    name: 'Midnight Dreams EP',
    status: 'active',
    progress: 75,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    tasks: { completed: 18, total: 24 }
  },
  {
    id: 2,
    name: 'Music Video Production',
    status: 'planning',
    progress: 25,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    tasks: { completed: 5, total: 20 }
  }
])

const highlights = computed(() =>
  highlightsStore.highlights.filter(h => !h.artistId || h.artistId === artist.value.id).slice(0, 4)
)

const teamActivity = computed(() => [
  {
    id: 1,
    user: { name: 'Sarah Chen', initials: 'SC', avatar: null },
    action: 'uploaded final masters',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    id: 2,
    user: { name: 'Mike Johnson', initials: 'MJ', avatar: null },
    action: 'completed artwork review',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000)
  }
])

// Methods
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K'
  return num.toString()
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getActivityIcon = (type) => {
  const icons = {
    music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    photo: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    update: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    release: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    tour: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    award: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
  }
  return icons[type] || icons.update
}

const shouldShowItem = (type) => {
  return activeActivityFilter.value === 'all' || activeActivityFilter.value === type
}

// Carousel methods
const scrollUploads = (direction) => {
  if (!uploadsTrack.value) return

  const scrollAmount = 320 // Scroll by 2 items
  if (direction === 'prev') {
    uploadsTrack.value.scrollLeft -= scrollAmount
  } else {
    uploadsTrack.value.scrollLeft += scrollAmount
  }
}

const checkScrollButtons = () => {
  if (!uploadsTrack.value) return

  const { scrollLeft, scrollWidth, clientWidth } = uploadsTrack.value
  showPrevButton.value = scrollLeft > 0
  showNextButton.value = scrollLeft < scrollWidth - clientWidth - 10
}

// Activity item handlers
const playTrack = (track) => {
  console.log('Playing track:', track)
  // TODO: Integrate with playback store
}

const viewPhoto = (photo) => {
  console.log('Viewing photo:', photo)
  // TODO: Open photo viewer
}

const viewUpdate = (update) => {
  console.log('Viewing update:', update)
  // TODO: Navigate to update details
}

// Ticker methods
const startDrag = (e) => {
  isDragging.value = true
  startX.value = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX
  startScrollLeft.value = tickerPosition.value
  lastInteractionTime.value = Date.now()

  // Stop auto-scroll
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
}

const drag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const x = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX
  const walk = x - startX.value
  tickerPosition.value = startScrollLeft.value + walk
}

const stopDrag = () => {
  isDragging.value = false

  // Resume auto-scroll after 3 seconds
  setTimeout(() => {
    if (Date.now() - lastInteractionTime.value >= 3000) {
      startAutoScroll()
    }
  }, 3000)
}

const startAutoScroll = () => {
  const animate = () => {
    if (!isDragging.value && tickerTrack.value) {
      tickerPosition.value -= autoScrollSpeed.value

      // Reset position when first item is completely out of view
      const firstItemWidth = tickerTrack.value.firstElementChild?.offsetWidth || 0
      if (Math.abs(tickerPosition.value) > firstItemWidth + 20) {
        tickerPosition.value = 0
        // Move first item to end
        const firstItem = tickerTrack.value.firstElementChild
        if (firstItem) {
          tickerTrack.value.appendChild(firstItem)
        }
      }
    }
    animationId.value = requestAnimationFrame(animate)
  }
  animate()
}

const handleTaskClick = (task) => {
  console.log('Task clicked:', task)
  // Handle task click - could open a modal or navigate
}

// Action handlers
const handleNewRelease = () => {
  router.push(`/artists/${artist.value.slug}/releases/new`)
}

const handleUpload = () => {
  console.log('Upload clicked')
}

const handleSchedule = () => {
  router.push(`/artists/${artist.value.slug}/calendar`)
}

const handleAnalytics = () => {
  router.push(`/artists/${artist.value.slug}/analytics`)
}

const handleTeam = () => {
  router.push(`/artists/${artist.value.slug}/team`)
}

const viewAllActivity = () => {
  router.push(`/artists/${artist.value.slug}/activity`)
}

const viewAllProjects = () => {
  router.push(`/artists/${artist.value.slug}/projects`)
}

const openProject = (project) => {
  router.push(`/artists/${artist.value.slug}/projects/${project.id}`)
}

const goToHighlight = (highlight) => {
  if (highlight.link) router.push(highlight.link)
}

// Lifecycle
onMounted(() => {
  // Start auto-scroll for ticker
  startAutoScroll()

  // Add drag event listeners
  document.addEventListener('mousemove', drag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', drag)
  document.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
  // Clean up
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', drag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<style scoped>
/* Artist Hub Styles - Matching Dashboard */
.artist-hub-view {
  min-height: 100vh;
  background: #000;
  color: #fff;
}

/* Artist Header */
.artist-header {
  position: relative;
  padding: 48px 48px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.header-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.2;
  filter: blur(50px);
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.9));
}

.header-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.artist-identity {
  display: flex;
  align-items: center;
  gap: 24px;
}

.artist-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.artist-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 32px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.artist-name {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -0.02em;
  margin: 0 0 4px;
}

.artist-genre {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.action-btn.primary {
  background: #fff;
  color: #000;
  border-color: #fff;
}

.action-btn.primary:hover {
  background: rgba(255, 255, 255, 0.9);
}

/* Content */
.artist-content {
  padding: 48px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Copy all the dashboard styles for consistency */
/* Insights Bar */
.insights-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  overflow: hidden;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}

.insight-item svg {
  opacity: 0.6;
}

.insights-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

/* Hero Stats */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.hero-stats.compact {
  gap: 16px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-2px);
}

.stat-content {
  position: relative;
  z-index: 1;
}

.stat-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 48px;
  font-weight: 200;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Recent Uploads */
.recent-uploads-inline {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.see-more-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.see-more-btn:hover {
  color: #fff;
}

/* Activity Filters */
.activity-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-pill:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.filter-pill.active {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.filter-pill svg {
  width: 14px;
  height: 14px;
  opacity: 0.8;
}

/* Carousel */
.uploads-carousel {
  position: relative;
}

.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 2;
}

.carousel-nav:hover {
  background: rgba(0, 0, 0, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.carousel-nav.prev {
  left: -16px;
}

.carousel-nav.next {
  right: -16px;
}

.carousel-nav svg {
  width: 20px;
  height: 20px;
}

.uploads-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  scroll-behavior: smooth;
}

.uploads-track::-webkit-scrollbar {
  height: 4px;
}

.uploads-track::-webkit-scrollbar-track {
  background: transparent;
}

.uploads-track::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.upload-item {
  flex-shrink: 0;
  width: 160px;
  cursor: pointer;
  transition: transform 0.2s;
}

.upload-item:hover {
  transform: translateY(-2px);
}

.item-cover {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 12px;
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
}

.update-cover {
  display: flex;
  align-items: center;
  justify-content: center;
}

.update-cover.release {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.update-cover.tour {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.update-cover.award {
  background: rgba(236, 72, 153, 0.1);
  color: #ec4899;
}

.item-type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.upload-item:hover .play-overlay {
  opacity: 1;
}

.play-overlay svg {
  width: 32px;
  height: 32px;
  color: #fff;
}

.item-info h4 {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 2px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-info p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 4px;
}

.item-info time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 48px;
}

/* Priority Actions */
.priority-actions {
  margin-bottom: 48px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.action-icon svg {
  width: 24px;
  height: 24px;
  opacity: 0.8;
}

.action-label {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.action-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* Projects Section */
.projects-section {
  margin-bottom: 48px;
}

.view-all {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.view-all:hover {
  color: #fff;
}

.projects-grid {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.project-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.project-card:hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.project-header h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.project-status {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.project-status.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.project-status.planning {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.project-progress {
  margin-bottom: 12px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #22c55e;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.project-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* Side Column */
.side-column {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-subtitle {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

/* Highlights */
.highlights-section.compact {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.highlights-list.horizontal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.highlight-item.mini {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.highlight-item.mini:hover {
  background: rgba(255, 255, 255, 0.08);
}

.pin-icon {
  opacity: 0.6;
}

/* Team Activity */
.team-activity {
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-content p {
  font-size: 13px;
  margin: 0 0 4px;
}

.activity-content strong {
  font-weight: 500;
  color: #fff;
}

.activity-content time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

/* Navigation Tabs */
.artist-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  padding: 0 48px;
}

.nav-tabs {
  display: flex;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.nav-tab:hover {
  color: rgba(255, 255, 255, 0.9);
}

.nav-tab.active {
  color: #fff;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #fff;
}

.tab-count {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

/* Tab Content */
.tab-content {
  padding: 48px 0;
}

.tab-title {
  font-size: 32px;
  font-weight: 300;
  margin: 0 0 24px;
}

/* Workflow Ticker */
.workflow-ticker {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: grab;
}

.workflow-ticker:active {
  cursor: grabbing;
}

.ticker-track {
  display: flex;
  gap: 32px;
  transition: transform 0.1s linear;
  will-change: transform;
}

.ticker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.ticker-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.task-priority-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-priority-dot.high {
  background: #ef4444;
}

.task-priority-dot.medium {
  background: #f59e0b;
}

.task-priority-dot.low {
  background: #10b981;
}

.task-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
}

.task-text strong {
  color: #fff;
  font-weight: 500;
}
</style>
