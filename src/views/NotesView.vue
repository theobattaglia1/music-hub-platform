<template>
  <WorkspacePage
    class="notes-view"
    artist-scoped-header
    eyebrow="Planning"
    title="Notes"
    :count="totalNotes"
    subtitle="Organize tasks, ideas, and project notes"
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="openCreateNoteModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add Note</span>
      </button>
    </template>

    <template #toolbar>
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
    </template>

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
            <button class="add-note-btn" @click="openCreateNoteModal(column.id)">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
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
                <div class="note-category" :class="note.category">
                  {{ formatCategory(note.category) }}
                </div>
                <div class="note-actions">
                  <button class="action-btn" @click="openEditNoteModal(note)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                      />
                    </svg>
                  </button>
                  <button class="action-btn danger" @click="deleteNote(note)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <h4 class="note-title">{{ note.title }}</h4>
              <p v-if="note.content" class="note-content">{{ note.content }}</p>

              <div
                v-if="note.dueDate"
                class="note-due-date"
                :class="{ overdue: isOverdue(note.dueDate) }"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                  />
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
      <div v-if="filteredNotes.length > 0" class="notes-grid collection-grid-compact">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          :class="[note.category, note.priority]"
          @click="openEditNoteModal(note)"
        >
          <div class="note-header">
            <div class="note-category" :class="note.category">
              {{ formatCategory(note.category) }}
            </div>
            <div class="note-status" :class="note.status">{{ formatStatus(note.status) }}</div>
          </div>

          <h4 class="note-title">{{ note.title }}</h4>
          <p v-if="note.content" class="note-content">{{ note.content }}</p>

          <div class="note-footer">
            <div
              v-if="note.dueDate"
              class="note-due-date"
              :class="{ overdue: isOverdue(note.dueDate) }"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                />
              </svg>
              {{ formatDueDate(note.dueDate) }}
            </div>

            <div v-if="note.tags?.length > 0" class="note-tags">
              <span v-for="tag in note.tags.slice(0, 2)" :key="tag" class="note-tag"
                >#{{ tag }}</span
              >
              <span v-if="note.tags.length > 2" class="note-tag-more"
                >+{{ note.tags.length - 2 }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect
              x="40"
              y="40"
              width="120"
              height="140"
              rx="8"
              stroke="currentColor"
              stroke-width="2"
              opacity="0.2"
            />
            <rect x="60" y="60" width="80" height="4" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="60" y="80" width="60" height="4" rx="2" fill="currentColor" opacity="0.2" />
            <rect x="60" y="100" width="90" height="4" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="60" y="120" width="40" height="4" rx="2" fill="currentColor" opacity="0.2" />
          </svg>
        </div>
        <h3 class="empty-title">No notes found</h3>
        <p class="empty-text">
          {{
            filterCategory
              ? "Try adjusting your filters"
              : "Start organizing your thoughts and tasks"
          }}
        </p>
        <button v-if="!filterCategory" class="create-btn large" @click="openCreateNoteModal()">
          <div class="btn-bg"></div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create First Note</span>
        </button>
      </div>
    </div>

    <teleport to="body">
      <transition name="fade">
        <div v-if="noteModalOpen" class="modal-overlay" @click.self="closeNoteModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>{{ noteModalMode === "create" ? "Create Note" : "Edit Note" }}</h2>
                <p>
                  {{
                    noteModalMode === "create"
                      ? "Add a note, task, or reference."
                      : "Update note content and workflow state."
                  }}
                </p>
              </div>
              <button class="modal-close" @click="closeNoteModal">×</button>
            </div>

            <form class="modal-form" @submit.prevent="submitNoteModal">
              <label>
                <span>Title</span>
                <input v-model="noteDraft.title" type="text" placeholder="Note title" required />
              </label>
              <label>
                <span>Details</span>
                <textarea
                  v-model="noteDraft.content"
                  rows="4"
                  placeholder="Add context or next steps"
                ></textarea>
              </label>
              <div class="modal-grid">
                <label>
                  <span>Status</span>
                  <select v-model="noteDraft.status">
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </label>
                <label>
                  <span>Category</span>
                  <select v-model="noteDraft.category">
                    <option value="task">Task</option>
                    <option value="idea">Idea</option>
                    <option value="reminder">Reminder</option>
                    <option value="reference">Reference</option>
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select v-model="noteDraft.priority">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  <span>Due Date</span>
                  <input v-model="noteDraft.dueDate" type="date" />
                </label>
              </div>
              <label>
                <span>Tags</span>
                <input v-model="noteDraft.tags" type="text" placeholder="comma, separated, tags" />
              </label>
              <div class="modal-actions">
                <button type="button" class="ghost-btn" @click="closeNoteModal">Cancel</button>
                <button type="submit" class="primary-btn">
                  {{ noteModalMode === "create" ? "Create Note" : "Save Note" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="deleteNoteModalOpen" class="modal-overlay" @click.self="closeDeleteNoteModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>Delete Note</h2>
                <p>Remove this note from the current workspace.</p>
              </div>
              <button class="modal-close" @click="closeDeleteNoteModal">×</button>
            </div>

            <div class="confirm-copy">
              <strong>{{ pendingDeleteNote?.title }}</strong>
              <p>This note will be deleted immediately in the current session.</p>
            </div>

            <div class="modal-actions">
              <button type="button" class="ghost-btn" @click="closeDeleteNoteModal">Cancel</button>
              <button type="button" class="danger-btn" @click="confirmDeleteNote">
                Delete Note
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </WorkspacePage>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject, reactive } from "vue";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import { apiService } from "@/shared/services/api";

const showToast = inject("showToast", () => {});

// State
const notes = ref([]);
const filterCategory = ref("");
const viewMode = ref("grid");
const draggedNote = ref(null);
const NOTES_STORAGE_KEY = "musicHub.notes";
const noteModalOpen = ref(false);
const noteModalMode = ref("create");
const activeNoteId = ref("");
const deleteNoteModalOpen = ref(false);
const pendingDeleteNote = ref(null);
const noteDraft = reactive({
  title: "",
  content: "",
  category: "task",
  status: "todo",
  priority: "medium",
  dueDate: "",
  tags: "",
});

// View modes
const viewModes = [
  { value: "kanban", label: "Kanban Board", icon: "M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" },
  { value: "grid", label: "Grid View", icon: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" },
];

// Kanban columns
const kanbanColumns = [
  {
    id: "todo",
    title: "To Do",
    icon: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  },
  {
    id: "review",
    title: "Review",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  {
    id: "done",
    title: "Done",
    icon: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  },
];

// Mock data
const mockNotes = [
  {
    id: "note-1",
    title: "Record new single",
    content: "Book studio time for next week. Need to prepare lyrics and demo track.",
    category: "task",
    status: "todo",
    priority: "high",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["recording", "music"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "note-2",
    title: "Album artwork concept",
    content: "Explore vintage aesthetic with neon accents. Consider photographer recommendations.",
    category: "idea",
    status: "in-progress",
    priority: "medium",
    tags: ["artwork", "design", "album"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "note-3",
    title: "Update social media",
    content: "Post behind-the-scenes content from studio sessions. Schedule posts for next week.",
    category: "task",
    status: "todo",
    priority: "low",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["social", "marketing"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "note-4",
    title: "Collaboration ideas",
    content: "Potential artists to collaborate with: Sarah Chen, Mike Rodriguez, Luna Project.",
    category: "reference",
    status: "review",
    priority: "medium",
    tags: ["collaboration", "artists"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "note-5",
    title: "Tour venue research",
    content: "Research venues in major cities for upcoming tour. Focus on capacity 1000-3000.",
    category: "task",
    status: "done",
    priority: "high",
    tags: ["tour", "venues"],
    createdAt: new Date().toISOString(),
  },
];

// Computed
const normalizeStatusFromApi = (status) => {
  if (status === "in_progress") return "in-progress";
  if (status === "archived") return "done";
  return status || "todo";
};

const normalizeStatusForApi = (status) => {
  if (status === "in-progress") return "in_progress";
  if (status === "review") return "in_progress";
  if (status === "done") return "done";
  return "todo";
};

const normalizeNote = (note) => ({
  ...note,
  title: note.title || "Untitled Note",
  content: note.content || "",
  category: note.category || "task",
  status: normalizeStatusFromApi(note.status),
  priority: note.priority || "medium",
  dueDate: note.dueDate || note.due_date || null,
  tags: note.tags || [],
  createdAt: note.createdAt || note.created_at || new Date().toISOString(),
});

const filteredNotes = computed(() => {
  let result = notes.value.map(normalizeNote);

  if (filterCategory.value) {
    result = result.filter((note) => note.category === filterCategory.value);
  }

  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const totalNotes = computed(() => notes.value.length);

// Methods
const loadNotes = async () => {
  const cached = localStorage.getItem(NOTES_STORAGE_KEY);
  if (cached) {
    try {
      notes.value = JSON.parse(cached).map(normalizeNote);
      return;
    } catch {
      localStorage.removeItem(NOTES_STORAGE_KEY);
    }
  }

  try {
    const result = await apiService.getAll("notes");
    notes.value = result.data?.length > 0 ? result.data.map(normalizeNote) : mockNotes;
  } catch (error) {
    console.error("Failed to load notes:", error);
    notes.value = mockNotes;
  }
};

const getColumnNotes = (status) => {
  return filteredNotes.value.filter((note) => note.status === status);
};

const resetNoteDraft = (status = "todo") => {
  noteDraft.title = "";
  noteDraft.content = "";
  noteDraft.category = "task";
  noteDraft.status = status;
  noteDraft.priority = "medium";
  noteDraft.dueDate = "";
  noteDraft.tags = "";
  activeNoteId.value = "";
};

const openCreateNoteModal = (status = "todo") => {
  noteModalMode.value = "create";
  resetNoteDraft(status);
  noteModalOpen.value = true;
};

const openEditNoteModal = (note) => {
  noteModalMode.value = "edit";
  activeNoteId.value = note.id;
  noteDraft.title = note.title || "";
  noteDraft.content = note.content || "";
  noteDraft.category = note.category || "task";
  noteDraft.status = note.status || "todo";
  noteDraft.priority = note.priority || "medium";
  noteDraft.dueDate = note.dueDate ? new Date(note.dueDate).toISOString().split("T")[0] : "";
  noteDraft.tags = Array.isArray(note.tags) ? note.tags.join(", ") : "";
  noteModalOpen.value = true;
};

const closeNoteModal = () => {
  noteModalOpen.value = false;
  resetNoteDraft("todo");
};

const buildNoteFromDraft = () => {
  const category = ["task", "idea", "reminder", "reference"].includes(noteDraft.category)
    ? noteDraft.category
    : "task";
  const priority = ["low", "medium", "high"].includes(noteDraft.priority)
    ? noteDraft.priority
    : "medium";
  const status = ["todo", "in-progress", "review", "done"].includes(noteDraft.status)
    ? noteDraft.status
    : "todo";
  const tags = noteDraft.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    title: noteDraft.title.trim(),
    content: noteDraft.content.trim(),
    category,
    status,
    priority,
    dueDate: noteDraft.dueDate ? new Date(noteDraft.dueDate).toISOString() : null,
    tags,
  };
};

const submitNoteModal = () => {
  const nextNote = buildNoteFromDraft();
  if (!nextNote.title) return;

  if (noteModalMode.value === "create") {
    const note = normalizeNote({
      id: `note-${Date.now()}`,
      ...nextNote,
      createdAt: new Date().toISOString(),
    });

    notes.value.unshift(note);
    apiService
      .create("notes", {
        title: note.title,
        content: note.content,
        status: normalizeStatusForApi(note.status),
        priority: note.priority,
      })
      .catch(() => {});

    showToast({
      message:
        nextNote.status === "todo"
          ? `Created "${note.title}"`
          : `Added note to ${formatStatus(nextNote.status)}`,
      type: "success",
    });
    closeNoteModal();
    return;
  }

  const note = notes.value.find((entry) => entry.id === activeNoteId.value);
  if (!note) return;

  Object.assign(note, nextNote);
  apiService
    .update("notes", note.id, {
      title: note.title,
      content: note.content,
      status: normalizeStatusForApi(note.status),
      priority: note.priority,
    })
    .catch(() => {});

  showToast({ message: `Updated "${note.title}"`, type: "success" });
  closeNoteModal();
};

const deleteNote = async (note) => {
  pendingDeleteNote.value = note;
  deleteNoteModalOpen.value = true;
};

const closeDeleteNoteModal = () => {
  deleteNoteModalOpen.value = false;
  pendingDeleteNote.value = null;
};

const confirmDeleteNote = async () => {
  if (!pendingDeleteNote.value) return;

  const note = pendingDeleteNote.value;
  try {
    try {
      await apiService.delete("notes", note.id);
    } catch {
      // Local-only deletion in demo mode.
    }
    notes.value = notes.value.filter((n) => n.id !== note.id);
    showToast({ message: "Note deleted successfully", type: "success" });
  } catch (error) {
    console.error("Failed to delete note:", error);
    showToast({ message: "Failed to delete note", type: "error" });
  } finally {
    closeDeleteNoteModal();
  }
};

const startDrag = (note, event) => {
  draggedNote.value = note;
  event.dataTransfer.effectAllowed = "move";
};

const onDrop = async (newStatus, event) => {
  event.preventDefault();
  if (!draggedNote.value || draggedNote.value.status === newStatus) return;

  try {
    const updatedNote = { ...draggedNote.value, status: newStatus };
    const index = notes.value.findIndex((n) => n.id === draggedNote.value.id);
    if (index !== -1) {
      notes.value[index] = updatedNote;
    }

    try {
      await apiService.update("notes", draggedNote.value.id, {
        status: normalizeStatusForApi(newStatus),
      });
    } catch {
      // Local-only drag/drop in demo mode.
    }

    showToast({
      message: `Moved "${draggedNote.value.title}" to ${formatStatus(newStatus)}`,
      type: "success",
    });
  } catch (error) {
    console.error("Failed to update note status:", error);
    showToast({ message: "Failed to update note status", type: "error" });
  }

  draggedNote.value = null;
};

const formatCategory = (category) => {
  const categories = {
    task: "Task",
    idea: "Idea",
    reminder: "Reminder",
    reference: "Reference",
  };
  return categories[category] || category;
};

const formatStatus = (status) => {
  const statuses = {
    todo: "To Do",
    "in-progress": "In Progress",
    review: "Review",
    done: "Done",
  };
  return statuses[status] || status;
};

const formatDueDate = (isoString) => {
  const date = new Date(isoString);
  const today = new Date();
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `${diffDays} days`;

  return date.toLocaleDateString();
};

const isOverdue = (isoString) => {
  return new Date(isoString) < new Date();
};

onMounted(() => {
  loadNotes();
});

watch(
  notes,
  (value) => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true },
);
</script>

<style scoped>
.notes-view {
  min-height: 100%;
  background: transparent;
  color: var(--color-text);
  --collection-card-min: 260px;
  --collection-grid-gap: var(--space-5);
}

/* Kanban Board */
.kanban-container {
  flex: 1;
  padding: 0 var(--page-gutter) var(--page-gutter);
  overflow-x: auto;
  overflow-y: hidden;
}

.kanban-board {
  display: flex;
  gap: var(--space-5);
  min-width: max-content;
  height: 100%;
  padding-bottom: var(--space-4);
}

.kanban-column {
  width: 300px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.column-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.column-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.column-icon.todo {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-text-secondary);
}

.column-icon.in-progress {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-accent);
}

.column-icon.review {
  background: rgba(201, 78, 23, 0.1);
  color: var(--color-warning);
}

.column-icon.done {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-success);
}

.column-icon svg {
  width: 16px;
  height: 16px;
}

.column-title h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.column-count {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.add-note-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
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
}

.empty-column {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  min-height: 100px;
}

/* Note Cards */
.note-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-card);
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 220px;
}

.note-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.note-card.high {
  border-left: 3px solid #ef4444;
}

.note-card.medium {
  border-left: 3px solid var(--color-warning);
}

.note-card.low {
  border-left: 3px solid var(--color-border-strong);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.note-category {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.note-category.task {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.note-category.idea {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-accent);
}

.note-category.reminder {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.note-category.reference {
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
}

.note-status {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.note-status.todo {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-text-secondary);
}

.note-status.in-progress {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-accent);
}

.note-status.review {
  background: rgba(201, 78, 23, 0.1);
  color: var(--color-warning);
}

.note-status.done {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-success);
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
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
  width: 12px;
  height: 12px;
}

.note-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
}

.note-content {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0;
}

.note-due-date.overdue {
  color: #ef4444;
}

.note-due-date svg {
  width: 12px;
  height: 12px;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
}

.note-tag {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  padding: 2px 6px;
  border-radius: 8px;
}

.note-tag-more {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  padding: 2px 6px;
  border-radius: 8px;
}

.note-footer {
  display: grid;
  gap: 8px;
  align-items: start;
  margin-top: auto;
}

/* Grid View */
.notes-container {
  flex: 1;
  padding: 0 0 var(--page-gutter);
  overflow-y: auto;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(min(var(--collection-card-min), 100%), var(--collection-card-min))
  );
  justify-content: start;
  gap: var(--space-5);
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

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(0, 0, 0, 0.76);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.modal-card {
  width: min(680px, 100%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02));
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.4);
  padding: 22px;
}

.modal-head {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 12px;
  margin-bottom: 18px;
}

.modal-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 320;
}

.modal-head p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.58);
}

