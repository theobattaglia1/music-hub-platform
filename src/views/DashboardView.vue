<template>
  <div class="dashboard-view">
    <!-- Welcome Header -->
    <div class="view-header">
      <div class="header-content">
        <div>
          <h1 class="view-title">
            Good {{ greeting }}, {{ authStore.userName }}!
          </h1>
          <p class="view-subtitle">
            Here's what's happening in your creative workspace
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="header-actions">
          <button
            @click="showCreateArtistModal = true"
            v-if="authStore.canCreateArtist"
            class="action-btn primary"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            <span>New Artist</span>
          </button>

          <button
            @click="refreshDashboard"
            :disabled="loading"
            class="action-btn ghost"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" :class="{ 'animate-spin': loading }">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="dashboard-content">
      <!-- Quick Access Cards -->
      <section class="section">
        <h2 class="section-title">Quick access</h2>
        <div class="quick-access-grid">
          <div
            v-for="(item, index) in quickAccess"
            :key="index"
            class="quick-card"
            @click="handleQuickAccess(item.action)"
          >
            <div class="quick-card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path :d="item.icon"/>
              </svg>
            </div>
            <div class="quick-card-info">
              <h3>{{ item.title }}</h3>
              <p>{{ item.subtitle }}</p>
            </div>
            <button class="quick-play-btn" @click.stop="handleQuickPlay(item.action)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Stats Overview -->
      <section class="section">
        <h2 class="section-title">Overview</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon artists">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div class="stat-info">
                <p class="stat-value">{{ stats.totalArtists }}</p>
                <p class="stat-label">Artists</p>
                <p class="stat-change positive">+{{ stats.newArtistsThisMonth }} this month</p>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon projects">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <div class="stat-info">
                <p class="stat-value">{{ stats.activeProjects }}</p>
                <p class="stat-label">Active Projects</p>
                <p class="stat-change neutral">{{ stats.projectsThisWeek }} updated this week</p>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon team">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div class="stat-info">
                <p class="stat-value">{{ stats.teamMembers }}</p>
                <p class="stat-label">Team Members</p>
                <p class="stat-change positive">{{ stats.onlineMembers }} online now</p>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon events">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"/>
                </svg>
              </div>
              <div class="stat-info">
                <p class="stat-value">{{ stats.upcomingEvents }}</p>
                <p class="stat-label">Upcoming Events</p>
                <p class="stat-change neutral">{{ stats.eventsThisWeek }} this week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Grid Layout -->
      <div class="main-grid">
        <!-- Recent Artists -->
        <section class="main-section">
          <div class="section-header">
            <h2 class="section-title">Recent artists</h2>
            <router-link
              to="/artists"
              class="see-all-btn"
            >
              Show all
            </router-link>
          </div>

          <div v-if="loading" class="loading-grid">
            <div v-for="i in 6" :key="i" class="loading-card">
              <div class="loading-avatar"></div>
              <div class="loading-content">
                <div class="loading-line short"></div>
                <div class="loading-line long"></div>
              </div>
            </div>
          </div>

          <div v-else-if="recentArtists.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <h3>No artists yet</h3>
            <p>Get started by creating your first artist workspace</p>
            <button
              @click="showCreateArtistModal = true"
              v-if="authStore.canCreateArtist"
              class="action-btn primary"
            >
              Create Artist
            </button>
          </div>

          <div v-else class="artists-grid">
            <div
              v-for="artist in recentArtists"
              :key="artist.id"
              class="artist-card"
              @click="navigateToArtist(artist)"
            >
              <div class="artist-cover">
                <img
                  v-if="artist.avatar_url"
                  :src="artist.avatar_url"
                  :alt="artist.name"
                  class="artist-image"
                />
                <div v-else class="artist-placeholder">
                  {{ artist.name.charAt(0) }}
                </div>
                <button class="artist-play-btn" @click.stop="playArtist(artist)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
              <div class="artist-info">
                <h3 class="artist-name">{{ artist.name }}</h3>
                <p class="artist-meta">{{ formatLastActivity(artist.last_activity || artist.updated_at) }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Activity & Quick Links Sidebar -->
        <aside class="sidebar-content">
          <!-- Recent Activity -->
          <section class="activity-section">
            <div class="section-header">
              <h2 class="section-title">Recent Activity</h2>
              <button class="more-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              </button>
            </div>

            <div v-if="loading" class="activity-loading">
              <div v-for="i in 4" :key="i" class="activity-loading-item">
                <div class="loading-avatar small"></div>
                <div class="loading-content">
                  <div class="loading-line short"></div>
                  <div class="loading-line tiny"></div>
                </div>
              </div>
            </div>

            <div v-else-if="recentActivity.length === 0" class="activity-empty">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <p>No recent activity</p>
            </div>

            <div v-else class="activity-list">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="activity-item"
              >
                <div class="activity-avatar">
                  <div
                    class="activity-icon"
                    :class="getActivityIconClass(activity.type)"
                  >
                    <component :is="getActivityIcon(activity.type)" />
                  </div>
                </div>
                <div class="activity-content">
                  <p class="activity-text">
                    <span class="activity-user">{{ activity.user_name }}</span>
                    {{ activity.description }}
                  </p>
                  <p class="activity-time">{{ formatTimeAgo(activity.created_at) }}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Quick Links -->
          <section class="quick-links-section">
            <h2 class="section-title">Quick Links</h2>
            <div class="quick-links">
              <router-link to="/calendar" class="quick-link">
                <div class="quick-link-icon calendar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v16a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div class="quick-link-content">
                  <h4>Calendar</h4>
                  <p>Manage events & schedules</p>
                </div>
              </router-link>

              <router-link to="/media" class="quick-link">
                <div class="quick-link-icon media">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <div class="quick-link-content">
                  <h4>Media Library</h4>
                  <p>Audio, images & videos</p>
                </div>
              </router-link>

              <router-link to="/artists" class="quick-link">
                <div class="quick-link-icon artists">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="quick-link-content">
                  <h4>All Artists</h4>
                  <p>Browse artist workspaces</p>
                </div>
              </router-link>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import CreateArtistModal from '@/components/modals/CreateArtistModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

// State
const showCreateArtistModal = ref(false)

// Computed
const loading = computed(() => dashboardStore.loading)
const recentArtists = computed(() => dashboardStore.recentArtists)
const recentActivity = computed(() => dashboardStore.recentActivity)
const stats = computed(() => dashboardStore.stats)

const currentHour = new Date().getHours()
const greeting = computed(() => {
  if (currentHour < 12) return 'morning'
  if (currentHour < 18) return 'afternoon'
  return 'evening'
})

const quickAccess = computed(() => [
  {
    title: 'Recently Active',
    subtitle: `${recentArtists.value.length} artists`,
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    action: 'recent-artists'
  },
  {
    title: 'All Artists',
    subtitle: `${stats.value.totalArtists} artists`,
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
    action: 'all-artists'
  },
  {
    title: 'Calendar',
    subtitle: `${stats.value.upcomingEvents} events`,
    icon: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z',
    action: 'calendar'
  },
  {
    title: 'Media Library',
    subtitle: 'Audio & images',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    action: 'media'
  }
])

// Methods
const refreshDashboard = () => {
  dashboardStore.refreshData()
}

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

const handleQuickAccess = (action) => {
  switch(action) {
    case 'all-artists':
    case 'recent-artists':
      router.push('/artists')
      break
    case 'calendar':
      router.push('/calendar')
      break
    case 'media':
      router.push('/media')
      break
  }
}

const handleQuickPlay = (action) => {
  // Placeholder for quick play functionality
  console.log('Quick play:', action)
}

const playArtist = (artist) => {
  // Placeholder for artist playback
  console.log('Play artist:', artist.name)
}

const formatLastActivity = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `Active ${minutes}m ago`
  if (hours < 24) return `Active ${hours}h ago`
  return `Active ${days}d ago`
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

const getActivityIconClass = (type) => {
  const classes = {
    media_upload: 'media',
    event_created: 'calendar',
    team_joined: 'team',
    moodboard_updated: 'moodboard',
    note_added: 'note'
  }
  return classes[type] || 'default'
}

const getActivityIcon = () => {
  // Return appropriate icon component based on type
  return 'svg'
}

// Lifecycle
onMounted(() => {
  dashboardStore.loadDashboardData()
})
</script>

<style scoped>
.dashboard-view {
  height: 100%;
  overflow-y: auto;
  background: #000;
  color: white;
}

/* Header */
.view-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.view-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Main Content */
.dashboard-content {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.section {
  margin-bottom: 56px;
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
  letter-spacing: -0.3px;
  margin: 0;
}

.see-all-btn {
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.see-all-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

/* Quick Access Grid */
.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 200px));
  gap: 12px;
}

