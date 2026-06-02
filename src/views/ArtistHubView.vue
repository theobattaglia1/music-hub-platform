<template>
  <WorkspacePage
    class="artist-hub-view"
    artist-scoped-header
    :title="artist?.name || 'Artist'"
    :artist-workspace-project-count="activeProjects.length"
    :artist-workspace-activity-count="activityTimeline.length"
    :artist-workspace-team-count="primaryTeamMembers.length"
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="handleNewRelease">
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
        <span>New Release</span>
      </button>
      <button class="workspace-header-secondary-btn" @click="handleUpload">
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
    </template>

    <template v-if="activeTab === 'overview'" #stats>
      <section class="hero-stats compact artist-overview-stats">
        <article class="stat-item">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ stats.totalReleases }}</h2>
            </div>
            <p class="stat-label">Releases</p>
          </div>
        </article>

        <article class="stat-item">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ formatNumber(stats.totalStreams) }}</h2>
            </div>
            <p class="stat-label">Total Streams</p>
          </div>
        </article>

        <article class="stat-item">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ stats.activeProjects }}</h2>
            </div>
            <p class="stat-label">Active Projects</p>
          </div>
        </article>

        <article class="stat-item">
          <div class="stat-content">
            <div class="stat-header">
              <h2 class="stat-number">{{ stats.teamSize }}</h2>
            </div>
            <p class="stat-label">Team Members</p>
          </div>
        </article>
      </section>
    </template>

    <template v-if="activeTab === 'overview'" #toolbar>
      <section class="insights-bar artist-context-bar">
        <div class="insight-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
            />
          </svg>
          <span>{{ formatNumber(monthlyListeners) }} monthly listeners</span>
        </div>

        <div class="insights-divider"></div>

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
    </template>

    <template v-if="activeTab === 'projects'" #toolbar>
      <div class="projects-toolbar artist-context-bar">
        <label class="project-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="projectSearch"
            type="text"
            placeholder="Search projects, owners, and milestones..."
          />
        </label>

        <div class="project-filter-chips">
          <button
            v-for="option in projectStatusOptions"
            :key="option.value"
            :class="['project-filter-chip', { active: projectStatusFilter === option.value }]"
            @click="projectStatusFilter = option.value"
          >
            <span>{{ option.label }}</span>
            <strong>{{ option.count }}</strong>
          </button>
        </div>

        <label class="project-sort">
          <span>Sort</span>
          <select v-model="projectSortBy">
            <option value="due">Due Date</option>
            <option value="priority">Priority</option>
            <option value="progress">Progress</option>
            <option value="updated">Last Updated</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
    </template>

    <div class="artist-content">
      <!-- Tab Content -->
      <div v-if="activeTab === 'overview'" class="tab-content tab-content-overview">
        <!-- Recent Activity -->
        <section class="recent-uploads-inline surface-panel">
          <div class="section-header">
            <h2 class="section-title">Recent Activity</h2>
            <button @click="viewAllActivity" class="see-more-btn">
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

          <!-- Activity Filters -->
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
                  <p>{{ item.subtitle || "Track" }}</p>
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
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      opacity="0.3"
                    >
                      <path
                        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                      />
                    </svg>
                  </div>
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
            <!-- Quick Actions -->
            <section class="priority-actions surface-panel">
              <h2 class="section-title">Quick Actions</h2>
              <div class="actions-grid">
                <button class="action-card" @click="handleNewRelease">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                      />
                    </svg>
                  </div>
                  <span class="action-label">New Release</span>
                  <span class="action-hint">Start a new project</span>
                </button>

                <button class="action-card" @click="handleSchedule">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"
                      />
                    </svg>
                  </div>
                  <span class="action-label">Schedule</span>
                  <span class="action-hint">Plan releases</span>
                </button>

                <button class="action-card" @click="handleAnalytics">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
                      />
                    </svg>
                  </div>
                  <span class="action-label">Analytics</span>
                  <span class="action-hint">View insights</span>
                </button>

                <button class="action-card" @click="handleTeam">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                      />
                    </svg>
                  </div>
                  <span class="action-label">Team</span>
                  <span class="action-hint">Manage access</span>
                </button>
              </div>
            </section>

            <!-- Active Projects -->
            <section class="projects-section surface-panel">
              <div class="section-header">
                <h2 class="section-title">Active Projects</h2>
                <button @click="viewAllProjects" class="view-all">View all →</button>
              </div>

              <div class="projects-grid">
                <article
                  v-for="project in activeProjects"
                  :key="project.id"
                  class="project-card"
                  @click="openProjectPage(project)"
                  @contextmenu.prevent.stop="openProjectContextMenu($event, project)"
                >
                  <div class="project-header">
                    <h3>{{ project.name }}</h3>
                    <span class="project-status" :class="project.status">{{
                      formatProjectStatus(project.status)
                    }}</span>
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
            <section v-if="highlights.length > 0" class="highlights-section compact surface-panel">
              <h3 class="section-subtitle">Pinned</h3>
              <div class="highlights-list horizontal">
                <div
                  v-for="highlight in highlights"
                  :key="highlight.id"
                  class="highlight-item mini"
                  @click="goToHighlight(highlight)"
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

            <!-- Team Activity -->
            <section class="team-activity surface-panel">
              <h3 class="section-subtitle">Team Activity</h3>
              <div class="activity-list">
                <div v-for="activity in teamActivity" :key="activity.id" class="activity-item">
                  <img
                    v-if="activity.user.avatar"
                    :src="activity.user.avatar"
                    class="user-avatar"
                  />
                  <div v-else class="user-avatar-placeholder">{{ activity.user.initials }}</div>
                  <div class="activity-content">
                    <p>
                      <strong>{{ activity.user.name }}</strong> {{ activity.action }}
                    </p>
                    <time>{{ formatTimeAgo(activity.timestamp) }}</time>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <!-- Projects Tab -->
      <div v-if="activeTab === 'projects'" class="tab-content tab-content-projects">
        <div class="tab-header">
          <div>
            <h2 class="tab-title">Projects</h2>
            <p class="tab-caption">
              Board for active execution. List view for full project history and scale.
            </p>
          </div>
          <div class="tab-header-actions">
            <div class="project-layout-toggle">
              <button
                :class="['layout-btn', { active: projectLayout === 'board' }]"
                @click="setProjectLayout('board')"
              >
                Board
              </button>
              <button
                :class="['layout-btn', { active: projectLayout === 'list' }]"
                @click="setProjectLayout('list')"
              >
                All Projects
              </button>
            </div>
            <button class="tab-action" @click="openCreateProjectModal">New Project</button>
          </div>
        </div>

        <div v-if="projectLayout === 'board'" class="projects-workspace">
          <section class="project-pipeline surface-panel">
            <article v-for="stage in projectPipeline" :key="stage.id" class="pipeline-column">
              <header class="pipeline-header">
                <div>
                  <h3>{{ stage.label }}</h3>
                  <p>{{ stage.description }}</p>
                </div>
                <span>{{ stage.projects.length }}</span>
              </header>

              <div class="pipeline-list">
                <div v-if="stage.projects.length === 0" class="pipeline-empty">
                  No projects in this stage
                </div>
                <button
                  v-for="project in stage.projects"
                  :key="`pipeline-${project.id}`"
                  class="pipeline-card"
                  :class="{ selected: selectedProject?.id === project.id }"
                  @click="selectProject(project)"
                  @dblclick="openProjectPage(project)"
                  @contextmenu.prevent.stop="openProjectContextMenu($event, project)"
                >
                  <div class="pipeline-card-head">
                    <h4>{{ project.name }}</h4>
                    <span class="project-priority" :class="project.priority">{{
                      project.priority
                    }}</span>
                  </div>

                  <p class="pipeline-card-owner">{{ project.owner }}</p>
                  <p class="pipeline-card-next">{{ project.nextMilestone }}</p>

                  <div class="pipeline-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: `${project.progress}%` }"></div>
                    </div>
                    <span>{{ project.progress }}%</span>
                  </div>

                  <div class="pipeline-meta">
                    <span>Due {{ formatDate(project.deadline) }}</span>
                    <span>{{ project.tasks.completed }}/{{ project.tasks.total }} tasks</span>
                  </div>
                </button>
              </div>
            </article>
          </section>

          <aside v-if="selectedProject" class="project-detail surface-panel">
            <header class="project-detail-header">
              <div>
                <h3>{{ selectedProject.name }}</h3>
                <p>{{ selectedProject.description }}</p>
              </div>
              <div class="project-detail-meta">
                <div class="project-detail-badges">
                  <div class="project-detail-badge">
                    <span>Stage</span>
                    <strong class="project-status" :class="selectedProject.status">
                      {{ formatProjectStatus(selectedProject.status) }}
                    </strong>
                  </div>
                  <div class="project-detail-badge">
                    <span>Priority</span>
                    <strong class="project-priority" :class="selectedProject.priority">{{
                      selectedProject.priority
                    }}</strong>
                  </div>
                </div>
                <button class="detail-link-btn" @click="openProjectPage(selectedProject)">
                  Open Project Page
                </button>
              </div>
            </header>

            <div class="project-metrics">
              <article class="detail-metric">
                <span>Progress</span>
                <strong>{{ selectedProject.progress }}%</strong>
              </article>
              <article class="detail-metric">
                <span>Due Date</span>
                <strong>{{ formatDate(selectedProject.deadline) }}</strong>
              </article>
              <article class="detail-metric">
                <span>Owner</span>
                <strong>{{ selectedProject.owner }}</strong>
              </article>
              <article class="detail-metric">
                <span>Tasks</span>
                <strong
                  >{{ selectedProject.tasks.completed }}/{{ selectedProject.tasks.total }}</strong
                >
              </article>
            </div>

            <section class="project-detail-section">
              <div class="detail-section-header">
                <h4>Milestones</h4>
                <span
                  >{{ completedMilestoneCount }}/{{
                    selectedProject.milestones.length
                  }}
                  complete</span
                >
              </div>
              <div class="milestone-list">
                <button
                  v-for="milestone in selectedProject.milestones"
                  :key="`milestone-${selectedProject.id}-${milestone.id}`"
                  class="milestone-row"
                  :class="{ done: milestone.done }"
                  @click="toggleMilestone(selectedProject.id, milestone.id)"
                >
                  <span class="milestone-check">{{ milestone.done ? "✓" : "" }}</span>
                  <span class="milestone-title">{{ milestone.title }}</span>
                  <span class="milestone-date">{{ formatDate(milestone.due_date) }}</span>
                </button>
              </div>
            </section>

            <section class="project-detail-section">
              <h4>Quick Actions</h4>
              <div class="detail-actions">
                <button class="detail-action-btn" @click="router.push(buildArtistRouteTarget('/files'))">
                  Review Files
                </button>
                <button class="detail-action-btn" @click="router.push(buildArtistRouteTarget('/calendar'))">
                  Schedule
                </button>
                <button class="detail-action-btn" @click="router.push(buildArtistRouteTarget('/notes'))">Open Notes</button>
                <button class="detail-action-btn" @click="router.push(buildArtistRouteTarget('/team'))">
                  Collaborators
                </button>
              </div>
            </section>
          </aside>
          <section v-else class="project-detail empty surface-panel">
            <p>Select a project to view details.</p>
          </section>
        </div>

        <div v-else class="projects-list-view">
          <div class="projects-list-header">
            <p>
              Showing <strong>{{ listStart }}</strong> to <strong>{{ listEnd }}</strong> of
              <strong>{{ filteredProjects.length }}</strong> projects
            </p>
          </div>

          <div v-if="pagedProjects.length > 0" class="projects-list-table surface-panel">
            <button
              v-for="project in pagedProjects"
              :key="`list-${project.id}`"
              class="project-list-row"
              :class="{ selected: selectedProject?.id === project.id }"
              @click="selectProject(project)"
              @dblclick="openProjectPage(project)"
              @contextmenu.prevent.stop="openProjectContextMenu($event, project)"
            >
              <div class="project-list-main">
                <h4>{{ project.name }}</h4>
                <p>{{ project.description }}</p>
              </div>
              <div class="project-list-owner">{{ project.owner }}</div>
              <div class="project-list-status">
                <span class="project-status" :class="project.status">{{
                  formatProjectStatus(project.status)
                }}</span>
                <span class="project-priority" :class="project.priority">{{
                  project.priority
                }}</span>
              </div>
              <div class="project-list-progress">
                <strong>{{ project.progress }}%</strong>
                <small>{{ project.tasks.completed }}/{{ project.tasks.total }} tasks</small>
              </div>
              <div class="project-list-due">Due {{ formatDate(project.deadline) }}</div>
            </button>
          </div>
          <div v-else class="projects-list-empty">
            No projects match the current search and filters.
          </div>

          <div v-if="totalProjectPages > 1" class="projects-pagination">
            <button
              class="pagination-btn"
              :disabled="projectsPage === 1"
              @click="projectsPage -= 1"
            >
              Previous
            </button>
            <span>Page {{ projectsPage }} of {{ totalProjectPages }}</span>
            <button
              class="pagination-btn"
              :disabled="projectsPage === totalProjectPages"
              @click="projectsPage += 1"
            >
              Next
            </button>
          </div>

          <div v-if="selectedProject" class="projects-list-selection surface-panel">
            <span>{{ selectedProject.name }} selected</span>
            <div class="projects-list-selection-actions">
              <button class="tab-action" @click="openProjectPage(selectedProject)">
                Open Project Page
              </button>
              <button class="tab-action" @click="setProjectLayout('board')">Open In Board</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Tab -->
      <div v-if="activeTab === 'activity'" class="tab-content tab-content-activity">
        <div class="tab-header">
          <h2 class="tab-title">Activity</h2>
          <button class="tab-action" @click="handleUpload">Upload Asset</button>
        </div>

        <div class="activity-stream surface-panel">
          <button
            v-for="item in activityTimeline"
            :key="item.id"
            class="activity-row"
            @click="openActivityItem(item)"
          >
            <div class="activity-row-icon" :class="item.type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path :d="getActivityIcon(item.type)" />
              </svg>
            </div>
            <div class="activity-row-content">
              <h4>{{ item.title }}</h4>
              <p>{{ item.subtitle }}</p>
            </div>
            <time>{{ formatTimeAgo(item.timestamp) }}</time>
          </button>
        </div>
      </div>

      <!-- Analytics Tab -->
      <div v-if="activeTab === 'analytics'" class="tab-content tab-content-analytics">
        <h2 class="tab-title">Analytics</h2>

        <div class="analytics-grid">
          <article class="metric-card">
            <span class="metric-label">Monthly Listeners</span>
            <strong class="metric-value">{{ formatNumber(monthlyListeners) }}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">Total Streams</span>
            <strong class="metric-value">{{ formatNumber(stats.totalStreams) }}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">Active Releases</span>
            <strong class="metric-value">{{ stats.totalReleases }}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">Team Collaboration</span>
            <strong class="metric-value">{{ primaryTeamMembers.length }}</strong>
          </article>
        </div>

        <section class="tab-subsection surface-panel">
          <h3 class="section-subtitle">Performance Mix</h3>
          <div class="metric-bars">
            <div v-for="metric in performanceBreakdown" :key="metric.id" class="metric-bar">
              <span>{{ metric.label }}</span>
              <div class="metric-track">
                <div class="metric-fill" :style="{ width: `${metric.value}%` }"></div>
              </div>
              <strong>{{ metric.value }}%</strong>
            </div>
          </div>
        </section>
      </div>

      <!-- Team Tab -->
      <div v-if="activeTab === 'team'" class="tab-content tab-content-team">
        <div class="tab-header">
          <h2 class="tab-title">Team</h2>
          <button class="tab-action" @click="router.push(buildArtistRouteTarget('/team'))">Manage Team</button>
        </div>

        <div class="team-grid collection-grid-compact">
          <article v-for="member in primaryTeamMembers" :key="member.id" class="member-card">
            <div class="member-avatar">{{ member.initials }}</div>
            <div class="member-info">
              <h4>{{ member.name }}</h4>
              <p>{{ member.role }}</p>
            </div>
            <span class="member-status" :class="member.status">{{ member.status }}</span>
          </article>
        </div>

        <section class="tab-subsection">
          <h3 class="section-subtitle">Recent Collaboration</h3>
          <div class="activity-list">
            <div
              v-for="activity in teamActivity"
              :key="`team-tab-${activity.id}`"
              class="activity-item"
            >
              <div class="user-avatar-placeholder">{{ activity.user.initials }}</div>
              <div class="activity-content">
                <p>
                  <strong>{{ activity.user.name }}</strong> {{ activity.action }}
                </p>
                <time>{{ formatTimeAgo(activity.timestamp) }}</time>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <teleport to="body">
      <transition name="fade">
        <div
          v-if="showProjectCreateModal"
          class="project-create-overlay"
          @click.self="closeCreateProjectModal"
        >
          <div class="project-create-modal">
            <div class="project-create-head">
              <div>
                <p class="project-create-eyebrow">Project Setup</p>
                <h3>Create Project</h3>
              </div>
              <button class="project-create-close" @click="closeCreateProjectModal">×</button>
            </div>

            <form class="project-create-form" @submit.prevent="submitCreateProject">
              <label>
                <span>Project Name</span>
                <input
                  v-model.trim="projectCreateForm.name"
                  type="text"
                  placeholder="Launch campaign sprint"
                  required
                />
              </label>

              <div class="project-create-grid">
                <label>
                  <span>Category</span>
                  <select v-model="projectCreateForm.category">
                    <option value="Release">Release</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Creative">Creative</option>
                    <option value="Touring">Touring</option>
                    <option value="Operations">Operations</option>
                  </select>
                </label>

                <label>
                  <span>Owner</span>
                  <input
                    v-model.trim="projectCreateForm.owner"
                    type="text"
                    placeholder="Project owner"
                  />
                </label>
              </div>

              <div class="project-create-grid three-up">
                <label>
                  <span>Stage</span>
                  <select v-model="projectCreateForm.status">
                    <option value="planning">Planning</option>
                    <option value="active">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Released</option>
                  </select>
                </label>

                <label>
                  <span>Priority</span>
                  <select v-model="projectCreateForm.priority">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>

                <label>
                  <span>Due In</span>
                  <input
                    v-model.number="projectCreateForm.dueDays"
                    type="number"
                    min="1"
                    max="365"
                  />
                </label>
              </div>

              <label>
                <span>Description</span>
                <textarea
                  v-model.trim="projectCreateForm.description"
                  rows="4"
                  maxlength="280"
                  placeholder="Describe the primary goal and the immediate next step."
                ></textarea>
              </label>

              <div class="project-create-grid">
                <label>
                  <span>Launch Window</span>
                  <input
                    v-model.trim="projectCreateForm.launchWindow"
                    type="text"
                    placeholder="Late March"
                  />
                </label>
                <label>
                  <span>Budget</span>
                  <input v-model.trim="projectCreateForm.budget" type="text" placeholder="$0" />
                </label>
              </div>

              <label>
                <span>Project Brief</span>
                <textarea
                  v-model.trim="projectCreateForm.brief"
                  rows="4"
                  maxlength="500"
                  placeholder="Outline scope, resources, and approvals."
                ></textarea>
              </label>

              <div class="project-create-footer">
                <button
                  type="button"
                  class="project-secondary-btn"
                  @click="closeCreateProjectModal"
                >
                  Cancel
                </button>
                <button type="submit" class="project-primary-btn">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </WorkspacePage>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, inject } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useHighlightsStore } from "@/stores/highlights";
