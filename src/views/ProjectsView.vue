<template>
  <WorkspacePage
    class="projects-view"
    eyebrow="Execution Workspace"
    title="Projects"
    :count="filteredProjects.length"
    subtitle="Operational board for active execution, deadlines, and cross-functional delivery."
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="openCreateProjectModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>New Project</span>
      </button>
      <button class="workspace-header-secondary-btn" @click="router.push('/timeline')">
        Open Timeline
      </button>
    </template>

    <template #stats>
      <article class="stat-card">
        <span>Active Projects</span>
        <strong>{{ activeProjectCount }}</strong>
      </article>
      <article class="stat-card">
        <span>Due Soon</span>
        <strong>{{ dueSoonCount }}</strong>
      </article>
      <article class="stat-card">
        <span>Scope</span>
        <strong>{{ scopeLabel }}</strong>
      </article>
    </template>

    <template #toolbar>
      <div class="search-container">
        <label class="search-wrapper search-field">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="projectSearch"
            class="search-input"
            type="text"
            placeholder="Search projects, owners, and milestones..."
          />
        </label>
      </div>

      <div class="toolbar-group">
        <label class="scope-select">
          <span>Scope</span>
          <select v-model="scopeFilter">
            <option value="">All Artists</option>
            <option v-for="artist in artists" :key="artist.slug" :value="artist.slug">
              {{ artist.name }}
            </option>
          </select>
        </label>

        <div class="layout-toggle segmented-control">
          <button
            :class="{ active: projectLayout === 'board' }"
            @click="setProjectLayout('board')"
          >
            Board
          </button>
          <button
            :class="{ active: projectLayout === 'list' }"
            @click="setProjectLayout('list')"
          >
            List
          </button>
        </div>
      </div>
    </template>

    <section class="projects-layout">
      <section class="workspace-panel projects-board" @contextmenu.prevent="openProjectsWorkspaceMenu">
        <div class="panel-head">
          <div>
            <h2>Project Pipeline</h2>
            <p>Structured by stage so the board reads like the rest of the app instead of a separate product.</p>
          </div>

          <div class="filter-group toolbar-group stage-filter-group">
            <button
              v-for="option in projectStatusOptions"
              :key="option.value"
              class="stage-chip"
              :class="{ active: projectStatusFilter === option.value }"
              @click="projectStatusFilter = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div v-if="projectLayout === 'board'" class="pipeline-grid">
          <article v-for="stage in projectPipeline" :key="stage.id" class="pipeline-column">
            <header class="pipeline-header">
              <div>
                <h3>{{ stage.label }}</h3>
                <p>{{ stage.description }}</p>
              </div>
              <span>{{ stage.projects.length }}</span>
            </header>

            <div class="pipeline-list">
              <div v-if="stage.projects.length === 0" class="pipeline-empty">No projects in this stage</div>
              <button
                v-for="project in stage.projects"
                :key="projectKey(project)"
                class="pipeline-card"
                :class="{ selected: selectedProjectKey === projectKey(project) }"
                @click="selectProject(project)"
                @dblclick="openProjectPage(project)"
                @contextmenu.prevent.stop="openProjectContextMenu($event, project)"
              >
                <div class="pipeline-card-head">
                  <div>
                    <p class="pipeline-card-artist">{{ project.artistName }}</p>
                    <h4>{{ project.name }}</h4>
                  </div>
                  <span class="project-priority" :class="project.priority">{{ project.priority }}</span>
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
        </div>

        <div v-else class="projects-list-view">
          <div v-if="filteredProjects.length > 0" class="projects-list-table">
            <button
              v-for="project in filteredProjects"
              :key="projectKey(project)"
              class="project-list-row"
              :class="{ selected: selectedProjectKey === projectKey(project) }"
              @click="selectProject(project)"
              @dblclick="openProjectPage(project)"
              @contextmenu.prevent.stop="openProjectContextMenu($event, project)"
            >
              <div class="project-list-main">
                <p class="project-list-artist">{{ project.artistName }}</p>
                <h4>{{ project.name }}</h4>
                <p>{{ project.description }}</p>
              </div>
              <div class="project-list-owner">{{ project.owner }}</div>
              <div class="project-list-status">
                <span class="project-status" :class="project.status">{{ formatProjectStatus(project.status) }}</span>
                <span class="project-priority" :class="project.priority">{{ project.priority }}</span>
              </div>
              <div class="project-list-progress">
                <strong>{{ project.progress }}%</strong>
                <small>{{ project.tasks.completed }}/{{ project.tasks.total }} tasks</small>
              </div>
              <div class="project-list-due">Due {{ formatDate(project.deadline) }}</div>
            </button>
          </div>
          <div v-else class="projects-empty">No projects match the current filters.</div>
        </div>
      </section>

      <aside class="detail-column">
        <section v-if="selectedProject" class="workspace-panel detail-panel">
          <div class="panel-head">
            <div>
              <h2>{{ selectedProject.name }}</h2>
              <p>{{ selectedProject.artistName }} · {{ selectedProject.category }}</p>
            </div>
            <span class="project-status" :class="selectedProject.status">
              {{ formatProjectStatus(selectedProject.status) }}
            </span>
          </div>

          <div class="detail-grid">
            <article class="detail-card">
              <span>Owner</span>
              <strong>{{ selectedProject.owner }}</strong>
            </article>
            <article class="detail-card">
              <span>Due Date</span>
              <strong>{{ formatDate(selectedProject.deadline) }}</strong>
            </article>
            <article class="detail-card">
              <span>Priority</span>
              <strong>{{ selectedProject.priority }}</strong>
            </article>
            <article class="detail-card">
              <span>Progress</span>
              <strong>{{ selectedProject.progress }}%</strong>
            </article>
          </div>

          <section class="detail-section">
            <div class="subsection-head">
              <h3>Milestones</h3>
              <span>{{ completedMilestoneCount }}/{{ selectedProject.milestones.length }}</span>
            </div>
            <div class="milestone-list">
              <button
                v-for="milestone in selectedProject.milestones"
                :key="`${selectedProjectKey}-${milestone.id}`"
                class="milestone-row"
                :class="{ done: milestone.done }"
                @click="toggleMilestone(selectedProject, milestone.id)"
              >
                <span class="check-indicator">{{ milestone.done ? "✓" : "" }}</span>
                <div>
                  <strong>{{ milestone.title }}</strong>
                  <p>{{ formatDate(milestone.due_date) }}</p>
                </div>
              </button>
            </div>
          </section>

          <div class="linked-actions">
            <button class="action-btn" @click="openProjectPage(selectedProject)">Open Project Page</button>
            <button class="action-btn" @click="router.push('/files')">Open Files</button>
            <button class="action-btn" @click="router.push('/calendar')">Open Calendar</button>
            <button class="action-btn" @click="router.push('/team')">Open Team</button>
          </div>
        </section>

        <section v-else class="workspace-panel detail-panel empty-panel">
          <div class="empty-panel-copy">
            <h3>Project Detail</h3>
            <p>Select a project to inspect milestones and actions.</p>
          </div>
        </section>
      </aside>
    </section>

    <teleport to="body">
      <transition name="fade">
        <div v-if="showCreateProjectModal" class="modal-overlay" @click.self="closeCreateProjectModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>Create Project</h2>
                <p>Use the shared workspace shell, but assign the work to the right artist.</p>
              </div>
              <button class="modal-close" @click="closeCreateProjectModal">×</button>
            </div>

            <form class="modal-form" @submit.prevent="submitCreateProject">
              <label>
                <span>Artist</span>
                <select v-model="projectDraft.artistSlug" required>
                  <option value="" disabled>Select artist</option>
                  <option v-for="artist in artists" :key="artist.slug" :value="artist.slug">
                    {{ artist.name }}
                  </option>
                </select>
              </label>

              <label>
                <span>Project name</span>
                <input v-model="projectDraft.name" type="text" maxlength="120" required />
              </label>

              <div class="modal-grid">
                <label>
                  <span>Category</span>
                  <input v-model="projectDraft.category" type="text" maxlength="60" />
                </label>
                <label>
                  <span>Owner</span>
                  <input v-model="projectDraft.owner" type="text" maxlength="80" />
                </label>
              </div>

              <div class="modal-grid">
                <label>
                  <span>Status</span>
                  <select v-model="projectDraft.status">
                    <option value="planning">Planning</option>
                    <option value="active">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Released</option>
                  </select>
                </label>
                <label>
                  <span>Priority</span>
                  <select v-model="projectDraft.priority">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Description</span>
                <textarea v-model="projectDraft.description" rows="4" maxlength="280"></textarea>
              </label>

              <div class="modal-actions">
                <button type="button" class="action-btn" @click="closeCreateProjectModal">Cancel</button>
                <button type="submit" class="action-btn primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      </transition>
    </teleport>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import { useDashboardStore } from "@/stores/dashboard";
