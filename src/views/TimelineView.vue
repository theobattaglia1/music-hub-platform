<template>
  <WorkspacePage
    class="timeline-view"
    artist-scoped-header
    eyebrow="Planning"
    title="Timeline"
    :count="filteredEvents.length"
    subtitle="Birds-eye timeline by default. Pinch, scroll-zoom, and drag to move like a fluid camera."
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="openCreateEventModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Add Event</span>
      </button>
    </template>

    <template #toolbar>
      <div class="timeline-controls">
        <div class="control-group">
          <label>
            <span>Type</span>
            <select v-model="filterType">
              <option value="">All Events</option>
              <option value="release">Releases</option>
              <option value="performance">Performances</option>
              <option value="milestone">Milestones</option>
              <option value="collaboration">Collaborations</option>
            </select>
          </label>

          <label>
            <span>Range</span>
            <select v-model="timeRange">
              <option value="all">All Time</option>
              <option value="year">Last 12 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </label>
        </div>

        <div class="control-group right">
          <div class="mode-toggle">
            <button
              v-for="mode in viewModes"
              :key="mode.value"
              :class="['mode-btn', { active: viewMode === mode.value }]"
              @click="viewMode = mode.value"
            >
              {{ mode.label }}
            </button>
          </div>

          <div v-if="viewMode === 'chronological'" class="zoom-controls">
            <button class="zoom-btn" :disabled="!canZoomOut" @click="zoomOut">-</button>
            <span>{{ zoomDisplay }}</span>
            <button class="zoom-btn" :disabled="!canZoomIn" @click="zoomIn">+</button>
            <button class="zoom-btn" @click="resetZoom">Reset</button>
          </div>
        </div>
      </div>
    </template>

    <section class="timeline-body" @contextmenu.prevent="openTimelineWorkspaceMenu">
      <div v-if="filteredEvents.length === 0" class="empty-state">
        <h2>No timeline events for these filters</h2>
        <p>Try a wider range or add a new event.</p>
        <button class="primary-btn" @click="openCreateEventModal">Add Event</button>
      </div>

      <template v-else>
        <div v-if="viewMode === 'chronological'" class="chronological-layout">
          <section class="timeline-insert-strip">
            <div class="insert-strip-copy">
              <strong>Quick insert</strong>
              <p>Drag a new event type onto the timeline, or click one to start a draft.</p>
            </div>

            <div class="insert-strip-items">
              <button
                v-for="template in quickInsertTemplates"
                :key="template.type"
                class="insert-template"
                :class="template.type"
                draggable="true"
                @dragstart="handleQuickInsertDragStart(template, $event)"
                @dragend="handleQuickInsertDragEnd"
                @click="openCreateEventModalForTemplate(template)"
              >
                <span class="insert-template-kicker">{{ template.label }}</span>
                <span class="insert-template-copy">{{ template.description }}</span>
              </button>
            </div>
          </section>

          <div class="timeline-overview-cards">
            <article class="overview-card">
              <span>Visible Window</span>
              <strong>{{ formatRange(viewStartTs, viewEndTs) }}</strong>
            </article>
            <article class="overview-card">
              <span>Total Horizon</span>
              <strong>{{ formatRange(fullStartTs, fullEndTs) }}</strong>
            </article>
            <article class="overview-card">
              <span>Events In View</span>
              <strong>{{ positionedEvents.length }}</strong>
            </article>
          </div>

          <div class="timeline-viewport-shell">
            <div
              ref="timelineViewport"
              class="timeline-viewport"
              :class="{
                'is-dragging': isPanning || isPinching,
                'is-drop-active': timelineDropActive,
                'has-focused-event': !!focusedEventId,
              }"
              :style="{ height: `${timelineHeight}px` }"
              @click="handleViewportClick"
              @wheel.prevent="handleViewportWheel"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointercancel="handlePointerUp"
              @dragover.prevent="handleTimelineDragOver"
              @dragenter.prevent="handleTimelineDragEnter"
              @dragleave="handleTimelineDragLeave"
              @drop.prevent="handleTimelineDrop"
            >
              <div class="timeline-axis"></div>

              <div
                v-for="tick in visibleTicks"
                :key="`tick-${tick.timestamp}`"
                class="timeline-tick"
                :style="{ left: `${tick.positionPct}%` }"
              >
                <span class="tick-label">{{ tick.label }}</span>
              </div>

              <button
                v-for="eventModel in positionedEvents"
                :key="eventModel.id"
                :ref="(element) => registerEventElement(eventModel.id, element)"
                class="timeline-event"
                :class="[
                  eventModel.type,
                  {
                    selected: selectedEvent?.id === eventModel.id,
                    focused: String(focusedEventId) === String(eventModel.id),
                    flipping: String(flippingEventId) === String(eventModel.id),
                  },
                ]"
                :style="{
                  left: `${eventModel.positionPct}%`,
                  top: `${eventModel.topOffset}px`,
                }"
                @click.stop="handleEventClick(eventModel)"
                @contextmenu.prevent.stop="openEventContextMenu($event, eventModel)"
              >
                <span class="event-dot"></span>
                <span class="event-title">{{ eventModel.title }}</span>
                <span class="event-date">{{ formatDate(eventModel.date) }}</span>
              </button>
            </div>

            <div ref="focusStage" class="timeline-focus-stage" :class="{ active: !!focusedEvent }">
              <button
                v-if="focusedEvent"
                class="focused-event-card"
                :class="[
                  focusedEvent.type,
                  {
                    flipping: String(flippingEventId) === String(focusedEvent.id),
                    'is-settled': focusedCardSettled,
                  },
                ]"
                :style="focusedCardStyle"
                @click.stop="triggerFocusedEventOpen(focusedEvent)"
              >
                <span class="focused-event-kicker">{{ formatType(focusedEvent.type) }}</span>
                <strong class="focused-event-title">{{ focusedEvent.title }}</strong>
                <span class="focused-event-date">{{ formatDate(focusedEvent.date) }}</span>
                <p v-if="focusedEvent.description" class="focused-event-copy">
                  {{ focusedEvent.description }}
                </p>
                <span class="focused-event-hint">Click again to open details</span>
              </button>
            </div>
          </div>

          <div class="timeline-minimap" @click="handleMinimapClick">
            <div class="minimap-track">
              <span
                v-for="eventModel in fullRangeEvents"
                :key="`mini-${eventModel.id}`"
                class="minimap-point"
                :style="{ left: `${eventModel.fullPositionPct}%` }"
              ></span>
              <div
                class="minimap-window"
                :style="{
                  left: `${minimapWindowLeftPct}%`,
                  width: `${minimapWindowWidthPct}%`,
                }"
              ></div>
            </div>
            <p>Pinch to zoom, drag to pan, click an event to focus it, then click again for details.</p>
          </div>

          <section class="selected-event-panel" v-if="selectedEvent && !focusedEvent">
            <div class="panel-header">
              <div>
                <h3>{{ selectedEvent.title }}</h3>
                <p>{{ formatType(selectedEvent.type) }} • {{ formatDate(selectedEvent.date) }}</p>
              </div>
              <span class="event-state" :class="selectedEvent.type">{{
                formatType(selectedEvent.type)
              }}</span>
            </div>

            <p class="panel-description" v-if="selectedEvent.description">
              {{ selectedEvent.description }}
            </p>

            <div
              class="panel-details"
              v-if="selectedEvent.details && Object.keys(selectedEvent.details).length > 0"
            >
              <div
                v-for="(value, key) in selectedEvent.details"
                :key="`detail-${key}`"
                class="detail-row"
              >
                <span>{{ formatLabel(key) }}</span>
                <strong>{{ value }}</strong>
              </div>
            </div>

            <div
              class="linked-assets-block"
              v-if="selectedEvent.linkedItems && selectedEvent.linkedItems.length"
            >
              <div class="linked-assets-head">
                <span>Linked references</span>
                <strong>{{ selectedEvent.linkedItems.length }}</strong>
              </div>

              <div class="linked-assets-list">
                <button
                  v-for="linkedItem in selectedEvent.linkedItems"
                  :key="linkedItem.id"
                  class="linked-asset-chip"
                  @click="openLinkedItem(linkedItem)"
                >
                  <span class="linked-asset-type">{{ linkedItem.kindLabel }}</span>
                  <span class="linked-asset-copy">
                    <strong>{{ linkedItem.title }}</strong>
                    <span>{{ linkedItem.subtitle || linkedItem.meta }}</span>
                  </span>
                </button>
              </div>
            </div>

            <div class="panel-actions">
              <button class="panel-btn" @click="openDetailModal(selectedEvent)">Open Details</button>
              <button class="panel-btn" @click="openEditEventModal(selectedEvent)">Edit</button>
              <button class="panel-btn danger" @click="deleteEvent(selectedEvent)">Delete</button>
            </div>
          </section>

          <section class="selected-event-panel empty" v-else>
            <p>Select an event to inspect details and quick actions.</p>
          </section>
        </div>

        <div v-else class="stacked-layout">
          <article
            v-for="event in stackedEvents"
            :key="event.id"
            class="stacked-item"
            :class="event.type"
            @click="handleStackedEventClick(event)"
            @contextmenu.prevent.stop="openEventContextMenu($event, event)"
          >
            <div class="stacked-item-head">
              <h3>{{ event.title }}</h3>
              <span>{{ formatDate(event.date) }}</span>
            </div>
            <p v-if="event.description">{{ event.description }}</p>
            <div class="stacked-item-meta">
              <span class="event-type-pill" :class="event.type">{{ formatType(event.type) }}</span>
              <button class="panel-btn" @click.stop="openEditEventModal(event)">Edit</button>
            </div>
          </article>
        </div>
      </template>
    </section>

    <teleport to="body">
      <transition name="fade">
        <div v-if="eventModalOpen" class="modal-overlay" @click.self="closeEventModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>
                  {{ eventModalMode === "create" ? "Add Timeline Event" : "Edit Timeline Event" }}
                </h2>
                <p>
                  {{
                    eventModalMode === "create"
                      ? "Create a new milestone, release, or performance event."
                      : "Update event details and date placement."
                  }}
                </p>
              </div>
              <button class="modal-close" @click="closeEventModal">×</button>
            </div>

            <form class="modal-form" @submit.prevent="submitEventModal">
              <label>
                <span>Title</span>
                <input
                  v-model="eventDraft.title"
                  type="text"
                  placeholder="Launch campaign sprint"
                  required
                />
              </label>
              <div class="modal-grid">
                <label>
                  <span>Type</span>
                  <select v-model="eventDraft.type">
                    <option value="release">Release</option>
                    <option value="performance">Performance</option>
                    <option value="milestone">Milestone</option>
                    <option value="collaboration">Collaboration</option>
                  </select>
                </label>
                <label>
                  <span>Date</span>
                  <input v-model="eventDraft.date" type="date" required />
                </label>
              </div>
              <label>
                <span>Description</span>
                <textarea
                  v-model="eventDraft.description"
                  rows="4"
                  placeholder="Add notes about this event"
                ></textarea>
              </label>

              <section class="attachment-builder">
                <div class="attachment-builder-head">
                  <div>
                    <h3>Attach references</h3>
                    <p>Link songs, files, notes, playlists, and moodboards to this event.</p>
                  </div>
                  <span>{{ eventDraft.linkedItems.length }} linked</span>
                </div>

                <label>
                  <span>Search workspace</span>
                  <input
                    v-model.trim="attachmentSearch"
                    type="text"
                    placeholder="Search songs, files, notes, or moodboards"
                  />
                </label>

                <div v-if="eventDraft.linkedItems.length" class="linked-draft-list">
                  <div
                    v-for="linkedItem in eventDraft.linkedItems"
                    :key="linkedItem.id"
                    class="linked-draft-item"
                  >
                    <button type="button" class="linked-draft-open" @click="openLinkedItem(linkedItem)">
                      <span class="linked-asset-type">{{ linkedItem.kindLabel }}</span>
                      <span class="linked-asset-copy">
                        <strong>{{ linkedItem.title }}</strong>
                        <span>{{ linkedItem.subtitle || linkedItem.meta }}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      class="linked-draft-remove"
                      @click="removeLinkedItemFromDraft(linkedItem.id)"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div v-if="attachmentSearch" class="attachment-results">
                  <button
                    v-for="result in attachmentSearchResults"
                    :key="result.id"
                    type="button"
                    class="attachment-result"
                    @click="addLinkedItemToDraft(result)"
                  >
                    <span class="linked-asset-type">{{ result.kindLabel }}</span>
                    <span class="attachment-result-copy">
                      <strong>{{ result.title }}</strong>
                      <span>{{ result.subtitle || result.meta }}</span>
                    </span>
                    <span class="attachment-result-action">Attach</span>
                  </button>

                  <p v-if="!attachmentSearchResults.length" class="attachment-empty">
                    No matching workspace items.
                  </p>
                </div>
              </section>

              <div class="modal-actions">
                <button type="button" class="modal-ghost-btn" @click="closeEventModal">
                  Cancel
                </button>
                <button type="submit" class="modal-primary-btn">
                  {{ eventModalMode === "create" ? "Create Event" : "Save Event" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="deleteEventModalOpen" class="modal-overlay" @click.self="closeDeleteEventModal">
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <h2>Delete Timeline Event</h2>
                <p>Remove this event from the timeline and its current focus state.</p>
              </div>
              <button class="modal-close" @click="closeDeleteEventModal">×</button>
            </div>

            <div class="confirm-copy">
              <strong>{{ pendingDeleteEvent?.title }}</strong>
              <p>
                {{
                  pendingDeleteEvent
                    ? `${formatType(pendingDeleteEvent.type)} • ${formatDate(pendingDeleteEvent.date)}`
                    : ""
                }}
              </p>
            </div>

            <div class="modal-actions">
              <button type="button" class="modal-ghost-btn" @click="closeDeleteEventModal">
                Cancel
              </button>
              <button type="button" class="modal-danger-btn" @click="confirmDeleteEvent">
                Delete Event
              </button>
            </div>
          </div>
        </div>
      </transition>

      <transition name="detail-modal-flip">
        <div v-if="detailModalOpen && detailModalEvent" class="modal-overlay" @click.self="closeDetailModal">
          <div class="modal-card detail-modal-card">
            <div class="modal-head">
              <div>
                <h2>{{ detailModalEvent.title }}</h2>
                <p>{{ formatType(detailModalEvent.type) }} • {{ formatDate(detailModalEvent.date) }}</p>
              </div>
              <button class="modal-close" @click="closeDetailModal">×</button>
            </div>

            <p v-if="detailModalEvent.description" class="detail-modal-description">
              {{ detailModalEvent.description }}
            </p>

            <section class="detail-modal-section" v-if="detailModalEvent.linkedItems?.length">
              <div class="detail-modal-section-head">
                <h3>Linked references</h3>
                <span>{{ detailModalEvent.linkedItems.length }}</span>
              </div>
              <div class="detail-modal-link-grid">
                <button
                  v-for="linkedItem in detailModalEvent.linkedItems"
                  :key="linkedItem.id"
                  class="detail-modal-link"
                  @click="openLinkedItem(linkedItem)"
                >
                  <span class="linked-asset-type">{{ linkedItem.kindLabel }}</span>
                  <span class="linked-asset-copy">
                    <strong>{{ linkedItem.title }}</strong>
                    <span>{{ linkedItem.subtitle || linkedItem.meta }}</span>
                  </span>
                </button>
              </div>
            </section>

            <section
              class="detail-modal-section"
              v-if="detailModalEvent.details && Object.keys(detailModalEvent.details).length > 0"
            >
              <div class="detail-modal-section-head">
                <h3>Details</h3>
              </div>
              <div class="detail-modal-detail-grid">
                <div
                  v-for="(value, key) in detailModalEvent.details"
                  :key="`detail-modal-${key}`"
                  class="detail-row"
                >
                  <span>{{ formatLabel(key) }}</span>
                  <strong>{{ value }}</strong>
                </div>
              </div>
            </section>

            <div class="modal-actions detail-modal-actions">
              <button type="button" class="modal-ghost-btn" @click="openEditEventModal(detailModalEvent)">
                Edit Event
              </button>
              <button type="button" class="modal-primary-btn" @click="closeDetailModal">Done</button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiService } from "@/shared/services/api";
import { useDashboardStore } from "@/stores/dashboard";
import { usePlaylistsStore } from "@/stores/playlists";
import { useMoodboardsStore } from "@/stores/moodboards";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";

const route = useRoute();
const router = useRouter();
const dashboardStore = useDashboardStore();
const playlistsStore = usePlaylistsStore();
const moodboardsStore = useMoodboardsStore();
const showToast = inject("showToast", () => {});
const showContextMenu = inject("showContextMenu", () => {});

const TIMELINE_STORAGE_KEY = "musicHub.timeline";
const MS_DAY = 24 * 60 * 60 * 1000;
const MIN_ZOOM_SCALE = 1;
const MAX_ZOOM_SCALE = 96;
const MIN_WINDOW_MS_ABSOLUTE = 2 * 60 * 60 * 1000;
const ZOOM_STEP_FACTOR = 1.35;
const DETAIL_ZOOM_THRESHOLD = 4;
const FOCUS_CARD_TRANSITION_MS = 620;
const EVENT_FLIP_DELAY_MS = 180;
const EVENT_FLIP_RESET_MS = 420;
const TIMELINE_INSERT_MIME = "application/x-music-hub-timeline-template";

const quickInsertTemplates = [
  {
    type: "milestone",
    label: "Milestone",
    title: "New milestone",
    description: "Creative or operational checkpoint",
  },
  {
    type: "release",
    label: "Release",
    title: "Release drop",
    description: "Single, EP, or rollout moment",
  },
  {
    type: "performance",
    label: "Performance",
    title: "Live performance",
    description: "Show, appearance, or session",
  },
  {
    type: "collaboration",
    label: "Collaboration",
    title: "Collaboration session",
    description: "Partner meeting or co-create touchpoint",
  },
];

const timelineEvents = ref([]);
const filterType = ref("");
const timeRange = ref("all");
const viewMode = ref("chronological");
const selectedEventId = ref(null);
const eventModalOpen = ref(false);
const eventModalMode = ref("create");
const activeEventId = ref("");
const deleteEventModalOpen = ref(false);
const pendingDeleteEvent = ref(null);
const detailModalOpen = ref(false);
const detailModalEventId = ref(null);
const focusedEventId = ref(null);
const flippingEventId = ref(null);
const focusedCardOrigin = ref(null);
const focusedCardSettled = ref(false);
const focusDismissTimeoutId = ref(null);
const timelineDropActive = ref(false);
const attachmentSearch = ref("");
const attachmentLibrary = ref([]);
const eventDraft = reactive({
  title: "",
  type: "milestone",
  date: new Date().toISOString().split("T")[0],
  description: "",
  linkedItems: [],
});

const zoomScale = ref(1);
const cameraCenterTs = ref(null);
const timelineViewport = ref(null);
const focusStage = ref(null);
const eventElementMap = new Map();

const isPanning = ref(false);
const isPinching = ref(false);
const suppressClickUntil = ref(0);
const inertiaFrameId = ref(null);
const detailFlipTimeoutId = ref(null);
const gestureStartScale = ref(1);

const activePointers = new Map();
let gestureTarget = null;

const panSession = {
  startX: 0,
  lastX: 0,
  lastTime: 0,
  velocityPxPerMs: 0,
  moved: false,
};

const pinchSession = {
  startDistance: 0,
  startScale: 1,
};

const viewModes = [
  { value: "chronological", label: "Chronological L→R" },
  { value: "stacked", label: "Stacked List" },
];

const mockEvents = [
  {
    id: "event-1",
    title: "Debut Album Release",
    type: "release",
    date: new Date("2024-03-15").toISOString(),
    completed: true,
    description: 'Released "Midnight Dreams" across all streaming platforms.',
    details: {
      tracks: "12 songs",
      producer: "Alex Johnson",
      region: "Global",
    },
  },
  {
    id: "event-2",
    title: "Summer Festival Tour",
    type: "performance",
    date: new Date("2024-06-01").toISOString(),
    completed: true,
    description: "Performed at 15 major festivals across the country.",
    details: {
      venues: "15",
      attendance: "250,000+",
    },
  },
  {
    id: "event-3",
    title: "Gold Certification",
    type: "milestone",
    date: new Date("2024-08-20").toISOString(),
    completed: true,
    description: "Debut album achieved Gold certification.",
    details: {
      sales: "500,000+ units",
      country: "United States",
    },
  },
  {
    id: "event-4",
    title: "Collaboration Recording Session",
    type: "collaboration",
    date: new Date("2024-11-10").toISOString(),
    completed: false,
    description: "Recording a featured single with a major artist.",
    details: {
      status: "In Progress",
      studio: "A Room Studios",
    },
  },
  {
    id: "event-5",
    title: "Holiday EP Release",
    type: "release",
    date: new Date("2024-12-15").toISOString(),
    completed: false,
    description: "Upcoming holiday EP with 5 tracks.",
    details: {
      tracks: "5 songs",
      format: "Digital EP",
    },
  },
];

const visibleArtists = computed(() =>
  Array.isArray(dashboardStore.artists) ? dashboardStore.artists : [],
);

const scopedArtistSlug = computed(() =>
  typeof route.query.artist === "string" && route.query.artist ? route.query.artist : "",
);

const scopedArtist = computed(() => {
  if (!scopedArtistSlug.value) return null;
  return (
    visibleArtists.value.find(
      (artist) => artist.slug === scopedArtistSlug.value || artist.id === scopedArtistSlug.value,
    ) || null
  );
});

const activeArtistIds = computed(() => {
  if (!scopedArtist.value) return [];
  const baseId = String(scopedArtist.value.id);
  return [baseId, `artist-${baseId}`, scopedArtist.value.slug].filter(Boolean);
});

const normalizeLinkedItem = (item = {}) => ({
  id:
    item.id ||
    `${item.type || item.kind || "item"}-${item.sourceId || item.assetId || Math.random().toString(36).slice(2, 8)}`,
  sourceId: String(item.sourceId || item.assetId || item.id || ""),
  type: item.type || item.kind || "reference",
  kindLabel: item.kindLabel || item.badge || "Reference",
  title: item.title || item.name || "Untitled",
  subtitle: item.subtitle || item.description || "",
  meta: item.meta || item.assetMeta || "",
  artist_id: item.artist_id || null,
  routePath: item.routePath || "",
  routeName: item.routeName || "",
  routeParams: item.routeParams || null,
});

const normalizeEvent = (event) => {
  const metadata =
    event?.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
      ? { ...event.metadata }
      : {};
  const linkedItems = Array.isArray(event?.linkedItems)
    ? event.linkedItems
    : Array.isArray(metadata.linkedItems)
      ? metadata.linkedItems
      : [];

  delete metadata.linkedItems;

  return {
    ...event,
    id: String(event?.id || `event-${Date.now()}`),
    type: event?.type || event?.event_type || "milestone",
    date: event?.date || event?.event_date || new Date().toISOString(),
    artist_id: event?.artist_id || metadata.artist_id || null,
    details: event?.details || metadata || {},
    linkedItems: linkedItems.map((item) => normalizeLinkedItem(item)),
  };
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const matchesArtistScope = (artistId) => {
  if (!activeArtistIds.value.length || !artistId) return true;
  return activeArtistIds.value.includes(String(artistId));
};

const filteredEvents = computed(() => {
  let result = timelineEvents.value.map(normalizeEvent);

  if (activeArtistIds.value.length) {
    result = result.filter((event) => matchesArtistScope(event.artist_id));
  }

  if (filterType.value) {
    result = result.filter((event) => event.type === filterType.value);
  }

  if (timeRange.value !== "all") {
    const cutoff = new Date();
    if (timeRange.value === "year") cutoff.setFullYear(cutoff.getFullYear() - 1);
    if (timeRange.value === "6months") cutoff.setMonth(cutoff.getMonth() - 6);
    if (timeRange.value === "3months") cutoff.setMonth(cutoff.getMonth() - 3);
    result = result.filter((event) => new Date(event.date) >= cutoff);
  }

  return result.sort((a, b) => new Date(a.date) - new Date(b.date));
});

const stackedEvents = computed(() => [...filteredEvents.value].reverse());

const fullStartTs = computed(() => {
  if (!filteredEvents.value.length) return Date.now() - 15 * MS_DAY;
  const firstTs = new Date(filteredEvents.value[0].date).getTime();
  return firstTs - 28 * MS_DAY;
});

const fullEndTs = computed(() => {
  if (!filteredEvents.value.length) return Date.now() + 15 * MS_DAY;
  const lastTs = new Date(filteredEvents.value[filteredEvents.value.length - 1].date).getTime();
  return lastTs + 28 * MS_DAY;
});

const fullDurationMs = computed(() => Math.max(fullEndTs.value - fullStartTs.value, 7 * MS_DAY));
const midpointTs = computed(() => fullStartTs.value + fullDurationMs.value / 2);
const minWindowMs = computed(() =>
  Math.min(
    fullDurationMs.value,
    Math.max(MIN_WINDOW_MS_ABSOLUTE, fullDurationMs.value / MAX_ZOOM_SCALE),
  ),
);

const getWindowForScale = (scale) => {
  const clampedScale = clamp(scale, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE);
  const rawWindow = fullDurationMs.value / clampedScale;
  return clamp(rawWindow, minWindowMs.value, fullDurationMs.value);
};

const getScaleForWindow = (windowMs) =>
  clamp(fullDurationMs.value / Math.max(windowMs, 1), MIN_ZOOM_SCALE, MAX_ZOOM_SCALE);

const getClampedCenterTs = (targetCenterTs, windowMs = getWindowForScale(zoomScale.value)) => {
  const halfWindow = windowMs / 2;
  const minCenter = fullStartTs.value + halfWindow;
  const maxCenter = fullEndTs.value - halfWindow;
  if (minCenter >= maxCenter) return midpointTs.value;
  return clamp(targetCenterTs, minCenter, maxCenter);
};

const viewWindowMs = computed(() => getWindowForScale(zoomScale.value));
const viewCenterTs = computed(() => {
  const target = cameraCenterTs.value ?? midpointTs.value;
  return getClampedCenterTs(target, viewWindowMs.value);
});
const viewStartTs = computed(() => viewCenterTs.value - viewWindowMs.value / 2);
const viewEndTs = computed(() => viewCenterTs.value + viewWindowMs.value / 2);

const positionedEvents = computed(() => {
  const start = viewStartTs.value;
  const end = viewEndTs.value;
  const duration = Math.max(end - start, 1);

  const visible = filteredEvents.value
    .map((event) => ({ ...event, ts: new Date(event.date).getTime() }))
    .filter((event) => event.ts >= start && event.ts <= end)
    .sort((a, b) => a.ts - b.ts);

  const laneEnds = [];
  const minGapPct = 11;

  return visible.map((event) => {
    const positionPct = ((event.ts - start) / duration) * 100;
    let lane = laneEnds.findIndex((lastPosition) => positionPct - lastPosition >= minGapPct);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(positionPct);
    } else {
      laneEnds[lane] = positionPct;
    }

    return {
      ...event,
      positionPct: clamp(positionPct, 1.5, 98.5),
      lane,
      topOffset: 64 + lane * 66,
    };
  });
});

const laneCount = computed(() => {
  if (!positionedEvents.value.length) return 1;
  return Math.max(...positionedEvents.value.map((event) => event.lane + 1), 1);
});

const timelineHeight = computed(() => 180 + (laneCount.value - 1) * 66);

const fullRangeEvents = computed(() => {
  const duration = fullDurationMs.value;
  return filteredEvents.value.map((event) => {
    const ts = new Date(event.date).getTime();
    return {
      ...event,
      fullPositionPct: clamp(((ts - fullStartTs.value) / duration) * 100, 0, 100),
    };
  });
});

const minimapWindowWidthPct = computed(() =>
  clamp((viewWindowMs.value / fullDurationMs.value) * 100, 2, 100),
);
const minimapWindowLeftPct = computed(() => {
  const left = ((viewStartTs.value - fullStartTs.value) / fullDurationMs.value) * 100;
  return clamp(left, 0, 100 - minimapWindowWidthPct.value);
});

const visibleTicks = computed(() => {
  const tickCount = 8;
  const duration = Math.max(viewWindowMs.value, 1);
  return Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    const timestamp = viewStartTs.value + duration * ratio;
    return {
      timestamp,
      positionPct: ratio * 100,
      label: formatTick(timestamp),
    };
  });
});

