import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'mh_projects_v1'

export const STATUS_CONFIG = {
  planning:  { label: 'Planning',   color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  active:    { label: 'Active',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  review:    { label: 'In Review',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  completed: { label: 'Completed',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  'on-hold': { label: 'On Hold',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
}

export const TYPE_CONFIG = {
  album:        { label: 'Album',       color: '#a855f7' },
  single:       { label: 'Single',      color: '#3b82f6' },
  ep:           { label: 'EP',          color: '#06b6d4' },
  campaign:     { label: 'Campaign',    color: '#f59e0b' },
  'music-video':{ label: 'Music Video', color: '#ec4899' },
  tour:         { label: 'Tour',        color: '#10b981' },
  'brand-deal': { label: 'Brand Deal',  color: '#f97316' },
  other:        { label: 'Other',       color: '#6b7280' }
}

export const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#ef4444' },
  medium: { label: 'Medium', color: '#f59e0b' },
  low:    { label: 'Low',    color: '#6b7280' }
}

const makeId = () => `proj-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
const taskId = () => `task-${Date.now()}-${Math.random().toString(36).slice(2,6)}`

const makeDefaultProjects = () => [
  {
    id: 'proj-1',
    title: 'Summer Singles Campaign',
    type: 'campaign',
    status: 'active',
    priority: 'high',
    artist: 'The Midnight',
    description: 'Summer release campaign covering 3 singles, social strategy, and DSP playlist pitching. Goal: 500K streams in 30 days.',
    due_date: '2026-07-15',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-02-18T14:30:00Z',
    cover_color: '#6366f1',
    tasks: [
      { id: 'pt1', title: 'Finalize track listing', done: true },
      { id: 'pt2', title: 'Submit masters to DSPs', done: true },
      { id: 'pt3', title: 'Build social content calendar', done: true },
      { id: 'pt4', title: 'Write press release', done: false },
      { id: 'pt5', title: 'Pitch to playlist editors', done: false },
      { id: 'pt6', title: 'Set up pre-save links', done: false }
    ],
    team: [
      { id: 'u1', name: 'Alex Smith', role: 'Manager' },
      { id: 'u2', name: 'Jordan Lee', role: 'Creative Director' }
    ],
    tags: ['release', 'digital', 'summer']
  },
  {
    id: 'proj-2',
    title: 'Debut Album — "Echoes"',
    type: 'album',
    status: 'active',
    priority: 'high',
    artist: 'Nova Drift',
    description: 'Full-length debut album. 12 tracks, targeting Q4 release. Physical + digital distribution.',
    due_date: '2026-10-01',
    created_at: '2025-11-01T09:00:00Z',
    updated_at: '2026-02-22T11:00:00Z',
    cover_color: '#a855f7',
    tasks: [
      { id: 'pt7', title: 'Record all 12 tracks', done: true },
      { id: 'pt8', title: 'Mixing sessions', done: true },
      { id: 'pt9', title: 'Mastering', done: false },
      { id: 'pt10', title: 'Artwork & packaging design', done: false },
      { id: 'pt11', title: 'Physical pressing order', done: false },
      { id: 'pt12', title: 'Distribution agreements', done: false },
      { id: 'pt13', title: 'Press & media tour', done: false }
    ],
    team: [
      { id: 'u3', name: 'Sam Torres', role: 'A&R' },
      { id: 'u1', name: 'Alex Smith', role: 'Manager' },
      { id: 'u4', name: 'Dana Wu', role: 'Engineer' }
    ],
    tags: ['album', 'physical', 'Q4']
  },
  {
    id: 'proj-3',
    title: 'Brand Partnership — Levi\'s',
    type: 'brand-deal',
    status: 'review',
    priority: 'medium',
    artist: 'Luna Ray',
    description: 'Licensing deal for Spring/Summer lookbook campaign. 2 songs licensed, sync fee negotiation ongoing.',
    due_date: '2026-03-30',
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-02-25T16:00:00Z',
    cover_color: '#f59e0b',
    tasks: [
      { id: 'pt14', title: 'Initial pitch deck', done: true },
      { id: 'pt15', title: 'Contract review (legal)', done: true },
      { id: 'pt16', title: 'Negotiate sync fee', done: false },
      { id: 'pt17', title: 'Deliver stems & masters', done: false },
      { id: 'pt18', title: 'Final sign-off', done: false }
    ],
    team: [
      { id: 'u5', name: 'Morgan Blake', role: 'Legal' },
      { id: 'u1', name: 'Alex Smith', role: 'Manager' }
    ],
    tags: ['sync', 'licensing', 'fashion']
  },
  {
    id: 'proj-4',
    title: '"Neon City" Music Video',
    type: 'music-video',
    status: 'planning',
    priority: 'medium',
    artist: 'The Midnight',
    description: 'Cinematic music video for lead single off upcoming EP. Director: TBD. Budget: $25K.',
    due_date: '2026-05-01',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-26T09:00:00Z',
    cover_color: '#ec4899',
    tasks: [
      { id: 'pt19', title: 'Director outreach & selection', done: false },
      { id: 'pt20', title: 'Treatment & storyboard review', done: false },
      { id: 'pt21', title: 'Location scouting', done: false },
      { id: 'pt22', title: 'Production schedule', done: false },
      { id: 'pt23', title: 'Shoot day(s)', done: false },
      { id: 'pt24', title: 'Edit & color grade', done: false }
    ],
    team: [
      { id: 'u2', name: 'Jordan Lee', role: 'Creative Director' }
    ],
    tags: ['video', 'visual', 'single']
  },
  {
    id: 'proj-5',
    title: 'North America Tour 2026',
    type: 'tour',
    status: 'planning',
    priority: 'high',
    artist: 'Nova Drift',
    description: '28-city North America headline tour. Routing, booking, logistics, and rider finalization.',
    due_date: '2026-09-01',
    created_at: '2026-02-05T00:00:00Z',
    updated_at: '2026-02-27T08:00:00Z',
    cover_color: '#10b981',
    tasks: [
      { id: 'pt25', title: 'Confirm routing with agent', done: false },
      { id: 'pt26', title: 'Venue holds', done: false },
      { id: 'pt27', title: 'Production rider', done: false },
      { id: 'pt28', title: 'Band & crew contracts', done: false },
      { id: 'pt29', title: 'Travel & accommodation logistics', done: false },
      { id: 'pt30', title: 'Marketing rollout plan', done: false }
    ],
    team: [
      { id: 'u6', name: 'Casey Park', role: 'Tour Manager' },
      { id: 'u1', name: 'Alex Smith', role: 'Manager' }
    ],
    tags: ['live', 'tour', '2026']
  },
  {
    id: 'proj-6',
    title: 'Winter EP — "Frostlines"',
    type: 'ep',
    status: 'completed',
    priority: 'low',
    artist: 'Luna Ray',
    description: '5-track EP released December 2025. Full campaign completed. Archived for reference.',
    due_date: '2025-12-10',
    created_at: '2025-09-01T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
    cover_color: '#06b6d4',
    tasks: [
      { id: 'pt31', title: 'Recording', done: true },
      { id: 'pt32', title: 'Mix & master', done: true },
      { id: 'pt33', title: 'Distribute', done: true },
      { id: 'pt34', title: 'Press campaign', done: true },
      { id: 'pt35', title: 'Playlist pitching', done: true }
    ],
    team: [
      { id: 'u3', name: 'Sam Torres', role: 'A&R' }
    ],
    tags: ['ep', 'completed', 'winter']
  }
]

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref([])

  const _save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.value)) } catch { /* quota */ }
  }

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      projects.value = raw ? JSON.parse(raw) : makeDefaultProjects()
    } catch {
      projects.value = makeDefaultProjects()
    }
  }

  const getProject = (id) => projects.value.find(p => p.id === id) || null

  const calcProgress = (tasks) => {
    if (!tasks?.length) return 0
    const done = tasks.filter(t => t.done).length
    return Math.round((done / tasks.length) * 100)
  }

  const createProject = (data) => {
    const p = {
      id: makeId(),
      title: data.title?.trim() || 'Untitled Project',
      type: data.type || 'other',
      status: data.status || 'planning',
      priority: data.priority || 'medium',
      artist: data.artist || '',
      description: data.description || '',
      due_date: data.due_date || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cover_color: data.cover_color || TYPE_CONFIG[data.type || 'other']?.color || '#6b7280',
      tasks: [],
      team: [],
      tags: data.tags || []
    }
    projects.value.unshift(p)
    _save()
    return p
  }

  const updateProject = (id, updates) => {
    const p = getProject(id)
    if (!p) return
    Object.assign(p, { ...updates, updated_at: new Date().toISOString() })
    _save()
  }

  const deleteProject = (id) => {
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx > -1) { projects.value.splice(idx, 1); _save() }
  }

  const duplicateProject = (id) => {
    const p = getProject(id)
    if (!p) return null
    const copy = {
      ...JSON.parse(JSON.stringify(p)),
      id: makeId(),
      title: `${p.title} (Copy)`,
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    copy.tasks = copy.tasks.map(t => ({ ...t, id: taskId(), done: false }))
    const idx = projects.value.findIndex(p2 => p2.id === id)
    projects.value.splice(idx + 1, 0, copy)
    _save()
    return copy
  }

  // Task helpers
  const addTask = (projectId, title) => {
    const p = getProject(projectId)
    if (!p) return
    if (!p.tasks) p.tasks = []
    const t = { id: taskId(), title: title.trim(), done: false }
    p.tasks.push(t)
    p.updated_at = new Date().toISOString()
    _save()
    return t
  }

  const toggleTask = (projectId, taskId) => {
    const p = getProject(projectId)
    const t = p?.tasks?.find(t => t.id === taskId)
    if (t) { t.done = !t.done; p.updated_at = new Date().toISOString(); _save() }
  }

  const deleteTask = (projectId, taskId) => {
    const p = getProject(projectId)
    if (!p?.tasks) return
    p.tasks = p.tasks.filter(t => t.id !== taskId)
    p.updated_at = new Date().toISOString()
    _save()
  }

  // Initialize
  load()

  return {
    projects, load, getProject, calcProgress,
    createProject, updateProject, deleteProject, duplicateProject,
    addTask, toggleTask, deleteTask,
    STATUS_CONFIG, TYPE_CONFIG, PRIORITY_CONFIG
  }
})
