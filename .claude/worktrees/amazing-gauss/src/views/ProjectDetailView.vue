<template>
  <div class="project-detail" v-if="project">
    <!-- Top bar -->
    <div class="detail-topbar">
      <button class="back-btn" @click="router.push('/projects')">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Projects
      </button>
      <div class="topbar-actions">
        <span class="status-chip" :style="{ background: statusConfig(project.status).bg, color: statusConfig(project.status).color }">
          {{ statusConfig(project.status).label }}
        </span>
        <button class="topbar-btn" @click="openEditModal" title="Edit project">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="topbar-btn" @click="showProjectMenu($event)" title="More options">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
      </div>
    </div>

    <!-- Hero -->
    <div class="detail-hero" :style="{ '--accent': project.cover_color || '#6366f1' }">
      <div class="hero-accent-bar"></div>
      <div class="hero-content">
        <div class="hero-meta">
          <span class="type-badge" :style="{ background: typeConfig(project.type).color + '22', color: typeConfig(project.type).color }">
            {{ typeConfig(project.type).label }}
          </span>
          <span class="priority-badge" :style="{ color: priorityConfig(project.priority).color }">
            ↑ {{ priorityConfig(project.priority).label }} Priority
          </span>
          <span v-if="project.artist" class="artist-badge">{{ project.artist }}</span>
        </div>
        <h1 class="hero-title">{{ project.title }}</h1>
        <p v-if="project.description" class="hero-desc">{{ project.description }}</p>

        <!-- Key metrics -->
        <div class="hero-metrics">
          <div class="metric">
            <span class="metric-val">{{ completedTasks }}/{{ totalTasks }}</span>
            <span class="metric-lbl">Tasks Done</span>
          </div>
          <div class="metric">
            <span class="metric-val" :class="{ 'text-overdue': isOverdue }">{{ project.due_date ? formatDate(project.due_date) : '—' }}</span>
            <span class="metric-lbl">{{ isOverdue ? 'OVERDUE' : 'Due Date' }}</span>
          </div>
          <div class="metric">
            <span class="metric-val">{{ daysRemaining }}</span>
            <span class="metric-lbl">{{ daysRemaining === '—' ? '' : isOverdue ? 'Days Overdue' : 'Days Left' }}</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="hero-progress">
          <div class="hp-track">
            <div class="hp-fill" :style="{ width: progress + '%', background: project.cover_color || '#6366f1' }"></div>
          </div>
          <span class="hp-pct">{{ progress }}% complete</span>
        </div>
      </div>
    </div>

    <!-- Main content: two columns -->
    <div class="detail-body">
      <!-- Left: Tasks -->
      <div class="col-tasks">
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">Tasks</h2>
            <span class="task-badge">{{ completedTasks }}/{{ totalTasks }}</span>
          </div>

          <!-- Task list -->
          <ul class="task-list">
            <li
              v-for="task in project.tasks"
              :key="task.id"
              :class="['task-item', { done: task.done }]"
            >
              <button class="task-check" @click="store.toggleTask(project.id, task.id)" :title="task.done ? 'Mark incomplete' : 'Mark complete'">
                <svg v-if="task.done" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
              </button>
              <span class="task-title">{{ task.title }}</span>
              <button class="task-del" @click="store.deleteTask(project.id, task.id)" title="Remove task">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </li>
          </ul>

          <!-- Add task -->
          <div class="add-task-row">
            <input
              v-model="newTaskTitle"
              class="add-task-input"
              placeholder="Add a task…"
              @keydown.enter="addTask"
              maxlength="150"
            />
            <button class="add-task-btn" @click="addTask" :disabled="!newTaskTitle.trim()">Add</button>
          </div>
        </div>
      </div>

      <!-- Right: Details + Team + Tags -->
      <div class="col-side">
        <!-- Details card -->
        <div class="section-card">
          <h2 class="section-title">Details</h2>
          <dl class="detail-list">
            <div class="detail-row">
              <dt>Status</dt>
              <dd>
                <select class="inline-select" v-model="project.status" @change="saveField('status', $event.target.value)">
                  <option v-for="(cfg, key) in store.STATUS_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                </select>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Type</dt>
              <dd>
                <select class="inline-select" v-model="project.type" @change="saveField('type', $event.target.value)">
                  <option v-for="(cfg, key) in store.TYPE_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                </select>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Priority</dt>
              <dd>
                <select class="inline-select" v-model="project.priority" @change="saveField('priority', $event.target.value)">
                  <option v-for="(cfg, key) in store.PRIORITY_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                </select>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Due Date</dt>
              <dd>
                <input class="inline-input" type="date" v-model="project.due_date" @change="saveField('due_date', $event.target.value)" />
              </dd>
            </div>
            <div class="detail-row">
              <dt>Artist</dt>
              <dd>
                <input class="inline-input" v-model="project.artist" @blur="saveField('artist', project.artist)" placeholder="—" />
              </dd>
            </div>
            <div class="detail-row">
              <dt>Created</dt>
              <dd class="readonly-val">{{ formatDate(project.created_at) }}</dd>
            </div>
            <div class="detail-row">
              <dt>Updated</dt>
              <dd class="readonly-val">{{ formatRelative(project.updated_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Team card -->
        <div class="section-card" v-if="project.team?.length">
          <h2 class="section-title">Team</h2>
          <div class="team-list">
            <div v-for="member in project.team" :key="member.id" class="team-member">
              <div class="member-avatar" :style="{ background: avatarColor(member.name) }">{{ member.name.charAt(0) }}</div>
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-role">{{ member.role }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags card -->
        <div class="section-card" v-if="project.tags?.length">
          <h2 class="section-title">Tags</h2>
          <div class="tags-row">
            <span v-for="tag in project.tags" :key="tag" class="tag-chip">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
          <div class="modal-box">
            <div class="modal-header">
              <h2>Edit Project</h2>
              <button class="modal-close" @click="showEditModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form @submit.prevent="submitEdit" class="modal-form">
              <div class="form-group">
                <label>Title</label>
                <input v-model="editForm.title" required />
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label>Type</label>
                  <select v-model="editForm.type">
                    <option v-for="(cfg, key) in store.TYPE_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select v-model="editForm.status">
                    <option v-for="(cfg, key) in store.STATUS_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label>Priority</label>
                  <select v-model="editForm.priority">
                    <option v-for="(cfg, key) in store.PRIORITY_CONFIG" :key="key" :value="key">{{ cfg.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Due Date</label>
                  <input v-model="editForm.due_date" type="date" />
                </div>
              </div>
              <div class="form-group">
                <label>Artist</label>
                <input v-model="editForm.artist" placeholder="Artist / team name" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea v-model="editForm.description" rows="3"></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-cancel" @click="showEditModal = false">Cancel</button>
                <button type="submit" class="btn-submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </div>

  <div v-else-if="notFound" class="not-found">
    <p>Project not found.</p>
    <button @click="router.push('/projects')">← Back to Projects</button>
  </div>
  <div v-else class="loading-screen">Loading…</div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore, STATUS_CONFIG, TYPE_CONFIG, PRIORITY_CONFIG } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const store = useProjectsStore()
const showContextMenu = inject('showContextMenu', () => {})
const showToast = inject('showToast', () => {})

const project = ref(null)
const notFound = ref(false)
const newTaskTitle = ref('')
const showEditModal = ref(false)
const editForm = ref({})

onMounted(() => {
  const found = store.getProject(route.params.id)
  if (found) { project.value = found }
  else { notFound.value = true }
})

// Config helpers
const statusConfig   = (s) => STATUS_CONFIG[s]   || STATUS_CONFIG.planning
const typeConfig     = (t) => TYPE_CONFIG[t]     || TYPE_CONFIG.other
const priorityConfig = (p) => PRIORITY_CONFIG[p] || PRIORITY_CONFIG.medium

// Computed
const totalTasks     = computed(() => project.value?.tasks?.length || 0)
const completedTasks = computed(() => project.value?.tasks?.filter(t => t.done).length || 0)
const progress       = computed(() => store.calcProgress(project.value?.tasks))
const isOverdue      = computed(() => project.value?.due_date && project.value.due_date < new Date().toISOString().split('T')[0] && project.value.status !== 'completed')

const daysRemaining = computed(() => {
  if (!project.value?.due_date) return '—'
  const due = new Date(project.value.due_date + 'T12:00:00')
  const diff = Math.round((due - new Date()) / 86400000)
  if (diff === 0) return 'Today'
  return String(Math.abs(diff))
})

// Helpers
const formatDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d.includes('T') ? d : d + 'T12:00:00')
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const formatRelative = (iso) => {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return formatDate(iso)
}
const avatarColor = (name) => {
  const colors = ['#6366f1','#a855f7','#ec4899','#3b82f6','#10b981','#f59e0b','#ef4444']
  return colors[name.charCodeAt(0) % colors.length]
}

// Actions
const saveField = (field, value) => {
  if (!project.value) return
  store.updateProject(project.value.id, { [field]: value })
}

const addTask = () => {
  if (!newTaskTitle.value.trim() || !project.value) return
  store.addTask(project.value.id, newTaskTitle.value)
  newTaskTitle.value = ''
}

// Context menu
const showProjectMenu = (event) => {
  if (!project.value) return
  const p = project.value
  const menuItems = [
    { label: 'Edit', action: openEditModal },
    { label: 'Duplicate', action: () => {
      const copy = store.duplicateProject(p.id)
      if (copy) { showToast({ message: `Duplicated as "${copy.title}"`, type: 'success' }); router.push(`/projects/${copy.id}`) }
    }},
    { divider: true },
    ...Object.entries(STATUS_CONFIG).filter(([key]) => key !== p.status).map(([key, cfg]) => ({
      label: `Move to ${cfg.label}`,
      action: () => { store.updateProject(p.id, { status: key }); showToast({ message: `Moved to ${cfg.label}`, type: 'success' }) }
    })),
    { divider: true },
    { label: 'Delete Project', danger: true, action: () => {
      if (confirm(`Delete "${p.title}"?`)) {
        store.deleteProject(p.id)
        showToast({ message: `Deleted "${p.title}"`, type: 'error' })
        router.push('/projects')
      }
    }}
  ]
  showContextMenu(event, menuItems, 'custom')
}

// Edit modal
const openEditModal = () => {
  editForm.value = {
    title: project.value.title,
    type: project.value.type,
    status: project.value.status,
    priority: project.value.priority,
    due_date: project.value.due_date || '',
    artist: project.value.artist || '',
    description: project.value.description || ''
  }
  showEditModal.value = true
}
const submitEdit = () => {
  if (!editForm.value.title?.trim()) return
  store.updateProject(project.value.id, editForm.value)
  showToast({ message: 'Project updated', type: 'success' })
  showEditModal.value = false
}
</script>

<style scoped>
.project-detail {
  display: flex; flex-direction: column;
  height: 100%; background: var(--color-bg); color: var(--color-text); overflow: hidden;
}

/* Top bar */
.detail-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--space-4); height: 52px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface); flex-shrink: 0;
}
.back-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; background: none;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  color: var(--color-text-secondary); font-size: 13px; cursor: pointer;
  transition: all var(--motion-fast);
}
.back-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }
.back-btn svg { width: 16px; height: 16px; }
.topbar-actions { display: flex; align-items: center; gap: 8px; }
.status-chip {
  padding: 4px 10px; border-radius: 100px;
  font-size: 12px; font-weight: var(--weight-medium);
}
.topbar-btn {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  color: var(--color-text-secondary); cursor: pointer; transition: all var(--motion-fast);
}
.topbar-btn svg { width: 16px; height: 16px; }
.topbar-btn:hover { background: var(--color-surface-raised); color: var(--color-text); }

