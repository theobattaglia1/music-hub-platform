<template>
  <div class="dashboard-view">
    <!-- Minimal Header with Smart Actions -->
    <header class="minimal-header">
      <div class="header-content">
        <h1 class="greeting">{{ greeting }}, {{ firstName }}</h1>
        <div class="header-actions">
          <button class="quick-upload-btn" @click="triggerUpload">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Upload</span>
          </button>
          <button
            @click="showCreateArtistModal = true"
            v-if="authStore.canCreateArtist"
            class="create-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>New Artist</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="dashboard-content">
      <!-- Smart Insights Bar -->
      <section class="insights-bar">
        <div class="insight-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{{ pendingFollowUps }} follow ups needed</span>
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
              v-for="(task, index) in workflowTasks"
              :key="`${task.id}-${index}`"
              class="ticker-item"
              @click="handleTaskClick(task)"
            >
              <div class="task-priority-dot" :class="task.priority"></div>
              <span class="task-text">
                <strong>{{ task.title }}</strong> - {{ task.artist }} • Due {{ formatDate(task.due_date) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Hero Stats with Smart Actions -->
      <section class="hero-stats compact">
        <div class="stat-item" @mouseenter="hoveredStat = 'artists'" @mouseleave="hoveredStat = null">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ stats.totalArtists }}</h2>
              <span class="stat-trend" v-if="stats.newArtistsThisMonth > 0">+{{ stats.newArtistsThisMonth }}</span>
            </div>
            <p class="stat-label">Artists</p>
          </div>

          <!-- Quick Actions on Hover -->
          <transition name="stat-detail">
            <div v-if="hoveredStat === 'artists'" class="stat-actions">
              <button @click="router.push('/artists')" class="stat-action-btn">View All</button>
              <button @click="showCreateArtistModal = true" class="stat-action-btn primary">Add New</button>
            </div>
          </transition>
        </div>

        <div class="stat-item" @mouseenter="hoveredStat = 'projects'" @mouseleave="hoveredStat = null">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ stats.activeProjects }}</h2>
            </div>
            <p class="stat-label">Active Projects</p>
          </div>

          <transition name="stat-detail">
            <div v-if="hoveredStat === 'projects'" class="stat-details compact">
              <div v-for="project in activeProjects" :key="project.id" class="detail-item">
                <span class="detail-name">{{ project.name }}</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <div class="stat-item clickable" @click="router.push('/calendar')">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ stats.upcomingEvents }}</h2>
            </div>
            <p class="stat-label">Upcoming Events</p>
            <span class="stat-subtitle" v-if="nextEvent">{{ nextEvent.title }}</span>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ stats.teamMembers }}</h2>
              <span class="stat-live" v-if="stats.onlineMembers > 0">
                <span class="live-dot"></span>
                {{ stats.onlineMembers }}
              </span>
            </div>
            <p class="stat-label">Team Members</p>
          </div>
        </div>
      </section>

      <!-- Streamlined Recent Uploads -->
      <section class="recent-uploads-inline">
        <div class="section-header">
          <h2 class="section-title">Recent Activity</h2>
          <button @click="router.push('/activity')" class="see-more-btn">
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
                <p>{{ item.artist }}</p>
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
                <img :src="item.thumbnail_url" :alt="item.caption" />
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

            <!-- Important Dates -->
            <div
              v-for="item in filteredDates"
              :key="'date-' + item.id"
              class="upload-item date"
              @click="viewDate(item)"
              v-show="shouldShowItem('dates')"
            >
              <div class="item-cover date-cover">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <div class="item-info">
                <h4>{{ item.title }}</h4>
                <p>{{ item.type }}</p>
                <time>{{ formatTimeAgo(item.date) }}</time>
              </div>
            </div>

            <!-- Merch Items -->
            <div
              v-for="item in filteredMerch"
              :key="'merch-' + item.id"
              class="upload-item merch"
              @click="viewMerch(item)"
              v-show="shouldShowItem('merch')"
            >
              <div class="item-cover merch-cover">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </div>
              <div class="item-info">
                <h4>{{ item.title }}</h4>
                <p>Merch</p>
                <time>{{ formatTimeAgo(item.created_at) }}</time>
              </div>
            </div>

            <!-- Live Events -->
            <div
              v-for="item in filteredLive"
              :key="'live-' + item.id"
              class="upload-item live"
              @click="viewLive(item)"
              v-show="shouldShowItem('live')"
            >
              <div class="item-cover live-cover">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
              </div>
              <div class="item-info">
                <h4>{{ item.title }}</h4>
                <p>Live</p>
                <time>{{ formatTimeAgo(item.date) }}</time>
              </div>
            </div>

            <!-- Update Items (for backwards compatibility) -->
            <div
              v-for="item in recentUpdates.slice(0, 3)"
              :key="'update-' + item.id"
              class="upload-item update"
              @click="viewUpdate(item)"
              v-show="shouldShowItem('all')"
            >
              <div class="item-cover update-cover" :class="item.type">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path :d="getUpdateIcon(item.type)" />
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
          <!-- Priority Actions (Music Manager Focus) -->
          <section class="priority-actions">
            <h2 class="section-title">Quick Actions</h2>
            <div class="actions-grid">
              <button class="action-card" @click="router.push('/releases/new')">
                <div class="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                  </svg>
                </div>
                <span class="action-label">New Release</span>
                <span class="action-hint">Plan your next drop</span>
              </button>

              <button class="action-card" @click="router.push('/campaigns')">
                <div class="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                </div>
                <span class="action-label">Campaign</span>
                <span class="action-hint">Launch marketing</span>
              </button>

              <button class="action-card" @click="router.push('/analytics')">
                <div class="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
                <span class="action-label">Analytics</span>
                <span class="action-hint">Track performance</span>
              </button>

              <button class="action-card" @click="router.push('/contracts')">
                <div class="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                </div>
                <span class="action-label">Contracts</span>
                <span class="action-hint">Manage agreements</span>
              </button>
            </div>
          </section>

          <!-- Artists Grid with Performance Indicators -->
          <section class="artists-section">
            <div class="section-header">
              <h2 class="section-title">Artists</h2>
              <router-link to="/artists" class="view-all">View all →</router-link>
            </div>

            <div v-if="loading" class="artists-skeleton">
              <div v-for="i in 6" :key="i" class="skeleton-card"></div>
            </div>

            <div v-else-if="recentArtists.length === 0" class="empty-artists">
              <p>No artists yet. Create your first workspace to get started.</p>
            </div>

            <!-- Fallback error message when API fails -->
            <div v-if="!loading && recentArtists.length === 0" class="api-error-fallback">
              <div class="error-icon">⚠️</div>
              <h3>Unable to load dashboard data</h3>
              <p>We're having trouble connecting to our services. Please check your internet connection and try refreshing the page.</p>
              <button @click="dashboardStore.refreshData()" class="retry-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Try Again
              </button>
            </div>

            <div v-else class="artists-grid">
              <article
                v-for="artist in recentArtists.slice(0, 6)"
                :key="artist.id"
                class="artist-card enhanced"
                @click="navigateToArtist(artist)"
              >
                <div class="artist-avatar">
                  <img v-if="artist.avatar_url" :src="artist.avatar_url" :alt="artist.name" />
                  <span v-else class="avatar-fallback">{{ artist.name.charAt(0) }}</span>
                  <div class="artist-status" v-if="artist.status">
                    <span class="status-indicator" :class="artist.status"></span>
                  </div>
                </div>
                <div class="artist-info">
                  <h3>{{ artist.name }}</h3>
                  <p>{{ artist.genre || 'Artist' }}</p>
                  <div class="artist-metrics">
                    <span class="metric" v-if="artist.monthly_listeners">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                      {{ formatNumber(artist.monthly_listeners) }}
                    </span>
                    <span class="metric trending" v-if="artist.trending_score > 0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                      </svg>
                      {{ artist.trending_score }}%
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <!-- Side Column -->
        <aside class="side-column">
          <!-- Highlights (Compact) -->
          <section v-if="highlights.length > 0" class="highlights-section compact">
            <h3 class="section-subtitle">Pinned</h3>
            <div class="highlights-list horizontal">
              <div
                v-for="highlight in highlights.slice(0, 4)"
                :key="highlight.id"
                class="highlight-item mini"
                @click="go(highlight.link)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="pin-icon">
                  <path d="M16 9V4l1 0c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1l1 0v5c0 1.66-1.34 3-3 3h0v2h5.97v7l1 1l1-1v-7H19v-2h0C17.34 12 16 10.66 16 9z"/>
                </svg>
                <span class="highlight-text">{{ highlight.title }}</span>
              </div>
            </div>
          </section>

          <!-- Now Playing Widget -->
          <section class="now-playing" v-if="nowPlaying">
            <h3 class="section-subtitle">Now Playing</h3>
            <div class="playing-card">
              <div class="playing-cover">
                <img v-if="nowPlaying.cover_url" :src="nowPlaying.cover_url" :alt="nowPlaying.title" />
                <div v-else class="cover-placeholder mini">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              </div>
              <div class="playing-info">
                <h4>{{ nowPlaying.title }}</h4>
                <p>{{ nowPlaying.artist }}</p>
                <div class="playing-controls">
                  <button @click="previousTrack">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                  </button>
                  <button @click="togglePlay" class="play-pause">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path v-if="isPlaying" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      <path v-else d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                  <button @click="nextTrack">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <!-- Create Artist Modal -->
    <CreateArtistModal
      v-if="showCreateArtistModal"
      @close="showCreateArtistModal = false"
      @created="handleArtistCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import CreateArtistModal from '@/components/modals/CreateArtistModal.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useHighlightsStore } from '@/stores/highlights'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const calendarStore = useCalendarStore()