.quick-card {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.quick-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.quick-card-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.quick-card-icon svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.6);
}

.quick-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.quick-card-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.quick-card-info p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.quick-play-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.quick-card:hover .quick-play-btn {
  opacity: 1;
}

.quick-play-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.06);
}

.quick-play-btn svg {
  width: 14px;
  height: 14px;
  color: white;
  margin-left: 1px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.15s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.artists {
  background: rgba(29, 185, 84, 0.2);
}

.stat-icon.projects {
  background: rgba(78, 205, 196, 0.2);
}

.stat-icon.team {
  background: rgba(34, 197, 94, 0.2);
}

.stat-icon.events {
  background: rgba(168, 85, 247, 0.2);
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 4px 0;
}

.stat-change {
  font-size: 13px;
  margin: 0;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.neutral {
  color: rgba(255, 255, 255, 0.5);
}

/* Main Grid Layout */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
}

.main-section {
  min-width: 0;
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.artist-card {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.artist-card:hover {
  transform: translateY(-2px);
}

.artist-cover {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.artist-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artist-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #1db954, #4ecdc4);
  color: white;
}

.artist-play-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.2s ease;
}

.artist-card:hover .artist-play-btn {
  opacity: 1;
  transform: scale(1);
}

.artist-play-btn:hover {
  transform: scale(1.06);
  background: rgba(0, 0, 0, 0.9);
}

.artist-play-btn svg {
  width: 16px;
  height: 16px;
  color: white;
  margin-left: 1px;
}

.artist-info {
  padding: 0 2px;
}

.artist-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-meta {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}

/* Sidebar Content */
.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.activity-section,
.quick-links-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
}

.more-btn {
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
}

.more-btn svg {
  width: 16px;
  height: 16px;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
}

.activity-avatar {
  flex-shrink: 0;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.activity-icon.media {
  background: #8b5cf6;
}

.activity-icon.calendar {
  background: #3b82f6;
}

.activity-icon.team {
  background: #10b981;
}

.activity-icon.default {
  background: #6b7280;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.activity-user {
  font-weight: 600;
  color: white;
}

.activity-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* Quick Links */
.quick-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.quick-link:hover {
  background: rgba(255, 255, 255, 0.05);
}

.quick-link-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-link-icon.calendar {
  background: rgba(59, 130, 246, 0.2);
}

.quick-link-icon.media {
  background: rgba(168, 85, 247, 0.2);
}

.quick-link-icon.artists {
  background: rgba(34, 197, 94, 0.2);
}

.quick-link-icon svg {
  width: 16px;
  height: 16px;
  color: white;
}

.quick-link-content h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px 0;
}

.quick-link-content p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Loading States */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.loading-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-avatar {
  width: 100%;
  padding-bottom: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.loading-avatar.small {
  width: 32px;
  height: 32px;
  padding-bottom: 0;
  border-radius: 50%;
  flex-shrink: 0;
}

.loading-avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

.loading-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.loading-line {
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  position: relative;
  overflow: hidden;
}

.loading-line.short {
  width: 60%;
}

.loading-line.long {
  width: 85%;
}

.loading-line.tiny {
  width: 40%;
  height: 8px;
}

.loading-line::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 1.5s infinite;
}

.activity-loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-loading-item {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 60px 40px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-state p {
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

.activity-empty {
  text-align: center;
  padding: 40px 20px;
}

.activity-empty svg {
  width: 32px;
  height: 32px;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
}

.activity-empty p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* Animations */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Action Buttons */
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn.primary {
  background: white;
  color: black;
}

.action-btn.primary:hover {
  background: rgba(255, 255, 255, 0.9);
}

.action-btn.ghost {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.action-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.15);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .sidebar-content {
    grid-row: 1;
  }
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 20px;
  }

  .quick-access-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
}
</style>