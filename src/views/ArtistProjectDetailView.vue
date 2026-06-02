<template>
  <div class="artist-project-detail-view">
    <header class="detail-header">
      <button class="back-btn" @click="goBackToProjects()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Back to Projects</span>
      </button>

      <template v-if="project">
        <div class="hero-grid">
          <section class="hero-card hero-primary">
            <p class="breadcrumb">
              {{ artist?.name || fallbackArtistName }} / Projects / {{ project.category }}
            </p>
            <div class="hero-title-row">
              <div>
                <h1>{{ project.name }}</h1>
                <p class="hero-description">{{ project.description }}</p>
              </div>
              <div class="hero-badges">
                <span class="project-status" :class="project.status">{{
                  formatProjectStatus(project.status)
                }}</span>
                <span class="project-priority" :class="project.priority">{{
                  project.priority
                }}</span>
                <span class="health-badge" :class="project.health">{{
                  formatHealth(project.health)
                }}</span>
              </div>
            </div>

            <div class="hero-progress-block">
              <div class="hero-progress-head">
                <span>Execution progress</span>
                <strong>{{ project.progress }}%</strong>
              </div>
              <div class="hero-progress-bar">
                <div class="hero-progress-fill" :style="{ width: `${project.progress}%` }"></div>
              </div>
              <div class="hero-progress-meta">
                <span>{{ project.tasks.completed }}/{{ project.tasks.total }} tasks closed</span>
                <span>{{ remainingMilestones }} milestones remaining</span>
              </div>
            </div>

            <div class="hero-metrics">
              <article class="hero-metric">
                <span>Due Date</span>
                <strong>{{ formatDate(project.deadline) }}</strong>
                <small>{{ dueDateLabel }}</small>
              </article>
              <article class="hero-metric">
                <span>Launch Window</span>
                <strong>{{ project.launchWindow }}</strong>
                <small>Current release target</small>
              </article>
              <article class="hero-metric">
                <span>Owner</span>
                <strong>{{ project.owner }}</strong>
                <small>Primary decision maker</small>
              </article>
              <article class="hero-metric">
                <span>Budget</span>
                <strong>{{ project.budget }}</strong>
                <small>Working allocation</small>
              </article>
            </div>
          </section>

          <aside class="hero-card hero-side">
            <div class="side-card-head">
              <h2>Command Deck</h2>
              <p>Fast project actions without going back to the board.</p>
            </div>

            <div class="stage-actions">
              <button
                v-for="option in statusOptions"
                :key="option.value"
                class="stage-btn"
                :class="{ active: project.status === option.value }"
                @click="setProjectStatus(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <div class="command-actions">
              <button
                class="action-btn primary"
                @click="saveProjectDetails"
                :disabled="!hasDraftChanges"
              >
                Save Changes
              </button>
              <button class="action-btn" @click="resetDraft" :disabled="!hasDraftChanges">
                Reset
              </button>
              <button class="action-btn" @click="goBackToProjects('list')">
                View All Projects
              </button>
              <button class="action-btn" @click="copyProjectLink">Copy Project Link</button>
              <button class="action-btn" @click="openLinkedRoute('/files')">Open Files</button>
              <button
                class="action-btn"
                @click="markProjectReleased"
                :disabled="project.status === 'completed'"
              >
                Mark Released
              </button>
            </div>
          </aside>
        </div>
      </template>
    </header>

    <section v-if="project" class="detail-content">
      <div class="detail-shell">
        <div class="detail-main-column">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Project Details</h2>
                <p>Edit the core operating fields for this project.</p>
              </div>
              <span class="panel-badge" :class="{ dirty: hasDraftChanges }">{{
                hasDraftChanges ? "Unsaved changes" : "Saved"
              }}</span>
            </div>

            <div class="detail-form-grid">
              <label class="field">
                <span>Project Name</span>
                <input v-model="projectDraft.name" type="text" />
              </label>

              <label class="field">
                <span>Owner</span>
                <input v-model="projectDraft.owner" type="text" />
              </label>

              <label class="field">
                <span>Status</span>
                <select v-model="projectDraft.status">
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span>Priority</span>
                <select v-model="projectDraft.priority">
                  <option
                    v-for="option in priorityOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span>Health</span>
                <select v-model="projectDraft.health">
                  <option v-for="option in healthOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <label class="field">
                <span>Due Date</span>
                <input v-model="projectDraft.deadline" type="date" />
              </label>

              <label class="field">
                <span>Launch Window</span>
                <input v-model="projectDraft.launchWindow" type="text" placeholder="Late March" />
              </label>

              <label class="field">
                <span>Budget</span>
                <input v-model="projectDraft.budget" type="text" placeholder="$25,000" />
              </label>

              <label class="field full-width">
                <span>Description</span>
                <textarea v-model="projectDraft.description" rows="3"></textarea>
              </label>

              <label class="field full-width">
                <span>Project Brief</span>
                <textarea v-model="projectDraft.brief" rows="4"></textarea>
              </label>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Milestones</h2>
                <p>Track and update the sequence of approvals and deliverables.</p>
              </div>
              <span class="panel-stat"
                >{{ completedMilestones }}/{{ project.milestones.length }} complete</span
              >
            </div>

            <form class="inline-form" @submit.prevent="createMilestone">
              <input
                v-model="newMilestone.title"
                type="text"
                placeholder="Add milestone title"
                required
              />
              <input v-model="newMilestone.due_date" type="date" required />
              <input v-model="newMilestone.owner" type="text" placeholder="Owner" />
              <button class="action-btn primary" type="submit">Add Milestone</button>
            </form>

            <div class="milestone-list">
              <article
                v-for="milestone in sortedMilestones"
                :key="`detail-${project.id}-${milestone.id}`"
                class="milestone-row"
                :class="{ done: milestone.done }"
              >
                <button class="milestone-toggle" @click="toggleMilestone(milestone.id)">
                  <span class="milestone-check">{{ milestone.done ? "✓" : "" }}</span>
                </button>
                <div class="milestone-copy">
                  <strong>{{ milestone.title }}</strong>
                  <span>{{ milestone.owner || "Unassigned" }}</span>
                </div>
                <div class="milestone-meta">
                  <span>{{ formatDate(milestone.due_date) }}</span>
                  <small>{{
                    milestone.done ? "Complete" : milestoneTimingLabel(milestone.due_date)
                  }}</small>
                </div>
                <button
                  class="icon-btn small"
                  @click="removeMilestone(milestone.id)"
                  aria-label="Delete milestone"
                >
                  ×
                </button>
              </article>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>Recent Activity</h2>
                <p>Project-specific actions and updates.</p>
              </div>
              <span class="panel-stat">{{ project.activity.length }} updates</span>
            </div>

            <div class="activity-list">
              <article v-for="entry in activityFeed" :key="entry.id" class="activity-row">
                <span class="activity-dot"></span>
                <div class="activity-copy">
                  <strong>{{ entry.title }}</strong>
                  <p>{{ entry.detail }}</p>
                </div>
                <time>{{ formatRelativeTime(entry.timestamp) }}</time>
              </article>
            </div>
          </section>
        </div>

        <div class="detail-side-column">
          <section class="panel compact-panel">
            <div class="panel-header">
              <div>
                <h2>Snapshot</h2>
                <p>What needs attention right now.</p>
              </div>
            </div>

            <div class="snapshot-grid">
              <article class="snapshot-card">
                <span>Next milestone</span>
                <strong>{{ project.nextMilestone }}</strong>
                <small>{{ nextMilestoneDateLabel }}</small>
              </article>
              <article class="snapshot-card">
                <span>Overdue</span>
                <strong>{{ overdueMilestoneCount }}</strong>
                <small>milestones need follow up</small>
              </article>
              <article class="snapshot-card">
                <span>Last updated</span>
                <strong>{{ formatDate(project.updated_at) }}</strong>
                <small>{{ formatRelativeTime(project.updated_at) }}</small>
              </article>
              <article class="snapshot-card">
                <span>Category</span>
                <strong>{{ project.category }}</strong>
                <small>{{ formatHealth(project.health) }}</small>
              </article>
            </div>
          </section>

          <section class="panel compact-panel">
            <div class="panel-header">
              <div>
                <h2>Linked Workstreams</h2>
                <p>Jump into the connected workspace areas.</p>
              </div>
            </div>

            <div class="workstream-list">
              <button
                v-for="link in project.links"
                :key="link.id"
                class="workstream-card"
                @click="openWorkspaceLink(link)"
              >
                <div>
                  <strong>{{ link.label }}</strong>
                  <p>{{ link.description }}</p>
                </div>
                <span>{{ link.cta }}</span>
              </button>
            </div>
          </section>

          <section class="panel compact-panel">
            <div class="panel-header">
              <div>
                <h2>Team</h2>
                <p>People currently attached to this project.</p>
              </div>
              <span class="panel-stat">{{ project.collaborators.length }}</span>
            </div>

            <div class="collaborator-list">
              <article
                v-for="person in project.collaborators"
                :key="person.id"
                class="collaborator-row"
              >
                <div class="collaborator-avatar">{{ initials(person.name) }}</div>
                <div>
                  <strong>{{ person.name }}</strong>
                  <p>{{ person.role }}</p>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </section>

    <section v-else class="missing-state">
      <h2>This project no longer exists</h2>
      <p>It may have been removed or moved to another artist workspace.</p>
      <button class="action-btn" @click="goBackToProjects()">Return to Artist Projects</button>
    </section>
    <teleport to="body">
      <transition name="fade">
        <div
          v-if="deleteMilestoneModalOpen"
          class="modal-overlay"
          @click.self="closeDeleteMilestoneModal"
        >
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>Delete Milestone</h2>
                <p>Remove this milestone from the project sequence.</p>
              </div>
              <button class="icon-btn small" @click="closeDeleteMilestoneModal">×</button>
            </div>

            <div class="confirm-copy">
              <strong>{{ pendingDeleteMilestone?.title }}</strong>
              <p>
                {{ pendingDeleteMilestone?.owner || "Unassigned" }} ·
                {{ pendingDeleteMilestone ? formatDate(pendingDeleteMilestone.due_date) : "" }}
              </p>
            </div>

            <div class="modal-actions">
              <button class="action-btn" @click="closeDeleteMilestoneModal">Cancel</button>
              <button class="action-btn danger-fill" @click="confirmDeleteMilestone">
                Delete Milestone
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { computed, inject, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDashboardStore } from "@/stores/dashboard";
import { useArtistProjectsStore } from "@/stores/artistProjects";

