<template>
  <WorkspacePage
    class="releases-view"
    artist-scoped-header
    eyebrow="Music Workspace"
    title="Releases"
    :count="filteredReleases.length"
    subtitle="Plan singles, EPs, and albums with one launch-oriented operating view."
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="startRelease">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>New Release</span>
      </button>
      <button class="workspace-header-secondary-btn" @click="openCalendar">
        Launch Calendar
      </button>
    </template>

    <template #stats>
      <article class="stat-card">
        <span>Active Rollouts</span>
        <strong>{{ activeRollouts }}</strong>
      </article>
      <article class="stat-card">
        <span>Launching Soon</span>
        <strong>{{ launchingSoon }}</strong>
      </article>
      <article class="stat-card">
        <span>Ready Assets</span>
        <strong>{{ readyAssetRate }}</strong>
      </article>
    </template>

    <template #toolbar>
      <div class="search-container">
        <div class="search-wrapper search-field">
          <svg
            class="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            v-model="searchQuery"
            class="search-input"
            type="text"
            placeholder="Search release titles, artists, or tracks..."
          />
        </div>
      </div>

      <div class="filter-group toolbar-group">
        <button
          v-for="option in stageOptions"
          :key="option.value"
          class="stage-chip"
          :class="{ active: stageFilter === option.value }"
          @click="stageFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </template>

    <section class="releases-layout">
      <section class="workspace-panel releases-board" @contextmenu.prevent="openReleaseWorkspaceMenu">
        <div class="panel-head">
          <div>
            <h2>Launch Pipeline</h2>
            <p>Track sequencing, assets, and approvals before each release date.</p>
          </div>
        </div>

        <div class="release-list">
          <button
            v-for="release in filteredReleases"
            :key="release.id"
            class="release-card"
            :class="{ active: selectedReleaseId === release.id }"
            @click="selectedReleaseId = release.id"
            @contextmenu.prevent.stop="openReleaseMenu($event, release)"
          >
            <div class="release-card-head">
              <div>
                <p class="release-format">{{ release.format }}</p>
                <h3>{{ release.title }}</h3>
              </div>
              <span class="release-stage" :class="release.stage">{{
                stageLabel(release.stage)
              }}</span>
            </div>

            <div class="release-meta">
              <span>{{ release.artist }}</span>
              <span>{{ formatDate(release.releaseDate) }}</span>
            </div>

            <p class="release-track">{{ release.leadTrack }}</p>

            <div class="progress-row">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${release.progress}%` }"></div>
              </div>
              <strong>{{ release.progress }}%</strong>
            </div>
          </button>
        </div>
      </section>

      <aside class="detail-column">
        <section class="workspace-panel detail-panel" v-if="selectedRelease">
          <div class="panel-head">
            <div>
              <h2>{{ selectedRelease.title }}</h2>
              <p>{{ selectedRelease.artist }} · {{ selectedRelease.format }}</p>
            </div>
            <span class="release-stage" :class="selectedRelease.stage">{{
              stageLabel(selectedRelease.stage)
            }}</span>
          </div>

          <div class="detail-grid">
            <article class="detail-card">
              <span>Release Date</span>
              <strong>{{ formatDate(selectedRelease.releaseDate) }}</strong>
            </article>
            <article class="detail-card">
              <span>Lead Track</span>
              <strong>{{ selectedRelease.leadTrack }}</strong>
            </article>
            <article class="detail-card">
              <span>Owner</span>
              <strong>{{ selectedRelease.owner }}</strong>
            </article>
            <article class="detail-card">
              <span>Priority</span>
              <strong>{{ selectedRelease.priority }}</strong>
            </article>
          </div>

          <div class="checklist-panel">
            <div class="subsection-head">
              <h3>Launch Checklist</h3>
              <span>{{ completedChecklistCount }}/{{ selectedRelease.checklist.length }}</span>
            </div>
            <div class="checklist-list">
              <article
                v-for="item in selectedRelease.checklist"
                :key="item.id"
                class="checklist-row"
                :class="{ done: item.done }"
              >
                <span class="check-indicator">{{ item.done ? "✓" : "" }}</span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.description }}</p>
                </div>
              </article>
            </div>
          </div>

          <div class="linked-actions">
            <button class="action-btn" @click="router.push(buildScopedRoute('/songs'))">Open Songs</button>
            <button class="action-btn" @click="router.push(buildScopedRoute('/files'))">Open Assets</button>
            <button class="action-btn" @click="router.push(buildScopedRoute('/timeline'))">Open Timeline</button>
            <button class="action-btn" @click="router.push(buildScopedRoute('/calendar'))">Open Calendar</button>
          </div>
        </section>

        <section class="workspace-panel milestones-panel">
          <div class="panel-head">
            <div>
              <h2>Upcoming Milestones</h2>
              <p>Cross-release launch moments that need attention next.</p>
            </div>
          </div>

          <div class="milestone-list">
            <article
              v-for="milestone in upcomingMilestones"
              :key="milestone.id"
              class="milestone-row"
            >
              <div>
                <strong>{{ milestone.title }}</strong>
                <p>{{ milestone.releaseTitle }} · {{ milestone.owner }}</p>
              </div>
              <span>{{ formatDate(milestone.date) }}</span>
            </article>
          </div>
        </section>
      </aside>
    </section>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import { useDashboardStore } from "@/stores/dashboard";

const router = useRouter();
const route = useRoute();
const dashboardStore = useDashboardStore();
const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});

const searchQuery = ref("");
const stageFilter = ref("all");
const selectedReleaseId = ref("release-1");

const scopedArtistSlug = computed(() =>
  typeof route.query.artist === "string" ? route.query.artist : "",
);
const scopedArtist = computed(() =>
  (dashboardStore.artists || []).find(
    (artist) => artist.slug === scopedArtistSlug.value || String(artist.id) === scopedArtistSlug.value,
  ) || null,
);

const stageOptions = [
  { value: "all", label: "All" },
  { value: "planning", label: "Planning" },
  { value: "delivery", label: "Delivery" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
];

const releases = computed(() => {
  const artists = dashboardStore.artists || [];
  const fallbackArtist = (index, fallback) => artists[index]?.name || fallback;
  return [
    {
      id: "release-1",
      title: "Midnight Dreams",
      artist: fallbackArtist(0, "Taylor Swift"),
      format: "Single",
      leadTrack: "Midnight Dreams",
      releaseDate: "2026-03-14",
      stage: "delivery",
      owner: "Sarah Chen",
      priority: "High",
      progress: 78,
      checklist: [
        {
          id: "c1",
          title: "Approve final master",
          description: "Final audio sign-off from management.",
          done: true,
        },
        {
          id: "c2",
          title: "Deliver cover artwork",
          description: "Export platform-safe square art package.",
          done: true,
        },
        {
          id: "c3",
          title: "Submit DSP metadata",
          description: "Confirm songwriter, ISRC, and territories.",
          done: false,
        },
        {
          id: "c4",
          title: "Schedule release-week content",
          description: "Lock social and short-form rollout.",
          done: false,
        },
      ],
      milestones: [
        { id: "m1", title: "DSP metadata lock", owner: "Ops", date: "2026-03-03" },
        { id: "m2", title: "Short-form edits approved", owner: "Creative", date: "2026-03-08" },
      ],
    },
    {
      id: "release-2",
      title: "Neon Afterglow",
      artist: fallbackArtist(1, "The Weeknd"),
      format: "EP",
      leadTrack: "Afterglow",
      releaseDate: "2026-04-04",
      stage: "planning",
      owner: "Alex Rivera",
      priority: "Medium",
      progress: 46,
      checklist: [
        {
          id: "c1",
          title: "Finalize tracklist",
          description: "Confirm sequencing and runtime.",
          done: true,
        },
        {
          id: "c2",
          title: "Creative direction approved",
          description: "Sign off visual system and art references.",
          done: false,
        },
        {
          id: "c3",
          title: "Budget approved",
          description: "Release campaign allocation confirmed.",
          done: false,
        },
      ],
      milestones: [
        { id: "m3", title: "Campaign brief review", owner: "Marketing", date: "2026-03-11" },
        { id: "m4", title: "Artwork concept review", owner: "Creative", date: "2026-03-18" },
      ],
    },
    {
      id: "release-3",
      title: "Open Static",
      artist: fallbackArtist(2, "Billie Eilish"),
      format: "Album",
      leadTrack: "Static Bloom",
      releaseDate: "2026-02-21",
      stage: "live",
      owner: "Mike Johnson",
      priority: "High",
      progress: 100,
      checklist: [
        {
          id: "c1",
          title: "Release day QA",
          description: "Validate storefronts and links.",
          done: true,
        },
        {
          id: "c2",
          title: "Fan comms live",
          description: "Newsletter and socials published.",
          done: true,
        },
        {
          id: "c3",
          title: "Reporting dashboard live",
          description: "Launch dashboard distributed to team.",
          done: true,
        },
      ],
      milestones: [
        { id: "m5", title: "Week-one reporting review", owner: "Analytics", date: "2026-02-28" },
      ],
    },
  ];
});

const filteredReleases = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return releases.value.filter((release) => {
    const matchesArtist = !scopedArtist.value || release.artist === scopedArtist.value.name;
    const matchesStage = stageFilter.value === "all" || release.stage === stageFilter.value;
    const matchesQuery =
      !query ||
      [release.title, release.artist, release.leadTrack].some((value) =>
        value.toLowerCase().includes(query),
      );
    return matchesArtist && matchesStage && matchesQuery;
  });
});

const selectedRelease = computed(() => {
  return (
    filteredReleases.value.find((release) => release.id === selectedReleaseId.value) ||
    filteredReleases.value[0] ||
    null
  );
});

const activeRollouts = computed(
  () => filteredReleases.value.filter((release) => release.stage !== "live").length,
);
const launchingSoon = computed(
  () =>
    filteredReleases.value.filter((release) => {
      const diff = new Date(release.releaseDate).getTime() - Date.now();
      return diff >= 0 && diff <= 21 * 24 * 60 * 60 * 1000;
    }).length,
);
const readyAssetRate = computed(() => {
  const allItems = filteredReleases.value.flatMap((release) => release.checklist);
  const done = allItems.filter((item) => item.done).length;
  return allItems.length ? `${Math.round((done / allItems.length) * 100)}%` : "0%";
});
const completedChecklistCount = computed(
  () => selectedRelease.value?.checklist.filter((item) => item.done).length || 0,
);
const upcomingMilestones = computed(() => {
  return filteredReleases.value
    .flatMap((release) =>
      release.milestones.map((milestone) => ({ ...milestone, releaseTitle: release.title })),
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);
});

const stageLabel = (stage) => {
  const labels = {
    planning: "Planning",
    delivery: "Delivery",
    scheduled: "Scheduled",
    live: "Live",
  };
  return labels[stage] || stage;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const buildScopedRoute = (path) =>
  scopedArtistSlug.value ? { path, query: { artist: scopedArtistSlug.value } } : { path };

const startRelease = () => {
  showToast({
    message: "Release setup should branch into artist-specific project creation next.",
    type: "info",
  });
  router.push(scopedArtistSlug.value ? `/artists/${scopedArtistSlug.value}` : "/artists");
};

const openCalendar = () => {
  router.push(buildScopedRoute("/calendar"));
};

const editRelease = (release) => {
  selectedReleaseId.value = release.id;
  showToast({
    message: `Release editor for "${release.title}" should open from this action next.`,
    type: "info",
  });
};

const duplicateRelease = (release) => {
  selectedReleaseId.value = release.id;
  showToast({
    message: `Duplicate flow for "${release.title}" should branch from this menu next.`,
    type: "info",
  });
};

const deleteRelease = (release) => {
  selectedReleaseId.value = release.id;
  showToast({
    message: `Delete flow for "${release.title}" should confirm here next.`,
    type: "warning",
  });
};

const openReleaseMenu = (event, release) => {
  showContextMenu(
    event,
    [
      {
        label: "Open Release",
        handler: () => {
          selectedReleaseId.value = release.id;
        },
      },
      {
        label: "Edit Release",
        handler: () => editRelease(release),
      },
      {
        label: "Duplicate Release",
        handler: () => duplicateRelease(release),
      },
      {
        label: "Open Launch Calendar",
        handler: () => openCalendar(),
      },
      { separator: true },
      {
        label: "Delete Release",
        destructive: true,
        handler: () => deleteRelease(release),
      },
    ],
    "custom",
  );
};

const openReleaseWorkspaceMenu = (event) => {
  if (event.target.closest(".release-card")) return;

  showContextMenu(
    event,
    [
      { label: "New Release", handler: () => startRelease() },
      { label: "Launch Calendar", handler: () => openCalendar() },
      { separator: true },
      {
        label: "Show All Releases",
        handler: () => {
          stageFilter.value = "all";
          searchQuery.value = "";
        },
      },
      {
        label: "Show Live Releases",
        handler: () => {
          stageFilter.value = "live";
        },
      },
    ],
    "custom",
  );
};

onMounted(async () => {
  await dashboardStore.loadArtists();
});
</script>

<style scoped>
.stat-card {
  min-width: 154px;
  padding: 12px 14px;
  border-radius: var(--radius-card);
  display: grid;
  gap: 4px;
  align-content: start;
}

.stat-card span,
.release-format {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-card strong {
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}

.search-field {
  display: block;
}

.search-field svg {
  width: 18px;
  height: 18px;
}

.toolbar-group {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: flex-start;
}

.stage-chip {
  min-width: fit-content;
}

.releases-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.82fr);
  gap: var(--space-4);
  align-items: start;
}

.workspace-panel {
  border-radius: var(--radius-card);
  padding: var(--space-5);
  display: grid;
  gap: var(--space-4);
  align-content: start;
}

.detail-column {
  display: grid;
  gap: var(--space-4);
  align-content: start;
}

.panel-head h2,
.subsection-head h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.panel-head p,
.subsection-head span,
.release-meta,
.checklist-row p {
  margin: 8px 0 0;
}

.release-list,
.detail-grid,
.checklist-list,
.milestone-list {
  display: grid;
  gap: var(--space-2);
  align-content: start;
}

.release-list {
  grid-auto-rows: max-content;
}

.release-card {
  width: 100%;
  padding: var(--space-4);
  border-radius: var(--radius-card);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.release-card.active {
  transform: translateY(-1px);
}

.release-card-head,
.release-meta,
.progress-row,
.subsection-head,
.linked-actions,
.milestone-row,
.checklist-row,
.detail-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.release-card-head {
  align-items: flex-start;
}

.release-card h3 {
  margin: 6px 0 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.release-track {
  margin: 0;
  font-size: 14px;
}

.release-stage {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.progress-bar {
  flex: 1;
  height: 6px;
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.progress-row strong {
  font-size: 13px;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.detail-card {
  padding: var(--space-4);
  border-radius: var(--radius-card);
  display: grid;
  gap: 6px;
  align-content: start;
  min-height: 82px;
}

.detail-card span {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.detail-card strong {
  font-size: 16px;
  line-height: 1.2;
}

.checklist-panel {
  display: grid;
  gap: var(--space-2);
}

.checklist-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: flex-start;
  padding: 6px 0;
}

.checklist-row > div {
  min-width: 0;
}

.check-indicator {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
}

.linked-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.linked-actions .action-btn {
  min-width: 0;
  width: 100%;
  justify-content: center;
}

.milestone-row strong {
  display: block;
}

@media (max-width: 1100px) {
  .releases-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

/* Theme override */
.releases-view .workspace-panel,
.releases-view .stat-card,
.releases-view .release-card,
.releases-view .detail-card,
.releases-view .check-indicator {
  border-color: var(--color-border);
  color: var(--color-text);
}

.releases-view .workspace-panel,
.releases-view .stat-card,
.releases-view .release-card,
.releases-view .detail-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.86)),
    var(--color-surface);
}

.releases-view .workspace-panel {
  box-shadow: var(--shadow-1);
}

.releases-view .stat-card {
  box-shadow: none;
}

.releases-view .search-input::placeholder,
.releases-view .toolbar-group,
.releases-view .panel-head p,
.releases-view .subsection-head span,
.releases-view .release-meta,
.releases-view .checklist-row p,
.releases-view .detail-card span,
.releases-view .milestone-row span,
.releases-view .stat-card span,
.releases-view .release-format {
  color: var(--color-text-secondary);
}

.releases-view .release-card.active {
  border-color: rgba(200, 75, 17, 0.28);
  background:
    linear-gradient(180deg, rgba(200, 75, 17, 0.08), rgba(250, 250, 248, 0.86)),
    var(--color-surface);
  box-shadow: none;
}

.releases-view .release-card h3,
.releases-view .panel-head h2,
.releases-view .subsection-head h3,
.releases-view .detail-card strong,
.releases-view .checklist-row strong,
.releases-view .milestone-row strong,
.releases-view .stat-card strong,
.releases-view .release-track {
  color: var(--color-text);
}

.releases-view .progress-bar {
  background: rgba(19, 18, 17, 0.08);
}

.releases-view .progress-fill {
  background: linear-gradient(90deg, rgba(200, 75, 17, 0.9), rgba(19, 18, 17, 0.82));
}

.releases-view .release-stage.planning {
  background: rgba(184, 105, 26, 0.12);
  color: var(--color-warning);
}

.releases-view .release-stage.delivery {
  background: rgba(17, 16, 15, 0.06);
  color: var(--color-info);
}

.releases-view .release-stage.scheduled {
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
}

.releases-view .release-stage.live {
  background: rgba(232, 90, 25, 0.1);
  color: var(--color-success);
}

.releases-view .checklist-row.done strong {
  color: var(--color-text-secondary);
}

.releases-view .check-indicator {
  background: rgba(232, 90, 25, 0.08);
  border-color: rgba(232, 90, 25, 0.18);
  color: var(--color-success);
}

.releases-view .toolbar-group .stage-chip {
  min-width: fit-content;
}
</style>