const selectedEvent = computed(() => {
  if (!selectedEventId.value) return null;
  return (
    filteredEvents.value.find((event) => String(event.id) === String(selectedEventId.value)) || null
  );
});

const focusedEvent = computed(() => {
  if (!focusedEventId.value) return null;
  return (
    filteredEvents.value.find((event) => String(event.id) === String(focusedEventId.value)) || null
  );
});

const focusedCardStyle = computed(() => {
  const origin = focusedCardOrigin.value;
  if (!focusedEvent.value || !origin) {
    return null;
  }

  return {
    "--focus-origin-x": `${origin.x}px`,
    "--focus-origin-y": `${origin.y}px`,
    "--focus-origin-width": `${origin.width}px`,
    "--focus-origin-height": `${origin.height}px`,
    "--focus-settled-top": "50%",
  };
});

const detailModalEvent = computed(() => {
  if (!detailModalEventId.value) return null;
  return (
    filteredEvents.value.find((event) => String(event.id) === String(detailModalEventId.value)) ||
    timelineEvents.value
      .map((event) => normalizeEvent(event))
      .find((event) => String(event.id) === String(detailModalEventId.value)) ||
    null
  );
});

const attachmentSearchResults = computed(() => {
  const query = attachmentSearch.value.trim().toLowerCase();
  if (!query) return [];

  const linkedIds = new Set(eventDraft.linkedItems.map((item) => String(item.id)));
  return attachmentLibrary.value
    .filter((item) => matchesArtistScope(item.artist_id))
    .filter((item) => !linkedIds.has(String(item.id)))
    .filter((item) => {
      const haystack = [item.title, item.subtitle, item.meta, item.kindLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 8);
});

const canZoomIn = computed(
  () => zoomScale.value < MAX_ZOOM_SCALE - 0.01 && viewWindowMs.value > minWindowMs.value + 1,
);
const canZoomOut = computed(
  () => zoomScale.value > MIN_ZOOM_SCALE + 0.01 && viewWindowMs.value < fullDurationMs.value - 1,
);
const zoomDisplay = computed(() => `Zoom ${zoomScale.value.toFixed(1)}x`);
const cameraAnimationFrame = ref(null);

const registerEventElement = (eventId, element) => {
  if (!eventId) return;
  if (element) {
    eventElementMap.set(String(eventId), element);
    return;
  }
  eventElementMap.delete(String(eventId));
};

const getFocusedCardOrigin = (eventModel) => {
  if (!focusStage.value || !eventModel) return null;
  const eventElement = eventElementMap.get(String(eventModel.id));
  if (!eventElement) return null;

  const viewportRect = focusStage.value.getBoundingClientRect();
  const eventRect = eventElement.getBoundingClientRect();

  return {
    x: eventRect.left - viewportRect.left + eventRect.width / 2,
    y: eventRect.top - viewportRect.top + eventRect.height / 2,
    width: eventRect.width,
    height: eventRect.height,
  };
};

const clearFocusedCardState = () => {
  if (focusDismissTimeoutId.value) {
    clearTimeout(focusDismissTimeoutId.value);
    focusDismissTimeoutId.value = null;
  }
  focusedCardOrigin.value = null;
  focusedCardSettled.value = false;
};

/** Animated dismiss: reverse-glide card back toward origin, then remove. */
const dismissFocusedCard = () => {
  if (!focusedEventId.value) return;
  if (focusDismissTimeoutId.value) {
    clearTimeout(focusDismissTimeoutId.value);
  }
  // Remove settled → triggers CSS reverse transition (glide back + fade)
  focusedCardSettled.value = false;
  focusDismissTimeoutId.value = setTimeout(() => {
    focusedEventId.value = null;
    selectedEventId.value = null;
    clearFocusedCardState();
    focusDismissTimeoutId.value = null;
  }, FOCUS_CARD_TRANSITION_MS);
};

const stageFocusedEvent = (eventModel) => {
  if (focusDismissTimeoutId.value) {
    clearTimeout(focusDismissTimeoutId.value);
    focusDismissTimeoutId.value = null;
  }
  focusedCardOrigin.value = getFocusedCardOrigin(eventModel);
  focusedCardSettled.value = false;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (focusedEventId.value && String(focusedEventId.value) === String(eventModel.id)) {
        focusedCardSettled.value = true;
      }
    });
  });
};