import { usePlaybackStore } from "@/stores/playback";
import { useDashboardStore } from "@/stores/dashboard";
import { useArtistProjectsStore } from "@/stores/artistProjects";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";

const router = useRouter();
const route = useRoute();
const highlightsStore = useHighlightsStore();
const playbackStore = usePlaybackStore();
const dashboardStore = useDashboardStore();
const artistProjectsStore = useArtistProjectsStore();
const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});

// State
const activeTab = ref("overview");
const activeActivityFilter = ref("all");
const uploadsTrack = ref(null);
const showPrevButton = ref(false);
const showNextButton = ref(true);

// Ticker state
const tickerTrack = ref(null);
const tickerPosition = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const startScrollLeft = ref(0);
const animationId = ref(null);
const autoScrollSpeed = ref(0.5);
const lastInteractionTime = ref(0);

const validTabs = ["overview", "projects", "activity", "analytics", "team"];
const validProjectLayouts = ["board", "list"];

const selectedProjectId = ref(null);
const projectSearch = ref("");
const projectStatusFilter = ref("all");
const projectSortBy = ref("due");
const projectLayout = ref("board");
const projectsPage = ref(1);
const projectsPerPage = 8;
const showProjectCreateModal = ref(false);
const projectCreateForm = reactive({
  name: "",
  category: "Release",
  owner: "Project Owner",
  status: "planning",
  priority: "medium",
  dueDays: 21,
  description: "",
  brief: "",
  launchWindow: "TBD",
  budget: "$0",
});