/* Hero */
.detail-hero {
  flex-shrink: 0; padding: 32px 48px 28px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: relative;
}
.hero-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--accent, #6366f1); }
.hero-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.type-badge {
  padding: 3px 10px; border-radius: 100px;
  font-size: 11px; font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.05em;
}
.priority-badge { font-size: 12px; font-weight: var(--weight-medium); }
.artist-badge { font-size: 13px; color: var(--color-text-secondary); }
.hero-title { font-size: 34px; font-weight: 200; letter-spacing: -0.02em; margin: 0 0 10px; }
.hero-desc { font-size: 15px; color: var(--color-text-secondary); margin: 0 0 24px; max-width: 680px; line-height: 1.6; }
.hero-metrics { display: flex; gap: 32px; margin-bottom: 20px; }
.metric { display: flex; flex-direction: column; gap: 2px; }
.metric-val { font-size: 22px; font-weight: 600; line-height: 1; }
.metric-val.text-overdue { color: #ef4444; }
.metric-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-tertiary); }
.hero-progress { display: flex; align-items: center; gap: 12px; }
.hp-track { flex: 1; max-width: 400px; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
.hp-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.hp-pct { font-size: 13px; color: var(--color-text-secondary); }

/* Body */
.detail-body {
  display: flex; gap: 0; flex: 1; overflow: hidden;
}

.col-tasks {
  flex: 1; overflow-y: auto; padding: 28px 32px 28px 48px; border-right: 1px solid var(--color-border);
}
.col-side {
  width: 320px; flex-shrink: 0; overflow-y: auto; padding: 28px 48px 28px 24px;
  display: flex; flex-direction: column; gap: 16px;
}

/* Section cards */
.section-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 20px; margin-bottom: 16px;
}
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-title { font-size: 13px; font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.07em; color: var(--color-text-secondary); margin: 0 0 16px; }
.task-badge { background: var(--color-border); border-radius: 100px; padding: 2px 8px; font-size: 11px; color: var(--color-text-tertiary); }

