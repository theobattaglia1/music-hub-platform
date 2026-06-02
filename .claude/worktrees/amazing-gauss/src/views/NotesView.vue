<template>
  <div class="notes-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-background"></div>
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-main">Notes</span>
            <span class="title-count">{{ totalNotes }}</span>
          </h1>
          <p class="view-subtitle">Organize tasks, ideas, and project notes</p>
        </div>
        <button class="create-btn" @click="addNote">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Add Note</span>
        </button>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-section">
      <div class="filter-group">
        <div class="custom-select">
          <select v-model="filterCategory" class="filter-select">
            <option value="">All Categories</option>
            <option value="task">Tasks</option>
            <option value="idea">Ideas</option>
            <option value="reminder">Reminders</option>
            <option value="reference">Reference</option>
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

    <!-- Kanban Board -->
    <div v-if="viewMode === 'kanban'" class="kanban-container">
      <div class="kanban-board">
        <div
          v-for="column in kanbanColumns"
          :key="column.id"
          class="kanban-column"
          :class="column.id"
        >
          <div class="column-header">
            <div class="column-title">
              <div class="column-icon" :class="column.id">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path :d="column.icon" />
                </svg>
              </div>
              <h3>{{ column.title }}</h3>
              <span class="column-count">{{ getColumnNotes(column.id).length }}</span>
            </div>
            <button class="add-note-btn" @click="addNoteToColumn(column.id)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </button>
          </div>

          <div class="column-content">
            <div
              v-for="note in getColumnNotes(column.id)"
              :key="note.id"
              class="note-card"
              :class="[note.category, note.priority]"
              draggable="true"
              @dragstart="startDrag(note, $event)"
              @dragover.prevent
              @drop="onDrop(column.id, $event)"
            >
              <div class="note-header">
                <div class="note-category" :class="note.category">{{ formatCategory(note.category) }}</div>
                <div class="note-actions">
                  <button class="action-btn" @click="editNote(note)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" @click="deleteNote(note)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <h4 class="note-title">{{ note.title }}</h4>
              <p v-if="note.content" class="note-content">{{ note.content }}</p>

              <div v-if="note.dueDate" class="note-due-date" :class="{ overdue: isOverdue(note.dueDate) }">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                {{ formatDueDate(note.dueDate) }}
              </div>

              <div v-if="note.tags?.length > 0" class="note-tags">
                <span v-for="tag in note.tags" :key="tag" class="note-tag">#{{ tag }}</span>
              </div>
            </div>

            <div
              v-if="getColumnNotes(column.id).length === 0"
              class="empty-column"
              @dragover.prevent
              @drop="onDrop(column.id, $event)"
            >
              <p>Drop notes here or click + to add</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid View -->
    <div v-else class="notes-container">
      <div v-if="filteredNotes.length > 0" class="notes-grid">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          :class="[note.category, note.priority]"
          @click="editNote(note)"
        >
          <div class="note-header">
            <div class="note-category" :class="note.category">{{ formatCategory(note.category) }}</div>
            <div class="note-status" :class="note.status">{{ formatStatus(note.status) }}</div>
          </div>

          <h4 class="note-title">{{ note.title }}</h4>
          <p v-if="note.content" class="note-content">{{ note.content }}</p>

          <div class="note-footer">
            <div v-if="note.dueDate" class="note-due-date" :class="{ overdue: isOverdue(note.dueDate) }">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              {{ formatDueDate(note.dueDate) }}
            </div>

            <div v-if="note.tags?.length > 0" class="note-tags">
              <span v-for="tag in note.tags.slice(0, 2)" :key="tag" class="note-tag">#{{ tag }}</span>
              <span v-if="note.tags.length > 2" class="note-tag-more">+{{ note.tags.length - 2 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="40" width="120" height="140" rx="8" stroke="currentColor" stroke-width="2" opacity="0.2"/>
            <rect x="60" y="60" width="80" height="4" rx="2" fill="currentColor" opacity="0.3"/>
            <rect x="60" y="80" width="60" height="4" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="60" y="100" width="90" height="4" rx="2" fill="currentColor" opacity="0.3"/>
            <rect x="60" y="120" width="40" height="4" rx="2" fill="currentColor" opacity="0.2"/>
          </svg>
        </div>
        <h3 class="empty-title">No notes found</h3>
        <p class="empty-text">
          {{ filterCategory ? 'Try adjusting your filters' : 'Start organizing your thoughts and tasks' }}
        </p>
        <button v-if="!filterCategory" class="create-btn large" @click="addNote">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create First Note</span>
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
const notes = ref([])
const filterCategory = ref('')
const viewMode = ref('kanban')
const draggedNote = ref(null)

// View modes
const viewModes = [
  { value: 'kanban', label: 'Kanban Board', icon: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z' },
  { value: 'grid', label: 'Grid View', icon: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z' }
]

// Kanban columns
const kanbanColumns = [
  {
    id: 'todo',
    title: 'To Do',
    icon: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
  },
  {
    id: 'review',
    title: 'Review',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
  },
  {
    id: 'done',
    title: 'Done',
    icon: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'
  }
]

// Mock data
const mockNotes = [
  {
    id: 'note-1',
    title: 'Record new single',
    content: 'Book studio time for next week. Need to prepare lyrics and demo track.',
    category: 'task',
    status: 'todo',
    priority: 'high',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['recording', 'music'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'note-2',
    title: 'Album artwork concept',
    content: 'Explore vintage aesthetic with neon accents. Consider photographer recommendations.',
    category: 'idea',
    status: 'in-progress',
    priority: 'medium',
    tags: ['artwork', 'design', 'album'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'note-3',
    title: 'Update social media',
    content: 'Post behind-the-scenes content from studio sessions. Schedule posts for next week.',
    category: 'task',
    status: 'todo',
    priority: 'low',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['social', 'marketing'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'note-4',
    title: 'Collaboration ideas',
    content: 'Potential artists to collaborate with: Sarah Chen, Mike Rodriguez, Luna Project.',
    category: 'reference',
    status: 'review',
    priority: 'medium',
    tags: ['collaboration', 'artists'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'note-5',
    title: 'Tour venue research',
    content: 'Research venues in major cities for upcoming tour. Focus on capacity 1000-3000.',
    category: 'task',
    status: 'done',
    priority: 'high',
    tags: ['tour', 'venues'],
    createdAt: new Date().toISOString()
  }
]

// Computed
const filteredNotes = computed(() => {
  let result = [...notes.value]

  if (filterCategory.value) {
    result = result.filter(note => note.category === filterCategory.value)
  }

  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const totalNotes = computed(() => notes.value.length)

// Methods
const loadNotes = async () => {
  try {
    const result = await apiService.getAll('notes')
    notes.value = result.data?.length > 0 ? result.data : mockNotes
  } catch (error) {
    console.error('Failed to load notes:', error)
    notes.value = mockNotes
  }
}

const getColumnNotes = (status) => {
  return filteredNotes.value.filter(note => note.status === status)
}

const addNote = () => {
  showToast({ message: 'Note creation form coming soon', type: 'info' })
}

const addNoteToColumn = (status) => {
  showToast({ message: `Add note to ${status} column (form coming soon)`, type: 'info' })
}

const editNote = (note) => {
  showToast({ message: `Editing "${note.title}" (form coming soon)`, type: 'info' })
}

const deleteNote = async (note) => {
  if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
    try {
      await apiService.delete('notes', note.id)
      notes.value = notes.value.filter(n => n.id !== note.id)
      showToast({ message: 'Note deleted successfully', type: 'success' })
    } catch (error) {
      console.error('Failed to delete note:', error)
      showToast({ message: 'Failed to delete note', type: 'error' })
    }
  }
}

const startDrag = (note, event) => {
  draggedNote.value = note
  event.dataTransfer.effectAllowed = 'move'
}

const onDrop = async (newStatus, event) => {
  event.preventDefault()
  if (!draggedNote.value || draggedNote.value.status === newStatus) return

  try {
    const updatedNote = { ...draggedNote.value, status: newStatus }
    await apiService.update('notes', draggedNote.value.id, { status: newStatus })
    
    const index = notes.value.findIndex(n => n.id === draggedNote.value.id)
    if (index !== -1) {
      notes.value[index] = updatedNote
    }
    
    showToast({ message: `Moved "${draggedNote.value.title}" to ${formatStatus(newStatus)}`, type: 'success' })
  } catch (error) {
    console.error('Failed to update note status:', error)
    showToast({ message: 'Failed to update note status', type: 'error' })
  }
  
  draggedNote.value = null
}

const formatCategory = (category) => {
  const categories = {
    task: 'Task',
    idea: 'Idea',
    reminder: 'Reminder',
    reference: 'Reference'
  }
  return categories[category] || category
}

const formatStatus = (status) => {
  const statuses = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done'
  }
  return statuses[status] || status
}

const formatDueDate = (isoString) => {
  const date = new Date(isoString)
  const today = new Date()
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `${diffDays} days`
  
  return date.toLocaleDateString()
}

const isOverdue = (isoString) => {
  return new Date(isoString) < new Date()
}

onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.notes-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
}

/* Header styles */
.view-header {
  position: relative;
  padding: 48px 48px 0;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 32px;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: radial-gradient(ellipse at top, var(--color-accent-subtle) 0%, transparent 50%);
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
  color: var(--color-text-tertiary);
  font-weight: 300;
}

.view-subtitle {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.create-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 100px;
  color: var(--color-text);
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
  border-color: var(--color-border-strong);
  background: var(--color-surface-raised);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(0, 0, 0, 0.04);
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  transition: all var(--motion-fast);
  min-width: 140px;
}

.filter-select:hover {
  background: var(--color-surface-raised);
  border-color: var(--color-border-strong);
}

.view-toggles {
  display: flex;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
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
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--motion-fast);
}

.view-toggle:hover {
  color: var(--color-text-secondary);
}

.view-toggle.active {
  background: var(--color-surface-raised);
  color: var(--color-text);
}

.view-toggle svg {
  width: 18px;
  height: 18px;
}

/* Kanban Board */
.kanban-container {
  flex: 1;
  padding: 0 48px 48px;
  overflow-x: auto;
  overflow-y: hidden;
}

.kanban-board {
  display: flex;
  gap: 24px;
  min-width: max-content;
  height: 100%;
  padding-bottom: 24px;
}

.kanban-column {
  width: 320px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-raised);
}

.column-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.column-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.column-icon.todo {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-secondary);
}

.column-icon.in-progress {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.column-icon.review {
  background: rgba(200, 75, 17, 0.08);
  color: #b45309;
}

.column-icon.done {
  background: rgba(22, 101, 52, 0.08);
  color: #166534;
}

.column-icon svg {
  width: 16px;
  height: 16px;
}

.column-title h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}

.column-count {
  background: var(--color-border);
  color: var(--color-text-secondary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.add-note-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast);
}

.add-note-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.add-note-btn svg {
  width: 16px;
  height: 16px;
}

.column-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--color-bg);
}

.empty-column {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 32px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 14px;
  min-height: 100px;
}

/* Note Cards */
.note-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  transition: all var(--motion-default);
}

.note-card:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--color-border-strong);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.note-card.high {
  border-left: 3px solid var(--color-danger);
}