import { useArtistProjectsStore } from "@/stores/artistProjects";

const router = useRouter();
const route = useRoute();
const dashboardStore = useDashboardStore();
const artistProjectsStore = useArtistProjectsStore();
const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});

const projectSearch = ref("");
const projectStatusFilter = ref("all");
const projectLayout = ref("board");
const selectedProjectKey = ref("");
const showCreateProjectModal = ref(false);

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

const projectDraft = reactive({
  artistSlug: "",
  name: "",
  category: "Release",
  owner: "Project Owner",
  status: "planning",
  priority: "medium",
  description: "",
});

const artists = computed(() => (Array.isArray(dashboardStore.artists) ? dashboardStore.artists : []));
const requestedLayout = computed(() => (route.query.layout === "list" ? "list" : "board"));
const scopeFilter = computed({
  get: () => (typeof route.query.artist === "string" ? route.query.artist : ""),
  set: (value) => {
    const nextQuery = {};
    if (value) nextQuery.artist = value;
    if (requestedLayout.value === "list") nextQuery.layout = "list";

    router.replace({
      path: "/projects",
      query: nextQuery,
    });
  },
});

const scopedArtist = computed(
  () => artists.value.find((artist) => artist.slug === scopeFilter.value) || null,
);

const allProjects = computed(() =>
  artists.value.flatMap((artist) =>
    artistProjectsStore.getProjectsForArtist(artist.slug).map((project) => ({
      ...project,
      artistSlug: artist.slug,
      artistName: artist.name,
    })),
  ),
);

