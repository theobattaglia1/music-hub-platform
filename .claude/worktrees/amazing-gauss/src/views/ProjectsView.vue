<template>
  <div class="projects-view" @contextmenu.prevent="onBgContextMenu($event)">

    <!-- Header -->
    <div class="view-header">
      <div class="header-bg"></div>
      <div class="header-inner">
        <div class="header-left">
          <h1 class="view-title">
            Projects
            <span class="title-count">{{ store.projects.length }}</span>
          </h1>
          <p class="view-subtitle">Track releases, campaigns &amp; deliverables</p>
        </div>
        <button class="new-project-btn" @click="openCreateModal">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Project
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card" v-for="s in headerStats" :key="s.label" :class="s.cls">
          <span class="stat-value">{{ s.value }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-bar">
      <!-- Search -->
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input v-model="searchQuery" placeholder="Search projects…" class="search-input" />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
      </div>

      <!-- Filter pills -->
      <div class="filter-pills">
        <button
          v-for="f in filterOptions"
          :key="f.value"
          :class="['filter-pill', { active: activeFilter === f.value }]"
          @click="activeFilter = f.value"
        >
          <span class="pill-dot" v-if="f.color" :style="{ background: f.color }"></span>
          {{ f.label }}
          <span class="pill-count">{{ f.count }}</span>
        </button>
      </div>

      <!-- Right controls -->
      <div class="right-controls">
        <select v-model="sortBy" class="sort-select">
          <option value="updated">Recently Updated</option>
          <option value="due">Due Date</option>
          <option value="priority">Priority</option>
          <option value="progress">Progress</option>
          <option value="title">Name A–Z</option>
        </select>

        <!-- View toggle -->
        <div class="view-toggle">
          <button :class="['vt-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'" title="Grid">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>
          </button>
          <button :class="['vt-btn', { active: viewMode === 'list' }]" @click="viewMode = 'list'" title="List">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
          </button>
          <button :class="['vt-btn', { active: viewMode === 'kanban' }]" @click="viewMode = 'kanban'" title="Kanban">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h5v11H3zm6.5 0h5v7h-5zM16 3h5v15h-5zM3 16h5v5H3zm6.5-1h5v6h-5z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid-container">
      <div v-if="filteredProjects.length === 0" class="empty-state">
        <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="8" stroke="currentColor" stroke-width="2" opacity="0.2"/><path d="M24 32h16M32 24v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.3"/></svg>
        <p>{{ searchQuery || activeFilter !== 'all' ? 'No projects match your filters' : 'No projects yet' }}</p>
        <button v-if="!searchQuery && activeFilter === 'all'" class="btn-ghost" @click="openCreateModal">Create your first project</button>
      </div>
      <div v-else class="projects-grid">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          @click="openProject(project)"
          @contextmenu.stop.prevent="showProjectMenu(project, $event)"
        >
          <!-- Color band -->
          <div class="card-band" :style="{ background: project.cover_color || '#6366f1' }">
            <span class="type-badge" :style="{ background: typeConfig(project.type).color + '33', color: typeConfig(project.type).color }">
              {{ typeConfig(project.type).label }}
            </span>
            <div class="card-menu-btn" @click.stop="showProjectMenu(project, $event)">
              <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body">
            <div class="card-header-row">
              <h3 class="card-title">{{ project.title }}</h3>
              <span class="priority-dot" :title="priorityConfig(project.priority).label" :style="{ background: priorityConfig(project.priority).color }"></span>
            </div>

            <p v-if="project.artist" class="card-artist">{{ project.artist }}</p>
            <p v-if="project.description" class="card-desc">{{ truncate(project.description, 80) }}</p>

            <!-- Progress -->
            <div class="progress-row">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: store.calcProgress(project.tasks) + '%', background: statusConfig(project.status).color }"></div>
              </div>
              <span class="progress-pct">{{ store.calcProgress(project.tasks) }}%</span>
            </div>

            <!-- Footer -->
            <div class="card-footer">
              <span class="status-chip" :style="{ background: statusConfig(project.status).bg, color: statusConfig(project.status).color }">
                {{ statusConfig(project.status).label }}
              </span>
              <span v-if="project.due_date" class="due-date" :class="{ overdue: isOverdue(project) }">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                {{ formatDate(project.due_date) }}
              </span>
            </div>

            <!-- Team avatars -->
            <div v-if="project.team?.length" class="team-row">
              <div v-for="(m, i) in project.team.slice(0,4)" :key="m.id" class="team-avatar" :style="{ '--i': i, background: avatarColor(m.name) }" :title="`${m.name} — ${m.role}`">
                {{ m.name.charAt(0) }}
              </div>
              <span v-if="project.team.length > 4" class="team-more">+{{ project.team.length - 4 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else-if="viewMode === 'list'" class="list-container">
      <div v-if="filteredProjects.length === 0" class="empty-state">
        <p>{{ searchQuery || activeFilter !== 'all' ? 'No projects match your filters' : 'No projects yet' }}</p>
      </div>
      <table v-else class="projects-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Artist</th>
            <th>Type</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Progress</th>
            <th>Due Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="project in filteredProjects"
            :key="project.id"
            class="table-row"
            @click="openProject(project)"
            @contextmenu.stop.prevent="showProjectMenu(project, $event)"
          >
            <td class="col-title">
              <span class="color-dot" :style="{ background: project.cover_color }"></span>
              <div>
                <div class="row-title">{{ project.title }}</div>
                <div v-if="project.description" class="row-desc">{{ truncate(project.description, 55) }}</div>
              </div>
            </td>
            <td class="col-artist">{{ project.artist || '—' }}</td>
            <td>
              <span class="type-chip" :style="{ color: typeConfig(project.type).color }">{{ typeConfig(project.type).label }}</span>
            </td>
            <td>
              <span class="status-chip sm" :style="{ background: statusConfig(project.status).bg, color: statusConfig(project.status).color }">
                {{ statusConfig(project.status).label }}
              </span>
            </td>
            <td>
              <span class="priority-chip" :style="{ color: priorityConfig(project.priority).color }">
                {{ priorityConfig(project.priority).label }}
              </span>
            </td>
            <td class="col-progress">
              <div class="mini-progress">
                <div class="mini-fill" :style="{ width: store.calcProgress(project.tasks) + '%', background: statusConfig(project.status).color }"></div>
              </div>
              <span class="mini-pct">{{ store.calcProgress(project.tasks) }}%</span>
            </td>
            <td :class="['col-date', { overdue: isOverdue(project) }]">
              {{ project.due_date ? formatDate(project.due_date) : '—' }}
            </td>
            <td class="col-actions" @click.stop>
              <button class="row-action-btn" @click.stop="showProjectMenu(project, $event)">
                <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Kanban View -->
    <div v-else-if="viewMode === 'kanban'" class="kanban-container">
      <div
        v-for="col in kanbanCols"
        :key="col.status"
        class="kanban-col"
      >
        <div class="kanban-col-header">
          <span class="col-dot" :style="{ background: statusConfig(col.status).color }"></span>
          <span class="col-label">{{ statusConfig(col.status).label }}</span>
          <span class="col-count">{{ col.items.length }}</span>
          <button class="col-add-btn" @click="openCreateModalWithStatus(col.status)" title="Add project">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
        </div>
        <div class="kanban-cards">
          <div
            v-for="project in col.items"
            :key="project.id"
            class="kanban-card"
            @click="openProject(project)"
            @contextmenu.stop.prevent="showProjectMenu(project, $event)"
          >
            <div class="kc-top">
              <span class="type-badge sm" :style="{ background: typeConfig(project.type).color + '22', color: typeConfig(project.type).color }">{{ typeConfig(project.type).label }}</span>
              <span class="priority-dot sm" :style="{ background: priorityConfig(project.priority).color }" :title="priorityConfig(project.priority).label"></span>
            </div>
            <div class="kc-accent" :style="{ background: project.cover_color || '#6366f1' }"></div>
            <h4 class="kc-title">{{ project.title }}</h4>
            <p v-if="project.artist" class="kc-artist">{{ project.artist }}</p>
            <div class="kc-progress">
              <div class="kc-bar">
                <div class="kc-fill" :style="{ width: store.calcProgress(project.tasks) + '%', background: statusConfig(col.status).color }"></div>
              </div>
              <span>{{ store.calcProgress(project.tasks) }}%</span>
            </div>
            <div class="kc-footer">
              <span v-if="project.due_date" class="kc-due" :class="{ overdue: isOverdue(project) }">{{ formatDate(project.due_date) }}</span>
              <div class="kc-team">
                <div v-for="(m, i) in project.team.slice(0,3)" :key="m.id" class="kc-avatar" :style="{ '--i': i, background: avatarColor(m.name) }" :title="m.name">{{ m.name.charAt(0) }}</div>
              </div>
            </div>
          </div>
          <button v-if="col.items.length === 0" class="kanban-empty-add" @click="openCreateModalWithStatus(col.status)">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add project
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box">
            <div class="modal-header">
              <h2>{{ editingProject ? 'Edit Project' : 'New Project' }}</h2>
              <button class="modal-close" @click="closeModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form @submit.prevent="submitModal" class="modal-form">
              <div class="form-row">
                <div class="form-group full">
                  <label>Title *</label>
                  <input v-model="form.title" required placeholder="Project title…" maxlength="100" />
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label>Type</label>
                  <select v-model="form.type">
                    <option v-for="(cfg, key) in store.TYPE_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select v-model="form.status">
                    <option v-for="(cfg, key) in store.STATUS_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label>Priority</label>
                  <select v-model="form.priority">
                    <option v-for="(cfg, key) in store.PRIORITY_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Due Date</label>
                  <input v-model="form.due_date" type="date" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full">
                  <label>Artist / Team</label>
                  <input v-model="form.artist" placeholder="Artist or team name…" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full">
                  <label>Description</label>
                  <textarea v-model="form.description" rows="3" placeholder="What's this project about?"></textarea>
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
                <button type="submit" class="btn-submit" :disabled="!form.title.trim()">
                  {{ editingProject ? 'Save Changes' : 'Create Project' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore, STATUS_CONFIG, TYPE_CONFIG, PRIORITY_CONFIG } from '@/stores/projects'

const router = useRouter()
const store = useProjectsStore()
const showContextMenu = inject('showContextMenu', () => {})
const showToast = inject('showToast', () => {})

// State
const searchQuery = ref('')
const activeFilter = ref('all')
const sortBy = ref('updated')
const viewMode = ref('grid')
const showModal = ref(false)
const editingProject = ref(null)

const blankForm = () => ({ title: '', type: 'other', status: 'planning', priority: 'medium', due_date: '', artist: '', description: '', cover_color: '' })
const form = ref(blankForm())

// Config helpers
const statusConfig = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.planning
const typeConfig = (t) => TYPE_CONFIG[t] || TYPE_CONFIG.other
const priorityConfig = (p) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.medium

// Stats
const headerStats = computed(() => {
  const ps = store.projects
  const today = new Date().toISOString().split('T')[0]
  return [
    { label: 'Total',      value: ps.length,                                     cls: '' },
    { label: 'Active',     value: ps.filter(p => p.status === 'active').length,  cls: 'stat-active' },
    { label: 'In Review',  value: ps.filter(p => p.status === 'review').length,  cls: 'stat-review' },
    { label: 'Overdue',    value: ps.filter(p => p.due_date && p.due_date < today && p.status !== 'completed').length, cls: 'stat-overdue' },
    { label: 'Completed',  value: ps.filter(p => p.status === 'completed').length, cls: 'stat-done' }
  ]
})

// Filter options
const filterOptions = computed(() => {
  const ps = store.projects
  return [
    { value: 'all',       label: 'All',        count: ps.length },
    { value: 'planning',  label: 'Planning',   count: ps.filter(p => p.status === 'planning').length,  color: STATUS_CONFIG.planning.color },
    { value: 'active',    label: 'Active',     count: ps.filter(p => p.status === 'active').length,    color: STATUS_CONFIG.active.color },
    { value: 'review',    label: 'In Review',  count: ps.filter(p => p.status === 'review').length,    color: STATUS_CONFIG.review.color },
    { value: 'completed', label: 'Completed',  count: ps.filter(p => p.status === 'completed').length, color: STATUS_CONFIG.completed.color },
    { value: 'on-hold',   label: 'On Hold',    count: ps.filter(p => p.status === 'on-hold').length,   color: STATUS_CONFIG['on-hold'].color }
  ]
})

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

const filteredProjects = computed(() => {
  let list = [...store.projects]
  if (activeFilter.value !== 'all') list = list.filter(p => p.status === activeFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.artist?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    )
  }
  list.sort((a, b) => {
    switch (sortBy.value) {
      case 'due':      return (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1
      case 'priority': return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
      case 'progress': return store.calcProgress(b.tasks) - store.calcProgress(a.tasks)
      case 'title':    return a.title.localeCompare(b.title)
      default:         return new Date(b.updated_at) - new Date(a.updated_at)
    }
  })
  return list
})

// Kanban
const KANBAN_ORDER = ['planning', 'active', 'review', 'completed', 'on-hold']
const kanbanCols = computed(() =>
  KANBAN_ORDER.map(status => ({
    status,
    items: filteredProjects.value.filter(p => p.status === status)
  }))
)

// Helpers
const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '')
const formatDate = (d) => {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const isOverdue = (p) => {
  if (!p.due_date || p.status === 'completed') return false
  return p.due_date < new Date().toISOString().split('T')[0]
}
const avatarColor = (name) => {
  const colors = ['#6366f1','#a855f7','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444']
  return colors[name.charCodeAt(0) % colors.length]
}

// Navigation
const openProject = (project) => router.push(`/projects/${project.id}`)

// Context menu
const showProjectMenu = (project, event) => {
  event.stopPropagation()
  const menuItems = [
    { label: 'Open', action: () => openProject(project) },
    { divider: true },
    { label: 'Edit', action: () => openEditModal(project) },
    { label: 'Duplicate', action: () => {
      const copy = store.duplicateProject(project.id)
      if (copy) showToast({ message: `Duplicated as "${copy.title}"`, type: 'success' })
    }},
    { divider: true },
    // Status shortcuts
    ...Object.entries(STATUS_CONFIG)
      .filter(([key]) => key !== project.status)
      .map(([key, cfg]) => ({
        label: `Move to ${cfg.label}`,
        action: () => { store.updateProject(project.id, { status: key }); showToast({ message: `Moved to ${cfg.label}`, type: 'success' }) }
      })),
    { divider: true },
    { label: 'Delete', danger: true, action: () => {
      if (confirm(`Delete "${project.title}"? This cannot be undone.`)) {
        store.deleteProject(project.id)
        showToast({ message: `Deleted "${project.title}"`, type: 'error' })
      }
    }}
  ]
  showContextMenu(event, menuItems, 'custom')
}

const onBgContextMenu = (event) => {
  if (event.target.closest('.project-card, .table-row, .kanban-card')) return
  const menuItems = [
    { label: 'New Project', action: openCreateModal },
    { divider: true },
    { label: 'View: Grid', action: () => { viewMode.value = 'grid' } },
    { label: 'View: List', action: () => { viewMode.value = 'list' } },
    { label: 'View: Kanban', action: () => { viewMode.value = 'kanban' } }
  ]
  showContextMenu(event, menuItems, 'custom')
}

// Modal
const openCreateModal = () => {
  editingProject.value = null
  form.value = blankForm()
  showModal.value = true
}
const openCreateModalWithStatus = (status) => {
  editingProject.value = null
  form.value = { ...blankForm(), status }
  showModal.value = true
}
const openEditModal = (project) => {
  editingProject.value = project
  form.value = {
    title: project.title,
    type: project.type,
    status: project.status,
    priority: project.priority,
    due_date: project.due_date || '',
    artist: project.artist || '',
    description: project.description || '',
    cover_color: project.cover_color || ''
  }
  showModal.value = true
}
const closeModal = () => { showModal.value = false; editingProject.value = null }
const submitModal = () => {
  if (!form.value.title.trim()) return
  if (editingProject.value) {
    store.updateProject(editingProject.value.id, {
      ...form.value,
      cover_color: form.value.cover_color || TYPE_CONFIG[form.value.type]?.color || '#6b7280'
    })
    showToast({ message: 'Project updated', type: 'success' })
  } else {
    const p = store.createProject({ ...form.value, cover_color: TYPE_CONFIG[form.value.type]?.color || '#6b7280' })
    showToast({ message: `Created "${p.title}"`, type: 'success' })
    closeModal()
    router.push(`/projects/${p.id}`)
    return
  }
  closeModal()
}
</script>

<style scoped>
.projects-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
}

/* ── Header ── */
.view-header {
  position: relative;
  padding: 40px 48px 24px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.header-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at top left, rgba(99,102,241,0.07) 0%, transparent 60%);
  pointer-events: none;
}
.header-inner {
  display: flex; align-items: flex-start; justify-content: space-between;
  position: relative; z-index: 1; margin-bottom: 24px;
}
.view-title {
  display: flex; align-items: baseline; gap: 12px;
  font-size: 42px; font-weight: 200; letter-spacing: -0.02em; margin: 0 0 6px;
}
.title-count { font-size: 22px; color: var(--color-text-tertiary); font-weight: 300; }
.view-subtitle { font-size: 15px; color: var(--color-text-secondary); margin: 0; }
.new-project-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px;
  background: var(--color-text); color: var(--color-bg);
  border: none; border-radius: var(--radius-md);
  font-size: 14px; font-weight: var(--weight-medium);
  cursor: pointer; transition: opacity var(--motion-fast); white-space: nowrap;
  position: relative; z-index: 1;
}
.new-project-btn:hover { opacity: 0.85; }
.new-project-btn svg { width: 18px; height: 18px; }