/* Task list */
.task-list { list-style: none; padding: 0; margin: 0 0 16px; display: flex; flex-direction: column; gap: 8px; }
.task-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  transition: all var(--motion-fast);
}
.task-item:hover { border-color: var(--color-border-strong); }
.task-item.done .task-title { text-decoration: line-through; color: var(--color-text-tertiary); }
.task-check {
  background: none; border: none; cursor: pointer; padding: 0;
  color: var(--color-text-tertiary); display: flex; flex-shrink: 0;
  transition: color var(--motion-fast);
}
.task-check svg { width: 20px; height: 20px; }
.task-item.done .task-check { color: #22c55e; }
.task-check:hover { color: #22c55e; }
.task-title { flex: 1; font-size: 14px; line-height: 1.4; }
.task-del {
  background: none; border: none; cursor: pointer; padding: 2px;
  color: var(--color-text-tertiary); display: flex; border-radius: 4px;
  opacity: 0; transition: all var(--motion-fast);
}
.task-item:hover .task-del { opacity: 1; }
.task-del svg { width: 16px; height: 16px; }
.task-del:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

.add-task-row { display: flex; gap: 8px; }
.add-task-input {
  flex: 1; padding: 8px 12px;
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px;
}
.add-task-input:focus { outline: none; border-color: var(--color-accent); }
.add-task-btn {
  padding: 8px 16px; background: var(--color-text);
  border: none; border-radius: var(--radius-sm);
  color: var(--color-bg); font-size: 13px; font-weight: var(--weight-medium);
  cursor: pointer; transition: opacity var(--motion-fast); white-space: nowrap;
}
.add-task-btn:hover:not(:disabled) { opacity: 0.85; }
.add-task-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Details list */
.detail-list { display: flex; flex-direction: column; gap: 12px; margin: 0; }
.detail-row { display: flex; align-items: center; gap: 12px; }
.detail-row dt { font-size: 12px; color: var(--color-text-tertiary); min-width: 72px; }
.detail-row dd { flex: 1; margin: 0; }
.inline-select, .inline-input {
  width: 100%; padding: 5px 8px;
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); color: var(--color-text); font-size: 13px;
}
.inline-select:focus, .inline-input:focus { outline: none; border-color: var(--color-accent); }
.readonly-val { font-size: 13px; color: var(--color-text-secondary); }

/* Team */
.team-list { display: flex; flex-direction: column; gap: 10px; }
.team-member { display: flex; align-items: center; gap: 10px; }
.member-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: #fff; flex-shrink: 0; text-transform: uppercase;
}
.member-name { font-size: 14px; font-weight: var(--weight-medium); }
.member-role { font-size: 12px; color: var(--color-text-tertiary); }