const visibleProjects = computed(() => {
  if (!scopedArtist.value) return allProjects.value;
  return allProjects.value.filter((project) => project.artistSlug === scopedArtist.value.slug);
});

const activeProjectCount = computed(
  () => visibleProjects.value.filter((project) => project.status !== "completed").length,
);

const dueSoonCount = computed(() => {
  const now = Date.now();
  const windowEnd = now + 14 * 24 * 60 * 60 * 1000;
  return visibleProjects.value.filter((project) => {
    const due = new Date(project.deadline).getTime();
    return project.status !== "completed" && due >= now && due <= windowEnd;
  }).length;
});

const scopeLabel = computed(() => scopedArtist.value?.name || "All Artists");

const projectStatusOptions = computed(() => [
  { value: "all", label: "All" },
  ...projectPipelineStages.map((stage) => ({
    value: stage.id,
    label: stage.label,
  })),
]);

const filteredProjects = computed(() => {
  const term = projectSearch.value.trim().toLowerCase();
  let projects = [...visibleProjects.value];

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
        project.artistName.toLowerCase().includes(term) ||
        project.owner.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.nextMilestone.toLowerCase().includes(term) ||
        milestoneMatch
      );
    });
  }

  return projects.sort((a, b) => {
    const statusDiff =
      projectPipelineStages.findIndex((stage) => stage.id === a.status) -
      projectPipelineStages.findIndex((stage) => stage.id === b.status);
    if (statusDiff !== 0) return statusDiff;

    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(a.deadline) - new Date(b.deadline);
  });
});