const buildScopedQuery = (extraQuery = {}) => {
  const nextQuery = { ...route.query, ...extraQuery };
  if (scopedArtistSlug.value) {
    nextQuery.artist = scopedArtistSlug.value;
  }
  return nextQuery;
};

const openLinkedItem = (item) => {
  if (!item) return;

  const sharedQuery = buildScopedQuery();

  if (item.routeName === "MoodboardDetail" && item.routeParams?.id) {
    router.push({
      name: item.routeName,
      params: item.routeParams,
      query: sharedQuery,
    });
    return;
  }

  if (item.routeName === "playlist-detail" && item.routeParams?.id) {
    router.push({
      name: item.routeName,
      params: item.routeParams,
      query: sharedQuery,
    });
    return;
  }

  const routeName =
    item.routeName ||
    {
      song: "songs",
      playlist: "playlists",
      note: "Notes",
      file: "Files",
      media: "media-library",
      moodboard: "Moodboards",
    }[item.type];

  if (!routeName) return;

  router.push({
    name: routeName,
    query: buildScopedQuery({
      focus: item.sourceId || item.id,
    }),
  });
};

const openDetailModal = (event) => {
  if (!event) return;
  selectedEventId.value = event.id;
  detailModalEventId.value = event.id;
  detailModalOpen.value = true;
};