const projectPipelineStages = [
  { id: "planning", label: "Planning", description: "Scoping and setup" },
  { id: "active", label: "In Progress", description: "Execution and production" },
  { id: "review", label: "Review", description: "Approvals and QA" },
  { id: "completed", label: "Released", description: "Closed and archived" },
];

const projectStatusMeta = {
  planning: { label: "Planning" },
  active: { label: "In Progress" },
  review: { label: "Review" },
  completed: { label: "Released" },
};

const priorityOrder = { high: 0, medium: 1, low: 2 };

const fallbackArtistName = computed(
  () =>
    String(route.params.slug || "artist")
      .split("-")
      .filter(Boolean)
      .map((chunk) => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
      .join(" ") || "Artist",
);

const buildArtistRouteTarget = (path) => {
  const query = artist.value?.slug ? { artist: artist.value.slug } : {};
  return { path, query };
};

// Activity filters
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
    type: "update",
    label: "Updates",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  },
];

// Computed
const artist = computed(() => {
  const slug = String(route.params.slug || "");
  const foundArtist = dashboardStore.artists.find((entry) => entry.slug === slug);

  if (foundArtist) {
    return foundArtist;
  }

  return {
    id: slug || "artist",
    slug: slug || "artist",
    name: fallbackArtistName.value,
    genre: "Music",
    avatar_url: null,
  };
});

watch(
  () => [artist.value.slug, artist.value.name],
  ([slug, name]) => {
    if (!slug) return;
    artistProjectsStore.ensureArtistSeed(slug, name);
  },
  { immediate: true },
);

const projectItems = computed(() => artistProjectsStore.getProjectsForArtist(artist.value.slug));

const monthlyListeners = computed(() => 1250000);

const stats = computed(() => ({
  totalReleases: 12,
  totalStreams: 850000000,
  activeProjects: activeProjects.value.length,
  teamSize: 8,
}));

const activeProjects = computed(() =>
  projectItems.value
    .filter((project) => project.status !== "completed")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline)),
);

const artistTasks = computed(() =>
  activeProjects.value
    .flatMap((project) =>
      project.milestones
        .filter((milestone) => !milestone.done)
        .map((milestone) => ({
          id: `${project.id}-${milestone.id}`,
          project_id: project.id,
          title: milestone.title,
          due_date: milestone.due_date,
          priority: project.priority,
        })),
    )
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 8),
);