.note-card.medium {
  border-left: 3px solid var(--color-accent);
}

.note-card.low {
  border-left: 3px solid #4ade80;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.note-category {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.note-category.task {
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-text-secondary);
}

.note-category.idea {
  background: rgba(200, 75, 17, 0.08);
  color: var(--color-accent);
}

.note-category.reminder {
  background: rgba(192, 57, 43, 0.08);
  color: var(--color-danger);
}

.note-category.reference {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-secondary);
}

.note-status {
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.note-status.todo {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-tertiary);
}

.note-status.in-progress {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.note-status.review {
  background: rgba(200, 75, 17, 0.08);
  color: #b45309;
}

.note-status.done {
  background: rgba(22, 101, 52, 0.08);
  color: #166534;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--motion-fast);
}

.note-card:hover .note-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--motion-fast);
}

.action-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.action-btn.danger:hover {
  background: rgba(192, 57, 43, 0.08);
  border-color: rgba(192, 57, 43, 0.3);
  color: var(--color-danger);
}

.action-btn svg {
  width: 12px;
  height: 12px;
}

.note-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.3;
  color: var(--color-text);
}

.note-content {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}

.note-due-date.overdue {
  color: var(--color-danger);
}

.note-due-date svg {
  width: 12px;
  height: 12px;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.note-tag {
  font-size: 10px;
  background: var(--color-surface-raised);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: 2px 6px;
  border-radius: 8px;
}

.note-tag-more {
  font-size: 10px;
  background: var(--color-bg);
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
  padding: 2px 6px;
  border-radius: 8px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

/* Grid View */
.notes-container {
  flex: 1;
  padding: 0 48px 48px;
  overflow-y: auto;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
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
  color: var(--color-border-strong);
}

.empty-title {
  font-size: 24px;
  font-weight: 300;
  margin: 0 0 8px;
  color: var(--color-text);
}

.empty-text {
  font-size: 14px;
  color: var(--color-text-secondary);
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

  .kanban-container {
    padding: 0 24px 24px;
  }

  .kanban-column {
    width: 280px;
  }

  .notes-container {
    padding: 0 24px 24px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>