const closeDetailModal = () => {
  detailModalOpen.value = false;
  detailModalEventId.value = null;
};

const addLinkedItemToDraft = (item) => {
  if (!item || eventDraft.linkedItems.some((entry) => String(entry.id) === String(item.id))) {
    return;
  }
  eventDraft.linkedItems.push(normalizeLinkedItem(item));
  attachmentSearch.value = "";
};

const removeLinkedItemFromDraft = (linkedItemId) => {
  eventDraft.linkedItems = eventDraft.linkedItems.filter(
    (item) => String(item.id) !== String(linkedItemId),
  );
};

const buildAttachmentLibrary = async () => {
  const nextItems = [];

  try {
    await dashboardStore.loadDashboardData?.();
  } catch {
    // Dashboard store already hydrates mock artists locally.
  }

  try {
    const { data } = await apiService.getAll("media");
    nextItems.push(
      ...(data || []).map((mediaItem) =>
        normalizeLinkedItem({
          id: `media-${mediaItem.id}`,
          sourceId: mediaItem.id,
          type: mediaItem.media_type === "audio" ? "song" : "media",
          kindLabel: mediaItem.media_type === "audio" ? "Song" : "Media",
          title: mediaItem.title || mediaItem.file_name,
          subtitle: mediaItem.description || mediaItem.file_name,
          meta: mediaItem.mime_type || mediaItem.media_type,
          artist_id: mediaItem.artist_id || null,
          routeName: mediaItem.media_type === "audio" ? "songs" : "media-library",
        }),
      ),
    );
  } catch {
    // Ignore and keep building with local stores.
  }

  try {
    const { data } = await apiService.getAll("media_files");
    nextItems.push(
      ...(data || []).map((fileItem) =>
        normalizeLinkedItem({
          id: `file-${fileItem.id}`,
          sourceId: fileItem.id,
          type: "file",
          kindLabel: "File",
          title: fileItem.name,
          subtitle: fileItem.type,
          meta: fileItem.url || "",
          routeName: "Files",
        }),
      ),
    );
  } catch {
    // Ignore and keep building with local stores.
  }

  try {
    const { data } = await apiService.getAll("notes");
    nextItems.push(
      ...(data || []).map((note) =>
        normalizeLinkedItem({
          id: `note-${note.id}`,
          sourceId: note.id,
          type: "note",
          kindLabel: "Note",
          title: note.title,
          subtitle: note.content,
          meta: note.category || note.status || "",
          artist_id: note.artist_id || null,
          routeName: "Notes",
        }),
      ),
    );
  } catch {
    // Ignore and keep building with local stores.
  }

  try {
    await playlistsStore.loadPlaylists();
    nextItems.push(
      ...playlistsStore.playlists.map((playlist) =>
        normalizeLinkedItem({
          id: `playlist-${playlist.id}`,
          sourceId: playlist.id,
          type: "playlist",
          kindLabel: "Playlist",
          title: playlist.name,
          subtitle: playlist.description,
          meta: `${playlist.song_count || playlist.track_ids?.length || 0} songs`,
          artist_id: playlist.artist_id || null,
          routeName: "playlist-detail",
          routeParams: { id: playlist.id },
        }),
      ),
    );
  } catch {
    // Ignore and keep building with local stores.
  }

  try {
    await moodboardsStore.loadMoodboards();
    nextItems.push(
      ...moodboardsStore.moodboards.map((board) =>
        normalizeLinkedItem({
          id: `moodboard-${board.id}`,
          sourceId: board.id,
          type: "moodboard",
          kindLabel: "Moodboard",
          title: board.title,
          subtitle: board.description,
          meta: `${board.item_count || board.items?.length || 0} items`,
          artist_id: board.artist_id || null,
          routeName: "MoodboardDetail",
          routeParams: { id: board.id },
        }),
      ),
    );
  } catch {
    // Ignore and keep building with local stores.
  }

  attachmentLibrary.value = nextItems.filter(
    (item, index, collection) =>
      collection.findIndex((entry) => String(entry.id) === String(item.id)) === index,
  );
};

const cancelMomentum = () => {
  if (inertiaFrameId.value) {
    cancelAnimationFrame(inertiaFrameId.value);
    inertiaFrameId.value = null;
  }
};

const cancelCameraAnimation = () => {
  if (cameraAnimationFrame.value) {
    cancelAnimationFrame(cameraAnimationFrame.value);
    cameraAnimationFrame.value = null;
  }
};

const cancelDetailFlip = () => {
  if (detailFlipTimeoutId.value) {
    clearTimeout(detailFlipTimeoutId.value);
    detailFlipTimeoutId.value = null;
  }
  flippingEventId.value = null;
};

const easeInOutCubic = (value) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

const animateCameraTo = ({ targetScale, targetCenterTs, duration = 260 }) => {
  cancelCameraAnimation();

  const startScale = zoomScale.value;
  const startCenterTs = viewCenterTs.value;
  const nextWindow = getWindowForScale(targetScale);
  const safeTargetCenterTs = getClampedCenterTs(targetCenterTs, nextWindow);
  const safeTargetScale = getScaleForWindow(nextWindow);
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutCubic(progress);

    zoomScale.value = startScale + (safeTargetScale - startScale) * eased;
    cameraCenterTs.value = startCenterTs + (safeTargetCenterTs - startCenterTs) * eased;

    if (progress < 1) {
      cameraAnimationFrame.value = requestAnimationFrame(step);
      return;
    }

    zoomScale.value = safeTargetScale;
    cameraCenterTs.value = safeTargetCenterTs;
    cameraAnimationFrame.value = null;
  };

  cameraAnimationFrame.value = requestAnimationFrame(step);
};

const panByPixels = (deltaPx) => {
  const viewportWidth = timelineViewport.value?.clientWidth || 1;
  const shiftRatio = deltaPx / viewportWidth;
  const shiftTs = -shiftRatio * viewWindowMs.value;
  cameraCenterTs.value = getClampedCenterTs(viewCenterTs.value + shiftTs, viewWindowMs.value);
};

const applyZoomAtRatio = (nextScale, focusRatio = 0.5) => {
  const ratio = clamp(focusRatio, 0, 1);
  const currentWindow = viewWindowMs.value;
  const focusTs = viewStartTs.value + currentWindow * ratio;
  const nextWindow = getWindowForScale(nextScale);
  const nextCenterTs = focusTs - ratio * nextWindow + nextWindow / 2;

  zoomScale.value = getScaleForWindow(nextWindow);
  cameraCenterTs.value = getClampedCenterTs(nextCenterTs, nextWindow);
};