.modal-close,
.ghost-btn,
.primary-btn,
.danger-btn {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
}

.modal-close {
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 22px;
}

.modal-form {
  display: grid;
  gap: 14px;
}

.modal-form label {
  display: grid;
  gap: 8px;
}

.modal-form span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.62);
}

.modal-form input,
.modal-form textarea,
.modal-form select {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font: inherit;
  padding: 12px 14px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.confirm-copy {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.confirm-copy strong {
  font-size: 16px;
}

.confirm-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.ghost-btn,
.primary-btn,
.danger-btn {
  min-height: 42px;
  padding: 0 16px;
  font-weight: 600;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.primary-btn {
  background: #fff;
  color: #000;
  border-color: transparent;
}

.danger-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #ffb4b4;
  border-color: rgba(239, 68, 68, 0.35);
}

/* Responsive */
@media (max-width: 768px) {
  .kanban-container {
    padding: 0 24px 24px;
  }

  .kanban-column {
    width: 280px;
  }

  .notes-container {
    padding: 0 0 24px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }

  .modal-grid,
  .modal-actions {
    grid-template-columns: 1fr;
  }
}

/* Theme override */
.notes-view {
  color: var(--color-text);
  background: transparent;
}

.notes-view .note-content,
.notes-view .empty-text,
.notes-view .modal-head p,
.notes-view .modal-form span,
.notes-view .confirm-copy p {
  color: var(--color-text-secondary);
}

.notes-view .column-title h3,
.notes-view .note-title,
.notes-view .empty-title,
.notes-view .modal-head h2 {
  color: var(--color-text);
}

.notes-view .add-note-btn,
.notes-view .action-btn,
.notes-view .ghost-btn,
.notes-view .primary-btn,
.notes-view .danger-btn,
.notes-view .modal-close {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
  backdrop-filter: blur(18px);
}

.notes-view .kanban-column {
  border-radius: 24px;
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.88)),
    var(--color-surface);
}