// Mock activity data
const recentMusic = computed(() => [
  {
    id: 1,
    title: "Midnight Dreams - Final Mix",
    cover_url: null,
    uploaded_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 2,
    title: "Love Story (Taylor's Version)",
    cover_url: null,
    uploaded_at: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 3,
    title: "Acoustic Demo",
    cover_url: null,
    uploaded_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
]);

const recentPhotos = computed(() => [
  {
    id: 1,
    caption: "Studio Session",
    thumbnail_url: null,
    uploaded_at: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 2,
    caption: "Behind the Scenes",
    thumbnail_url: null,
    uploaded_at: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: 3,
    caption: "Album Cover Shoot",
    thumbnail_url: null,
    uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]);

const recentUpdates = computed(() => [
  {
    id: 1,
    type: "release",
    title: "New Single Released",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: 2,
    type: "tour",
    title: "Tour Dates Announced",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: 3,
    type: "award",
    title: "Grammy Nomination",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
]);

// Filtered activity items
const filteredMusic = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "music"
    ? recentMusic.value
    : [],
);

const filteredPhotos = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "photo"
    ? recentPhotos.value
    : [],
);

const filteredUpdates = computed(() =>
  activeActivityFilter.value === "all" || activeActivityFilter.value === "update"
    ? recentUpdates.value
    : [],
);

const projectStatusOptions = computed(() => [
  {
    value: "all",
    label: "All",
    count: projectItems.value.length,
  },
  ...projectPipelineStages.map((stage) => ({
    value: stage.id,
    label: stage.label,
    count: projectItems.value.filter((project) => project.status === stage.id).length,
  })),
]);

const filteredProjects = computed(() => {
  const term = projectSearch.value.trim().toLowerCase();
  let projects = [...projectItems.value];

  if (projectStatusFilter.value !== "all") {
    projects = projects.filter((project) => project.status === projectStatusFilter.value);
  }

  if (term) {
    projects = projects.filter((project) => {
      const milestoneMatch = project.milestones.some((milestone) =>
        milestone.title.toLowerCase().includes(term),
      );

      return (
        project.name.toLowerCase().includes(term) ||
        project.owner.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.nextMilestone.toLowerCase().includes(term) ||
        milestoneMatch
      );
    });
  }

  projects.sort((a, b) => {
    if (projectSortBy.value === "name") {
      return a.name.localeCompare(b.name);
    }

    if (projectSortBy.value === "priority") {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    if (projectSortBy.value === "progress") {
      return b.progress - a.progress;
    }

    if (projectSortBy.value === "updated") {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }

    return new Date(a.deadline) - new Date(b.deadline);
  });

  return projects;
});

const projectPipeline = computed(() =>
  projectPipelineStages.map((stage) => ({
    ...stage,
    projects: filteredProjects.value.filter((project) => project.status === stage.id),
  })),
);

const totalProjectPages = computed(() =>
  Math.max(1, Math.ceil(filteredProjects.value.length / projectsPerPage)),
);

const pagedProjects = computed(() => {
  const start = (projectsPage.value - 1) * projectsPerPage;
  return filteredProjects.value.slice(start, start + projectsPerPage);
});

const listStart = computed(() =>
  filteredProjects.value.length ? (projectsPage.value - 1) * projectsPerPage + 1 : 0,
);

const listEnd = computed(() =>
  Math.min(projectsPage.value * projectsPerPage, filteredProjects.value.length),
);

const selectedProject = computed(
  () => projectItems.value.find((project) => project.id === selectedProjectId.value) || null,
);

const completedMilestoneCount = computed(() =>
  selectedProject.value
    ? selectedProject.value.milestones.filter((milestone) => milestone.done).length
    : 0,
);

const highlights = computed(() =>
  highlightsStore.highlights
    .filter((h) => !h.artistId || h.artistId === artist.value.id)
    .slice(0, 4),
);

const teamActivity = computed(() => [
  {
    id: 1,
    user: { name: "Sarah Chen", initials: "SC", avatar: null },
    action: "uploaded final masters",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 2,
    user: { name: "Mike Johnson", initials: "MJ", avatar: null },
    action: "completed artwork review",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
]);

const activityTimeline = computed(() => {
  const music = recentMusic.value.map((item) => ({
    id: `music-${item.id}`,
    type: "music",
    title: item.title,
    subtitle: "Audio upload",
    timestamp: item.uploaded_at,
    payload: item,
  }));

  const photos = recentPhotos.value.map((item) => ({
    id: `photo-${item.id}`,
    type: "photo",
    title: item.caption,
    subtitle: "Photo upload",
    timestamp: item.uploaded_at,
    payload: item,
  }));

  const updates = recentUpdates.value.map((item) => ({
    id: `update-${item.id}`,
    type: item.type || "update",
    title: item.title,
    subtitle: "Team update",
    timestamp: item.created_at,
    payload: item,
  }));

  return [...music, ...photos, ...updates].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );
});

const performanceBreakdown = computed(() => [
  { id: "streams", label: "Streaming", value: 72 },
  { id: "social", label: "Social Reach", value: 58 },
  { id: "sync", label: "Sync Opportunities", value: 31 },
  { id: "live", label: "Live Demand", value: 44 },
]);

const primaryTeamMembers = computed(() =>
  teamActivity.value.map((entry, index) => {
    const roles = ["Manager", "Producer", "Creative Director", "Marketing Lead"];
    return {
      id: `${entry.id}-${entry.user.initials}`,
      name: entry.user.name,
      initials: entry.user.initials,
      role: roles[index % roles.length],
      status: index === 0 ? "online" : "active",
    };
  }),
);

// Methods
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatProjectStatus = (status) => projectStatusMeta[status]?.label || status;

const getActivityIcon = (type) => {
  const icons = {
    music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
    photo:
      "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
    update:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    release:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    tour: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    award:
      "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  };
  return icons[type] || icons.update;
};

const setActiveTab = (tabId) => {
  if (!validTabs.includes(tabId)) return;
  activeTab.value = tabId;
  if (tabId === "projects") {
    ensureSelectedProject();
  }
};

const setProjectLayout = (layout) => {
  if (!validProjectLayouts.includes(layout)) return;
  projectLayout.value = layout;
  if (layout === "list") {
    projectsPage.value = 1;
  } else {
    ensureSelectedProject();
  }
};

const ensureSelectedProject = () => {
  const available = filteredProjects.value.map((project) => project.id);
  if (!available.length) {
    selectedProjectId.value = null;
    return;
  }

  if (!selectedProjectId.value || !available.includes(selectedProjectId.value)) {
    selectedProjectId.value = available[0];
  }
};

const resetProjectCreateForm = () => {
  projectCreateForm.name = "";
  projectCreateForm.category = "Release";
  projectCreateForm.owner = primaryTeamMembers.value[0]?.name || "Project Owner";
  projectCreateForm.status = "planning";
  projectCreateForm.priority = "medium";
  projectCreateForm.dueDays = 21;
  projectCreateForm.description = "";
  projectCreateForm.brief = "";
  projectCreateForm.launchWindow = "TBD";
  projectCreateForm.budget = "$0";
};

const openCreateProjectModal = () => {
  resetProjectCreateForm();
  showProjectCreateModal.value = true;
};

const closeCreateProjectModal = () => {
  showProjectCreateModal.value = false;
};

const submitCreateProject = () => {
  const name = projectCreateForm.name.trim();
  if (!name || !artist.value?.slug) return;

  const dueDays = Math.max(1, Number.parseInt(String(projectCreateForm.dueDays || 21), 10) || 21);
  const createdProject = artistProjectsStore.createProject(artist.value.slug, {
    name,
    category: projectCreateForm.category,
    due_days: dueDays,
    owner: projectCreateForm.owner.trim() || "Project Owner",
    status: projectCreateForm.status,
    priority: projectCreateForm.priority,
    description:
      projectCreateForm.description.trim() || "New project created from artist workspace.",
    brief:
      projectCreateForm.brief.trim() ||
      "Use this workspace to align scope, milestones, resources, and stakeholders.",
    launchWindow: projectCreateForm.launchWindow.trim() || "TBD",
    budget: projectCreateForm.budget.trim() || "$0",
  });
  if (!createdProject) return;

  projectStatusFilter.value = "all";
  projectSortBy.value = "due";
  selectedProjectId.value = createdProject.id;
  setActiveTab("projects");
  setProjectLayout("board");
  closeCreateProjectModal();
  showToast({ message: `Created project ${name}`, type: "success" });
};

const toggleMilestone = (projectId, milestoneId) => {
  artistProjectsStore.toggleMilestone(artist.value.slug, projectId, milestoneId);
};

const shouldShowItem = (type) => {
  return activeActivityFilter.value === "all" || activeActivityFilter.value === type;
};

// Carousel methods
const scrollUploads = (direction) => {
  if (!uploadsTrack.value) return;

  const scrollAmount = 320; // Scroll by 2 items
  if (direction === "prev") {
    uploadsTrack.value.scrollLeft -= scrollAmount;
  } else {
    uploadsTrack.value.scrollLeft += scrollAmount;
  }
};

const checkScrollButtons = () => {
  if (!uploadsTrack.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = uploadsTrack.value;
  showPrevButton.value = scrollLeft > 0;
  showNextButton.value = scrollLeft < scrollWidth - clientWidth - 10;
};

// Activity item handlers
const playTrack = (track) => {
  playbackStore.playSong({
    id: track.id,
    name: track.title,
    artist_name: artist.value.name,
    artwork_url: track.cover_url || null,
    duration: 180,
  });
  showToast({ message: `Playing ${track.title}`, type: "success" });
};

const viewPhoto = (photo) => {
  showToast({ message: `Opening ${photo.caption}`, type: "info" });
  router.push(buildArtistRouteTarget("/media-library"));
};

const viewUpdate = (update) => {
  showToast({ message: update.title, type: "info" });
  setActiveTab("activity");
};

const openActivityItem = (item) => {
  if (item.type === "music") {
    playTrack(item.payload);
    return;
  }

  if (item.type === "photo") {
    viewPhoto(item.payload);
    return;
  }

  viewUpdate(item.payload);
};

// Ticker methods
const startDrag = (e) => {
  isDragging.value = true;
  startX.value = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
  startScrollLeft.value = tickerPosition.value;
  lastInteractionTime.value = Date.now();

  // Stop auto-scroll
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
};

const drag = (e) => {
  if (!isDragging.value) return;
  e.preventDefault();
  const x = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
  const walk = x - startX.value;
  tickerPosition.value = startScrollLeft.value + walk;
};

const stopDrag = () => {
  isDragging.value = false;

  // Resume auto-scroll after 3 seconds
  setTimeout(() => {
    if (Date.now() - lastInteractionTime.value >= 3000) {
      startAutoScroll();
    }
  }, 3000);
};

const startAutoScroll = () => {
  const animate = () => {
    if (!isDragging.value && tickerTrack.value) {
      tickerPosition.value -= autoScrollSpeed.value;

      // Reset position when first item is completely out of view
      const firstItemWidth = tickerTrack.value.firstElementChild?.offsetWidth || 0;
      if (Math.abs(tickerPosition.value) > firstItemWidth + 20) {
        tickerPosition.value = 0;
        // Move first item to end
        const firstItem = tickerTrack.value.firstElementChild;
        if (firstItem) {
          tickerTrack.value.appendChild(firstItem);
        }
      }
    }
    animationId.value = requestAnimationFrame(animate);
  };
  animate();
};

const handleTaskClick = (task) => {
  if (task.project_id) {
    const project = projectItems.value.find((item) => item.id === task.project_id);
    if (project) {
      openProject(project);
      return;
    }
  }

  const title = task.title.toLowerCase();

  if (title.includes("master") || title.includes("release")) {
    setActiveTab("projects");
    return;
  }

  if (title.includes("video")) {
    router.push(buildArtistRouteTarget("/files"));
    return;
  }

  if (title.includes("campaign")) {
    router.push(buildArtistRouteTarget("/timeline"));
    return;
  }

  router.push(buildArtistRouteTarget("/notes"));
};

// Action handlers
const handleNewRelease = () => {
  router.push(buildArtistRouteTarget("/releases"));
};

const handleUpload = () => {
  router.push(buildArtistRouteTarget("/files"));
};

const handleSchedule = () => {
  router.push(buildArtistRouteTarget("/calendar"));
};

const handleAnalytics = () => {
  setActiveTab("analytics");
};

const handleTeam = () => {
  setActiveTab("team");
};

const viewAllActivity = () => {
  setActiveTab("activity");
};

const viewAllProjects = () => {
  setActiveTab("projects");
  setProjectLayout("list");
};

const openProject = (project) => {
  if (!project) return;
  selectedProjectId.value = project.id;
  setActiveTab("projects");
  setProjectLayout("board");
};

const selectProject = (project) => {
  if (!project) return;
  selectedProjectId.value = project.id;
};

const openProjectPage = (project) => {
  if (!project?.id) return;
  router.push(`/artists/${artist.value.slug}/projects/${project.id}`);
};

const openProjectContextMenu = (event, project) => {
  if (!project?.id) return;
  selectedProjectId.value = project.id;

  showContextMenu(
    event,
    {
      ...project,
      artist_slug: artist.value.slug,
      link: `/artists/${artist.value.slug}/projects/${project.id}`,
    },
    "project",
  );
};

const goToHighlight = (highlight) => {
  if (highlight.link) router.push(highlight.link);
};

const applyArtistHubQueryState = () => {
  if (route.name !== "ArtistHub") return;

  const tab = String(route.query.tab || "");
  const layout = String(route.query.layout || "");
  const project = String(route.query.project || "");

  activeTab.value = validTabs.includes(tab) ? tab : "overview";

  if (validProjectLayouts.includes(layout)) {
    projectLayout.value = layout;
  } else {
    projectLayout.value = "board";
  }

  if (project) {
    selectedProjectId.value = project;
  }
};

const syncArtistHubQueryState = () => {
  if (route.name !== "ArtistHub") return;

  const nextQuery = {};

  if (activeTab.value !== "overview") {
    nextQuery.tab = activeTab.value;
  }

  if (activeTab.value === "projects") {
    if (projectLayout.value !== "board") {
      nextQuery.layout = projectLayout.value;
    }

    if (selectedProjectId.value) {
      nextQuery.project = String(selectedProjectId.value);
    }
  }

  const currentQuery = {
    tab: route.query.tab ? String(route.query.tab) : undefined,
    layout: route.query.layout ? String(route.query.layout) : undefined,
    project: route.query.project ? String(route.query.project) : undefined,
  };

  const hasQueryChanged = ["tab", "layout", "project"].some(
    (key) => currentQuery[key] !== nextQuery[key],
  );
  if (!hasQueryChanged) return;

  router.replace({
    query: {
      ...route.query,
      tab: nextQuery.tab,
      layout: nextQuery.layout,
      project: nextQuery.project,
    },
  });
};

watch(
  filteredProjects,
  () => {
    ensureSelectedProject();
  },
  { immediate: true },
);

watch(activeTab, (tab) => {
  if (tab === "projects") {
    ensureSelectedProject();
  }
});

watch([projectSearch, projectStatusFilter, projectSortBy], () => {
  projectsPage.value = 1;
  ensureSelectedProject();
});

watch(totalProjectPages, (maxPages) => {
  if (projectsPage.value > maxPages) {
    projectsPage.value = maxPages;
  }
});

watch(
  () => [route.params.slug, route.query.tab, route.query.layout, route.query.project],
  () => {
    applyArtistHubQueryState();
  },
  { immediate: true },
);

watch(
  () => [activeTab.value, projectLayout.value, selectedProjectId.value],
  () => {
    syncArtistHubQueryState();
  },
);

// Lifecycle
onMounted(() => {
  // Start auto-scroll for ticker
  startAutoScroll();

  // Add drag event listeners
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchmove", drag);
  document.addEventListener("touchend", stopDrag);
});

onUnmounted(() => {
  // Clean up
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", drag);
  document.removeEventListener("touchend", stopDrag);
});
</script>

<style scoped>
/* Artist Hub Styles - Matching Dashboard */
.artist-hub-view {
  min-height: 100%;
  background: transparent;
  color: var(--color-text);
}

/* Artist Header */
.artist-header {
  position: relative;
  display: grid;
  gap: var(--space-3);
  align-content: start;
  padding: var(--workspace-header-padding);
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
  gap: var(--space-5);
  max-width: 1400px;
  margin: 0 auto;
  min-width: 0;
  width: 100%;
}

.artist-identity {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  min-width: 0;
}

.artist-details {
  min-width: 0;
}

.artist-avatar {
  width: 76px;
  height: 76px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--placeholder-initial-avatar);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.06em;
  color: rgba(255, 255, 255, 0.7);
}

.artist-name {
  margin: 0 0 var(--space-1);
  font-size: clamp(32px, 4.6vw, 48px);
  line-height: 0.88;
  letter-spacing: -0.072em;
  font-weight: 700;
}

.artist-genre {
  font-size: var(--text-body);
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.header-actions :is(.workspace-header-primary-btn, .workspace-header-secondary-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: var(--weight-medium);
  cursor: pointer;
  box-shadow: none;
  transition:
    background var(--motion-default),
    border-color var(--motion-default),
    transform var(--motion-default),
    color var(--motion-default);
}

.header-actions .workspace-header-primary-btn {
  border-color: rgba(200, 75, 17, 0.16);
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.header-actions .workspace-header-primary-btn:hover {
  background: var(--color-accent-hover);
  border-color: rgba(200, 75, 17, 0.22);
}

.header-actions .workspace-header-secondary-btn {
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-text);
}

.header-actions .workspace-header-secondary-btn:hover {
  background: rgba(255, 255, 255, 0.96);
  border-color: var(--color-border-strong);
}

.header-actions :is(.workspace-header-primary-btn, .workspace-header-secondary-btn) svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
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
  padding: 0 0 48px;
  max-width: 100%;
  margin: 0;
  min-width: 0;
  width: 100%;
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
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
  min-width: 0;
  max-width: 100%;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0;
}

.see-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition:
    background var(--motion-default),
    border-color var(--motion-default),
    color var(--motion-default),
    transform var(--motion-default);
}

.see-more-btn:hover {
  background: rgba(255, 255, 255, 0.92);
  border-color: var(--color-border-strong);
  color: var(--color-text);
  transform: translateY(-1px);
}

/* Activity Filters */
.activity-filters {
  margin-bottom: 20px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: var(--control-sm);
  padding: 0 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background var(--motion-default),
    color var(--motion-default),
    transform var(--motion-default);
}

.filter-pill:hover {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text);
}

.filter-pill.active {
  background: rgba(19, 18, 17, 0.08);
  color: var(--color-text);
}

.filter-pill svg {
  width: 14px;
  height: 14px;
  opacity: 0.8;
}

/* Carousel */
.uploads-carousel {
  position: relative;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
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
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
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

.update-cover.award {
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
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
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(19, 18, 17, 0.04);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.action-icon svg {
  width: 24px;
  height: 24px;
  opacity: 0.8;
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
  background: rgba(232, 90, 25, 0.12);
  color: var(--color-accent);
}

.project-status.planning {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.project-status.review {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.project-status.completed {
  background: var(--color-success-subtle);
  color: var(--color-success);
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
  background: var(--color-accent);
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
  font-size: var(--placeholder-initial-inline);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.04em;
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
  position: relative;
  z-index: 1;
  background: transparent;
  border: 0;
  padding: 18px 48px 0;
}

.nav-tabs {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  min-width: 0;
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-1);
  overflow-x: auto;
  scrollbar-width: none;
}

.nav-tabs::-webkit-scrollbar {
  display: none;
}

.nav-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--control-sm);
  padding: 0 14px;
  background: none;
  border: none;
  border-radius: var(--radius-pill);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition:
    background var(--motion-default),
    color var(--motion-default);
}

.nav-tab:hover {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text);
}

.nav-tab.active {
  background: rgba(19, 18, 17, 0.08);
  color: var(--color-text);
}

.nav-tab.active::after {
  display: none;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(19, 18, 17, 0.06);
  border-radius: 999px;
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

.tab-caption {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.56);
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.tab-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.tab-action {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
  border-radius: 999px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.tab-action:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.24);
}

.project-layout-toggle {
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.layout-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.layout-btn.active {
  background: rgba(232, 90, 25, 0.12);
  color: var(--color-accent);
}

.projects-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1.4fr) minmax(300px, 2fr) auto;
  gap: 12px;
  margin-bottom: 16px;
}

