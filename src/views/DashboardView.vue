<template>
  <WorkspacePage
    class="dashboard-page"
    eyebrow="Home"
    :title="`${greeting}, ${firstName}`"
    subtitle="Central workspace for follow-ups, artist movement, and operational visibility."
  >
    <template #actions>
      <div class="header-actions">
        <button
          v-if="authStore?.canCreateArtist"
          class="workspace-header-primary-btn"
          @click="showCreateArtistModal = true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Artist</span>
        </button>
        <button class="workspace-header-secondary-btn" @click="triggerUpload">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>Upload</span>
        </button>
      </div>
    </template>

    <template #stats>
      <div class="quick-stats">
        <div class="stat-pill">
          <strong>{{ pendingFollowUps }}</strong>
          <span>follow ups</span>
        </div>
        <div class="stat-pill">
          <strong>{{ stats.totalArtists }}</strong>
          <span>artists</span>
        </div>
        <div class="stat-pill">
          <strong>{{ stats.activeProjects }}</strong>
          <span>active projects</span>
        </div>
        <div class="stat-pill">
          <strong>{{ nextEvent?.title || "No upcoming event" }}</strong>
          <span>next calendar moment</span>
        </div>
      </div>
    </template>

    <template #toolbar>
      <div class="hero-toolbar">
        <div class="hero-toolbar-label">
          <span class="hero-toolbar-eyebrow">Next up</span>
          <span class="hero-toolbar-meta">{{ pendingFollowUps }} follow ups needed</span>
        </div>

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
                <strong>{{ task.title }}</strong> {{ task.artist }} • Due
                {{ formatDate(task.due_date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="dashboard-view">
      <!-- Main Content -->
      <div class="dashboard-content">
        <!-- Hero Stats with Smart Actions -->
        <section class="hero-stats compact">
          <div
            class="stat-item interactive"
            :class="{ 'is-active': hoveredStat === 'artists' }"
            @mouseenter="hoveredStat = 'artists'"
            @mouseleave="hoveredStat = null"
          >
            <div class="stat-content">
              <div class="stat-header">
                <h2 class="stat-number">{{ stats.totalArtists }}</h2>
                <span class="stat-trend" v-if="stats.newArtistsThisMonth > 0"
                  >+{{ stats.newArtistsThisMonth }}</span
                >
              </div>
              <p class="stat-label">Artists</p>
            </div>

            <div class="stat-actions" :class="{ 'is-visible': hoveredStat === 'artists' }">
              <button @click="router.push('/artists')" class="stat-action-btn">View All</button>
              <button @click="showCreateArtistModal = true" class="stat-action-btn primary">
                Add New
              </button>
            </div>
          </div>

          <div
            class="stat-item interactive"
            :class="{ 'is-active': hoveredStat === 'projects' }"
            @mouseenter="hoveredStat = 'projects'"
            @mouseleave="hoveredStat = null"
          >
            <div class="stat-content">
              <div class="stat-header">
                <h2 class="stat-number">{{ stats.activeProjects }}</h2>
              </div>
              <p class="stat-label">Active Projects</p>
            </div>

            <div class="stat-details compact" :class="{ 'is-visible': hoveredStat === 'projects' }">
              <div v-for="project in activeProjects" :key="project.id" class="detail-item">
                <span class="detail-name">{{ project.name }}</span>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: project.progress + '%' }"></div>
                </div>
              </div>
            </div>
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
        <section class="recent-uploads-inline surface-panel">
          <div class="section-header recent-uploads-header">
            <div class="section-heading">
              <h2 class="section-title section-title-quiet">Recent Activity</h2>
              <div class="activity-filters segmented-control">
                <button
                  v-for="filter in activityFilters"
                  :key="filter.type"
                  @click="activeActivityFilter = filter.type"
                  :class="['filter-pill', { active: activeActivityFilter === filter.type }]"
                >
                  <svg
                    v-if="filter.icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path :d="filter.icon" />
                  </svg>
                  <span>{{ filter.label }}</span>
                </button>
              </div>
            </div>
            <button @click="router.push('/timeline')" class="see-more-btn">
              <span>View All Activity</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div class="uploads-carousel">
            <button class="carousel-nav prev" @click="scrollUploads('prev')" v-if="showPrevButton">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
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
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      opacity="0.3"
                    >
                      <path
                        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                      />
                    </svg>
                  </div>
                  <div class="item-type-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                      />
                    </svg>
                  </div>
                  <div class="play-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
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
                      <path
                        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                      />
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
                    <path
                      d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                    />
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
                    <path
                      d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
                    />
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
                    <path
                      d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
                    />
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
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
            <section class="priority-actions surface-panel">
              <h2 class="section-title">Quick Actions</h2>
              <div class="actions-grid">
                <button class="action-card" @click="router.push('/songs')">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                      />
                    </svg>
                  </div>
                  <span class="action-label">New Release</span>
                  <span class="action-hint">Plan your next drop</span>
                </button>

                <button class="action-card" @click="router.push('/timeline')">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                    </svg>
                  </div>
                  <span class="action-label">Campaign</span>
                  <span class="action-hint">Launch marketing</span>
                </button>

                <button class="action-card" @click="router.push('/artists')">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
                      />
                    </svg>
                  </div>
                  <span class="action-label">Analytics</span>
                  <span class="action-hint">Track performance</span>
                </button>

                <button class="action-card" @click="router.push('/files')">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                      />
                    </svg>
                  </div>
                  <span class="action-label">Contracts</span>
                  <span class="action-hint">Manage agreements</span>
                </button>
              </div>
            </section>

            <!-- Artists Grid with Performance Indicators -->
            <section class="artists-section surface-panel">
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
                <p>
                  We're having trouble connecting to our services. Please check your internet
                  connection and try refreshing the page.
                </p>
                <button @click="dashboardStore.refreshData()" class="retry-btn">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
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
                    <img
                      v-if="hasCustomAvatar(artist.avatar_url)"
                      :src="artist.avatar_url"
                      :alt="artist.name"
                    />
                    <span v-else class="avatar-fallback">{{ getInitials(artist.name) }}</span>
                    <div class="artist-status" v-if="artist.status">
                      <span class="status-indicator" :class="artist.status"></span>
                    </div>
                  </div>
                  <div class="artist-info">
                    <h3>{{ artist.name }}</h3>
                    <p>{{ artist.genre || "Artist" }}</p>
                    <div class="artist-metrics">
                      <span class="metric" v-if="artist.monthly_listeners">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                          />
                        </svg>
                        {{ formatNumber(artist.monthly_listeners) }}
                      </span>
                      <span class="metric trending" v-if="artist.trending_score > 0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
                          />
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
            <section v-if="highlights.length > 0" class="highlights-section compact surface-panel">
              <h3 class="section-subtitle">Pinned</h3>
              <div class="highlights-list horizontal">
                <div
                  v-for="highlight in highlights.slice(0, 4)"
                  :key="highlight.id"
                  class="highlight-item mini"
                  @click="go(highlight.link)"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="pin-icon"
                  >
                    <path
                      d="M16 9V4l1 0c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1l1 0v5c0 1.66-1.34 3-3 3h0v2h5.97v7l1 1l1-1v-7H19v-2h0C17.34 12 16 10.66 16 9z"
                    />
                  </svg>
                  <span class="highlight-text">{{ highlight.title }}</span>
                </div>
              </div>
            </section>

            <!-- Now Playing Widget -->
            <section class="now-playing surface-panel" v-if="nowPlaying">
              <h3 class="section-subtitle">Now Playing</h3>
              <div class="playing-card">
                <div class="playing-cover">
                  <img
                    v-if="nowPlaying.cover_url"
                    :src="nowPlaying.cover_url"
                    :alt="nowPlaying.title"
                  />
                  <div v-else class="cover-placeholder mini">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      opacity="0.3"
                    >
                      <path
                        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                      />
                    </svg>
                  </div>
                </div>
                <div class="playing-info">
                  <h4>{{ nowPlaying.title }}</h4>
                  <p>{{ nowPlaying.artist }}</p>
                  <div class="playing-controls">
                    <button @click="previousTrack">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                      </svg>
                    </button>
                    <button @click="togglePlay" class="play-pause">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path v-if="isPlaying" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        <path v-else d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <button @click="nextTrack">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
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
  </WorkspacePage>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, inject } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useDashboardStore } from "@/stores/dashboard";