const startMomentum = (velocityPxPerMs) => {
  cancelMomentum();
  let velocity = velocityPxPerMs;
  if (Math.abs(velocity) < 0.02) return;

  let previousTime = performance.now();
  const step = (currentTime) => {
    const dt = currentTime - previousTime;
    previousTime = currentTime;

    panByPixels(velocity * dt);
    velocity *= Math.pow(0.92, dt / 16);

    if (Math.abs(velocity) < 0.01 || isPanning.value || isPinching.value) {
      inertiaFrameId.value = null;
      return;
    }

    inertiaFrameId.value = requestAnimationFrame(step);
  };

  inertiaFrameId.value = requestAnimationFrame(step);
};

const getPinchDistance = () => {
  const [pointA, pointB] = Array.from(activePointers.values());
  if (!pointA || !pointB) return 0;
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
};

const getPinchMidRatio = () => {
  const [pointA, pointB] = Array.from(activePointers.values());
  const rect = timelineViewport.value?.getBoundingClientRect();
  if (!pointA || !pointB || !rect || rect.width <= 0) return 0.5;

  const midpointX = (pointA.x + pointB.x) / 2;
  return clamp((midpointX - rect.left) / rect.width, 0, 1);
};

const zoomIn = () => {
  const focusTs = selectedEvent.value
    ? new Date(selectedEvent.value.date).getTime()
    : viewCenterTs.value;
  const nextScale = Math.min(zoomScale.value * ZOOM_STEP_FACTOR, MAX_ZOOM_SCALE);
  animateCameraTo({ targetScale: nextScale, targetCenterTs: focusTs });
};

const zoomOut = () => {
  animateCameraTo({
    targetScale: Math.max(zoomScale.value / ZOOM_STEP_FACTOR, MIN_ZOOM_SCALE),
    targetCenterTs: viewCenterTs.value,
  });
};

const resetZoom = () => {
  cancelDetailFlip();
  focusedEventId.value = null;
  clearFocusedCardState();
  zoomScale.value = MIN_ZOOM_SCALE;
  cameraCenterTs.value = null;
};

const handleViewportClick = () => {
  if (performance.now() < suppressClickUntil.value || isPanning.value || isPinching.value) return;
  if (!timelineViewport.value) return;

  // Click on empty viewport area: animated dismiss, then clear.
  cancelDetailFlip();
  if (focusedEventId.value) {
    dismissFocusedCard();
  } else {
    selectedEventId.value = null;
  }
};

const handleViewportWheel = (event) => {
  if (viewMode.value !== "chronological") return;
  cancelMomentum();

  const rect = timelineViewport.value?.getBoundingClientRect();
  if (!rect) return;

  const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const pinchLikeWheel = event.ctrlKey || event.metaKey || event.altKey;

  if (pinchLikeWheel) {
    const zoomFactor = Math.exp(-event.deltaY * 0.0025);
    applyZoomAtRatio(zoomScale.value * zoomFactor, ratio);
    suppressClickUntil.value = performance.now() + 90;
    return;
  }

  const panDelta = event.deltaX + event.deltaY * 0.65;
  panByPixels(panDelta);
};

const handlePointerDown = (event) => {
  if (viewMode.value !== "chronological") return;
  if (event.target?.closest?.(".timeline-event")) {
    return;
  }
  cancelMomentum();

  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  timelineViewport.value?.setPointerCapture?.(event.pointerId);

  if (activePointers.size === 1) {
    isPanning.value = true;
    isPinching.value = false;
    panSession.startX = event.clientX;
    panSession.lastX = event.clientX;
    panSession.lastTime = performance.now();
    panSession.velocityPxPerMs = 0;
    panSession.moved = false;
  } else if (activePointers.size >= 2) {
    isPinching.value = true;
    isPanning.value = false;
    pinchSession.startDistance = Math.max(getPinchDistance(), 1);
    pinchSession.startScale = zoomScale.value;
    panSession.moved = true;
  }

  event.preventDefault();
};

const handlePointerMove = (event) => {
  if (!activePointers.has(event.pointerId) || viewMode.value !== "chronological") return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (isPinching.value && activePointers.size >= 2) {
    const distance = Math.max(getPinchDistance(), 1);
    const ratio = getPinchMidRatio();
    const scaleFactor = distance / Math.max(pinchSession.startDistance, 1);
    applyZoomAtRatio(pinchSession.startScale * scaleFactor, ratio);
    suppressClickUntil.value = performance.now() + 130;
    event.preventDefault();
    return;
  }

  if (isPanning.value && activePointers.size === 1) {
    const now = performance.now();
    const dx = event.clientX - panSession.lastX;
    const dt = Math.max(1, now - panSession.lastTime);

    panSession.velocityPxPerMs = dx / dt;
    panSession.lastX = event.clientX;
    panSession.lastTime = now;
    panByPixels(dx);

    if (!panSession.moved && Math.abs(event.clientX - panSession.startX) > 3) {
      panSession.moved = true;
    }
    if (panSession.moved) {
      suppressClickUntil.value = performance.now() + 130;
    }

    event.preventDefault();
  }
};

const handlePointerUp = (event) => {
  if (activePointers.has(event.pointerId)) {
    activePointers.delete(event.pointerId);
  }
  timelineViewport.value?.releasePointerCapture?.(event.pointerId);

  if (activePointers.size >= 2) return;

  if (isPinching.value && activePointers.size === 1) {
    const [remainingPointer] = Array.from(activePointers.values());
    isPinching.value = false;
    isPanning.value = true;
    panSession.startX = remainingPointer.x;
    panSession.lastX = remainingPointer.x;
    panSession.lastTime = performance.now();
    panSession.velocityPxPerMs = 0;
    panSession.moved = true;
    return;
  }

  if (activePointers.size === 0) {
    if (isPanning.value && panSession.moved) {
      startMomentum(panSession.velocityPxPerMs);
    }
    isPanning.value = false;
    isPinching.value = false;
  }
};

const handleMinimapClick = (event) => {
  const track = event.currentTarget?.querySelector(".minimap-track");
  if (!track) return;

  const rect = track.getBoundingClientRect();
  const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const targetTs = fullStartTs.value + ratio * fullDurationMs.value;
  cameraCenterTs.value = getClampedCenterTs(targetTs, viewWindowMs.value);
};

const handleEventClick = (eventModel) => {
  if (performance.now() < suppressClickUntil.value) return;
  const sameFocusedEvent = String(focusedEventId.value) === String(eventModel.id);

  selectedEventId.value = eventModel.id;

  if (sameFocusedEvent) {
    triggerFocusedEventOpen(eventModel);
    return;
  }

  // Coverflow-style first click:
  // hand the event off into the focus stage as the primary motion.
  // Avoid competing rail camera motion here; the card glide is the focus cue.
  cancelDetailFlip();
  cancelCameraAnimation();
  closeDetailModal();
  focusedEventId.value = eventModel.id;
  stageFocusedEvent(eventModel);
};

const triggerFocusedEventOpen = (eventModel) => {
  if (!eventModel) return;
  cancelDetailFlip();
  flippingEventId.value = eventModel.id;
  detailFlipTimeoutId.value = setTimeout(() => {
    openDetailModal(eventModel);
    detailFlipTimeoutId.value = null;
    setTimeout(() => {
      if (String(flippingEventId.value) === String(eventModel.id)) {
        flippingEventId.value = null;
      }
    }, EVENT_FLIP_RESET_MS);
  }, EVENT_FLIP_DELAY_MS);
};

const handleStackedEventClick = (event) => {
  cancelDetailFlip();
  focusedEventId.value = event.id;
  selectedEventId.value = event.id;
  clearFocusedCardState();
  openDetailModal(event);
};

const openCreateEventModalForTemplate = (template, targetTs = Date.now()) => {
  eventModalMode.value = "create";
  resetEventDraft();
  eventDraft.type = template.type;
  eventDraft.title = template.title;
  eventDraft.description = template.description;
  eventDraft.date = new Date(targetTs).toISOString().split("T")[0];
  eventModalOpen.value = true;
};

const handleQuickInsertDragStart = (template, event) => {
  timelineDropActive.value = true;
  event.dataTransfer?.setData(TIMELINE_INSERT_MIME, JSON.stringify(template));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "copy";
  }
};

const handleQuickInsertDragEnd = () => {
  timelineDropActive.value = false;
};

const handleTimelineDragOver = () => {
  timelineDropActive.value = true;
};

const handleTimelineDragEnter = () => {
  timelineDropActive.value = true;
};

const handleTimelineDragLeave = (event) => {
  if (event.currentTarget === event.target) {
    timelineDropActive.value = false;
  }
};

const handleTimelineDrop = (event) => {
  timelineDropActive.value = false;
  const rawTemplate = event.dataTransfer?.getData(TIMELINE_INSERT_MIME);
  if (!rawTemplate || !timelineViewport.value) return;

  try {
    const template = JSON.parse(rawTemplate);
    const rect = timelineViewport.value.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const targetTs = viewStartTs.value + viewWindowMs.value * ratio;
    openCreateEventModalForTemplate(template, targetTs);
  } catch {
    showToast({ message: "Could not place that event on the timeline", type: "error" });
  }
};

const handleGestureStart = (event) => {
  if (viewMode.value !== "chronological") return;
  cancelMomentum();
  isPinching.value = true;
  gestureStartScale.value = zoomScale.value;
  suppressClickUntil.value = performance.now() + 160;
  event.preventDefault();
};

const handleGestureChange = (event) => {
  if (viewMode.value !== "chronological") return;
  const rect = timelineViewport.value?.getBoundingClientRect();
  const ratio =
    rect && rect.width > 0 ? clamp((event.clientX - rect.left) / rect.width, 0, 1) : 0.5;
  applyZoomAtRatio(gestureStartScale.value * (event.scale || 1), ratio);
  suppressClickUntil.value = performance.now() + 160;
  event.preventDefault();
};