.project-search {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  padding: 0 12px;
}

.project-search svg {
  width: 15px;
  height: 15px;
  opacity: 0.55;
  flex-shrink: 0;
}

.project-search input {
  width: 100%;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.project-search input:focus {
  outline: none;
}

.project-filter-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}

.project-filter-chip {
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  color: rgba(255, 255, 255, 0.68);
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.project-filter-chip strong {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.project-filter-chip:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.project-filter-chip.active {
  background: rgba(232, 90, 25, 0.08);
  border-color: rgba(232, 90, 25, 0.28);
  color: var(--color-accent);
}

.project-sort {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  min-height: 40px;
  padding: 0 10px;
  white-space: nowrap;
}

.project-sort span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.52);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.project-sort select {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.project-sort select:focus {
  outline: none;
}

.projects-list-view {
  display: grid;
  gap: 12px;
}

.projects-list-header p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.projects-list-header strong {
  color: rgba(255, 255, 255, 0.92);
}

.projects-list-table {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.015);
  overflow: hidden;
}

.project-list-row {
  width: 100%;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  display: grid;
  grid-template-columns:
    minmax(260px, 1.8fr) minmax(120px, 0.7fr) minmax(170px, 0.9fr) minmax(120px, 0.7fr)
    minmax(100px, 0.6fr);
  align-items: center;
  gap: 14px;
  text-align: left;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.project-list-row:last-child {
  border-bottom: none;
}

.project-list-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.project-list-row.selected {
  background: rgba(232, 90, 25, 0.08);
}

.project-list-main h4 {
  margin: 0 0 3px;
  font-size: 14px;
  font-weight: 530;
}

.project-list-main p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.56);
  line-height: 1.35;
}

.project-list-owner {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.project-list-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.project-list-progress {
  display: grid;
  gap: 1px;
}

.project-list-progress strong {
  font-size: 13px;
}

.project-list-progress small {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.54);
}

.project-list-due {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}

.projects-list-empty {
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.56);
  font-size: 13px;
}

.projects-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.projects-pagination span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.64);
}

.pagination-btn {
  min-width: 90px;
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.projects-list-selection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.02);
}

.projects-list-selection span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.74);
}

.projects-list-selection-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.projects-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
  gap: 16px;
}

.project-pipeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.pipeline-column {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.015);
  padding: 12px;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

.pipeline-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.pipeline-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 560;
  letter-spacing: 0.01em;
}

.pipeline-header p {
  margin: 3px 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.48);
}

.pipeline-header span {
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
}

.pipeline-list {
  display: grid;
  gap: 8px;
  align-content: start;
}

.pipeline-empty {
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  padding: 12px;
}

.pipeline-card {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  color: #fff;
  padding: 10px;
  display: grid;
  gap: 7px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.pipeline-card:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
}

.pipeline-card.selected {
  border-color: rgba(232, 90, 25, 0.3);
  background: rgba(232, 90, 25, 0.08);
  box-shadow: 0 0 0 1px rgba(232, 90, 25, 0.14);
}

.pipeline-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pipeline-card-head h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 540;
  line-height: 1.3;
}

.project-priority {
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.project-priority.high {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.project-priority.medium {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.project-priority.low {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.pipeline-card-owner {
  margin: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.pipeline-card-next {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.35;
}

.pipeline-progress {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
}

.pipeline-progress .progress-bar {
  margin: 0;
}

.pipeline-progress span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}

.pipeline-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.48);
}

.project-detail {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015));
  padding: 16px;
  display: grid;
  gap: 14px;
  align-content: start;
}

.project-detail.empty {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.project-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.project-detail-meta {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.project-detail-badges {
  display: grid;
  gap: 8px;
  justify-items: end;
}

.project-detail-badge {
  display: grid;
  gap: 4px;
  justify-items: end;
}

.project-detail-badge > span {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.52);
}

.project-detail-header h3 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 540;
}

.project-detail-header p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.45;
}

.detail-link-btn {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  min-height: 30px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  font-size: 11px;
  font-weight: 520;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.detail-link-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.project-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-metric {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 4px;
  background: rgba(255, 255, 255, 0.02);
}

.detail-metric span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-metric strong {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}

.project-detail-section {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  display: grid;
  gap: 10px;
}

.project-detail-section h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 560;
}

.detail-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.detail-section-header span {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.58);
}

.milestone-list {
  display: grid;
  gap: 8px;
}

.milestone-row {
  width: 100%;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.01);
  color: rgba(255, 255, 255, 0.84);
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
}

.milestone-row.done {
  border-color: rgba(232, 90, 25, 0.24);
  background: rgba(232, 90, 25, 0.08);
}