const projectPipeline = computed(() =>
  projectPipelineStages.map((stage) => ({
    ...stage,
    projects: filteredProjects.value.filter((project) => project.status === stage.id),
  })),
);

const selectedProject = computed(
  () => filteredProjects.value.find((project) => projectKey(project) === selectedProjectKey.value) || null,
);

const completedMilestoneCount = computed(
  () => selectedProject.value?.milestones.filter((milestone) => milestone.done).length || 0,
);

const projectKey = (project) => `${project.artistSlug}:${project.id}`;
const requestedProjectKey = computed(() => {
  const projectId = typeof route.query.project === "string" ? route.query.project : "";
  if (!projectId || !scopeFilter.value) return "";
  return `${scopeFilter.value}:${projectId}`;
});

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const formatProjectStatus = (status) => projectStatusMeta[status]?.label || status;

const syncProjectsQuery = ({ layout = projectLayout.value, project = selectedProject.value } = {}) => {
  const nextQuery = {};
  if (scopeFilter.value) nextQuery.artist = scopeFilter.value;
  if (layout === "list") nextQuery.layout = "list";
  if (project?.id && project.artistSlug === scopeFilter.value) nextQuery.project = project.id;

  const currentArtist = typeof route.query.artist === "string" ? route.query.artist : "";
  const currentLayout = route.query.layout === "list" ? "list" : "";
  const currentProject = typeof route.query.project === "string" ? route.query.project : "";

  if (
    currentArtist === (nextQuery.artist || "") &&
    currentLayout === (nextQuery.layout || "") &&
    currentProject === (nextQuery.project || "")
  ) {
    return;
  }

  router.replace({
    path: "/projects",
    query: nextQuery,
  });
};

const ensureSelectedProject = () => {
  const available = filteredProjects.value.map((project) => projectKey(project));
  if (!available.length) {
    selectedProjectKey.value = "";
    return;
  }

  if (!selectedProjectKey.value || !available.includes(selectedProjectKey.value)) {
    if (requestedProjectKey.value && available.includes(requestedProjectKey.value)) {
      selectedProjectKey.value = requestedProjectKey.value;
      return;
    }

    selectedProjectKey.value = available[0];
  }
};

const setProjectLayout = (layout) => {
  projectLayout.value = layout;
  ensureSelectedProject();
  syncProjectsQuery({
    layout,
    project: selectedProject.value,
  });
};

const selectProject = (project) => {
  selectedProjectKey.value = projectKey(project);
  syncProjectsQuery({ project });
};

const openProjectPage = (project) => {
  router.push(`/artists/${project.artistSlug}/projects/${project.id}`);
};

const openProjectContextMenu = (event, project) => {
  selectProject(project);
  showContextMenu(
    event,
    {
      ...project,
      artist_slug: project.artistSlug,
      link: `/artists/${project.artistSlug}/projects/${project.id}`,
    },
    "project",
  );
};

const openProjectsWorkspaceMenu = (event) => {
  if (event.target.closest(".pipeline-card") || event.target.closest(".project-list-row")) return;

  showContextMenu(
    event,
    [
      { label: "New Project", handler: () => openCreateProjectModal() },
      { label: "Board View", handler: () => setProjectLayout("board") },
      { label: "List View", handler: () => setProjectLayout("list") },
      { separator: true },
      { label: "Show All Artists", handler: () => (scopeFilter.value = "") },
      { label: "Open Timeline", handler: () => router.push("/timeline") },
    ],
    "custom",
  );
};

const toggleMilestone = (project, milestoneId) => {
  artistProjectsStore.toggleMilestone(project.artistSlug, project.id, milestoneId);
};

const resetProjectDraft = () => {
  projectDraft.artistSlug = scopeFilter.value || artists.value[0]?.slug || "";
  projectDraft.name = "";
  projectDraft.category = "Release";
  projectDraft.owner = "Project Owner";
  projectDraft.status = "planning";
  projectDraft.priority = "medium";
  projectDraft.description = "";
};