const handleGestureEnd = (event) => {
  isPinching.value = false;
  suppressClickUntil.value = performance.now() + 100;
  event.preventDefault();
};

const bindGestureListeners = (element) => {
  if (!element) return;
  element.addEventListener("gesturestart", handleGestureStart, { passive: false });
  element.addEventListener("gesturechange", handleGestureChange, { passive: false });
  element.addEventListener("gestureend", handleGestureEnd, { passive: false });
};

const unbindGestureListeners = (element) => {
  if (!element) return;
  element.removeEventListener("gesturestart", handleGestureStart);
  element.removeEventListener("gesturechange", handleGestureChange);
  element.removeEventListener("gestureend", handleGestureEnd);
};

const loadEvents = async () => {
  const cached = localStorage.getItem(TIMELINE_STORAGE_KEY);
  if (cached) {
    try {
      timelineEvents.value = JSON.parse(cached).map(normalizeEvent);
      return;
    } catch {
      localStorage.removeItem(TIMELINE_STORAGE_KEY);
    }
  }

  try {
    const result = await apiService.getAll("timeline_events");
    timelineEvents.value =
      result.data?.length > 0 ? result.data.map(normalizeEvent) : mockEvents.map(normalizeEvent);
  } catch {
    timelineEvents.value = mockEvents.map(normalizeEvent);
  }
};

const resetEventDraft = () => {
  eventDraft.title = "";
  eventDraft.type = "milestone";
  eventDraft.date = new Date().toISOString().split("T")[0];
  eventDraft.description = "";
  eventDraft.linkedItems = [];
  attachmentSearch.value = "";
  activeEventId.value = "";
};

const openCreateEventModal = () => {
  eventModalMode.value = "create";
  resetEventDraft();
  eventModalOpen.value = true;
};

const openEditEventModal = (event) => {
  if (!event) return;
  eventModalMode.value = "edit";
  activeEventId.value = event.id;
  eventDraft.title = event.title || "";
  eventDraft.type = event.type || "milestone";
  eventDraft.date = new Date(event.date || new Date()).toISOString().split("T")[0];
  eventDraft.description = event.description || "";
  eventDraft.linkedItems = Array.isArray(event.linkedItems)
    ? event.linkedItems.map((item) => normalizeLinkedItem(item))
    : [];
  attachmentSearch.value = "";
  closeDetailModal();
  eventModalOpen.value = true;
};

const closeEventModal = () => {
  eventModalOpen.value = false;
  resetEventDraft();
};

const submitEventModal = () => {
  const title = eventDraft.title.trim();
  if (!title) return;

  const type = ["release", "performance", "milestone", "collaboration"].includes(eventDraft.type)
    ? eventDraft.type
    : "milestone";
  const parsedDate = new Date(eventDraft.date || "");
  const date = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();
  const description = eventDraft.description.trim();

  if (eventModalMode.value === "create") {
    const event = normalizeEvent({
      id: `event-${Date.now()}`,
      title,
      type,
      date,
      description,
      details: {},
      artist_id: scopedArtist.value?.id || null,
      linkedItems: eventDraft.linkedItems,
    });

    timelineEvents.value.push(event);
    selectedEventId.value = event.id;

    apiService
      .create("timeline_events", {
        title: event.title,
        event_type: event.type,
        event_date: event.date.split("T")[0],
        description: event.description,
        artist_id: event.artist_id,
        metadata: {
          ...event.details,
          artist_id: event.artist_id,
          linkedItems: event.linkedItems,
        },
        is_public: false,
      })
      .catch(() => {});

    showToast({ message: `Added "${event.title}"`, type: "success" });
    closeEventModal();
    return;
  }

  const event = timelineEvents.value.find(
    (entry) => String(entry.id) === String(activeEventId.value),
  );
  if (!event) return;

  event.title = title;
  event.description = description;
  event.type = type;
  event.date = date;
  event.linkedItems = eventDraft.linkedItems.map((item) => normalizeLinkedItem(item));
  event.artist_id = event.artist_id || scopedArtist.value?.id || null;

  apiService
    .update("timeline_events", event.id, {
      title: event.title,
      description: event.description,
      event_type: event.type,
      event_date: event.date.split("T")[0],
      artist_id: event.artist_id,
      metadata: {
        ...event.details,
        artist_id: event.artist_id,
        linkedItems: event.linkedItems,
      },
    })
    .catch(() => {});

  showToast({ message: `Updated "${event.title}"`, type: "success" });
  closeEventModal();
};

const deleteEvent = async (event) => {
  pendingDeleteEvent.value = event;
  deleteEventModalOpen.value = true;
};

const closeDeleteEventModal = () => {
  deleteEventModalOpen.value = false;
  pendingDeleteEvent.value = null;
};

const confirmDeleteEvent = async () => {
  if (!pendingDeleteEvent.value) return;

  const event = pendingDeleteEvent.value;

  try {
    try {
      await apiService.delete("timeline_events", event.id);
    } catch {
      // Local demo fallback.
    }

    timelineEvents.value = timelineEvents.value.filter((entry) => entry.id !== event.id);
    if (selectedEventId.value === event.id) {
      selectedEventId.value = null;
    }
    if (focusedEventId.value === event.id) {
      focusedEventId.value = null;
      clearFocusedCardState();
      cancelDetailFlip();
    }
    if (detailModalEventId.value === event.id) {
      closeDetailModal();
    }

    showToast({ message: "Event deleted", type: "success" });
  } catch {
    showToast({ message: "Failed to delete event", type: "error" });
  } finally {
    closeDeleteEventModal();
  }
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTick = (timestamp) => {
  const durationDays = viewWindowMs.value / MS_DAY;
  if (durationDays > 400) {
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  if (durationDays > 45) {
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return new Date(timestamp).toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
};

const formatRange = (startTs, endTs) => {
  const start = new Date(startTs);
  const end = new Date(endTs);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};

const formatType = (type) => {
  const types = {
    release: "Release",
    performance: "Performance",
    milestone: "Milestone",
    collaboration: "Collaboration",
  };
  return types[type] || type;
};

const formatLabel = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());

const copyTimelineEventDate = async (event) => {
  const value = new Date(event.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  try {
    await navigator.clipboard.writeText(value);
    showToast({ message: "Event date copied", type: "success" });
  } catch {
    showToast({ message: value, type: "info" });
  }
};

const openEventContextMenu = (event, timelineEvent) => {
  showContextMenu(
    event,
    [
      {
        label: "Open Details",
        handler: () => {
          openDetailModal(timelineEvent);
        },
      },
      {
        label: "Edit Event",
        handler: () => {
          selectedEventId.value = timelineEvent.id;
          openEditEventModal(timelineEvent);
        },
      },
      {
        label: `Show ${formatType(timelineEvent.type)}`,
        handler: () => {
          filterType.value = timelineEvent.type;
          focusedEventId.value = timelineEvent.id;
          selectedEventId.value = timelineEvent.id;
          stageFocusedEvent(timelineEvent);
        },
      },
      {
        label: "Copy Date",
        handler: () => copyTimelineEventDate(timelineEvent),
      },
      { separator: true },
      {
        label: "Delete Event",
        destructive: true,
        handler: () => deleteEvent(timelineEvent),
      },
    ],
    "custom",
  );
};

const openTimelineWorkspaceMenu = (event) => {
  if (event.target.closest(".timeline-event") || event.target.closest(".stacked-item")) return;

  showContextMenu(
    event,
    [
      { label: "Add Event", handler: () => openCreateEventModal() },
      { separator: true },
      {
        label: "Show All Events",
        handler: () => {
          filterType.value = "";
          timeRange.value = "all";
        },
      },
      {
        label: "Chronological View",
        handler: () => {
          viewMode.value = "chronological";
        },
      },
      {
        label: "Stacked List View",
        handler: () => {
          viewMode.value = "stacked";
        },
      },
      {
        label: "Reset Zoom",
        handler: () => {
          viewMode.value = "chronological";
          resetZoom();
        },
      },
      { separator: true },
      {
        label: "Quick Add Milestone",
        handler: () => openCreateEventModalForTemplate(quickInsertTemplates[0]),
      },
    ],
    "custom",
  );
};

watch([filterType, timeRange], () => {
  resetZoom();
  focusedEventId.value = null;
  clearFocusedCardState();
  cancelDetailFlip();
  selectedEventId.value = null;
});

watch(viewMode, () => {
  cancelDetailFlip();
  closeDetailModal();
  focusedEventId.value = null;
  clearFocusedCardState();
  selectedEventId.value = null;
});

watch(
  filteredEvents,
  (events) => {
    if (!events.length) {
      cancelDetailFlip();
      focusedEventId.value = null;
      clearFocusedCardState();
      selectedEventId.value = null;
      resetZoom();
      return;
    }

    cameraCenterTs.value = getClampedCenterTs(viewCenterTs.value, viewWindowMs.value);
    zoomScale.value = getScaleForWindow(viewWindowMs.value);

    if (selectedEventId.value && !events.some((event) => event.id === selectedEventId.value)) {
      selectedEventId.value = null;
    }
    if (focusedEventId.value && !events.some((event) => event.id === focusedEventId.value)) {
      focusedEventId.value = null;
      clearFocusedCardState();
      cancelDetailFlip();
    }
    if (
      detailModalEventId.value &&
      !events.some((event) => String(event.id) === String(detailModalEventId.value))
    ) {
      closeDetailModal();
    }
  },
  { immediate: true },
);

watch(
  timelineEvents,
  (value) => {
    localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true },
);

watch(timelineViewport, (element, previousElement) => {
  if (previousElement) {
    unbindGestureListeners(previousElement);
  }
  if (element) {
    gestureTarget = element;
    bindGestureListeners(element);
  }
});

onMounted(() => {
  loadEvents();
  buildAttachmentLibrary();
});

onUnmounted(() => {
  cancelMomentum();
  cancelCameraAnimation();
  cancelDetailFlip();
  activePointers.clear();
  if (gestureTarget) {
    unbindGestureListeners(gestureTarget);
  }
});
</script>

<style scoped>
.timeline-view {
  min-height: 100%;
  background: #000;
  color: #fff;
  padding-bottom: 0;
}

.timeline-header {
  position: relative;
  padding: 42px 48px 0;
}

.header-background {
  position: absolute;
  inset: 0 0 auto;
  height: 230px;
  background:
    radial-gradient(circle at 8% 20%, rgba(232, 90, 25, 0.2), transparent 35%),
    radial-gradient(circle at 84% 0%, rgba(214, 64, 50, 0.14), transparent 28%);
  pointer-events: none;
}

.header-content {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.title-block h1 {
  margin: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 12px;
  font-size: 44px;
  font-weight: 260;
  letter-spacing: -0.03em;
}

.title-count {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.38);
}

.title-block p {
  margin: 10px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.62);
}

.primary-btn {
  min-height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 520;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn svg {
  width: 16px;
  height: 16px;
}

.primary-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.timeline-controls {
  width: 100%;
  margin-top: 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.control-group {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.control-group label {
  min-width: 150px;
  display: grid;
  gap: 4px;
}

.control-group label span {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
}

.control-group select {
  min-height: 36px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  padding: 0 10px;
}

.control-group.right {
  justify-content: flex-end;
}

.mode-toggle {
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
}

.mode-btn {
  min-height: 34px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  padding: 0 12px;
  cursor: pointer;
}

.mode-btn.active {
  color: var(--color-accent);
  background: rgba(232, 90, 25, 0.14);
}

.zoom-controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.zoom-controls span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.zoom-btn {
  min-width: 34px;
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
}

.zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.timeline-body {
  margin-top: 0;
  padding: 0 0 40px;
}

.empty-state {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 28px;
  display: grid;
  gap: 10px;
  justify-items: start;
}

.empty-state h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 400;
}

.empty-state p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}

.chronological-layout {
  position: relative;
  display: grid;
  gap: 14px;
}

.timeline-overview-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.overview-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px;
  display: grid;
  gap: 4px;
}

.overview-card span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.48);
}