/* Stats Row */
.stats-row {
  display: flex; gap: 12px;
  position: relative; z-index: 1;
}
.stat-card {
  display: flex; flex-direction: column; gap: 2px;
  padding: 12px 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  min-width: 90px;
}
.stat-value { font-size: 24px; font-weight: 600; line-height: 1; }
.stat-label { font-size: 11px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }
.stat-active  .stat-value { color: #22c55e; }
.stat-review  .stat-value { color: #f59e0b; }
.stat-overdue .stat-value { color: #ef4444; }
.stat-done    .stat-value { color: #10b981; }

/* ── Controls Bar ── */
.controls-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 48px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.search-wrap { position: relative; flex-shrink: 0; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--color-text-tertiary); pointer-events: none; }
.search-input {
  padding: 7px 32px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text); font-size: 13px; width: 220px;
}
.search-input:focus { outline: none; border-color: var(--color-accent); }
.clear-btn { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; font-size: 16px; line-height: 1; }

.filter-pills { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
.filter-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  border-radius: 100px;
  background: none; color: var(--color-text-secondary);
  font-size: 12px; font-weight: var(--weight-medium); cursor: pointer;
  transition: all var(--motion-fast); white-space: nowrap;
}
.filter-pill:hover { border-color: var(--color-border-strong); color: var(--color-text); }
.filter-pill.active { background: var(--color-text); color: var(--color-bg); border-color: var(--color-text); }
.pill-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.pill-count { font-size: 11px; opacity: 0.6; }

.right-controls { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.sort-select {
  padding: 6px 12px;
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text); font-size: 13px;
  cursor: pointer; appearance: none; min-width: 160px;
}
.view-toggle { display: flex; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
.vt-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; transition: all var(--motion-fast); }
.vt-btn svg { width: 16px; height: 16px; }
.vt-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }
.vt-btn.active { background: var(--color-text); color: var(--color-bg); }

/* ── Grid View ── */
.grid-container { flex: 1; overflow-y: auto; padding: 28px 48px; }
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

.project-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex; flex-direction: column;
}
.project-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--color-border-strong); }