.milestone-check {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.milestone-row.done .milestone-check {
  border-color: rgba(232, 90, 25, 0.32);
  color: var(--color-accent);
}

.milestone-title {
  font-size: 12px;
  color: inherit;
}

.milestone-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.52);
}

.detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-action-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  min-height: 34px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.detail-action-btn:hover {
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.1);
}

.tab-subsection {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
}

.task-list {
  display: grid;
  gap: 10px;
}

.task-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.01);
  color: rgba(255, 255, 255, 0.88);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.task-row:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}

.task-row-title {
  flex: 1;
  font-size: 14px;
}

.task-row-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.activity-stream {
  display: grid;
  gap: 12px;
}

.activity-row {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255, 255, 255, 0.01);
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.activity-row:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}

.activity-row-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-row-icon.music {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text-secondary);
}

.activity-row-icon.photo {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text-secondary);
}

.activity-row-icon.release,
.activity-row-icon.tour,
.activity-row-icon.update {
  background: rgba(232, 90, 25, 0.12);
  color: var(--color-accent);
}

.activity-row-icon.award {
  background: rgba(214, 64, 50, 0.12);
  color: var(--color-danger);
}

.activity-row-content {
  flex: 1;
}

.activity-row-content h4 {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 500;
}

.activity-row-content p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.54);
}

.activity-row time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.metric-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  display: grid;
  gap: 8px;
}

.metric-label {
  font-size: 12px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}

.metric-value {
  font-size: 26px;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.metric-bars {
  display: grid;
  gap: 12px;
}

.metric-bar {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  align-items: center;
  gap: 12px;
}

.metric-bar span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.68);
}

.metric-track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.metric-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(232, 90, 25, 0.88), rgba(19, 18, 17, 0.82));
}

.metric-bar strong {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.86);
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.member-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(194, 189, 181, 0.88));
  color: var(--color-text);
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
}

.member-info h4 {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 500;
}

.member-info p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.54);
}

.member-status {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.member-status.online {
  background: rgba(232, 90, 25, 0.08);
  color: var(--color-accent);
}

.member-status.active {
  background: rgba(255, 255, 255, 0.09);
  color: rgba(255, 255, 255, 0.75);
}

/* Workflow Ticker */
.workflow-ticker {
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 100%;
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
  width: max-content;
  min-width: max-content;
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
  background: var(--color-warning);
}

.task-priority-dot.low {
  background: var(--color-info);
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

@media (max-width: 1200px) {
  .artist-content {
    padding: 0 0 36px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .projects-toolbar {
    grid-template-columns: 1fr;
  }

  .tab-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .tab-header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .project-sort {
    justify-content: space-between;
  }

  .projects-workspace {
    grid-template-columns: 1fr;
  }

  .project-pipeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .project-list-row {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 0.9fr) minmax(0, 0.7fr);
  }

  .project-list-due {
    grid-column: 1 / -1;
  }

  .analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .artist-header {
    padding: var(--space-5);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .artist-nav {
    padding: 0 20px;
    overflow: hidden;
  }

  .nav-tabs {
    width: 100%;
    max-width: 100%;
    gap: 18px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-header .see-more-btn {
    align-self: flex-start;
  }

  .nav-tabs::-webkit-scrollbar {
    display: none;
  }

  .artist-content {
    padding: 0 0 120px;
  }

  .hero-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .project-pipeline,
  .project-metrics,
  .detail-actions {
    grid-template-columns: 1fr;
  }

  .project-detail-header {
    flex-direction: column;
  }

  .project-detail-meta,
  .project-detail-badges,
  .project-detail-badge {
    width: 100%;
    justify-items: start;
  }

  .project-layout-toggle {
    width: 100%;
  }

  .layout-btn {
    flex: 1;
  }

  .project-list-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .project-list-status {
    justify-content: flex-start;
  }

  .projects-list-selection {
    flex-direction: column;
    align-items: flex-start;
  }

  .projects-list-selection-actions {
    width: 100%;
    display: grid;
    gap: 8px;
  }

  .projects-list-selection-actions .tab-action {
    width: 100%;
    justify-content: center;
  }

  .analytics-grid,
  .team-grid {
    grid-template-columns: 1fr;
  }

  .metric-bar {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .activity-row {
    align-items: flex-start;
  }
}

.project-create-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(24px);
}

.project-create-modal {
  width: min(720px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  overflow: auto;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
    rgba(10, 10, 12, 0.96);
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.48);
  padding: 28px;
}

.project-create-head,
.project-create-grid,
.project-create-footer {
  display: flex;
  gap: 14px;
}

.project-create-head {
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 22px;
}

.project-create-eyebrow {
  margin: 0 0 6px;
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.project-create-head h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.03em;
}

.project-create-close {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  font-size: 24px;
  cursor: pointer;
}

.project-create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-create-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-create-form span {
  color: rgba(255, 255, 255, 0.66);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.project-create-form input,
.project-create-form textarea,
.project-create-form select {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 14px 16px;
  font: inherit;
}

.project-create-form textarea {
  resize: vertical;
}

.project-create-form input:focus,
.project-create-form textarea:focus,
.project-create-form select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.project-create-grid {
  align-items: stretch;
}

.project-create-grid label {
  flex: 1;
}

.project-create-grid.three-up label {
  min-width: 0;
}

.project-create-footer {
  justify-content: flex-end;
  margin-top: 8px;
}

.project-secondary-btn,
.project-primary-btn {
  border-radius: 999px;
  padding: 12px 18px;
  font: inherit;
  cursor: pointer;
}

.project-secondary-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.86);
}

.project-primary-btn {
  border: 0;
  background: #fff;
  color: #050505;
  font-weight: 600;
}

@media (max-width: 720px) {
  .project-create-modal {
    padding: 22px;
    border-radius: 24px;
  }

  .project-create-grid,
  .project-create-footer {
    flex-direction: column;
  }

  .project-primary-btn,
  .project-secondary-btn {
    width: 100%;
  }
}

/* Theme override */
.artist-hub-view {
  color: var(--color-text);
  background: transparent;
}

.artist-header,
.insights-bar,
.stat-item,
.upload-item,
.action-card,
.projects-section,
.team-activity,
.projects-list-table,
.projects-list-selection,
.project-detail,
.project-detail-section,
.metric-card,
.tab-subsection,
.project-create-modal {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.76)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-1);
}

.artist-header {
  border-radius: 28px;
  overflow: hidden;
}

.header-background {
  opacity: 0.96;
}

.bg-gradient {
  background:
    linear-gradient(180deg, rgba(244, 243, 240, 0.18), rgba(244, 243, 240, 0.9) 74%),
    radial-gradient(circle at top left, rgba(200, 75, 17, 0.16), transparent 38%);
}

.artist-avatar {
  border: 1px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: none;
}

.avatar-fallback {
  color: var(--color-text);
}

.artist-hub-view .user-avatar-placeholder {
  background: linear-gradient(135deg, rgba(232, 90, 25, 0.18), rgba(19, 18, 17, 0.12));
  color: var(--color-text);
}

.artist-name,
.section-title,
.tab-title,
.project-header h3,
.project-detail-header h3,
.item-info h4,
.metric-value,
.activity-row-content h4,
.projects-list-header strong,
.project-list-main h4 {
  color: var(--color-text);
}

.artist-genre,
.tab-caption,
.section-subtitle,
.item-info p,
.item-info time,
.project-meta,
.activity-content p,
.activity-content time,
.activity-row-content p,
.activity-row time,
.metric-label,
.project-list-main p,
.project-list-owner,
.project-list-due,
.projects-list-selection span,
.project-detail-header p,
.detail-section-header span,
.detail-metric span,
.detail-metric strong,
.project-create-eyebrow,
.project-create-form span {
  color: var(--color-text-secondary);
}

.action-btn,
.see-more-btn,
.view-all,
.carousel-nav,
.filter-pill,
.tab-action,
.layout-btn,
.project-filter-chip,
.detail-action-btn,
.detail-link-btn,
.project-secondary-btn,
.project-primary-btn,
.project-search,
.project-sort select,
.project-create-close,
.project-create-form input,
.project-create-form textarea,
.project-create-form select {
  backdrop-filter: blur(18px);
}

.action-btn,
.see-more-btn,
.view-all,
.carousel-nav,
.filter-pill,
.tab-action,
.layout-btn,
.project-filter-chip,
.detail-action-btn,
.detail-link-btn,
.project-secondary-btn,
.project-search,
.project-sort,
.project-sort select,
.project-create-close,
.project-create-form input,
.project-create-form textarea,
.project-create-form select {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.74);
  color: var(--color-text);
}

.action-btn.primary,
.project-primary-btn {
  border-color: rgba(200, 75, 17, 0.16);
  background: var(--color-accent);
  color: var(--color-text-inverse);
}

.action-btn.primary:hover,
.project-primary-btn:hover {
  background: var(--color-accent-hover);
}

.nav-tabs {
  width: 100%;
  max-width: 100%;
  padding: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.68)),
    var(--color-surface);
}

.nav-tab {
  color: var(--color-text-secondary);
}

.nav-tab:hover {
  color: var(--color-text);
}

.nav-tab.active {
  color: var(--color-text);
}

.nav-tab.active::after {
  background: var(--color-accent);
}

.tab-count,
.project-status,
.project-detail-badge,
.project-priority {
  border-color: transparent;
  box-shadow: none;
}

.insights-divider {
  background: var(--color-border);
}

.workflow-ticker {
  background: transparent;
  border-radius: 0;
}

.ticker-item {
  border-color: transparent;
  background: transparent;
  color: var(--color-text);
}

.ticker-item:hover,
.upload-item:hover,
.action-card:hover,
.project-card:hover,
.project-list-row:hover,
.activity-row:hover {
  border-color: rgba(200, 75, 17, 0.24);
  box-shadow: 0 16px 36px rgba(19, 18, 17, 0.08);
}