/* Tags */
.tags-row { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-chip {
  padding: 4px 10px; background: var(--color-surface-raised);
  border: 1px solid var(--color-border); border-radius: 100px;
  font-size: 12px; color: var(--color-text-secondary);
}

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; padding: 24px; }
.modal-box { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; width: 100%; max-width: 500px; box-shadow: var(--shadow-lg); }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--color-border); }
.modal-header h2 { margin: 0; font-size: 18px; font-weight: var(--weight-semibold); }
.modal-close { background: none; border: none; cursor: pointer; color: var(--color-text-tertiary); padding: 4px; border-radius: var(--radius-sm); display: flex; }
.modal-close svg { width: 18px; height: 18px; }
.modal-close:hover { color: var(--color-text); background: var(--color-surface-raised); }
.modal-form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; gap: 14px; }
.form-row.two-col .form-group { flex: 1; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 12px; font-weight: var(--weight-medium); color: var(--color-text-secondary); }
.form-group input, .form-group select, .form-group textarea { padding: 9px 12px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); font-size: 14px; font-family: inherit; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--color-accent); }
.form-group textarea { resize: vertical; min-height: 70px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
.btn-cancel { padding: 9px 18px; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-secondary); font-size: 14px; cursor: pointer; }
.btn-cancel:hover { background: var(--color-surface-raised); }
.btn-submit { padding: 9px 18px; background: var(--color-text); border: none; border-radius: var(--radius-sm); color: var(--color-bg); font-size: 14px; font-weight: var(--weight-medium); cursor: pointer; }
.btn-submit:hover { opacity: 0.85; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96); }

/* States */
.not-found, .loading-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--color-text-secondary); }
.not-found button { padding: 9px 18px; background: none; border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-secondary); cursor: pointer; }
</style>