.card-band {
  height: 6px; position: relative;
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px 0;
  height: auto;
  padding-top: 10px; padding-bottom: 6px;
  background: transparent;
  border-bottom: 3px solid;
}
/* Override: use inline style for border-bottom-color via background */
.card-band { border-bottom: none; }
.card-band::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: inherit; filter: none; opacity: 1; }
.card-band { padding: 10px 12px 13px; }

.type-badge {
  display: inline-flex; align-items: center;
  padding: 3px 8px; border-radius: 100px;
  font-size: 11px; font-weight: var(--weight-semibold);
  text-transform: uppercase; letter-spacing: 0.05em;
}
.type-badge.sm { font-size: 10px; padding: 2px 6px; }

.card-menu-btn {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px; color: var(--color-text-secondary);
  transition: all var(--motion-fast);
  cursor: pointer;
}
.card-menu-btn:hover { background: rgba(0,0,0,0.1); color: var(--color-text); }
.card-menu-btn svg { width: 14px; height: 14px; }

.card-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.card-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.card-title { font-size: 15px; font-weight: var(--weight-semibold); margin: 0; line-height: 1.3; flex: 1; }
.priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.priority-dot.sm { width: 7px; height: 7px; }

.card-artist { font-size: 12px; color: var(--color-text-tertiary); margin: 0; }
.card-desc { font-size: 12px; color: var(--color-text-secondary); margin: 0; line-height: 1.45; }