.cover-placeholder,
.item-cover.update-cover {
  background: linear-gradient(135deg, rgba(200, 75, 17, 0.1), rgba(255, 255, 255, 0.38));
  color: var(--color-accent);
}

.action-icon,
.item-type-badge,
.project-search svg,
.project-sort span {
  color: var(--color-text-secondary);
}

.project-list-row {
  border-bottom-color: var(--color-border);
}

.project-list-row.selected {
  background: rgba(200, 75, 17, 0.08);
}

.project-search input,
.project-sort select,
.project-create-form input,
.project-create-form textarea,
.project-create-form select {
  color: var(--color-text);
}

.project-search input::placeholder,
.project-create-form input::placeholder,
.project-create-form textarea::placeholder {
  color: var(--color-text-tertiary);
}

.detail-metric,
.project-create-form input,
.project-create-form textarea,
.project-create-form select {
  background: rgba(255, 255, 255, 0.78);
  border-color: var(--color-border);
}

.project-create-overlay {
  background: rgba(19, 18, 17, 0.18);
  backdrop-filter: blur(22px);
}

.project-create-modal {
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-overlay);
}

.project-create-head h3 {
  color: var(--color-text);
  font-weight: 300;
  letter-spacing: -0.04em;
}

.project-secondary-btn {
  color: var(--color-text);
}

/* Theme correction */
.artist-hub-view .artist-nav {
  background: transparent;
  border: 0;
  padding: 18px 48px 0;
  margin-bottom: var(--space-5);
  overflow: hidden;
}

.artist-hub-view .artist-content {
  color: var(--color-text);
  min-width: 0;
  max-width: 100%;
}

.artist-hub-view .insight-item,
.artist-hub-view .task-text,
.artist-hub-view .artist-genre,
.artist-hub-view .stat-label,
.artist-hub-view .item-info p,
.artist-hub-view .item-info time,
.artist-hub-view .project-meta,
.artist-hub-view .project-list-main p,
.artist-hub-view .project-list-owner,
.artist-hub-view .project-list-due,
.artist-hub-view .project-detail-header p,
.artist-hub-view .section-subtitle,
.artist-hub-view .detail-section-header span,
.artist-hub-view .detail-metric span {
  color: var(--color-text-secondary);
}

.artist-hub-view .task-text strong,
.artist-hub-view .stat-number,
.artist-hub-view .stat-label,
.artist-hub-view .item-info h4,
.artist-hub-view .project-header h3,
.artist-hub-view .project-list-main h4,
.artist-hub-view .project-detail-header h3,
.artist-hub-view .project-detail-section h4,
.artist-hub-view .detail-metric strong {
  color: var(--color-text);
}

.artist-hub-view .insights-bar,
.artist-hub-view .projects-section,
.artist-hub-view .project-card,
.artist-hub-view .upload-item,
.artist-hub-view .project-list-row,
.artist-hub-view .project-detail,
.artist-hub-view .project-detail-section,
.artist-hub-view .detail-action-btn,
.artist-hub-view .detail-link-btn,
.artist-hub-view .project-search,
.artist-hub-view .project-filter-chip,
.artist-hub-view .project-sort,
.artist-hub-view .project-sort select,
.artist-hub-view .layout-btn,
.artist-hub-view .view-all,
.artist-hub-view .filter-pill,
.artist-hub-view .stat-item {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.76)),
    var(--color-surface);
  color: var(--color-text);
}

.artist-hub-view .view-all,
.artist-hub-view .filter-pill,
.artist-hub-view .layout-btn,
.artist-hub-view .detail-action-btn,
.artist-hub-view .detail-link-btn,
.artist-hub-view .project-search,
.artist-hub-view .project-sort select {
  backdrop-filter: blur(18px);
}

.artist-hub-view .nav-tabs {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.78)),
    var(--color-surface);
}

.artist-hub-view .nav-tab,
.artist-hub-view .tab-count {
  color: var(--color-text-secondary);
}

.artist-hub-view .nav-tab.active,
.artist-hub-view .nav-tab:hover {
  color: var(--color-text);
}

.artist-hub-view .insights-divider {
  background: var(--color-border);
}

.artist-hub-view .insights-bar,
.artist-hub-view .workflow-ticker,
.artist-hub-view .uploads-carousel,
.artist-hub-view .activity-filters {
  min-width: 0;
  max-width: 100%;
}

.artist-hub-view .upload-item:hover,
.artist-hub-view .project-card:hover,
.artist-hub-view .project-list-row:hover,
.artist-hub-view .stat-item:hover {
  border-color: rgba(200, 75, 17, 0.24);
  box-shadow: var(--shadow-1);
}

.artist-hub-view .project-list-row.selected,
.artist-hub-view .filter-pill.active,
.artist-hub-view .layout-btn.active,
.artist-hub-view .project-filter-chip.active {
  background: rgba(200, 75, 17, 0.08);
  border-color: rgba(200, 75, 17, 0.22);
  color: var(--color-text);
}

.artist-hub-view .project-search input,
.artist-hub-view .project-sort select,
.artist-hub-view .project-create-form input,
.artist-hub-view .project-create-form textarea,
.artist-hub-view .project-create-form select {
  color: var(--color-text);
}

.artist-hub-view .project-search input::placeholder,
.artist-hub-view .project-create-form input::placeholder,
.artist-hub-view .project-create-form textarea::placeholder {
  color: var(--color-text-tertiary);
}

.artist-hub-view .cover-placeholder,
.artist-hub-view .item-cover.update-cover {
  background: linear-gradient(135deg, rgba(200, 75, 17, 0.1), rgba(255, 255, 255, 0.38));
}

.artist-hub-view .artist-header,
.artist-hub-view .project-detail,
.artist-hub-view .project-detail-section,
.artist-hub-view .projects-section,
.artist-hub-view .project-create-modal {
  border-color: var(--color-border) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface) !important;
  color: var(--color-text) !important;
  box-shadow: var(--shadow-1) !important;
}

.artist-hub-view .insights-bar,
.artist-hub-view .project-card,
.artist-hub-view .project-list-row,
.artist-hub-view .stat-item,
.artist-hub-view .upload-item,
.artist-hub-view .action-card {
  border-color: var(--color-border) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface) !important;
  color: var(--color-text) !important;
  box-shadow: none !important;
}

.artist-hub-view .artist-name,
.artist-hub-view .section-title,
.artist-hub-view .stat-number,
.artist-hub-view .action-label,
.artist-hub-view .project-header h3,
.artist-hub-view .project-list-main h4,
.artist-hub-view .project-detail-header h3,
.artist-hub-view .project-detail-section h4,
.artist-hub-view .detail-metric strong,
.artist-hub-view .item-info h4,
.artist-hub-view .view-all,
.artist-hub-view .activity-content strong,
.artist-hub-view .activity-row-content h4,
.artist-hub-view .metric-value,
.artist-hub-view .metric-bar strong,
.artist-hub-view .tab-action,
.artist-hub-view .tab-title {
  color: var(--color-text) !important;
}

.artist-hub-view .artist-genre,
.artist-hub-view .task-text,
.artist-hub-view .stat-label,
.artist-hub-view .item-info p,
.artist-hub-view .item-info time,
.artist-hub-view .action-hint,
.artist-hub-view .progress-text,
.artist-hub-view .project-meta,
.artist-hub-view .project-list-main p,
.artist-hub-view .project-list-owner,
.artist-hub-view .project-list-due,
.artist-hub-view .project-detail-header p,
.artist-hub-view .detail-section-header span,
.artist-hub-view .detail-metric span,
.artist-hub-view .section-subtitle,
.artist-hub-view .activity-content p,
.artist-hub-view .activity-content time,
.artist-hub-view .activity-row-content p,
.artist-hub-view .metric-label,
.artist-hub-view .metric-bar span,
.artist-hub-view .tab-caption,
.artist-hub-view .pipeline-card-owner,
.artist-hub-view .pipeline-card-next,
.artist-hub-view .milestone-date {
  color: var(--color-text-secondary) !important;
}

.artist-hub-view .nav-tabs {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  border-color: var(--color-border) !important;
  box-shadow: none !important;
}

.artist-hub-view .project-search input,
.artist-hub-view .project-search input::placeholder,
.artist-hub-view .project-sort select {
  color: var(--color-text) !important;
}

.artist-hub-view .project-search input::placeholder {
  color: var(--color-text-tertiary) !important;
}

.artist-hub-view .pipeline-column {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(250, 250, 248, 0.76)),
    var(--color-surface);
}

.artist-hub-view .pipeline-header p,
.artist-hub-view .pipeline-header span,
.artist-hub-view .pipeline-empty,
.artist-hub-view .pipeline-progress span,
.artist-hub-view .pipeline-meta {
  color: var(--color-text-secondary);
}

.artist-hub-view .pipeline-header span {
  border-color: var(--color-border);
  background: rgba(19, 18, 17, 0.04);
}

.artist-hub-view .pipeline-empty {
  border-color: var(--color-border);
  background: rgba(19, 18, 17, 0.03);
}

.artist-hub-view .pipeline-card {
  border-color: rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-text);
}

.artist-hub-view .pipeline-card:hover {
  border-color: rgba(200, 75, 17, 0.2);
  background: rgba(255, 255, 255, 0.96);
}

.artist-hub-view .pipeline-card.selected {
  border-color: rgba(200, 75, 17, 0.26);
  background: rgba(200, 75, 17, 0.1);
  box-shadow: 0 0 0 1px rgba(200, 75, 17, 0.12);
}

.artist-hub-view .pipeline-card-head h4 {
  color: var(--color-text);
}

.artist-hub-view .tab-content {
  display: grid;
  gap: var(--section-gap);
  padding: 0;
}