const highlightsStore = useHighlightsStore()

// State
const showCreateArtistModal = ref(false)
const hoveredStat = ref(null)
const uploadsTrack = ref(null)
const showPrevButton = ref(false)
const showNextButton = ref(true)
const activeActivityFilter = ref('all')

// Ticker state
const tickerTrack = ref(null)
const tickerPosition = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startScrollLeft = ref(0)
const animationId = ref(null)
const autoScrollSpeed = ref(0.5)
const lastInteractionTime = ref(0)

// Mock data for new features
const pendingFollowUps = ref(7)
const nextEvent = ref({ title: 'Studio Session', date: new Date(Date.now() + 48 * 60 * 60 * 1000) })

const workflowTasks = ref([
  { id: 1, type: 'release', title: 'Approve final master', artist: 'Taylor Swift', due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), priority: 'high', artist_slug: 'taylor-swift' },
  { id: 2, type: 'contract', title: 'Review distribution deal', artist: 'The Weeknd', due_date: new Date(Date.now() + 72 * 60 * 60 * 1000), priority: 'medium', artist_slug: 'the-weeknd' },
  { id: 3, type: 'marketing', title: 'Social media campaign', artist: 'Billie Eilish', due_date: new Date(Date.now() + 48 * 60 * 60 * 1000), priority: 'medium', artist_slug: 'billie-eilish' }
])