.progress-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.progress-track { flex: 1; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
.progress-pct { font-size: 11px; color: var(--color-text-tertiary); min-width: 30px; text-align: right; }

.card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; }
.status-chip {
  display: inline-flex; align-items: center;
  padding: 3px 8px; border-radius: 100px;
  font-size: 11px; font-weight: var(--weight-medium);
}
.status-chip.sm { padding: 2px 7px; font-size: 11px; }
.due-date {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--color-text-tertiary);
}
.due-date svg { width: 12px; height: 12px; }
.due-date.overdue { color: #ef4444; }

.team-row { display: flex; align-items: center; gap: -6px; margin-top: 4px; }
.team-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; color: #fff;
  border: 2px solid var(--color-surface);
  margin-left: calc(var(--i) * -6px);
  position: relative; z-index: calc(10 - var(--i));
  text-transform: uppercase;
}
.team-more { font-size: 11px; color: var(--color-text-tertiary); margin-left: 4px; }

/* ── List View ── */
.list-container { flex: 1; overflow-y: auto; padding: 0; }
.projects-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.projects-table thead th {
  padding: 10px 16px;
  text-align: left; font-size: 11px; font-weight: var(--weight-semibold);
  text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: sticky; top: 0; z-index: 2;
}
.table-row { cursor: pointer; border-bottom: 1px solid var(--color-border); transition: background var(--motion-fast); }
.table-row:hover { background: var(--color-surface-raised); }
.table-row td { padding: 12px 16px; vertical-align: middle; }