import CreateArtistModal from "@/components/modals/CreateArtistModal.vue";
import { useCalendarStore } from "@/stores/calendar";
import { useHighlightsStore } from "@/stores/highlights";
import { usePlaybackStore } from "@/stores/playback";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import { getInitials, hasCustomAvatar } from "@/shared/utils/avatar";

const router = useRouter();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();
const calendarStore = useCalendarStore();
const highlightsStore = useHighlightsStore();
const playbackStore = usePlaybackStore();
const showToast = inject("showToast", () => {});

// State
const showCreateArtistModal = ref(false);
const hoveredStat = ref(null);
const uploadsTrack = ref(null);
const showPrevButton = ref(false);
const showNextButton = ref(true);
const activeActivityFilter = ref("all");

// Ticker state
const tickerTrack = ref(null);
const tickerPosition = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const startScrollLeft = ref(0);
const animationId = ref(null);
const autoScrollSpeed = ref(0.5);
const lastInteractionTime = ref(0);

// Mock data for new features
const pendingFollowUps = ref(7);
const nextEvent = ref({
  title: "Studio Session",
  date: new Date(Date.now() + 48 * 60 * 60 * 1000),
});

const workflowTasks = ref([
  {
    id: 1,
    type: "release",
    title: "Approve final master",
    artist: "Taylor Swift",
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    priority: "high",
    artist_slug: "taylor-swift",
  },
  {
    id: 2,
    type: "contract",
    title: "Review distribution deal",
    artist: "The Weeknd",
    due_date: new Date(Date.now() + 72 * 60 * 60 * 1000),
    priority: "medium",
    artist_slug: "the-weeknd",
  },
  {
    id: 3,
    type: "marketing",
    title: "Social media campaign",
    artist: "Billie Eilish",
    due_date: new Date(Date.now() + 48 * 60 * 60 * 1000),
    priority: "medium",
    artist_slug: "billie-eilish",
  },
]);