.notes-view .column-header {
  border-bottom-color: var(--color-border);
}

.notes-view .column-count,
.notes-view .note-status {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text-secondary);
}

.notes-view .note-card:hover {
  border-color: rgba(200, 75, 17, 0.22);
  box-shadow: 0 16px 36px rgba(19, 18, 17, 0.08);
}

.notes-view .note-card {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.88)),
    var(--color-surface);
  box-shadow: none;
}

.notes-view .note-due-date,
.notes-view .note-tag,
.notes-view .note-tag-more {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text-secondary);
}

.notes-view .empty-state {
  border-style: dashed;
  border-color: rgba(200, 75, 17, 0.22);
}

.notes-view .empty-illustration {
  color: rgba(200, 75, 17, 0.22);
}

.notes-view .modal-overlay {
  background: rgba(19, 18, 17, 0.16);
  backdrop-filter: blur(22px);
}

.notes-view .modal-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.9)),
    var(--color-surface);
  border-color: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-overlay);
}

.notes-view .modal-form input,
.notes-view .modal-form textarea,
.notes-view .modal-form select {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text);
}

.notes-view .modal-form input::placeholder,
.notes-view .modal-form textarea::placeholder {
  color: var(--color-text-tertiary);
}

.notes-view .primary-btn {
  background: rgba(19, 18, 17, 0.94);
  border-color: rgba(19, 18, 17, 0.08);
  color: var(--color-text-inverse);
}

.notes-view .danger-btn {
  background: rgba(192, 57, 43, 0.08);
  border-color: rgba(192, 57, 43, 0.18);
  color: var(--color-danger);
}

.notes-view .kanban-container,
.notes-view .notes-container {
  background: transparent;
}

.notes-view .empty-column {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.82);
  color: var(--color-text-secondary);
}

.notes-view .note-category,
.notes-view .note-status,
.notes-view .column-count {
  border: 1px solid rgba(19, 18, 17, 0.06);
}

.notes-view .note-category.task {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.notes-view .note-category.idea {
  background: rgba(184, 105, 26, 0.12);
  color: var(--color-warning);
}

.notes-view .note-category.reference {
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
}

.notes-view .note-category.reminder {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-success);
}
</style>