.overview-card strong {
  font-size: 14px;
  font-weight: 540;
}

.timeline-viewport {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)),
    radial-gradient(circle at 20% 20%, rgba(232, 90, 25, 0.14), transparent 35%);
  overflow: hidden;
  cursor: zoom-in;
  perspective: 1400px;
  perspective-origin: center 30%;
}

.timeline-viewport.has-focused-event .timeline-axis,
.timeline-viewport.has-focused-event .timeline-tick,
.timeline-viewport.has-focused-event .timeline-event:not(.focused) {
  opacity: 0.12;
  pointer-events: none;
  filter: blur(1px);
  transition:
    opacity 0.4s ease,
    filter 0.4s ease;
}

.timeline-viewport.has-focused-event {
  cursor: default;
}

.timeline-axis {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 44px;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(232, 90, 25, 0.18),
    rgba(232, 90, 25, 0.6),
    rgba(214, 64, 50, 0.36)
  );
}

.timeline-tick {
  position: absolute;
  top: 20px;
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.22);
}

.tick-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.52);
  white-space: nowrap;
}

.timeline-event {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  min-width: 160px;
  max-width: 220px;
  padding: 8px 10px;
  display: grid;
  gap: 4px;
  text-align: left;
  transform: translateX(-50%);
  transform-origin: center center;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.24s ease,
    opacity 0.2s ease,
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 2;
}

.timeline-event:hover {
  transform: translateX(-50%) translateY(-2px);
  border-color: rgba(255, 255, 255, 0.28);
}

.timeline-event.selected {
  border-color: rgba(232, 90, 25, 0.36);
  background: rgba(232, 90, 25, 0.12);
  box-shadow: 0 0 0 1px rgba(232, 90, 25, 0.18);
  z-index: 6;
}

.timeline-event.focused {
  transform: translateX(-50%) scale(1.04);
  border-color: rgba(232, 90, 25, 0.42);
  background: rgba(232, 90, 25, 0.14);
  box-shadow:
    0 16px 34px rgba(0, 0, 0, 0.24),
    0 0 0 1px rgba(232, 90, 25, 0.2);
  z-index: 8;
}

.timeline-viewport.has-focused-event .timeline-event.focused {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) scale(0.96);
  box-shadow: none;
  transition:
    opacity 0.32s ease,
    transform 0.62s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.timeline-event.flipping {
  transform: translateX(-50%) scale(0.96);
  opacity: 0.08;
  z-index: 10;
}

.timeline-viewport-shell {
  position: relative;
}

.timeline-focus-stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 24;
  overflow: visible;
}

.timeline-focus-stage.active::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(250, 250, 248, 0.14), rgba(250, 250, 248, 0.02)),
    radial-gradient(circle at 50% 50%, rgba(19, 18, 17, 0.12), transparent 48%);
  pointer-events: none;
  transition: opacity 0.42s ease;
}

.focused-event-card {
  position: absolute;
  left: var(--focus-origin-x, 50%);
  top: var(--focus-origin-y, 50%);
  width: var(--focus-origin-width, min(420px, calc(100% - 56px)));
  min-height: var(--focus-origin-height, 86px);
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(232, 90, 25, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(250, 250, 248, 0.92)),
    var(--color-surface);
  color: var(--color-text);
  display: grid;
  gap: 8px;
  text-align: left;
  transform: translate(-50%, -50%) scale(0.9) translateZ(0);
  transform-style: preserve-3d;
  backface-visibility: hidden;
  box-shadow:
    0 8px 18px rgba(19, 18, 17, 0.08),
    0 0 0 1px rgba(232, 90, 25, 0.06);
  z-index: 12;
  cursor: default;
  opacity: 0.7;
  pointer-events: none;
  transition:
    left 0.62s cubic-bezier(0.2, 0.9, 0.2, 1),
    top 0.62s cubic-bezier(0.2, 0.9, 0.2, 1),
    width 0.62s cubic-bezier(0.2, 0.9, 0.2, 1),
    min-height 0.62s cubic-bezier(0.2, 0.9, 0.2, 1),
    padding 0.62s cubic-bezier(0.2, 0.9, 0.2, 1),
    border-radius 0.62s cubic-bezier(0.2, 0.9, 0.2, 1),
    transform 0.62s cubic-bezier(0.2, 0.9, 0.2, 1),
    opacity 0.24s ease,
    box-shadow 0.62s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.focused-event-card.is-settled {
  left: 50%;
  top: var(--focus-settled-top, 210px);
  width: min(540px, calc(100% - 64px));
  min-height: 236px;
  padding: 24px 26px;
  border-radius: 22px;
  transform: translate(-50%, -50%) scale(1) translateZ(0);
  box-shadow:
    0 42px 84px rgba(19, 18, 17, 0.28),
    0 0 0 1px rgba(232, 90, 25, 0.14);
  opacity: 1;
  pointer-events: auto;
  cursor: pointer;
}

.focused-event-card.is-settled:hover {
  transform: translate(-50%, -50%) scale(1.02) translateZ(0);
}

.focused-event-card.flipping {
  transform: translate(-50%, -50%) perspective(1000px) rotateY(88deg) scale(0.94);
  opacity: 0.06;
  box-shadow: none;
  pointer-events: none;
  transition:
    transform 0.38s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.22s ease,
    box-shadow 0.18s ease;
}

.focused-event-card:not(.is-settled) .focused-event-copy,
.focused-event-card:not(.is-settled) .focused-event-hint {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  margin: 0;
}

.focused-event-kicker {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.focused-event-title {
  font-size: 2rem;
  line-height: 1;
  letter-spacing: -0.03em;
}

.focused-event-date {
  font-size: 1rem;
  color: var(--color-text-secondary);
}

.focused-event-copy {
  max-width: 40ch;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.focused-event-hint {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-accent);
}

.focused-event-date,
.focused-event-copy,
.focused-event-hint {
  color: var(--color-text-secondary);
}

.focused-event-copy {
  margin: 0;
  line-height: 1.45;
}

.focused-event-hint {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.timeline-event .event-dot {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.82);
}

.timeline-event.release .event-dot {
  background: var(--color-accent);
}

.timeline-event.performance .event-dot {
  background: var(--color-warning);
}

.timeline-event.milestone .event-dot {
  background: var(--color-info);
}

.timeline-event.collaboration .event-dot {
  background: var(--color-danger);
}

.event-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.event-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.62);
}

.timeline-minimap {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  padding: 10px 12px;
  display: grid;
  gap: 8px;
  cursor: pointer;
}

.minimap-track {
  position: relative;
  min-height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.minimap-point {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
}

.minimap-window {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 6px;
  border: 1px solid rgba(232, 90, 25, 0.32);
  background: rgba(232, 90, 25, 0.12);
}

.timeline-minimap p {
  margin: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.58);
}

.selected-event-panel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  padding: 14px;
  display: grid;
  gap: 10px;
}

.selected-event-panel.empty {
  color: rgba(255, 255, 255, 0.54);
  min-height: 68px;
  align-items: center;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.panel-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 520;
}

.panel-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.event-state {
  height: fit-content;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-state.release {
  background: rgba(232, 90, 25, 0.12);
  color: var(--color-accent);
}

.event-state.performance {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.event-state.milestone {
  background: rgba(19, 18, 17, 0.08);
  color: var(--color-info);
}

.event-state.collaboration {
  background: rgba(214, 64, 50, 0.12);
  color: var(--color-danger);
}

.panel-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.76);
}

.panel-details {
  display: grid;
  gap: 7px;
}

.detail-row {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.01);
  min-height: 34px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.detail-row span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.56);
}

.detail-row strong {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.panel-actions {
  display: inline-flex;
  gap: 8px;
}

.panel-btn {
  min-height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 500;
  padding: 0 12px;
  cursor: pointer;
}

.panel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.panel-btn.danger {
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.35);
}

.stacked-layout {
  display: grid;
  gap: 10px;
}

.stacked-item {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.stacked-item-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.stacked-item-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 550;
}