const nowPlaying = ref({
  id: 1,
  title: "Blinding Lights",
  artist: "The Weeknd",
  cover_url: null,
});

const isPlaying = ref(false);

// Enhanced artist data
const recentArtists = computed(() =>
  dashboardStore.recentArtists.map((artist) => ({
    ...artist,
    status: Math.random() > 0.5 ? "active" : "idle",
    monthly_listeners: Math.floor(Math.random() * 1000000),
    trending_score: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0,
  })),
);

const recentMusic = ref([
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "Taylor Swift",
    cover_url: null,
    uploaded_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: "Blinding Lights",
    artist: "The Weeknd",
    cover_url: null,
    uploaded_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: "Good 4 U",
    artist: "Billie Eilish",
    cover_url: null,
    uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 4,
    title: "Stay",
    artist: "The Weeknd",
    cover_url: null,
    uploaded_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
]);

const recentPhotos = ref([
  { id: 1, thumbnail_url: null, caption: "Studio Session", uploaded_at: new Date() },
  { id: 2, thumbnail_url: null, caption: "Live Performance", uploaded_at: new Date() },
  { id: 3, thumbnail_url: null, caption: "Behind the Scenes", uploaded_at: new Date() },
  { id: 4, thumbnail_url: null, caption: "Album Cover Shoot", uploaded_at: new Date() },
]);

const recentUpdates = ref([
  {
    id: 1,
    type: "release",
    title: "New Single Released",
    description: "Midnight Dreams is now available on all platforms",
    created_at: new Date(),
  },
  {
    id: 2,
    type: "tour",
    title: "Tour Dates Announced",
    description: "2024 World Tour kicks off in March",
    created_at: new Date(),
  },
  {
    id: 3,
    type: "merch",
    title: "New Merch Drop",
    description: "Limited edition vinyl and tour merchandise available",
    created_at: new Date(),
  },
]);

const activeProjects = ref([
  { id: 1, name: "New Album Recording", progress: 65 },
  { id: 2, name: "Music Video Production", progress: 30 },
]);

// Computed
const loading = computed(() => dashboardStore.loading);
const stats = computed(() => dashboardStore.stats);

const currentHour = new Date().getHours();
const greeting = computed(() => {
  if (currentHour < 12) return "morning";
  if (currentHour < 18) return "afternoon";
  return "evening";
});

const firstName = computed(() => authStore.userName.split(" ")[0]);

// Methods
const navigateToArtist = (artist) => {
  router.push(`/artists/${artist.slug}`);
};