const openCreateProjectModal = () => {
  resetProjectDraft();
  showCreateProjectModal.value = true;
};

const closeCreateProjectModal = () => {
  showCreateProjectModal.value = false;
};

const submitCreateProject = () => {
  const artistSlug = String(projectDraft.artistSlug || "");
  const name = projectDraft.name.trim();
  if (!artistSlug || !name) return;

  const createdProject = artistProjectsStore.createProject(artistSlug, {
    name,
    category: projectDraft.category,
    owner: projectDraft.owner,
    status: projectDraft.status,
    priority: projectDraft.priority,
    description: projectDraft.description,
  });

  if (!createdProject) return;

  if (!scopeFilter.value) {
    scopeFilter.value = artistSlug;
  }

  selectedProjectKey.value = `${artistSlug}:${createdProject.id}`;
  projectLayout.value = "board";
  projectStatusFilter.value = "all";
  closeCreateProjectModal();
  showToast({ message: `Created project ${name}`, type: "success" });
};

watch(
  artists,
  (list) => {
    list.forEach((artist) => artistProjectsStore.ensureArtistSeed(artist.slug, artist.name));
  },
  { immediate: true },
);

watch(
  requestedLayout,
  (layout) => {
    projectLayout.value = layout;
  },
  { immediate: true },
);

watch([filteredProjects, scopeFilter, requestedProjectKey], () => {
  ensureSelectedProject();
  syncProjectsQuery();
});

onMounted(async () => {
  await dashboardStore.loadArtists();
});
</script>

<style scoped>
.projects-view {
  color: var(--color-text);
}

.projects-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--space-4);
  align-items: start;
}

.workspace-panel,
.scope-select {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(250, 250, 248, 0.82)),
    var(--color-surface);
  color: var(--color-text);
}

.workspace-panel {
  border-radius: var(--radius-card);
  padding: 16px;
  display: grid;
  gap: 14px;
}

.panel-head,
.subsection-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.panel-head h2,
.subsection-head h3,
.pipeline-header h3,
.pipeline-card h4,
.project-list-main h4 {
  margin: 0;
  color: var(--color-text);
}

.panel-head p,
.subsection-head span,
.pipeline-header p,
.project-list-main p,
.pipeline-card-owner,
.pipeline-card-next,
.pipeline-meta,
.detail-card span,
.milestone-row p {
  color: var(--color-text-secondary);
}

.toolbar-group {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  align-items: center;
}

.scope-select {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: var(--control-md);
  padding: 0 var(--control-px);
  border-radius: var(--radius-pill);
}

.scope-select span {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.scope-select select {
  border: none;
  background: transparent;
  color: var(--color-text);
  font: inherit;
}

.scope-select select:focus {
  outline: none;
}

.layout-toggle {
  min-height: var(--control-md);
}

.layout-toggle button {
  min-height: var(--control-sm);
}

.stage-filter-group {
  justify-content: flex-start;
}

.stage-chip {
  min-height: var(--control-sm);
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.stage-chip.active {
  background: var(--color-accent-subtle);
  border-color: rgba(200, 75, 17, 0.18);
  color: var(--color-accent);
}

.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(240px, 1fr));
  gap: 14px;
  align-items: start;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}

.pipeline-column {
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius-card) - 4px);
  padding: 12px;
  background: rgba(255, 255, 255, 0.58);
  display: grid;
  gap: 12px;
  min-width: 0;
  align-content: start;
  min-height: 100%;
}

.pipeline-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.pipeline-header span {
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.pipeline-list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.pipeline-empty,
.projects-empty {
  min-height: 120px;
  display: grid;
  place-items: center;
  border: 1px dashed var(--color-border);
  border-radius: 14px;
  color: var(--color-text-tertiary);
  font-size: 13px;
  text-align: center;
}

.pipeline-card,
.project-list-row,
.milestone-row {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.88);
  color: var(--color-text);
  border-radius: 14px;
  transition:
    border-color var(--motion-default),
    transform var(--motion-default),
    box-shadow var(--motion-default);
}