.col-title { display: flex; align-items: center; gap: 10px; min-width: 200px; }
.color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.row-title { font-weight: var(--weight-medium); }
.row-desc { font-size: 12px; color: var(--color-text-tertiary); margin-top: 1px; }
.col-artist { color: var(--color-text-secondary); white-space: nowrap; }
.type-chip { font-size: 12px; font-weight: var(--weight-medium); }
.priority-chip { font-size: 12px; font-weight: var(--weight-medium); }
.col-progress { display: flex; align-items: center; gap: 8px; min-width: 120px; }
.mini-progress { flex: 1; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.mini-fill { height: 100%; border-radius: 2px; }
.mini-pct { font-size: 11px; color: var(--color-text-tertiary); min-width: 30px; }
.col-date { white-space: nowrap; color: var(--color-text-secondary); }
.col-date.overdue { color: #ef4444; }
.col-actions { width: 40px; }
.row-action-btn { background: none; border: none; cursor: pointer; color: var(--color-text-tertiary); padding: 4px; border-radius: var(--radius-sm); display: flex; }
.row-action-btn svg { width: 16px; height: 16px; }
.row-action-btn:hover { background: var(--color-border); color: var(--color-text); }

/* ── Kanban View ── */
.kanban-container { flex: 1; overflow-x: auto; overflow-y: hidden; display: flex; gap: 16px; padding: 24px 48px; align-items: flex-start; }
.kanban-col { flex-shrink: 0; width: 280px; display: flex; flex-direction: column; gap: 0; }
.kanban-col-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px 10px 0 0;
  border-bottom: none;
}
.col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.col-label { font-size: 12px; font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.07em; flex: 1; }
.col-count { font-size: 11px; color: var(--color-text-tertiary); background: var(--color-border); border-radius: 100px; padding: 1px 7px; }
.col-add-btn { background: none; border: none; cursor: pointer; color: var(--color-text-tertiary); padding: 2px; display: flex; border-radius: 4px; }
.col-add-btn svg { width: 16px; height: 16px; }
.col-add-btn:hover { background: var(--color-border); color: var(--color-text); }

.kanban-cards {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 10px 10px;
  padding: 8px;
  min-height: 120px;
  display: flex; flex-direction: column; gap: 8px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

.kanban-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all var(--motion-fast);
  position: relative;
  overflow: hidden;
}
.kanban-card:hover { border-color: var(--color-border-strong); box-shadow: var(--shadow-sm); transform: translateY(-1px); }

.kc-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.kc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; margin-top: 4px; }
.kc-title { font-size: 13px; font-weight: var(--weight-medium); margin: 0 0 3px; line-height: 1.3; }
.kc-artist { font-size: 11px; color: var(--color-text-tertiary); margin: 0 0 8px; }
.kc-progress { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.kc-bar { flex: 1; height: 3px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.kc-fill { height: 100%; border-radius: 2px; }
.kc-progress span { font-size: 10px; color: var(--color-text-tertiary); }
.kc-footer { display: flex; align-items: center; justify-content: space-between; }
.kc-due { font-size: 11px; color: var(--color-text-tertiary); }
.kc-due.overdue { color: #ef4444; }
.kc-team { display: flex; }
.kc-avatar {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 600; color: #fff;
  border: 2px solid var(--color-bg);
  margin-left: calc(var(--i) * -5px);
  position: relative; z-index: calc(10 - var(--i));
}
.kanban-empty-add {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px;
  background: none; border: 1px dashed var(--color-border);
  border-radius: 6px; color: var(--color-text-tertiary);
  font-size: 12px; cursor: pointer;
  transition: all var(--motion-fast);
}
.kanban-empty-add svg { width: 14px; height: 14px; }
.kanban-empty-add:hover { border-color: var(--color-accent); color: var(--color-accent); }

/* ── Empty State ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 48px; gap: 12px; text-align: center; color: var(--color-text-secondary);
}
.empty-state svg { width: 64px; height: 64px; color: var(--color-border-strong); }
.empty-state p { font-size: 15px; margin: 0; }
.btn-ghost {
  padding: 9px 20px; background: none;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  color: var(--color-text-secondary); font-size: 14px; cursor: pointer;
  transition: all var(--motion-fast);
}
.btn-ghost:hover { border-color: var(--color-accent); color: var(--color-accent); }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.modal-box {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 16px; width: 100%; max-width: 520px; box-shadow: var(--shadow-lg);
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--color-border); }
.modal-header h2 { margin: 0; font-size: 18px; font-weight: var(--weight-semibold); }
.modal-close { background: none; border: none; cursor: pointer; color: var(--color-text-tertiary); padding: 4px; border-radius: var(--radius-sm); display: flex; }
.modal-close svg { width: 18px; height: 18px; }
.modal-close:hover { color: var(--color-text); background: var(--color-surface-raised); }

.modal-form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }
.form-row { display: flex; gap: 16px; }
.form-row.two-col .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full { flex: 1; }
.form-group label { font-size: 12px; font-weight: var(--weight-medium); color: var(--color-text-secondary); }
.form-group input, .form-group select, .form-group textarea {
  padding: 9px 12px;
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px;
  font-family: inherit;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-accent-subtle); }
.form-group textarea { resize: vertical; min-height: 70px; }

.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { padding: 9px 18px; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-secondary); font-size: 14px; cursor: pointer; }
.btn-cancel:hover { background: var(--color-surface-raised); }
.btn-submit { padding: 9px 18px; background: var(--color-text); border: none; border-radius: var(--radius-sm); color: var(--color-bg); font-size: 14px; font-weight: var(--weight-medium); cursor: pointer; }
.btn-submit:hover:not(:disabled) { opacity: 0.85; }
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

/* Transitions */
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }

@media (max-width: 900px) {
  .view-header { padding: 28px 24px 20px; }
  .controls-bar { padding: 12px 24px; }
  .grid-container, .list-container { padding: 20px 24px; }
  .kanban-container { padding: 20px 24px; }
  .projects-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}
</style>