const route = useRoute();
const router = useRouter();
const dashboardStore = useDashboardStore();
const projectsStore = useArtistProjectsStore();
const showToast = inject("showToast", () => {});

const slug = computed(() => String(route.params.slug || ""));
const projectId = computed(() => String(route.params.projectId || ""));

const statusOptions = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Released" },
];

const priorityOptions = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const healthOptions = [
  { value: "on-track", label: "On Track" },
  { value: "watch", label: "Watch" },
  { value: "at-risk", label: "At Risk" },
  { value: "ready", label: "Ready" },
];

const fallbackArtistName = computed(
  () =>
    slug.value
      .split("-")
      .filter(Boolean)
      .map((chunk) => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
      .join(" ") || "Artist",
);

const artist = computed(
  () => dashboardStore.artists.find((entry) => entry.slug === slug.value) || null,
);

watch(
  [slug, artist],
  ([artistSlug, artistEntry]) => {
    if (!artistSlug) return;
    projectsStore.ensureArtistSeed(artistSlug, artistEntry?.name || fallbackArtistName.value);
  },
  { immediate: true },
);

const project = computed(() => projectsStore.getProject(slug.value, projectId.value));

const projectDraft = reactive({
  name: "",
  owner: "",
  status: "planning",
  priority: "medium",
  health: "on-track",
  deadline: "",
  launchWindow: "",
  budget: "",
  description: "",
  brief: "",
});

const newMilestone = reactive({
  title: "",
  due_date: "",
  owner: "",
});
const deleteMilestoneModalOpen = ref(false);
const pendingDeleteMilestone = ref(null);

const snapshotDraft = () => JSON.stringify(projectDraft);
const savedDraft = computed(() =>
  JSON.stringify({
    name: project.value?.name || "",
    owner: project.value?.owner || "",
    status: project.value?.status || "planning",
    priority: project.value?.priority || "medium",
    health: project.value?.health || "on-track",
    deadline: toDateInputValue(project.value?.deadline),
    launchWindow: project.value?.launchWindow || "",
    budget: project.value?.budget || "",
    description: project.value?.description || "",
    brief: project.value?.brief || "",
  }),
);

const hasDraftChanges = computed(() => snapshotDraft() !== savedDraft.value);

const completedMilestones = computed(
  () => project.value?.milestones?.filter((milestone) => milestone.done).length || 0,
);

const remainingMilestones = computed(() =>
  Math.max((project.value?.milestones?.length || 0) - completedMilestones.value, 0),
);

const sortedMilestones = computed(() =>
  [...(project.value?.milestones || [])].sort(
    (a, b) => new Date(a.due_date) - new Date(b.due_date),
  ),
);

const activityFeed = computed(() =>
  [...(project.value?.activity || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  ),
);

const nextOpenMilestone = computed(
  () => sortedMilestones.value.find((milestone) => !milestone.done) || null,
);

const overdueMilestoneCount = computed(() => {
  const now = Date.now();
  return (project.value?.milestones || []).filter(
    (milestone) => !milestone.done && new Date(milestone.due_date).getTime() < now,
  ).length;
});

const dueDateLabel = computed(() => {
  if (!project.value?.deadline) return "No deadline set";
  const diffDays = Math.ceil(
    (new Date(project.value.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `${diffDays} days remaining`;
});

const nextMilestoneDateLabel = computed(() => {
  if (!nextOpenMilestone.value) return "All milestones complete";
  return `${formatDate(nextOpenMilestone.value.due_date)} · ${milestoneTimingLabel(nextOpenMilestone.value.due_date)}`;
});

const syncDraft = () => {
  projectDraft.name = project.value?.name || "";
  projectDraft.owner = project.value?.owner || "";
  projectDraft.status = project.value?.status || "planning";
  projectDraft.priority = project.value?.priority || "medium";
  projectDraft.health = project.value?.health || "on-track";
  projectDraft.deadline = toDateInputValue(project.value?.deadline);
  projectDraft.launchWindow = project.value?.launchWindow || "";
  projectDraft.budget = project.value?.budget || "";
  projectDraft.description = project.value?.description || "";
  projectDraft.brief = project.value?.brief || "";
};

watch(project, syncDraft, { immediate: true });
watch(
  () => project.value?.owner,
  (owner) => {
    if (!newMilestone.owner && owner) {
      newMilestone.owner = owner;
    }
  },
  { immediate: true },
);

function toDateInputValue(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

const formatProjectStatus = (status) =>
  statusOptions.find((option) => option.value === status)?.label || status;
const formatHealth = (health) =>
  healthOptions.find((option) => option.value === health)?.label || health;
const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatRelativeTime = (value) => {
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(ms / (60 * 1000)));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
};

const milestoneTimingLabel = (value) => {
  const diffDays = Math.ceil((new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays}d`;
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "P";

const goBackToProjects = (layout = "board") => {
  router.push({
    path: "/projects",
    query: {
      artist: slug.value,
      layout,
      project: projectId.value,
    },
  });
};

const saveProjectDetails = () => {
  if (!project.value) return;

  const updatedProject = projectsStore.updateProject(slug.value, projectId.value, {
    name: projectDraft.name.trim() || project.value.name,
    owner: projectDraft.owner.trim() || project.value.owner,
    status: projectDraft.status,
    priority: projectDraft.priority,
    health: projectDraft.health,
    deadline: projectDraft.deadline
      ? new Date(`${projectDraft.deadline}T12:00:00`).toISOString()
      : project.value.deadline,
    launchWindow: projectDraft.launchWindow.trim() || "TBD",
    budget: projectDraft.budget.trim() || "$0",
    description: projectDraft.description.trim() || project.value.description,
    brief: projectDraft.brief.trim() || project.value.brief,
  });

  if (!updatedProject) return;

  projectsStore.addActivity(slug.value, projectId.value, {
    title: "Project details updated",
    detail: "Core metadata, scheduling, or ownership fields were changed.",
  });
  syncDraft();
  showToast({ message: `Saved ${updatedProject.name}`, type: "success" });
};

const resetDraft = () => {
  syncDraft();
};

const setProjectStatus = (status) => {
  if (!project.value || project.value.status === status) return;
  projectsStore.updateProject(slug.value, projectId.value, { status });
  projectsStore.addActivity(slug.value, projectId.value, {
    title: "Stage updated",
    detail: `Project moved to ${formatProjectStatus(status)}.`,
  });
  syncDraft();
  showToast({ message: `Moved to ${formatProjectStatus(status)}`, type: "success" });
};

const createMilestone = () => {
  if (!newMilestone.title.trim() || !newMilestone.due_date) return;

  projectsStore.addMilestone(slug.value, projectId.value, {
    title: newMilestone.title.trim(),
    due_date: new Date(`${newMilestone.due_date}T12:00:00`).toISOString(),
    owner: newMilestone.owner.trim() || project.value?.owner || "Unassigned",
  });

  newMilestone.title = "";
  newMilestone.due_date = "";
  newMilestone.owner = project.value?.owner || "";
  showToast({ message: "Milestone added", type: "success" });
};

const toggleMilestone = (milestoneId) => {
  const updatedProject = projectsStore.toggleMilestone(slug.value, projectId.value, milestoneId);
  if (!updatedProject) return;

  showToast({ message: `Updated ${updatedProject.name}`, type: "success" });
};

const removeMilestone = (milestoneId) => {
  const target = project.value?.milestones.find((milestone) => milestone.id === milestoneId);
  if (!target) return;

  pendingDeleteMilestone.value = target;
  deleteMilestoneModalOpen.value = true;
};

const closeDeleteMilestoneModal = () => {
  deleteMilestoneModalOpen.value = false;
  pendingDeleteMilestone.value = null;
};

const confirmDeleteMilestone = () => {
  if (!pendingDeleteMilestone.value) return;

  projectsStore.deleteMilestone(slug.value, projectId.value, pendingDeleteMilestone.value.id);
  showToast({ message: "Milestone removed", type: "success" });
  closeDeleteMilestoneModal();
};

const openLinkedRoute = (path) => {
  router.push(path);
};

const openWorkspaceLink = async (link) => {
  if (!link) return;
  if (link.type === "self") {
    await copyProjectLink();
    return;
  }

  router.push(link.route);
};

const copyProjectLink = async () => {
  const href = window.location.href;
  try {
    await navigator.clipboard.writeText(href);
    showToast({ message: "Project link copied", type: "success" });
  } catch {
    showToast({ message: href, type: "info" });
  }
};

const markProjectReleased = () => {
  if (!project.value) return;

  const totalTasks = project.value.tasks.total || Math.max(project.value.milestones.length, 1);
  projectsStore.updateProject(slug.value, projectId.value, {
    status: "completed",
    health: "ready",
    tasks: {
      completed: totalTasks,
      total: totalTasks,
    },
  });
  projectsStore.addActivity(slug.value, projectId.value, {
    title: "Project marked released",
    detail: `${project.value.name} was marked complete from the project page.`,
  });
  syncDraft();
  showToast({ message: "Project marked released", type: "success" });
};
</script>

<style scoped>
.artist-project-detail-view {
  min-height: 100vh;
  color: #fff;
  background:
    radial-gradient(circle at top right, rgba(19, 78, 74, 0.22), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)), #000;
  padding: var(--space-9) var(--page-gutter) 120px;
}

.detail-header {
  display: grid;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.back-btn,
.action-btn,
.stage-btn,
.workstream-card,
.milestone-toggle,
.icon-btn,
.field input,
.field textarea,
.field select,
.inline-form input {
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.back-btn {
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-pill);
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 550;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.back-btn svg {
  width: 14px;
  height: 14px;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.72fr);
  gap: var(--space-4);
}

.hero-card,
.panel {
  border: 1px solid rgba(255, 255, 255, 0.09);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-2);
}

.hero-card {
  padding: var(--space-6);
}

.hero-primary {
  display: grid;
  gap: var(--space-5);
}

.breadcrumb {
  margin: 0;
  color: rgba(255, 255, 255, 0.52);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.hero-title-row h1 {
  margin: 0;
  font-size: 40px;
  line-height: 0.96;
  font-weight: 330;
  letter-spacing: -0.035em;
}

.hero-description {
  margin: 14px 0 0;
  max-width: 760px;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.68);
}

.hero-badges {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.project-status,
.project-priority,
.health-badge,
.panel-badge,
.panel-stat {
  border-radius: var(--radius-pill);
  padding: 7px 11px;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
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

.project-priority.high {
  background: rgba(239, 68, 68, 0.16);
  color: rgba(185, 28, 28, 0.92);
}

.project-priority.medium {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.project-priority.low {
  background: var(--color-info-subtle);
  color: var(--color-info);
}

.health-badge.on-track {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.health-badge.watch {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.health-badge.at-risk {
  background: rgba(248, 113, 113, 0.16);
  color: rgba(185, 28, 28, 0.92);
}

.health-badge.ready {
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.hero-progress-block {
  border-radius: var(--radius-card);
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.025);
  padding: var(--space-4) var(--space-5);
  display: grid;
  gap: var(--space-2);
}

.hero-progress-head,
.hero-progress-meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: center;
}

.hero-progress-head span,
.hero-progress-meta span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 13px;
}

.hero-progress-head strong {
  font-size: 26px;
  letter-spacing: -0.03em;
}

.hero-progress-bar {
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.hero-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(232, 90, 25, 0.88), rgba(17, 16, 15, 0.74));
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.hero-metric,
.snapshot-card {
  border-radius: var(--radius-card);
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.025);
  padding: var(--space-3) var(--space-4);
  display: grid;
  gap: var(--space-1);
}

.hero-metric span,
.snapshot-card span {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.46);
}

.hero-metric strong,
.snapshot-card strong {
  font-size: 22px;
  font-weight: 560;
  letter-spacing: -0.03em;
}

.hero-metric small,
.snapshot-card small {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.hero-side {
  display: grid;
  align-content: start;
  gap: var(--space-5);
}

.side-card-head h2,
.panel h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 560;
}

.side-card-head p,
.panel-header p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  line-height: 1.5;
}

.stage-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.stage-btn,
.action-btn,
.workstream-card,
.icon-btn {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.88);
  border-radius: var(--radius-control);
  min-height: var(--control-md);
  cursor: pointer;
}

.stage-btn {
  padding: 0 var(--space-3);
  font-size: 12px;
  font-weight: 550;
}

.stage-btn.active,
.stage-btn:hover {
  border-color: rgba(232, 90, 25, 0.24);
  background: rgba(232, 90, 25, 0.08);
}

.command-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.action-btn {
  padding: 0 var(--control-px);
  font-size: 12px;
  font-weight: 550;
}

.action-btn.primary {
  background: linear-gradient(180deg, rgba(232, 90, 25, 0.18), rgba(232, 90, 25, 0.08));
  border-color: rgba(232, 90, 25, 0.28);
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-btn:not(:disabled):hover,
.workstream-card:hover,
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3200;
  background: rgba(0, 0, 0, 0.76);
  backdrop-filter: blur(14px);
  display: grid;
  place-items: center;
  padding: var(--space-6);
}

.modal-card {
  width: min(480px, 100%);
  border-radius: var(--radius-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02));
  box-shadow: var(--shadow-overlay);
  padding: var(--space-6);
  display: grid;
  gap: var(--space-5);
}

.modal-head,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.modal-head {
  align-items: flex-start;
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

.confirm-copy {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-card);
  border: 1px solid rgba(239, 68, 68, 0.18);
  background: rgba(239, 68, 68, 0.08);
}

.confirm-copy strong {
  display: block;
  font-size: 18px;
}

.confirm-copy p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.62);
}

.danger-fill {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
}

.detail-content {
  display: grid;
}

.detail-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.9fr);
  gap: var(--space-4);
}

.detail-main-column,
.detail-side-column {
  display: grid;
  align-content: start;
  gap: var(--space-4);
}

.panel {
  padding: var(--space-5);
  gap: var(--space-4);
  display: grid;
}

.compact-panel {
  gap: var(--space-3);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: flex-start;
}

.panel-badge,
.panel-stat {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.panel-badge.dirty {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.detail-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.field {
  display: grid;
  gap: var(--space-2);
}

.field.full-width {
  grid-column: 1 / -1;
}

.field span {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.64);
}

.field input,
.field textarea,
.field select,
.inline-form input {
  width: 100%;
  border-radius: var(--radius-control);
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
  padding: var(--space-3) var(--control-px);
  font: inherit;
}

.field textarea {
  resize: vertical;
  min-height: 96px;
}

.field input:focus,
.field textarea:focus,
.field select:focus,
.inline-form input:focus {
  outline: none;
  border-color: rgba(232, 90, 25, 0.36);
  box-shadow: 0 0 0 1px rgba(232, 90, 25, 0.18);
}

.inline-form {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(160px, 0.9fr) minmax(140px, 0.9fr) auto;
  gap: var(--space-2);
}

.milestone-list,
.activity-list,
.workstream-list,
.collaborator-list {
  display: grid;
  gap: var(--space-2);
}

.milestone-row,
.activity-row,
.collaborator-row {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-card);
  background: rgba(255, 255, 255, 0.025);
}

.milestone-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
}

.milestone-row.done {
  border-color: rgba(19, 18, 17, 0.12);
  background: var(--color-success-subtle);
}

.milestone-toggle {
  border-radius: var(--radius-pill);
  width: var(--control-sm);
  min-width: var(--control-sm);
  height: var(--control-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.milestone-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.milestone-row.done .milestone-check {
  border-color: rgba(19, 18, 17, 0.18);
  color: var(--color-success);
}

.milestone-copy {
  display: grid;
  gap: 3px;
}

.milestone-copy strong,
.activity-copy strong,
.collaborator-row strong,
.workstream-card strong {
  font-size: 14px;
  font-weight: 600;
}

.milestone-copy span,
.collaborator-row p,
.workstream-card p,
.activity-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
  line-height: 1.45;
}

.milestone-meta {
  display: grid;
  gap: 2px;
  justify-items: end;
}

.milestone-meta span {
  font-size: 13px;
  font-weight: 550;
}

.milestone-meta small {
  color: rgba(255, 255, 255, 0.56);
  font-size: 11px;
}

.icon-btn {
  width: var(--control-sm);
  min-width: var(--control-sm);
  height: var(--control-sm);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}

.icon-btn.small {
  border-radius: var(--radius-control);
}

.activity-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-3);
  padding: var(--space-3) var(--control-px);
  align-items: start;
}

.activity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  background: linear-gradient(135deg, var(--color-danger), var(--color-accent));
}

.activity-row time {
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
  white-space: nowrap;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.workstream-card {
  padding: var(--space-3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  text-align: left;
}

.workstream-card span {
  color: #99f6e4;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.collaborator-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
}

.collaborator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(19, 18, 17, 0.1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(194, 189, 181, 0.88));
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.missing-state {
  margin-top: var(--space-4);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-card);
  padding: var(--space-6);
  max-width: 600px;
  display: grid;
  gap: var(--space-2);
}

.missing-state h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 420;
}

.missing-state p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

@media (max-width: 1180px) {
  .artist-project-detail-view {
    padding: var(--space-6) var(--space-6) 110px;
  }

  .hero-grid,
  .detail-shell {
    grid-template-columns: 1fr;
  }

  .hero-metrics,
  .snapshot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .artist-project-detail-view {
    padding: var(--space-5) var(--space-4) 110px;
  }

  .hero-title-row,
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title-row h1 {
    font-size: 31px;
  }

  .hero-badges,
  .command-actions,
  .stage-actions,
  .detail-form-grid,
  .hero-metrics,
  .snapshot-grid,
  .inline-form {
    grid-template-columns: 1fr;
  }

  .milestone-row,
  .activity-row {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .milestone-meta,
  .activity-row time,
  .icon-btn.small {
    grid-column: 2;
    justify-self: start;
  }
}

/* Theme correction */
.artist-project-detail-view {
  background: transparent;
  color: var(--color-text);
}

.artist-project-detail-view :is(.detail-header, .hero-card, .panel, .missing-state) {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  color: var(--color-text);
}

.artist-project-detail-view :is(.detail-header, .hero-card, .panel) {
  box-shadow: var(--shadow-1);
}

.artist-project-detail-view :is(.snapshot-card, .workstream-card, .milestone-row, .activity-row) {
  border-color: rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text);
  box-shadow: none;
}

.artist-project-detail-view .modal-card {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-overlay);
}

.artist-project-detail-view
  :is(
    .back-btn,
    .stage-btn,
    .action-btn,
    .icon-btn,
    .field input,
    .field textarea,
    .field select,
    .inline-form input
  ) {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  box-shadow: none;
}

.artist-project-detail-view .action-btn.primary {
  border-color: rgba(200, 75, 17, 0.2);
  background:
    linear-gradient(180deg, rgba(200, 75, 17, 0.15), rgba(200, 75, 17, 0.08)),
    rgba(255, 255, 255, 0.9);
  color: var(--color-accent);
}

.artist-project-detail-view .stage-btn.active,
.artist-project-detail-view .stage-btn:hover,
.artist-project-detail-view .workstream-card:hover,
.artist-project-detail-view .icon-btn:hover {
  border-color: rgba(200, 75, 17, 0.22);
  background: rgba(200, 75, 17, 0.08);
}

.artist-project-detail-view .danger-fill {
  border-color: rgba(192, 57, 43, 0.18);
  background: rgba(192, 57, 43, 0.08);
  color: var(--color-danger);
}

.artist-project-detail-view
  :is(
    .breadcrumb,
    .hero-description,
    .hero-progress-head span,
    .hero-progress-meta span,
    .hero-metric span,
    .hero-metric small,
    .side-card-head p,
    .panel-header p,
    .panel-stat,
    .field span,
    .milestone-copy p,
    .activity-copy p,
    .activity-row time,
    .snapshot-card span,
    .snapshot-card small,
    .collaborator-row span,
    .missing-state p,
    .modal-head p,
    .confirm-copy p
  ) {
  color: var(--color-text-secondary);
}

.artist-project-detail-view
  :is(
    .hero-title-row h1,
    .hero-progress-head strong,
    .hero-metric strong,
    .side-card-head h2,
    .panel h2,
    .panel-badge,
    .milestone-copy strong,
    .activity-copy strong,
    .snapshot-card strong,
    .workstream-card strong,
    .collaborator-row strong,
    .missing-state h2,
    .modal-head h2,
    .confirm-copy strong
  ) {
  color: var(--color-text);
}

.artist-project-detail-view .field input::placeholder,
.artist-project-detail-view .field textarea::placeholder,
.artist-project-detail-view .inline-form input::placeholder {
  color: var(--color-text-tertiary);
}

.artist-project-detail-view .hero-progress-bar {
  background: rgba(19, 18, 17, 0.08);
}

.artist-project-detail-view .hero-progress-fill {
  background: linear-gradient(90deg, rgba(200, 75, 17, 0.82), rgba(19, 18, 17, 0.76));
}

.artist-project-detail-view .hero-metric,
.artist-project-detail-view .snapshot-card {
  border-color: rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.76);
}

.artist-project-detail-view .milestone-toggle {
  border-color: rgba(19, 18, 17, 0.1);
  background: rgba(255, 255, 255, 0.82);
}

.artist-project-detail-view .modal-overlay {
  background: rgba(19, 18, 17, 0.18);
  backdrop-filter: blur(14px);
}

.artist-project-detail-view .missing-state {
  border-style: solid;
}
</style>