.stacked-item-head span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.stacked-item p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.stacked-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.event-type-pill {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-type-pill.release {
  background: rgba(232, 90, 25, 0.12);
  color: var(--color-accent);
}

.event-type-pill.performance {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.event-type-pill.milestone {
  background: rgba(19, 18, 17, 0.08);
  color: var(--color-info);
}

.event-type-pill.collaboration {
  background: rgba(214, 64, 50, 0.12);
  color: var(--color-danger);
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

.confirm-copy {
  margin-bottom: 18px;
  padding: 16px 18px;
  border-radius: 18px;
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

.modal-close,
.modal-ghost-btn,
.modal-primary-btn,
.modal-danger-btn {
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

.modal-danger-btn {
  min-height: 44px;
  padding: 0 18px;
  background: rgba(239, 68, 68, 0.14);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fecaca;
  font-weight: 600;
}

.modal-danger-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.modal-form {
  display: grid;
  gap: 14px;
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
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

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-ghost-btn,
.modal-primary-btn {
  min-height: 42px;
  padding: 0 16px;
  font-weight: 600;
}

.modal-ghost-btn {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.modal-primary-btn {
  background: #fff;
  color: #000;
  border-color: transparent;
}

@media (max-width: 1200px) {
  .timeline-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .control-group.right {
    width: 100%;
    justify-content: space-between;
  }

  .timeline-overview-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .control-group label {
    min-width: 0;
    width: 100%;
  }

  .control-group {
    width: 100%;
  }

  .mode-toggle,
  .zoom-controls {
    width: 100%;
  }

  .mode-btn,
  .zoom-btn {
    flex: 1;
  }

  .timeline-event {
    min-width: 138px;
    max-width: 170px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-grid,
  .modal-actions {
    grid-template-columns: 1fr;
  }
}

/* Theme override: keep the dynamic timeline interactions, but move the page
   onto the lighter glass language while preserving the stronger header type. */
.timeline-view {
  min-height: 100%;
  background: transparent;
  color: var(--color-text);
  padding-bottom: 0;
}

.header-background {
  height: 210px;
  background:
    radial-gradient(circle at 10% 16%, rgba(200, 75, 17, 0.14), transparent 34%),
    radial-gradient(circle at 84% 8%, rgba(19, 18, 17, 0.08), transparent 26%);
}

.title-block h1 {
  color: var(--color-text);
  letter-spacing: -0.05em;
}

.title-count {
  color: var(--color-text-tertiary);
}

.title-block p,
.tick-label,
.panel-description,
.detail-row span,
.zoom-controls span,
.control-group label span {
  color: var(--color-text-secondary);
}

.timeline-view p {
  color: var(--color-text-secondary);
}

.primary-btn,
.zoom-btn,
.control-group select,
.panel-btn,
.modal-ghost-btn,
.modal-primary-btn {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  box-shadow: none;
}

.primary-btn,
.modal-primary-btn {
  border-color: rgba(200, 75, 17, 0.2);
  background:
    linear-gradient(180deg, rgba(200, 75, 17, 0.15), rgba(200, 75, 17, 0.08)),
    rgba(255, 255, 255, 0.9);
  color: var(--color-accent);
}

.panel-btn.danger,
.modal-danger-btn {
  background: rgba(192, 57, 43, 0.08);
  border-color: rgba(192, 57, 43, 0.16);
  color: var(--color-danger);
}

.mode-toggle,
.overview-card,
.stacked-item,
.timeline-minimap {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  box-shadow: none;
}

.selected-event-panel,
.empty-state {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  box-shadow: var(--shadow-1);
}

.modal-card {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  box-shadow: var(--shadow-overlay);
}

.mode-btn {
  color: var(--color-text-secondary);
}

.mode-btn.active {
  background: rgba(200, 75, 17, 0.1);
  color: var(--color-accent);
}

.overview-card span,
.stacked-item-meta,
.event-date,
.empty-state p {
  color: var(--color-text-secondary);
}

.overview-card strong,
.panel-header h3,
.event-title,
.stacked-item h3,
.detail-row strong,
.empty-state h2 {
  color: var(--color-text);
}

.timeline-viewport {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(250, 250, 248, 0.74)),
    radial-gradient(circle at 20% 20%, rgba(200, 75, 17, 0.08), transparent 35%);
}

.timeline-axis {
  background: linear-gradient(
    90deg,
    rgba(200, 75, 17, 0.12),
    rgba(200, 75, 17, 0.48),
    rgba(19, 18, 17, 0.12)
  );
}

.timeline-tick {
  background: rgba(19, 18, 17, 0.16);
}

.timeline-event {
  border-color: rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  box-shadow: none;
  transition:
    left 0.26s ease,
    top 0.26s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.24s ease,
    opacity 0.2s ease,
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

.timeline-event:hover {
  border-color: rgba(200, 75, 17, 0.18);
  background: rgba(255, 255, 255, 0.9);
}

.timeline-event.selected {
  border-color: rgba(200, 75, 17, 0.28);
  background: rgba(200, 75, 17, 0.12);
  box-shadow: 0 0 0 1px rgba(200, 75, 17, 0.18);
}

.timeline-event.focused {
  border-color: rgba(200, 75, 17, 0.32);
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 16px 30px rgba(19, 18, 17, 0.12),
    0 0 0 1px rgba(200, 75, 17, 0.16);
}

.timeline-event.flipping {
  box-shadow: none;
}

.focused-event-card {
  border-color: rgba(200, 75, 17, 0.22);
  box-shadow:
    0 22px 44px rgba(19, 18, 17, 0.14),
    0 0 0 1px rgba(200, 75, 17, 0.12);
}

.timeline-event .event-dot {
  border-color: rgba(19, 18, 17, 0.12);
}

.minimap-track {
  background: rgba(19, 18, 17, 0.06);
}

.minimap-point {
  background: rgba(200, 75, 17, 0.28);
}

.minimap-window {
  background: rgba(200, 75, 17, 0.12);
  border-color: rgba(200, 75, 17, 0.2);
}

.event-state,
.event-type-pill {
  border: 1px solid transparent;
}

.event-state.release,
.event-type-pill.release {
  background: rgba(232, 90, 25, 0.08);
  color: var(--color-accent);
  border-color: rgba(232, 90, 25, 0.14);
}

.event-state.performance,
.event-type-pill.performance {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  border-color: rgba(134, 98, 72, 0.16);
}

.event-state.milestone,
.event-type-pill.milestone {
  background: rgba(19, 18, 17, 0.06);
  color: var(--color-info);
  border-color: rgba(19, 18, 17, 0.08);
}

.event-state.collaboration,
.event-type-pill.collaboration {
  background: rgba(214, 64, 50, 0.08);
  color: var(--color-danger);
  border-color: rgba(214, 64, 50, 0.14);
}

.modal-close,
.modal-form input,
.modal-form textarea,
.modal-form select {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
}

.modal-form span {
  color: var(--color-text-secondary);
}

.detail-modal-flip-enter-active,
.detail-modal-flip-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.26s ease;
}

.detail-modal-flip-enter-from,
.detail-modal-flip-leave-to {
  opacity: 0;
  transform: perspective(1200px) rotateX(10deg) scale(0.96);
}


.timeline-insert-strip {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.insert-strip-copy,
.insert-template,
.linked-asset-chip,
.attachment-result,
.linked-draft-item,
.detail-modal-link {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  box-shadow: none;
}

.insert-strip-copy {
  border-radius: 14px;
  padding: 14px 16px;
  display: grid;
  gap: 4px;
}

.insert-strip-copy strong {
  font-size: 15px;
  color: var(--color-text);
}

.insert-strip-copy p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.insert-strip-items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.insert-template {
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 6px;
  text-align: left;
  cursor: grab;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;
}

.insert-template:hover {
  border-color: rgba(200, 75, 17, 0.2);
  transform: translateY(-2px);
}

.insert-template:active {
  cursor: grabbing;
}

.insert-template-kicker {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.insert-template-copy {
  font-size: 13px;
  line-height: 1.45;
  color: var(--color-text);
}

.timeline-viewport.is-drop-active {
  border-color: rgba(200, 75, 17, 0.28);
  box-shadow: inset 0 0 0 1px rgba(200, 75, 17, 0.18);
}

.linked-assets-block,
.attachment-builder,
.detail-modal-section {
  display: grid;
  gap: 12px;
}

.linked-assets-head,
.attachment-builder-head,
.detail-modal-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.linked-assets-head span,
.attachment-builder-head p,
.detail-modal-section-head span,
.attachment-empty {
  color: var(--color-text-secondary);
}

.attachment-builder-head h3,
.detail-modal-section-head h3 {
  margin: 0;
  font-size: 15px;
  color: var(--color-text);
}

.attachment-builder-head p {
  margin: 4px 0 0;
  font-size: 13px;
}

.linked-assets-list,
.linked-draft-list,
.attachment-results,
.detail-modal-link-grid {
  display: grid;
  gap: 10px;
}

.linked-asset-chip,
.attachment-result,
.detail-modal-link {
  border-radius: 12px;
  padding: 12px 14px;
  display: grid;
  gap: 8px;
  text-align: left;
}

.linked-draft-item {
  border-radius: 12px;
  padding: 4px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.linked-draft-open {
  border: none;
  background: transparent;
  padding: 8px 10px;
  display: grid;
  gap: 6px;
  text-align: left;
  cursor: pointer;
}

.linked-draft-remove,
.attachment-result-action {
  min-height: 36px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.88);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
  padding: 0 12px;
}

.attachment-result {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.linked-asset-copy,
.attachment-result-copy {
  display: grid;
  gap: 3px;
}

.linked-asset-copy strong,
.attachment-result-copy strong {
  color: var(--color-text);
  font-size: 13px;
}

.linked-asset-copy span,
.attachment-result-copy span,
.detail-modal-description {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.linked-asset-type {
  width: fit-content;
  border-radius: 999px;
  background: rgba(200, 75, 17, 0.08);
  color: var(--color-accent);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 8px;
}

.detail-modal-card {
  width: min(760px, 100%);
}

.detail-modal-description {
  margin: 0;
}

.detail-modal-detail-grid {
  display: grid;
  gap: 10px;
}

.detail-modal-actions {
  grid-template-columns: 1fr auto;
}

@media (max-width: 1100px) {
  .timeline-insert-strip {
    grid-template-columns: 1fr;
  }

  .insert-strip-items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .insert-strip-items,
  .attachment-result,
  .linked-draft-item,
  .detail-modal-actions {
    grid-template-columns: 1fr;
  }
}
</style>