const nowPlaying = ref({
  id: 1,
  title: 'Blinding Lights',
  artist: 'The Weeknd',
  cover_url: null
})

const isPlaying = ref(false)

// Enhanced artist data
const recentArtists = computed(() =>
  dashboardStore.recentArtists.map(artist => ({
    ...artist,
    status: Math.random() > 0.5 ? 'active' : 'idle',
    monthly_listeners: Math.floor(Math.random() * 1000000),
    trending_score: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0
  }))
)

const recentMusic = ref([
  { id: 1, title: 'Midnight Dreams', artist: 'Taylor Swift', cover_url: null, uploaded_at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: 2, title: 'Blinding Lights', artist: 'The Weeknd', cover_url: null, uploaded_at: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: 3, title: 'Good 4 U', artist: 'Billie Eilish', cover_url: null, uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: 4, title: 'Stay', artist: 'The Weeknd', cover_url: null, uploaded_at: new Date(Date.now() - 48 * 60 * 60 * 1000) }
])

const recentPhotos = ref([
  { id: 1, thumbnail_url: null, caption: 'Studio Session', uploaded_at: new Date() },
  { id: 2, thumbnail_url: null, caption: 'Live Performance', uploaded_at: new Date() },
  { id: 3, thumbnail_url: null, caption: 'Behind the Scenes', uploaded_at: new Date() },
  { id: 4, thumbnail_url: null, caption: 'Album Cover Shoot', uploaded_at: new Date() }
])