const handleArtistCreated = async (artistData, avatarFile) => {
  try {
    const artist = await dashboardStore.createArtist(artistData, avatarFile);
    showCreateArtistModal.value = false;
    router.push(`/artists/${artist.slug}`);
  } catch (error) {
    console.error("Failed to create artist:", error);
  }
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = d - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days} days`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const go = (link) => {
  if (link) router.push(link);
};

const getUpdateIcon = (type) => {
  const icons = {
    release:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    tour: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    merch:
      "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",
  };
  return icons[type] || icons.release;
};

const scrollUploads = (direction) => {
  if (!uploadsTrack.value) return;
  const scrollAmount = 300;
  const currentScroll = uploadsTrack.value.scrollLeft;

  if (direction === "prev") {
    uploadsTrack.value.scrollTo({
      left: currentScroll - scrollAmount,
      behavior: "smooth",
    });
  } else {
    uploadsTrack.value.scrollTo({
      left: currentScroll + scrollAmount,
      behavior: "smooth",
    });
  }
};

const checkScrollButtons = () => {
  if (!uploadsTrack.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = uploadsTrack.value;
  showPrevButton.value = scrollLeft > 0;
  showNextButton.value = scrollLeft < scrollWidth - clientWidth - 10;
};

const playTrack = (track) => {
  nowPlaying.value = track;
  isPlaying.value = true;
  playbackStore.playSong({
    id: track.id,
    name: track.title,
    artist_name: track.artist,
    artwork_url: track.cover_url || null,
    duration: 180,
  });
};

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
};

const previousTrack = () => {
  playbackStore.playPrevious();
};

const nextTrack = () => {
  playbackStore.playNext();
};

const viewPhoto = (photo) => {
  showToast({ message: `Opening ${photo.caption}`, type: "info" });
  router.push("/media-library");
};

const viewUpdate = (update) => {
  showToast({ message: update.title, type: "info" });
  router.push("/timeline");
};

const triggerUpload = () => {
  router.push("/files");
};

const highlights = computed(() => highlightsStore.highlights);

// Add activity filters
const activityFilters = [
  { type: "all", label: "All" },
  {
    type: "music",
    label: "Music",
    icon: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  },
  {
    type: "photo",
    label: "Photos",
    icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  },
  {
    type: "dates",
    label: "Dates",
    icon: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z",
  },
  {
    type: "merch",
    label: "Merch",
    icon: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",
  },
  {
    type: "live",
    label: "Live",
    icon: "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z",
  },
];

// Add mock data for new types
const importantDates = ref([
  {
    id: 1,
    title: "Album Release",
    type: "Release Date",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: "Tour Announcement",
    type: "Announcement",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
]);

const merchItems = ref([
  { id: 1, title: "Limited Edition Vinyl", created_at: new Date(Date.now() - 3 * 60 * 60 * 1000) },
  { id: 2, title: "Tour T-Shirt Drop", created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) },
]);

const liveEvents = ref([
  { id: 1, title: "Instagram Live Session", date: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: 2, title: "Virtual Concert", date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
]);

// Computed filtered items
const filteredMusic = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "music"
    ? recentMusic.value
    : [],
);
const filteredPhotos = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "photo"
    ? recentPhotos.value.slice(0, 4)
    : [],
);
const filteredDates = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "dates"
    ? importantDates.value
    : [],
);
const filteredMerch = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "merch"
    ? merchItems.value
    : [],
);
const filteredLive = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "live"
    ? liveEvents.value
    : [],
);

const shouldShowItem = (type) => {
  return activeActivityFilter.value === "all" || activeActivityFilter.value === type;
};

const viewDate = (date) => {
  void date;
  router.push("/calendar");
};

const viewMerch = (merch) => {
  void merch;
  router.push("/files");
};

const viewLive = (live) => {
  void live;
  router.push("/timeline");
};

const handleTaskClick = (task) => {
  // Don't navigate if dragging
  if (isDragging.value) return;

  // Navigate based on task type
  switch (task.type) {
    case "release":
      router.push(`/artists/${task.artist_slug}`);
      break;
    case "contract":
      router.push("/files");
      break;
    case "marketing":
      router.push("/timeline");
      break;
    default:
      router.push("/notes");
  }
};

// Ticker interaction methods
const startDrag = (e) => {
  isDragging.value = true;
  tickerTrack.value.style.cursor = "grabbing";

  // Cancel auto-scroll
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
    animationId.value = null;
  }

  // Get starting position
  const pageX = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
  startX.value = pageX;
  startScrollLeft.value = tickerPosition.value;

  // Prevent text selection
  e.preventDefault();

  // Add event listeners
  if (e.type.includes("mouse")) {
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);
  } else {
    document.addEventListener("touchmove", drag, { passive: false });
    document.addEventListener("touchend", stopDrag);
  }
};

const drag = (e) => {
  if (!isDragging.value) return;

  e.preventDefault();
  const pageX = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
  const walk = (pageX - startX.value) * 1.5; // Increase sensitivity

  tickerPosition.value = startScrollLeft.value + walk;
  lastInteractionTime.value = Date.now();
};

const stopDrag = () => {
  isDragging.value = false;
  tickerTrack.value.style.cursor = "grab";

  // Remove event listeners
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", stopDrag);

  // Resume auto-scroll after 3 seconds
  setTimeout(() => {
    if (Date.now() - lastInteractionTime.value >= 3000) {
      startWorkflowTicker();
    }
  }, 3000);
};

// Lifecycle
onMounted(async () => {
  await authStore.initialize();
  if (authStore.isAuthenticated) {
    await dashboardStore.loadDashboardData();
    try {
      await calendarStore.loadEvents();
    } catch (error) {
      console.error("Dashboard calendar preload failed:", error);
    }
  }

  // Start workflow ticker animation
  startWorkflowTicker();
});

const startWorkflowTicker = () => {
  if (!tickerTrack.value || isDragging.value) return;

  const animate = () => {
    if (isDragging.value) {
      animationId.value = null;
      return;
    }

    tickerPosition.value -= autoScrollSpeed.value;

    // Get the width of the ticker content
    const tickerWidth = tickerTrack.value.scrollWidth;
    const containerWidth = tickerTrack.value.parentElement.offsetWidth;

    // Reset position when scrolled too far
    if (Math.abs(tickerPosition.value) >= tickerWidth - containerWidth + 100) {
      tickerPosition.value = 0;
    }

    animationId.value = requestAnimationFrame(animate);
  };

  // Start animation after a short delay
  setTimeout(() => {
    if (!isDragging.value) {
      animate();
    }
  }, 1000);
};

// Cleanup on unmount
onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
});
</script>

<style scoped>
/* Dashboard Layout */
.dashboard-view {
  min-height: 0;
  background: transparent;
}

.quick-stats {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--control-sm);
  padding: 0 var(--control-px);
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text-secondary);
}

.stat-pill strong {
  color: var(--color-text);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.quick-upload-btn {
  backdrop-filter: blur(18px);
}

.quick-upload-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2.1;
}

.quick-upload-btn:hover {
  background: rgba(19, 18, 17, 0.06);
}

.quick-upload-btn:focus-visible,
.stat-action-btn:focus-visible,
.see-more-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(125, 211, 252, 0.45);
}

/* Dashboard Content */
.dashboard-content {
  padding: 0;
  max-width: none;
  margin: 0;
  min-width: 0;
  max-width: 100%;
}

/* Hero Toolbar */
.hero-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.hero-toolbar-label {
  display: grid;
  gap: 2px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
}

.hero-toolbar-eyebrow {
  font-size: var(--text-utility);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.hero-toolbar-meta {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
}

/* Workflow Ticker */
.workflow-ticker {
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent);
  position: relative;
  user-select: none;
}

.ticker-track {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  width: max-content;
  min-width: max-content;
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
  gap: var(--space-2);
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.ticker-item + .ticker-item::before {
  content: "";
  width: 3px;
  height: 3px;
  margin-right: var(--space-2);
  border-radius: 999px;
  background: var(--color-border-strong);
}

.ticker-item:hover {
  color: var(--color-text);
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
  background: var(--color-info);
}

.task-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.task-text strong {
  color: var(--color-text);
  font-weight: 500;
}

/* Streamlined Recent Uploads */
.recent-uploads-inline {
  margin-bottom: var(--space-10);
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  min-width: 0;
  max-width: 100%;
}

.section-heading {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.section-title {
  font-size: clamp(26px, 3vw, 32px);
  line-height: 0.98;
  letter-spacing: -0.05em;
  font-weight: var(--weight-semibold);
  margin: 0;
  color: var(--color-text);
}

.priority-actions .section-title,
.artists-section .section-title {
  font-size: clamp(26px, 3vw, 32px);
  line-height: 0.96;
  letter-spacing: -0.05em;
  font-weight: var(--weight-semibold);
}

.see-more-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.see-more-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-strong);
  background: rgba(255, 255, 255, 0.92);
  transform: translateY(-1px);
}

.uploads-carousel {
  position: relative;
  min-width: 0;
  max-width: 100%;
  margin-top: var(--space-6);
  overflow: hidden;
}

.uploads-track {
  display: flex;
  gap: var(--space-4);
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
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
  width: var(--control-sm);
  height: var(--control-sm);
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
  left: calc(-1 * var(--space-4));
}

.carousel-nav.next {
  right: calc(-1 * var(--space-4));
}

.upload-item {
  flex-shrink: 0;
  width: 172px;
  cursor: pointer;
  min-width: 0;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.upload-item:hover {
  transform: translateY(-2px);
}

.item-cover {
  width: 172px;
  height: 172px;
  border-radius: var(--radius-card);
  overflow: hidden;
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: var(--space-3);
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
  background: linear-gradient(135deg, rgba(232, 90, 25, 0.18) 0%, rgba(32, 29, 26, 0.12) 100%);
}

.update-cover {
  display: flex;
  align-items: center;
  justify-content: center;
}

.update-cover.release {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-accent);
}

.update-cover.tour {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.update-cover.merch {
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
}

.item-type-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(19, 18, 17, 0.08);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  opacity: 0.72;
  transition:
    opacity 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
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

.upload-item:hover .item-type-badge {
  background: rgba(19, 18, 17, 0.78);
  color: var(--color-text-inverse);
  opacity: 1;
}

.item-info {
  padding-inline: var(--space-2);
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
  margin: 0 0 var(--space-1);
}

.item-info time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* Priority Actions */
.priority-actions {
  margin-bottom: var(--space-10);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-card);
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
  width: var(--control-lg);
  height: var(--control-lg);
  border-radius: var(--radius-card);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(19, 18, 17, 0.04);
  color: var(--color-text-secondary);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.action-card:hover .action-icon {
  border-color: rgba(232, 90, 25, 0.16);
  background: rgba(232, 90, 25, 0.08);
  color: var(--color-accent);
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

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--space-8);
  min-width: 0;
  max-width: 100%;
}

.main-column {
  min-width: 0;
}

.side-column {
  min-width: 0;
}

.view-all {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.62);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-pill);
  padding: var(--space-2) var(--space-3);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.view-all:hover {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.05);
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
  background: var(--color-accent);
  animation: pulse 2s infinite;
}

.artist-metrics {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.metric {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.metric.trending {
  color: var(--color-accent);
}

.metric svg {
  opacity: 0.6;
}

/* Artists Grid */
.artists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  gap: var(--space-6);
}

.artist-card {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.artist-card:hover {
  transform: translateY(-4px);
}

.artist-avatar {
  width: 100%;
  aspect-ratio: 1;
  min-height: 152px;
  border-radius: var(--radius-card);
  overflow: hidden;
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
  font-size: var(--placeholder-initial-card);
  font-weight: 500;
  letter-spacing: -0.06em;
  color: var(--color-text);
  background: linear-gradient(135deg, rgba(232, 90, 25, 0.14), rgba(19, 18, 17, 0.08));
}

.artist-info h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 var(--space-1);
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
  gap: var(--space-8);
  position: sticky;
  top: var(--space-8);
}

.section-subtitle {
  margin: 0 0 var(--space-3);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.48);
  font-weight: 580;
}

.highlights-section,
.now-playing {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-card);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
  padding: var(--space-4);
}

.highlights-list {
  display: grid;
  gap: var(--space-2);
}

.highlight-item {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-control);
  padding: var(--space-2) var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.highlight-item:hover {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.pin-icon {
  color: rgba(255, 255, 255, 0.54);
  flex-shrink: 0;
}

.highlight-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.86);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playing-card {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
}

.playing-cover {
  width: 68px;
  height: 68px;
  border-radius: var(--radius-control);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.playing-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playing-info {
  min-width: 0;
}

.playing-info h4 {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 540;
  color: rgba(255, 255, 255, 0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playing-info p {
  margin: 0 0 var(--space-3);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playing-controls {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.playing-controls button {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.76);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.playing-controls button:hover {
  border-color: rgba(255, 255, 255, 0.22);
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.playing-controls .play-pause {
  width: var(--control-sm);
  height: var(--control-sm);
  background: #fff;
  color: #000;
  border-color: #fff;
}

.playing-controls .play-pause:hover {
  background: rgba(255, 255, 255, 0.92);
}

/* Empty States */
.empty-artists,
.empty-activity {
  text-align: center;
  padding: var(--space-6);
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 14px;
  border-radius: var(--radius-card);
  margin: var(--space-6) 0;
}

/* API Error Fallback */
.api-error-fallback {
  text-align: center;
  padding: var(--space-8);
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: var(--radius-card);
  margin: var(--space-6) 0;
  border: 2px solid rgba(239, 68, 68, 0.2);
}

.api-error-fallback .error-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
}

.api-error-fallback h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 var(--space-2) 0;
  color: #ef4444;
}

.api-error-fallback p {
  font-size: 14px;
  color: #666;
  margin: 0 0 var(--space-6) 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.api-error-fallback .retry-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: #ef4444;
  color: white;
  border: none;
  border-radius: var(--radius-control);
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
  grid-template-columns: repeat(auto-fill, minmax(min(160px, 100%), 1fr));
  gap: var(--space-6);
}

.skeleton-card {
  height: 220px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-card);
  position: relative;
  overflow: hidden;
}

.skeleton-card::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
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
    padding: 0;
  }

  .minimal-header {
    padding: 24px 24px 16px;
  }

  .greeting {
    font-size: 24px;
  }

  .hero-stats {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .stat-item {
    padding: var(--space-6);
  }

  .stat-number {
    font-size: 36px;
  }

  .artists-grid {
    grid-template-columns: repeat(auto-fill, minmax(min(120px, 100%), 1fr));
    gap: var(--space-4);
  }

  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Hero Stats */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-6);
  margin-bottom: var(--space-10);
}

/* Compact Hero Stats */
.hero-stats.compact {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.hero-stats.compact .stat-item {
  position: relative;
  min-height: 112px;
  padding: var(--space-5);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  transition:
    transform 0.24s ease,
    border-color 0.24s ease,
    background 0.24s ease,
    box-shadow 0.24s ease;
}

.hero-stats.compact .stat-item:hover {
  transform: translateY(-2px);
  border-color: rgba(200, 75, 17, 0.18);
  box-shadow: var(--shadow-1);
}

.hero-stats.compact .stat-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 3px;
  height: 100%;
  padding: 0;
  min-width: 0;
}

.hero-stats.compact .stat-item.interactive {
  display: block;
  min-height: 112px;
}

.hero-stats.compact .stat-item.interactive .stat-content {
  height: auto;
  padding-bottom: 0;
}

.stat-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.hero-stats.compact .stat-number {
  font-size: 30px;
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
  color: var(--color-accent);
  font-weight: 500;
}

.hero-stats.compact .stat-subtitle {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.44);
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-stats.compact .stat-live {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 6px;
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text-secondary);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.hero-stats.compact .live-dot {
  width: 5px;
  height: 5px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.stat-actions,
.stat-details.compact {
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 1;
  margin-top: 0;
  padding: 6px;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.9)),
    var(--color-surface);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-1);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(6px);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease,
    visibility 0.16s ease;
}

.stat-actions.is-visible,
.stat-details.compact.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
}

.stat-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  align-items: stretch;
}

.stat-action-btn {
  flex: 1 1 0;
  min-height: 28px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.86);
  font-size: 11px;
  font-weight: 510;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.stat-action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.24);
  color: #fff;
}

.stat-action-btn.primary {
  background: rgba(125, 211, 252, 0.22);
  border-color: rgba(125, 211, 252, 0.5);
  color: rgba(232, 248, 255, 0.96);
}

.stat-action-btn.primary:hover {
  background: rgba(125, 211, 252, 0.32);
  border-color: rgba(125, 211, 252, 0.7);
}

.stat-details.compact {
  display: grid;
  gap: 6px;
}

.detail-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 56px;
  align-items: center;
  gap: 8px;
}

.detail-name {
  font-size: 10px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-details.compact .progress-bar {
  height: 4px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.09);
  overflow: hidden;
}

.stat-details.compact .progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(232, 90, 25, 0.88), rgba(17, 16, 15, 0.76));
}

.stat-detail-enter-active,
.stat-detail-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.stat-detail-enter-from,
.stat-detail-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* Activity Filters */
.activity-filters {
  display: flex;
  gap: var(--space-1);
  margin: 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0;
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
  min-height: var(--control-sm);
  padding: 0 14px;
  background: transparent;
  border: 0;
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-pill svg {
  opacity: 0.82;
  color: inherit;
}

.filter-pill:hover {
  color: var(--color-text);
  background: rgba(19, 18, 17, 0.06);
}

.filter-pill.active {
  background: rgba(19, 18, 17, 0.08);
  color: var(--color-text);
}

.filter-pill.active svg {
  opacity: 1;
}

/* Additional cover styles for new types */
.date-cover {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
  display: flex;
  align-items: center;
  justify-content: center;
}

.merch-cover {
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
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

@media (max-width: 1200px) {
  .hero-stats.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .side-column {
    position: static;
  }
}

@media (max-width: 900px) {
  .section-title {
    font-size: 30px;
  }
}

@media (max-width: 768px) {
  .header-actions {
    width: 100%;
  }

  .hero-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .hero-toolbar-label,
  .workflow-ticker,
  .section-heading {
    width: 100%;
  }

  .quick-upload-btn,
  .create-btn {
    height: var(--control-md);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-title {
    font-size: 28px;
  }

  .hero-stats.compact {
    display: flex;
    gap: var(--space-3);
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 6px;
    margin-bottom: var(--space-8);
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
  }

  .hero-stats.compact .stat-item {
    min-width: 190px;
    flex: 0 0 auto;
    scroll-snap-align: start;
  }

  .recent-uploads-header .see-more-btn {
    align-self: flex-start;
  }

  .playing-card {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .playing-cover {
    width: 56px;
    height: 56px;
  }
}

/* Theme correction */
.dashboard-view {
  color: var(--color-text);
}

.dashboard-view
  :is(
    .recent-uploads-inline,
    .priority-actions,
    .artists-section,
    .highlights-section,
    .now-playing
  ) {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: none;
}

.dashboard-page :is(.quick-stats .stat-pill, .see-more-btn, .filter-pill, .carousel-nav) {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
  box-shadow: none;
}

.dashboard-page :is(.hero-stats.compact .stat-item, .upload-item, .artist-card, .playing-list-row) {
  border: 1px solid var(--color-border) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface) !important;
  color: var(--color-text) !important;
  box-shadow: none !important;
}

.dashboard-page
  :is(
    .quick-stats .stat-pill span,
    .task-text,
    .detail-name,
    .item-info p,
    .item-info time,
    .hero-stats.compact .stat-label,
    .hero-stats.compact .stat-subtitle,
    .artist-info p,
    .playing-info p,
    .section-subtitle,
    .hero-toolbar-meta,
    .action-hint,
    .metric
  ) {
  color: var(--color-text-secondary) !important;
}

.dashboard-page
  :is(
    .quick-stats .stat-pill strong,
    .task-text strong,
    .section-title,
    .item-info h4,
    .hero-stats.compact .stat-number,
    .stat-action-btn,
    .see-more-btn,
    .artist-info h3,
    .playing-info h4,
    .action-label,
    .view-all
  ) {
  color: var(--color-text) !important;
}

.dashboard-page .workflow-ticker,
.dashboard-page .ticker-item,
.dashboard-page .activity-filters {
  background: transparent;
}

.dashboard-page .ticker-item {
  border: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.dashboard-page .ticker-item:hover {
  border-color: transparent;
  box-shadow: none;
}

.dashboard-page .carousel-nav {
  background: rgba(255, 255, 255, 0.84);
  color: var(--color-text-secondary);
}

.dashboard-page .carousel-nav:hover {
  background: rgba(255, 255, 255, 0.96);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.dashboard-page .create-btn {
  border-color: rgba(19, 18, 17, 0.08);
  background: rgba(19, 18, 17, 0.94);
  color: var(--color-text-inverse);
}

.dashboard-page .create-btn:hover {
  background: rgba(19, 18, 17, 1);
}

.dashboard-page .stat-actions,
.dashboard-page .stat-details.compact {
  box-shadow: var(--shadow-1);
}

.dashboard-page .stat-action-btn {
  border-color: var(--color-border);
  background: rgba(19, 18, 17, 0.04);
}

.dashboard-page .stat-action-btn:hover {
  background: rgba(19, 18, 17, 0.08);
  color: var(--color-text);
}

.dashboard-page .stat-action-btn.primary {
  background: rgba(19, 18, 17, 0.94);
  border-color: rgba(19, 18, 17, 0.08);
  color: var(--color-text-inverse);
}

.dashboard-page .stat-details.compact .progress-bar {
  background: rgba(19, 18, 17, 0.08);
}

.dashboard-page .stat-details.compact .progress-fill {
  background: linear-gradient(90deg, rgba(200, 75, 17, 0.86), rgba(19, 18, 17, 0.82));
}

.dashboard-page .hero-stats.compact .stat-trend {
  color: var(--color-accent);
}

.dashboard-page .hero-stats.compact .stat-live {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text-secondary);
}

.dashboard-page .hero-stats.compact .live-dot {
  background: var(--color-accent);
}

.dashboard-page .filter-pill,
.dashboard-page .see-more-btn,
.dashboard-view .carousel-nav {
  backdrop-filter: blur(18px);
}

.dashboard-view .filter-pill.active {
  background: rgba(200, 75, 17, 0.08);
  color: var(--color-accent) !important;
}

.dashboard-view .cover-placeholder,
.dashboard-view .date-cover,
.dashboard-view .merch-cover,
.dashboard-view .live-cover {
  background: linear-gradient(135deg, rgba(200, 75, 17, 0.1), rgba(255, 255, 255, 0.38));
}

.dashboard-view .play-overlay {
  background: rgba(19, 18, 17, 0.72);
  color: var(--color-text-inverse);
}

.dashboard-view :is(.upload-item:hover, .hero-stats.compact .stat-item:hover, .artist-card:hover) {
  border-color: rgba(200, 75, 17, 0.18);
  box-shadow: var(--shadow-1) !important;
}

.dashboard-view .hero-stats.compact {
  gap: var(--space-5);
}

.dashboard-view .hero-stats.compact .stat-item {
  min-height: 112px;
  padding: var(--space-5) !important;
  justify-content: flex-start;
}

.dashboard-view :is(.recent-uploads-inline, .priority-actions, .artists-section) {
  padding: var(--space-8);
}

.dashboard-view .recent-uploads-inline {
  margin-bottom: var(--space-8);
}

.dashboard-view .priority-actions {
  margin-bottom: var(--space-8);
}

.dashboard-view .section-header {
  margin-bottom: var(--space-5);
  align-items: flex-start;
}

.dashboard-view .recent-uploads-header {
  align-items: flex-end;
  gap: var(--space-5);
}

.dashboard-view .recent-uploads-inline .section-title {
  font-size: clamp(24px, 2.7vw, 30px);
  line-height: 1;
}

.dashboard-view .uploads-carousel {
  margin-top: 0;
}

.dashboard-view .uploads-track {
  padding: 6px var(--space-2) 12px;
  margin: 0;
  scroll-padding-inline: var(--space-2);
  gap: var(--space-5);
}

.dashboard-view .upload-item {
  width: 172px;
}

.dashboard-view .item-cover {
  width: 172px;
  height: 172px;
  margin-bottom: var(--space-4);
}
</style>