.pipeline-card {
  padding: 14px;
  text-align: left;
  display: grid;
  gap: 8px;
  align-content: start;
  min-height: 0;
}

.pipeline-card:hover,
.project-list-row:hover,
.milestone-row:hover {
  border-color: rgba(200, 75, 17, 0.22);
  box-shadow: var(--shadow-1);
  transform: translateY(-1px);
}

.pipeline-card.selected,
.project-list-row.selected {
  border-color: rgba(200, 75, 17, 0.28);
  background: rgba(232, 90, 25, 0.06);
}

.pipeline-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.pipeline-card-head > div {
  min-width: 0;
}

.pipeline-card h4 {
  line-height: 1.02;
  letter-spacing: -0.035em;
}

.pipeline-card-artist,
.project-list-artist {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.pipeline-progress,
.progress-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.progress-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(19, 18, 17, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-accent), #f2854e);
}

.pipeline-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}

.project-priority,
.project-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.project-priority.high,
.project-status.review {
  background: rgba(214, 64, 50, 0.1);
  color: var(--color-danger);
}

.project-priority.medium,
.project-status.active {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.project-priority.low,
.project-status.planning,
.project-status.completed {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-text-secondary);
}

.projects-list-table {
  display: grid;
  gap: 10px;
}

.project-list-row {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(120px, 0.8fr) minmax(180px, 0.9fr) minmax(110px, 0.7fr) minmax(110px, 0.7fr);
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  text-align: left;
}

.project-list-owner,
.project-list-progress,
.project-list-due {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.project-list-progress {
  display: grid;
  gap: 2px;
}

.detail-column {
  display: grid;
  gap: var(--space-4);
  position: sticky;
  top: 0;
  align-self: start;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.detail-card {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 12px 14px;
  display: grid;
  gap: 4px;
  background: rgba(255, 255, 255, 0.72);
}

.detail-card strong {
  color: var(--color-text);
}

.detail-section {
  display: grid;
  gap: 12px;
}

.milestone-list {
  display: grid;
  gap: 10px;
}

.milestone-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 12px;
  text-align: left;
}

.milestone-row.done {
  background: rgba(19, 18, 17, 0.04);
}

.check-indicator {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(19, 18, 17, 0.08);
  color: var(--color-accent);
  font-weight: 700;
}

.linked-actions {
  display: grid;
  gap: 8px;
}

.empty-panel {
  min-height: 220px;
  place-items: center;
}

.empty-panel-copy {
  display: grid;
  gap: 6px;
  text-align: center;
}

.empty-panel-copy h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text);
}

.empty-panel p {
  color: var(--color-text-tertiary);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 16, 15, 0.28);
  display: grid;
  place-items: center;
  padding: var(--space-4);
  z-index: var(--z-modal);
}

.modal-card {
  width: min(560px, 100%);
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-overlay);
  padding: 20px;
  display: grid;
  gap: 16px;
}

.modal-head,
.modal-actions,
.modal-grid {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.modal-head h2 {
  margin: 0;
}

.modal-head p {
  margin-top: 4px;
  color: var(--color-text-secondary);
}

.modal-close {
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 28px;
  line-height: 1;
}

.modal-form,
.modal-form label {
  display: grid;
  gap: 8px;
}

.modal-form span {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.modal-form input,
.modal-form select,
.modal-form textarea {
  width: 100%;
  min-height: var(--control-md);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  font: inherit;
}

.modal-form textarea {
  min-height: 120px;
  resize: vertical;
}

@media (max-width: 1200px) {
  .projects-layout {
    grid-template-columns: 1fr;
  }

  .detail-column {
    position: static;
  }

  .pipeline-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .pipeline-grid,
  .detail-grid,
  .project-list-row {
    grid-template-columns: 1fr;
  }

  .pipeline-grid {
    overflow: visible;
  }
}
</style>