const recentUpdates = ref([
  { id: 1, type: 'release', title: 'New Single Released', description: 'Midnight Dreams is now available on all platforms', created_at: new Date() },
  { id: 2, type: 'tour', title: 'Tour Dates Announced', description: '2024 World Tour kicks off in March', created_at: new Date() },
  { id: 3, type: 'merch', title: 'New Merch Drop', description: 'Limited edition vinyl and tour merchandise available', created_at: new Date() }
])

const activeProjects = ref([
  { id: 1, name: 'New Album Recording', progress: 65 },
  { id: 2, name: 'Music Video Production', progress: 30 }
])

// Computed
const loading = computed(() => dashboardStore.loading)
const stats = computed(() => dashboardStore.stats)

const currentHour = new Date().getHours()
const greeting = computed(() => {
  if (currentHour < 12) return 'morning'
  if (currentHour < 18) return 'afternoon'
  return 'evening'
})

const firstName = computed(() => authStore.userName.split(' ')[0])

// Methods
const navigateToArtist = (artist) => {
  router.push(`/artists/${artist.slug}`)
}

const handleArtistCreated = async (artistData, avatarFile) => {
  try {
    const artist = await dashboardStore.createArtist(artistData, avatarFile)
    showCreateArtistModal.value = false
    router.push(`/artists/${artist.slug}`)
  } catch (error) {
    console.error('Failed to create artist:', error)
  }
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = d - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `${days} days`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const go = (link) => {
  if (link) router.push(link)
}

const getUpdateIcon = (type) => {
  const icons = {
    release: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    tour: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    merch: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z'
  }
  return icons[type] || icons.release
}

const scrollUploads = (direction) => {
  if (!uploadsTrack.value) return
  const scrollAmount = 300
  const currentScroll = uploadsTrack.value.scrollLeft

  if (direction === 'prev') {
    uploadsTrack.value.scrollTo({
      left: currentScroll - scrollAmount,
      behavior: 'smooth'
    })
  } else {
    uploadsTrack.value.scrollTo({
      left: currentScroll + scrollAmount,
      behavior: 'smooth'
    })
  }
}

const checkScrollButtons = () => {
  if (!uploadsTrack.value) return
  const { scrollLeft, scrollWidth, clientWidth } = uploadsTrack.value
  showPrevButton.value = scrollLeft > 0
  showNextButton.value = scrollLeft < scrollWidth - clientWidth - 10
}

const playTrack = (track) => {
  nowPlaying.value = track
  isPlaying.value = true
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

const previousTrack = () => {
  // Implement previous track logic
}

const nextTrack = () => {
  // Implement next track logic
}

const viewPhoto = (photo) => {
  console.log('Viewing photo:', photo)
}

const viewUpdate = (update) => {
  console.log('Viewing update:', update)
}

const triggerUpload = () => {
  console.log('Triggering upload')
  // Implement file upload
}

const highlights = computed(() => highlightsStore.highlights)

// Add activity filters
const activityFilters = [
  { type: 'all', label: 'All' },
  { type: 'music', label: 'Music', icon: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' },
  { type: 'photo', label: 'Photos', icon: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z' },
  { type: 'dates', label: 'Dates', icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z' },
  { type: 'merch', label: 'Merch', icon: 'M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z' },
  { type: 'live', label: 'Live', icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z' }
]

// Add mock data for new types
const importantDates = ref([
  { id: 1, title: 'Album Release', type: 'Release Date', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { id: 2, title: 'Tour Announcement', type: 'Announcement', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
])

const merchItems = ref([
  { id: 1, title: 'Limited Edition Vinyl', created_at: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: 2, title: 'Tour T-Shirt Drop', created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) }
])

const liveEvents = ref([
  { id: 1, title: 'Instagram Live Session', date: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: 2, title: 'Virtual Concert', date: new Date(Date.now() - 24 * 60 * 60 * 1000) }
])

// Computed filtered items
const filteredMusic = computed(() => activeActivityFilter.value === 'all' || activeActivityFilter.value === 'music' ? recentMusic.value : [])
const filteredPhotos = computed(() => activeActivityFilter.value === 'all' || activeActivityFilter.value === 'photo' ? recentPhotos.value.slice(0, 4) : [])
const filteredDates = computed(() => activeActivityFilter.value === 'all' || activeActivityFilter.value === 'dates' ? importantDates.value : [])
const filteredMerch = computed(() => activeActivityFilter.value === 'all' || activeActivityFilter.value === 'merch' ? merchItems.value : [])
const filteredLive = computed(() => activeActivityFilter.value === 'all' || activeActivityFilter.value === 'live' ? liveEvents.value : [])

const shouldShowItem = (type) => {
  return activeActivityFilter.value === 'all' || activeActivityFilter.value === type
}

const viewDate = (date) => {
  console.log('Viewing date:', date)
  router.push('/calendar')
}

const viewMerch = (merch) => {
  console.log('Viewing merch:', merch)
  router.push('/merch')
}

const viewLive = (live) => {
  console.log('Viewing live:', live)
  router.push('/live')
}

const handleTaskClick = (task) => {
  // Don't navigate if dragging
  if (isDragging.value) return

  console.log('Task clicked:', task)
  // Navigate based on task type
  switch(task.type) {
    case 'release':
      router.push(`/artists/${task.artist_slug}/releases`)
      break
    case 'contract':
      router.push('/contracts')
      break
    case 'marketing':
      router.push('/campaigns')
      break
    default:
      router.push('/tasks')
  }
}

// Ticker interaction methods
const startDrag = (e) => {
  isDragging.value = true
  tickerTrack.value.style.cursor = 'grabbing'

  // Cancel auto-scroll
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }

  // Get starting position
  const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX
  startX.value = pageX
  startScrollLeft.value = tickerPosition.value

  // Prevent text selection
  e.preventDefault()

  // Add event listeners
  if (e.type.includes('mouse')) {
    document.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', stopDrag)
  } else {
    document.addEventListener('touchmove', drag, { passive: false })
    document.addEventListener('touchend', stopDrag)
  }
}

const drag = (e) => {
  if (!isDragging.value) return

  e.preventDefault()
  const pageX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX
  const walk = (pageX - startX.value) * 1.5 // Increase sensitivity

  tickerPosition.value = startScrollLeft.value + walk
  lastInteractionTime.value = Date.now()
}

const stopDrag = () => {
  isDragging.value = false
  tickerTrack.value.style.cursor = 'grab'

  // Remove event listeners
  document.removeEventListener('mousemove', drag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', drag)
  document.removeEventListener('touchend', stopDrag)

  // Resume auto-scroll after 3 seconds
  setTimeout(() => {
    if (Date.now() - lastInteractionTime.value >= 3000) {
      startWorkflowTicker()
    }
  }, 3000)
}

// Lifecycle
onMounted(async () => {
  await authStore.initialize()
  if (authStore.isAuthenticated) {
    dashboardStore.loadDashboardData()
    calendarStore.loadEvents()
  }

  // Start workflow ticker animation
  startWorkflowTicker()
})

const startWorkflowTicker = () => {
  if (!tickerTrack.value || isDragging.value) return

  const animate = () => {
    if (isDragging.value) {
      animationId.value = null
      return
    }

    tickerPosition.value -= autoScrollSpeed.value

    // Get the width of the ticker content
    const tickerWidth = tickerTrack.value.scrollWidth
    const containerWidth = tickerTrack.value.parentElement.offsetWidth

    // Reset position when scrolled too far
    if (Math.abs(tickerPosition.value) >= tickerWidth - containerWidth + 100) {
      tickerPosition.value = 0
    }

    animationId.value = requestAnimationFrame(animate)
  }

  // Start animation after a short delay
  setTimeout(() => {
    if (!isDragging.value) {
      animate()
    }
  }, 1000)
}

// Cleanup on unmount
onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})
</script>

<style scoped>
/* Dashboard Layout */
.dashboard-view {
  height: 100%;
  overflow-y: auto;
  background: #000 !important;
}

/* Minimal Header */
.minimal-header {
  padding: 48px 48px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.greeting {
  font-size: 32px;
  font-weight: 300;
  letter-spacing: -0.02em;
  margin: 0;
  color: #fff;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
}

/* Dashboard Content */
.dashboard-content {
  padding: 48px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Smart Insights Bar */
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
  position: relative;
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

/* Workflow Ticker */
.workflow-ticker {
  flex: 1;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
  position: relative;
  user-select: none;
}

.ticker-track {
  display: flex;
  gap: 48px;
  white-space: nowrap;
  will-change: transform;
  cursor: grab;
  transition: none;
}

.ticker-track:active {
  cursor: grabbing;
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 6px;
  margin: -4px -8px;
}

.ticker-item:hover {
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.03);
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
  background: #fb923c;
}

.task-priority-dot.low {
  background: #3b82f6;
}

.task-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.task-text strong {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* Streamlined Recent Uploads */
.recent-uploads-inline {
  margin-bottom: 48px;
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

.uploads-carousel {
  position: relative;
  margin-top: 24px;
}

.uploads-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 0 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
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

.update-cover.merch {
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
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.action-label {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.action-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* Enhanced Artist Cards */
.artist-card.enhanced .artist-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
}

.status-indicator {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.status-indicator.active {
  background: #22c55e;
  animation: pulse 2s infinite;
}

.artist-metrics {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.metric.trending {
  color: #22c55e;
}

.metric svg {
  opacity: 0.6;
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 24px;
}

.artist-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.artist-card:hover {
  transform: translateY(-4px);
}

.artist-avatar {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.04);
  position: relative;
}

.artist-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 300;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.artist-info h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-info p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Side Column */
.side-column {
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: sticky;
  top: 32px;
}

/* Empty States */
.empty-artists,
.empty-activity {
  text-align: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 14px;
  border-radius: 12px;
  margin: 24px 0;
}

/* API Error Fallback */
.api-error-fallback {
  text-align: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 12px;
  margin: 24px 0;
  border: 2px solid rgba(239, 68, 68, 0.2);
}

.api-error-fallback .error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.api-error-fallback h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #ef4444;
}

.api-error-fallback p {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.api-error-fallback .retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.api-error-fallback .retry-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Loading States */
.artists-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 24px;
}

.skeleton-card {
  height: 220px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.skeleton-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Responsive */
@media (max-width: 1200px) {
  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    position: static;
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 24px;
  }

  .minimal-header {
    padding: 24px 24px 16px;
  }

  .greeting {
    font-size: 24px;
  }

  .hero-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stat-item {
    padding: 24px;
  }

  .stat-number {
    font-size: 36px;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
  }

  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Hero Stats */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 64px;
}

/* Compact Hero Stats */
.hero-stats.compact {
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.hero-stats.compact::-webkit-scrollbar {
  height: 4px;
}

.hero-stats.compact::-webkit-scrollbar-track {
  background: transparent;
}

.hero-stats.compact::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.hero-stats.compact .stat-item {
  flex: 0 0 auto;
  min-width: 140px;
  padding: 0;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.hero-stats.compact .stat-content {
  padding: 20px;
}

.stat-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.hero-stats.compact .stat-number {
  font-size: 32px;
  font-weight: 300;
  line-height: 1;
  margin: 0;
  color: #fff;
  letter-spacing: -0.02em;
}

.hero-stats.compact .stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-weight: 400;
}

.hero-stats.compact .stat-trend {
  font-size: 11px;
  color: #4ade80;
  font-weight: 500;
}

.hero-stats.compact .stat-subtitle {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-stats.compact .stat-live {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.hero-stats.compact .live-dot {
  width: 5px;
  height: 5px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* Activity Filters */
.activity-filters {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.05) transparent;
}

.activity-filters::-webkit-scrollbar {
  height: 3px;
}

.activity-filters::-webkit-scrollbar-track {
  background: transparent;
}

.activity-filters::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1.5px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-pill svg {
  opacity: 0.6;
}

.filter-pill:hover {
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.02);
}

.filter-pill.active {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.filter-pill.active svg {
  opacity: 0.8;
}

/* Additional cover styles for new types */
.date-cover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.merch-cover {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-cover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