.artist-hub-view .hero-stats {
  margin-bottom: 0;
  gap: var(--space-4);
}

.artist-hub-view .artist-overview-stats {
  width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
  margin: 0;
}

.artist-hub-view .artist-overview-stats .stat-item {
  min-height: 112px;
  padding: var(--space-5);
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface) !important;
  box-shadow: none !important;
  overflow: hidden;
}

.artist-hub-view .artist-overview-stats .stat-content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 3px;
  height: 100%;
  min-width: 0;
}

.artist-hub-view .artist-overview-stats .stat-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.artist-hub-view .artist-overview-stats .stat-number {
  margin: 0;
  font-size: 30px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text) !important;
}

.artist-hub-view .artist-overview-stats .stat-label {
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  color: var(--color-text-secondary) !important;
}

.artist-hub-view .artist-stat-card {
  padding: 14px 16px;
  display: grid;
  gap: 6px;
  box-shadow: none;
}

.artist-hub-view .artist-stat-card .stat-header {
  margin-bottom: 0;
}

.artist-hub-view .artist-stat-card .stat-number {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 400;
  letter-spacing: -0.05em;
}

.artist-hub-view .recent-uploads-inline,
.artist-hub-view .priority-actions,
.artist-hub-view .projects-section,
.artist-hub-view .highlights-section,
.artist-hub-view .team-activity,
.artist-hub-view .project-pipeline,
.artist-hub-view .project-detail,
.artist-hub-view .activity-stream,
.artist-hub-view .tab-subsection,
.artist-hub-view .projects-list-table,
.artist-hub-view .projects-list-selection {
  padding: 16px;
}

.artist-hub-view .recent-uploads-inline,
.artist-hub-view .priority-actions,
.artist-hub-view .projects-section,
.artist-hub-view .highlights-section,
.artist-hub-view .team-activity {
  margin-bottom: 0;
}

.artist-hub-view .section-header {
  margin-bottom: 16px;
}

.artist-hub-view .artist-context-bar {
  margin-bottom: 0;
  padding: 0;
  border: 0 !important;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none !important;
}

.artist-hub-view .insights-bar.artist-context-bar {
  gap: var(--space-4);
  align-items: center;
}

.artist-hub-view .artist-context-bar .workflow-ticker {
  gap: var(--space-5);
}

.artist-hub-view .artist-context-bar .ticker-item {
  padding: 0;
  border: 0 !important;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none !important;
}

.artist-hub-view .artist-context-bar .ticker-item:hover {
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
}

.artist-hub-view .artist-context-bar .ticker-track,
.artist-hub-view .artist-context-bar .task-text,
.artist-hub-view .artist-context-bar .task-text strong {
  background: transparent !important;
  box-shadow: none !important;
}

.artist-hub-view .projects-toolbar.artist-context-bar {
  grid-template-columns: minmax(240px, 1.25fr) minmax(0, 1fr) auto;
}

.artist-hub-view .content-grid,
.artist-hub-view .projects-workspace {
  gap: var(--space-4);
  align-items: start;
}

.artist-hub-view .content-grid {
  grid-template-columns: minmax(0, 1fr) 320px;
}

.artist-hub-view .actions-grid {
  margin-top: 0;
  gap: 12px;
}

.artist-hub-view .action-card {
  min-height: 132px;
  padding: 18px 14px;
  border-radius: 16px;
}

.artist-hub-view .projects-grid {
  margin-top: 0;
}

.artist-hub-view .view-all {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.76);
  font-size: 13px;
  font-weight: var(--weight-medium);
}

.artist-hub-view .view-all:hover {
  background: rgba(255, 255, 255, 0.92);
  border-color: var(--color-border-strong);
}

.artist-hub-view .tab-title {
  margin: 0;
  font-size: clamp(24px, 2.8vw, 30px);
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: var(--weight-semibold);
}

.artist-hub-view .tab-header {
  margin-bottom: 0;
}

.artist-hub-view .tab-header-actions {
  gap: var(--space-2);
}

.artist-hub-view .tab-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.76);
  font-size: 13px;
  font-weight: var(--weight-medium);
}

.artist-hub-view .tab-action:hover {
  background: rgba(255, 255, 255, 0.92);
  border-color: var(--color-border-strong);
}

.artist-hub-view .project-layout-toggle {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.76);
}

.artist-hub-view .layout-btn {
  min-height: var(--control-sm);
  padding: 0 14px;
  color: var(--color-text-secondary);
}

.artist-hub-view .projects-toolbar {
  grid-template-columns: minmax(240px, 1.25fr) minmax(0, 1fr) auto;
  margin-bottom: 0;
}

.artist-hub-view .project-search,
.artist-hub-view .project-sort {
  min-height: var(--control-md);
  border-radius: calc(var(--radius-control) + 4px);
}

.artist-hub-view .project-filter-chips {
  gap: var(--space-2);
  align-items: center;
}

.artist-hub-view .project-filter-chip {
  min-height: var(--control-sm);
  padding: 0 14px;
  border-radius: var(--radius-pill);
}

.artist-hub-view .projects-workspace {
  grid-template-columns: minmax(0, 1fr) 320px;
}

.artist-hub-view .project-pipeline {
  padding: 16px;
  min-height: 0;
}

.artist-hub-view .pipeline-column {
  min-height: 0;
  padding: 12px;
  border-radius: 16px;
}

.artist-hub-view .pipeline-card {
  padding: 12px;
  border-radius: 14px;
}

.artist-hub-view .project-detail {
  padding: 16px;
}

.artist-hub-view .projects-list-table {
  padding: 0;
  overflow: hidden;
}

.artist-hub-view .projects-list-selection {
  padding: 12px 14px;
}

.artist-hub-view .activity-stream {
  gap: 10px;
}

.artist-hub-view .activity-row {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
  padding: 14px 16px;
}

.artist-hub-view .analytics-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.artist-hub-view .metric-card {
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius-control) + 6px);
  background: rgba(255, 255, 255, 0.76);
  padding: 14px 16px;
  display: grid;
  gap: 6px;
  box-shadow: none;
}

.artist-hub-view .tab-subsection {
  padding: 16px;
}

.artist-hub-view .team-grid {
  --collection-card-min: 220px;
  gap: var(--collection-grid-gap);
  justify-content: start;
}

.artist-hub-view .member-card {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-text);
  padding: 16px;
  display: grid;
  gap: 10px;
  box-shadow: none;
}

.artist-hub-view .member-card:hover {
  border-color: rgba(200, 75, 17, 0.2);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-1);
}

.artist-hub-view .member-avatar {
  width: 52px;
  height: 52px;
  margin-bottom: 4px;
}

.artist-hub-view .member-avatar,
.artist-hub-view .member-avatar img,
.artist-hub-view .member-avatar .avatar-placeholder {
  border-radius: 50%;
}

.artist-hub-view .member-name,
.artist-hub-view .member-info h4 {
  margin: 0;
  color: var(--color-text);
}

.artist-hub-view .member-info p,
.artist-hub-view .member-email,
.artist-hub-view .meta-item,
.artist-hub-view .projects-title,
.artist-hub-view .project-tag,
.artist-hub-view .project-more {
  color: var(--color-text-secondary);
}

@media (max-width: 1200px) {
  .artist-hub-view .content-grid,
  .artist-hub-view .projects-workspace {
    grid-template-columns: 1fr;
  }

  .artist-hub-view .analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.artist-hub-view {
  display: grid;
  gap: var(--section-gap);
  padding: 0 0 calc(var(--now-playing-height) + var(--space-10));
}

.artist-hub-view .artist-header {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: var(--space-3);
  align-content: space-between;
  min-height: clamp(228px, 22vw, var(--workspace-header-min-height));
  padding: var(--workspace-header-padding);
  border: 1px solid var(--color-border) !important;
  border-radius: var(--radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.84)),
    var(--color-surface) !important;
  box-shadow: var(--shadow-1) !important;
}

.artist-hub-view .header-background {
  pointer-events: none;
}

.artist-hub-view .bg-gradient {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(250, 250, 248, 0.72));
}

.artist-hub-view .header-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
  width: 100%;
  max-width: none;
  margin: 0;
}

.artist-hub-view .artist-avatar {
  width: 88px;
  height: 88px;
  border: 1px solid var(--color-border);
  background: rgba(19, 18, 17, 0.04);
}

.artist-hub-view .avatar-fallback {
  color: var(--color-text);
}

.artist-hub-view .artist-name {
  color: var(--color-text) !important;
}

.artist-hub-view .artist-genre {
  color: var(--color-text-secondary) !important;
}

.artist-hub-view .header-actions {
  align-self: flex-start;
}

.artist-hub-view .header-actions .workspace-header-primary-btn,
.artist-hub-view .header-actions .workspace-header-secondary-btn {
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border-radius: var(--radius-pill);
  box-shadow: none;
}

.artist-hub-view .header-actions .workspace-header-primary-btn {
  border-color: rgba(200, 75, 17, 0.16) !important;
  background: var(--color-accent) !important;
  color: var(--color-text-inverse) !important;
}

.artist-hub-view .header-actions .workspace-header-primary-btn:hover {
  background: var(--color-accent-hover) !important;
  border-color: rgba(200, 75, 17, 0.22) !important;
}

.artist-hub-view .header-actions .workspace-header-secondary-btn {
  border-color: var(--color-border) !important;
  background: rgba(255, 255, 255, 0.82) !important;
  color: var(--color-text) !important;
}

.artist-hub-view .header-actions .workspace-header-secondary-btn:hover {
  background: rgba(255, 255, 255, 0.96) !important;
  border-color: var(--color-border-strong) !important;
}

.artist-hub-view .artist-nav,
.artist-hub-view .artist-content {
  margin: 0;
}
</style>
