<template>
  <WorkspacePage
    class="calendar-view"
    artist-scoped-header
    eyebrow="Calendar Workspace"
    title="Calendar"
    :subtitle="label"
  >
    <template #actions>
      <button class="workspace-header-primary-btn" type="button" @click="openCreateEvent">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>New Event</span>
      </button>
      <button class="workspace-header-secondary-btn" type="button" @click="showConnections = true">
        Manage Calendars
      </button>
    </template>

    <template #stats>
      <div class="stat-pill">
        <span class="stat-label">Visible Events</span>
        <strong>{{ filteredEvents.length }}</strong>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Upcoming</span>
        <strong>{{ upcomingEvents }}</strong>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Scope</span>
        <strong>{{ activeArtistLabel }}</strong>
      </div>
      <div
        v-if="connectedCalendarChips.length"
        class="connected-calendars-strip"
        aria-label="Connected calendars"
      >
        <span class="connected-calendars-strip-label">Connected</span>
        <button
          v-for="chip in connectedCalendarChips"
          :key="chip.key"
          type="button"
          class="connected-calendar-chip"
          :class="[chip.tone, { inactive: !chip.active }]"
          :aria-pressed="chip.active"
          @click="toggleCalendarSource(chip.key)"
        >
          <span class="connected-calendar-chip-dot" aria-hidden="true"></span>
          <span class="connected-calendar-chip-label">{{ chip.label }}</span>
          <span class="connected-calendar-chip-detail">{{ chip.detail }}</span>
        </button>
      </div>
    </template>

    <template #toolbar>
      <div class="header-left">
        <div class="nav-group">
          <button class="nav-btn" type="button" @click="prev" aria-label="Previous period">
            ←
          </button>
          <button class="nav-btn nav-btn-today" type="button" @click="today">Today</button>
          <button class="nav-btn" type="button" @click="next" aria-label="Next period">→</button>
        </div>
      </div>

      <div class="header-right">
        <select v-model="view" class="control-select" aria-label="Calendar view">
          <option value="list">List</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>

        <select
          v-if="!isArtistScopedCalendar"
          v-model="artistFilter"
          class="control-select"
          aria-label="Artist filter"
        >
          <option value="">All Artists</option>
          <option v-for="artist in visibleArtists" :key="artist.id" :value="artist.id">
            {{ artist.name }}
          </option>
        </select>
      </div>
    </template>

    <section class="calendar-content">
      <div class="content-shell" @contextmenu.prevent="openCalendarWorkspaceMenu">
        <div v-if="isLoading" class="state-message">Loading events...</div>

        <template v-else-if="view === 'list'">
          <ul v-if="filteredEvents.length" class="list-view" role="list">
            <li
              v-for="event in filteredEvents"
              :key="event.id"
              :class="['event-row', getEventSourceClass(event)]"
              @contextmenu.prevent.stop="openCalendarEventMenu($event, event)"
            >
              <div class="event-date-block">
                <span class="event-date">{{ formatDate(event.start) }}</span>
                <span class="event-time"
                  >{{ formatTime(event.start) }} - {{ formatTime(event.end) }}</span
                >
              </div>
              <div class="event-main">
                <p class="event-title">{{ event.title }}</p>
                <p v-if="event.description" class="event-description">{{ event.description }}</p>
                <p v-if="event.external" class="event-source">
                  {{ event.source_label || (event.source_provider === "google" ? "Google Calendar" : "iCloud Calendar") }}
                </p>
              </div>
              <div class="event-artist">{{ getArtistName(event.artist_id) }}</div>
            </li>
          </ul>
          <div v-else class="state-message">
            No events for this filter. Create your first event to populate the calendar.
          </div>
        </template>

        <template v-else-if="view === 'month'">
          <div class="month-grid">
            <div v-for="day in weekDayLabels" :key="day" class="month-cell month-header">
              {{ day }}
            </div>

            <button
              v-for="dayObj in monthDays"
              :key="dayObj.key"
              class="month-cell month-day"
              :class="{ other: !dayObj.currentMonth, active: isSameDay(dayObj.date, todayDate) }"
              type="button"
              @click="goToDay(dayObj.date)"
              @contextmenu.prevent.stop="openCalendarDayMenu($event, dayObj.date)"
            >
              <span class="day-number">{{ dayObj.date.getDate() }}</span>
              <span class="day-count" v-if="eventsByDate(dayObj.date).length"
                >{{ eventsByDate(dayObj.date).length }} event(s)</span
              >
              <div class="mini-dots" v-if="eventsByDate(dayObj.date).length">
                <span
                  v-for="event in eventsByDate(dayObj.date).slice(0, 4)"
                  :key="event.id"
                  :class="['mini-dot', getEventSourceClass(event)]"
                  :title="event.title"
                ></span>
              </div>
            </button>
          </div>
        </template>

        <template v-else-if="view === 'week'">
          <div class="week-grid">
            <div v-for="weekDay in weekDays" :key="weekDay.key" class="week-day">
              <div class="week-day-header">
                <p class="week-day-label">{{ weekDay.label }}</p>
                <p class="week-day-date">{{ weekDay.subLabel }}</p>
              </div>
              <ul class="week-day-list" role="list">
                <li
                  v-for="event in eventsByDate(weekDay.date)"
                  :key="event.id"
                  :class="['week-event', getEventSourceClass(event)]"
                  @contextmenu.prevent.stop="openCalendarEventMenu($event, event)"
                >
                  <span class="week-event-time">{{ formatTime(event.start) }}</span>
                  <span class="week-event-title">{{ event.title }}</span>
                  <span v-if="event.external" class="week-event-source">
                    {{ event.source_provider === "google" ? "Google" : "iCloud" }}
                  </span>
                </li>
                <li v-if="eventsByDate(weekDay.date).length === 0" class="week-empty">No events</li>
              </ul>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="day-view">
            <h2 class="day-title">{{ dayHeader }}</h2>
            <ul class="list-view" role="list">
              <li
                v-for="event in eventsByDate(todayDate)"
                :key="event.id"
                :class="['event-row', getEventSourceClass(event)]"
                @contextmenu.prevent.stop="openCalendarEventMenu($event, event)"
              >
                <div class="event-date-block">
                  <span class="event-time"
                    >{{ formatTime(event.start) }} - {{ formatTime(event.end) }}</span
                  >
                </div>
                <div class="event-main">
                  <p class="event-title">{{ event.title }}</p>
                  <p v-if="event.description" class="event-description">{{ event.description }}</p>
                  <p v-if="event.external" class="event-source">
                    {{ event.source_label || (event.source_provider === "google" ? "Google Calendar" : "iCloud Calendar") }}
                  </p>
                </div>
                <div class="event-artist">{{ getArtistName(event.artist_id) }}</div>
              </li>
              <li v-if="eventsByDate(todayDate).length === 0" class="state-message compact">
                No events for this day.
              </li>
            </ul>
          </div>
        </template>
      </div>
    </section>

    <div v-if="showCreateEvent" class="modal-overlay" @click.self="showCreateEvent = false">
      <div class="modal-content" role="dialog" aria-modal="true" :aria-label="eventModalTitle">
        <div class="modal-header">
          <h3 class="modal-title">{{ eventModalTitle }}</h3>
          <button
            class="modal-close"
            type="button"
            @click="closeEventModal"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form class="modal-form" @submit.prevent="saveEvent">
          <div class="form-group">
            <label class="form-label" for="event-title">Event title</label>
            <input
              id="event-title"
              v-model="newEvent.title"
              type="text"
              class="form-input"
              required
              maxlength="120"
            />
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="event-start-date">Start date</label>
              <input
                id="event-start-date"
                v-model="newEvent.startDate"
                type="date"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="event-start-time">Start time</label>
              <input
                id="event-start-time"
                v-model="newEvent.startTime"
                type="time"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label" for="event-end-date">End date</label>
              <input
                id="event-end-date"
                v-model="newEvent.endDate"
                type="date"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="event-end-time">End time</label>
              <input
                id="event-end-time"
                v-model="newEvent.endTime"
                type="time"
                class="form-input"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="event-artist">{{
              isArtistScopedCalendar ? "Artist Workspace" : "Artist"
            }}</label>
            <select
              v-if="!isArtistScopedCalendar"
              id="event-artist"
              v-model="newEvent.artist_id"
              class="form-input"
              required
            >
              <option value="" disabled>Select artist</option>
              <option v-for="artist in visibleArtists" :key="artist.id" :value="artist.id">
                {{ artist.name }}
              </option>
            </select>
            <input
              v-else
              id="event-artist"
              class="form-input"
              type="text"
              :value="scopedArtist?.name || activeArtistLabel"
              disabled
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="event-description">Description</label>
            <textarea
              id="event-description"
              v-model="newEvent.description"
              class="form-input form-textarea"
              rows="3"
              maxlength="500"
              placeholder="Optional notes"
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeEventModal">
              Cancel
            </button>
            <button type="submit" class="btn-primary">{{ eventSubmitLabel }}</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showConnections"
      class="modal-overlay"
      @click.self="showConnections = false"
    >
      <div class="modal-content calendar-connections-modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Connected Calendars</h3>
            <p class="connections-intro">
              Bring in Google calendars or shared iCloud calendar feeds without replacing internal events.
            </p>
          </div>
          <button
            class="modal-close"
            type="button"
            @click="showConnections = false"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div class="connections-body">
          <section class="connections-section">
            <div class="connections-section-head">
              <div>
                <p class="connections-eyebrow">Google Calendar</p>
                <h4>Connect Gmail calendars</h4>
                <p class="connections-copy">
                  Uses the same Google OAuth setup pattern as the Schedule Summary app, adapted for web with a browser callback.
                </p>
              </div>
              <div class="connections-actions">
                <button
                  v-if="!calendarConnections.google.connected"
                  type="button"
                  class="btn-primary"
                  :disabled="connectionBusy"
                  @click="connectGoogleCalendars"
                >
                  Connect Google
                </button>
                <template v-else>
                  <button
                    type="button"
                    class="btn-secondary"
                    :disabled="connectionBusy"
                    @click="refreshGoogleCalendars"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    class="btn-secondary danger"
                    :disabled="connectionBusy"
                    @click="disconnectGoogleCalendars"
                  >
                    Disconnect
                  </button>
                </template>
              </div>
            </div>

            <p class="connections-status" v-if="calendarConnections.google.connected">
              Connected{{ googleSyncLabel ? ` · ${googleSyncLabel}` : "" }}
            </p>

            <div v-if="calendarConnections.google.calendars.length" class="connection-list">
              <article
                v-for="calendar in calendarConnections.google.calendars"
                :key="calendar.id"
                class="connection-card"
              >
                <label class="connection-toggle">
                  <input
                    type="checkbox"
                    :checked="calendar.enabled"
                    @change="
                      updateGoogleCalendarSettings(calendar.id, {
                        enabled: $event.target.checked,
                      })
                    "
                  />
                  <span>
                    <strong>{{ calendar.summary }}</strong>
                    <small>{{ calendar.id }}</small>
                  </span>
                </label>

                <div v-if="!isArtistScopedCalendar" class="connection-field">
                  <label class="form-label" :for="`google-calendar-artist-${calendar.id}`">
                    Artist
                  </label>
                  <select
                    :id="`google-calendar-artist-${calendar.id}`"
                    class="form-input"
                    :value="calendar.artistId || ''"
                    @change="
                      updateGoogleCalendarSettings(calendar.id, {
                        artistId: $event.target.value,
                      })
                    "
                  >
                    <option value="">All Artists</option>
                    <option v-for="artist in visibleArtists" :key="artist.id" :value="artist.id">
                      {{ artist.name }}
                    </option>
                  </select>
                </div>
              </article>
            </div>
          </section>

          <section class="connections-section">
            <div class="connections-section-head">
              <div>
                <p class="connections-eyebrow">Apple / iCloud</p>
                <h4>Connect shared calendar feeds</h4>
                <p class="connections-copy">
                  Paste a public iCloud or ICS feed link. <code>webcal://</code> links are supported and normalized automatically.
                </p>
              </div>
            </div>

            <form class="connections-form" @submit.prevent="addAppleFeed">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="apple-feed-label">Label</label>
                  <input
                    id="apple-feed-label"
                    v-model="newAppleFeed.label"
                    type="text"
                    class="form-input"
                    placeholder="Tour calendar"
                  />
                </div>
                <div class="form-group connections-form-wide">
                  <label class="form-label" for="apple-feed-url">Feed URL</label>
                  <input
                    id="apple-feed-url"
                    v-model="newAppleFeed.url"
                    type="url"
                    class="form-input"
                    placeholder="webcal://pXX-caldav.icloud.com/published/..."
                  />
                </div>
              </div>

              <div v-if="!isArtistScopedCalendar" class="form-group connections-form-artist">
                <label class="form-label" for="apple-feed-artist">Artist</label>
                <select id="apple-feed-artist" v-model="newAppleFeed.artistId" class="form-input">
                  <option value="">All Artists</option>
                  <option v-for="artist in visibleArtists" :key="artist.id" :value="artist.id">
                    {{ artist.name }}
                  </option>
                </select>
              </div>

              <div class="connections-actions">
                <button type="submit" class="btn-primary" :disabled="connectionBusy">
                  Add Feed
                </button>
              </div>
            </form>

            <div v-if="calendarConnections.apple.feeds.length" class="connection-list">
              <article
                v-for="feed in calendarConnections.apple.feeds"
                :key="feed.id"
                class="connection-card"
              >
                <label class="connection-toggle">
                  <input
                    type="checkbox"
                    :checked="feed.enabled"
                    @change="
                      updateAppleFeed(feed.id, {
                        enabled: $event.target.checked,
                      })
                    "
                  />
                  <span>
                    <strong>{{ feed.label || feed.calendarName || "Calendar feed" }}</strong>
                    <small>{{ feed.url }}</small>
                  </span>
                </label>

                <div v-if="!isArtistScopedCalendar" class="connection-field">
                  <label class="form-label" :for="`apple-feed-artist-${feed.id}`">Artist</label>
                  <select
                    :id="`apple-feed-artist-${feed.id}`"
                    class="form-input"
                    :value="feed.artistId || ''"
                    @change="
                      updateAppleFeed(feed.id, {
                        artistId: $event.target.value,
                      })
                    "
                  >
                    <option value="">All Artists</option>
                    <option v-for="artist in visibleArtists" :key="artist.id" :value="artist.id">
                      {{ artist.name }}
                    </option>
                  </select>
                </div>

                <button
                  type="button"
                  class="btn-secondary danger"
                  :disabled="connectionBusy"
                  @click="removeAppleFeed(feed.id)"
                >
                  Remove
                </button>
              </article>
            </div>
          </section>

          <p v-if="externalSyncError" class="connections-error">{{ externalSyncError }}</p>
        </div>
      </div>
    </div>
  </WorkspacePage>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useCalendarStore } from "@/stores/calendar";
import { useDashboardStore } from "@/stores/dashboard";
import { useAuthStore } from "@/stores/auth";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";
import {
  clearGoogleCalendarConnection,
  createDefaultCalendarConnections,
  loadCalendarConnections,
  saveCalendarConnections,
} from "@/shared/services/calendarConnections";
import {
  authenticateGoogleCalendar,
  ensureGoogleCalendarAccessToken,
  fetchGoogleCalendarEvents,
  fetchGoogleCalendarList,
} from "@/shared/services/googleCalendarWeb";
import { fetchIcsFeedEvents, fetchIcsFeedPreview } from "@/shared/services/icsCalendar";

const route = useRoute();
const authStore = useAuthStore();
const calendarStore = useCalendarStore();
const dashboardStore = useDashboardStore();
const showToast = inject("showToast", () => {});
const showContextMenu = inject("showContextMenu", () => {});

const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const todayDate = ref(new Date());
const view = ref("month");
const artistFilter = ref("");
const showCreateEvent = ref(false);
const showConnections = ref(false);
const eventModalMode = ref("create");
const activeEventId = ref("");
const localEvents = ref([]);
const externalEvents = ref([]);
const connectionBusy = ref(false);
const externalSyncError = ref("");
const calendarConnections = ref(createDefaultCalendarConnections());
const activeCalendarSources = ref(["google", "apple"]);

const newEvent = reactive({
  title: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  artist_id: "",
  description: "",
});

const newAppleFeed = reactive({
  label: "",
  url: "",
  artistId: "",
});

const artists = computed(() =>
  Array.isArray(dashboardStore.artists) ? dashboardStore.artists : [],
);
const visibleArtists = computed(() => authStore.filterAccessibleArtists(artists.value));
const scopedArtistSlug = computed(() => {
  if (typeof route.query.artist === "string" && route.query.artist) {
    return route.query.artist;
  }
  return authStore.isArtistScoped ? authStore.getDefaultArtistSlug(visibleArtists.value) : "";
});
const scopedArtist = computed(() => {
  if (!scopedArtistSlug.value) return null;
  return (
    artists.value.find(
      (artist) => artist.slug === scopedArtistSlug.value || artist.id === scopedArtistSlug.value,
    ) || null
  );
});
const isArtistScopedCalendar = computed(() => authStore.isArtistScoped);
const effectiveArtistFilterId = computed(() => {
  if (scopedArtist.value?.id) return scopedArtist.value.id;
  return artistFilter.value;
});
const upcomingEvents = computed(() => {
  const now = Date.now();
  return filteredEvents.value.filter((event) => new Date(event.end).getTime() >= now).length;
});
const activeArtistLabel = computed(() => {
  if (scopedArtist.value?.name) {
    return scopedArtist.value.name;
  }
  if (scopedArtistSlug.value) {
    return scopedArtistSlug.value
      .split("-")
      .filter(Boolean)
      .map((chunk) => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
      .join(" ");
  }
  return artistFilter.value ? getArtistName(artistFilter.value) : "All Artists";
});
const connectionUserId = computed(() => authStore.profile?.id || authStore.user?.id || "anonymous");
const googleSyncLabel = computed(() => {
  const value = calendarConnections.value.google.lastSyncedAt;
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `Last synced ${parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
});
const connectedCalendarChips = computed(() => {
  const chips = [];
  const enabledGoogle = calendarConnections.value.google.calendars.filter((calendar) => calendar.enabled);
  const enabledApple = calendarConnections.value.apple.feeds.filter((feed) => feed.enabled);

  if (enabledGoogle.length) {
    chips.push({
      key: "google",
      label: "Google",
      detail:
        enabledGoogle.length === 1
          ? enabledGoogle[0].summary || "1 calendar"
          : `${enabledGoogle.length} calendars`,
      tone: "source-google",
      active: activeCalendarSources.value.includes("google"),
    });
  }

  if (enabledApple.length) {
    chips.push({
      key: "apple",
      label: "iCloud",
      detail:
        enabledApple.length === 1
          ? enabledApple[0].label || enabledApple[0].calendarName || "1 feed"
          : `${enabledApple.length} feeds`,
      tone: "source-apple",
      active: activeCalendarSources.value.includes("apple"),
    });
  }

  return chips;
});
const eventModalTitle = computed(() =>
  eventModalMode.value === "edit" ? "Edit Event" : "Create Event",
);
const eventSubmitLabel = computed(() =>
  eventModalMode.value === "edit" ? "Save Changes" : "Create Event",
);

const normalizeEvent = (event) => {
  if (!event || typeof event !== "object") return null;
  const start = event.start || event.start_time;
  const end = event.end || event.end_time || start;
  return {
    ...event,
    start,
    end,
  };
};

const hasValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const mergedEvents = computed(() => {
  const storeEvents = Array.isArray(calendarStore.filteredEvents)
    ? calendarStore.filteredEvents
    : [];
  const local = Array.isArray(localEvents.value) ? localEvents.value : [];
  const external = Array.isArray(externalEvents.value) ? externalEvents.value : [];
  return [...external, ...local, ...storeEvents]
    .map(normalizeEvent)
    .filter((event) => event && hasValidDate(event.start));
});

const filteredEvents = computed(() => {
  let events = [...mergedEvents.value];
  if (effectiveArtistFilterId.value) {
    events = events.filter((event) => event.artist_id === effectiveArtistFilterId.value);
  }

  events = events.filter((event) => {
    const sourceKey = getEventSourceKey(event);
    if (sourceKey === "local") return true;
    return activeCalendarSources.value.includes(sourceKey);
  });

  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
});

const isLoading = computed(() => {
  const loading = calendarStore.loading;
  if (typeof loading === "object" && loading !== null && "value" in loading) {
    return Boolean(loading.value);
  }
  return Boolean(loading);
});

const dayHeader = computed(() => {
  return todayDate.value.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
});

const label = computed(() => {
  const date = todayDate.value;

  if (view.value === "day") {
    return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }

  if (view.value === "week") {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }

  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
});

const monthDays = computed(() => {
  const first = new Date(todayDate.value.getFullYear(), todayDate.value.getMonth(), 1);
  const days = [];
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    days.push({
      key: current.toISOString(),
      date: current,
      currentMonth: current.getMonth() === todayDate.value.getMonth(),
    });
  }

  return days;
});

const weekDays = computed(() => {
  const start = startOfWeek(todayDate.value);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString(),
      date,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      subLabel: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
});

const startOfWeek = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
};

const isSameDay = (a, b) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const eventsByDate = (date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return filteredEvents.value.filter((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return start < dayEnd && end >= dayStart;
  });
};

const getArtistName = (artistId) => {
  if (!artistId) return "No artist";
  const artist = visibleArtists.value.find((item) => item.id === artistId) ||
    artists.value.find((item) => item.id === artistId);
  return artist?.name || "Unknown artist";
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getEventSourceKey = (eventModel) => {
  if (eventModel?.source_provider === "google") return "google";
  if (eventModel?.source_provider === "icloud") return "apple";
  return "local";
};

const getEventSourceClass = (eventModel) => `source-${getEventSourceKey(eventModel)}`;

const syncActiveSourcesFromConnections = () => {
  const sourceFilters = calendarConnections.value.ui?.sourceFilters || {};
  activeCalendarSources.value = ["google", "apple"].filter((key) => sourceFilters[key] !== false);
};

const writeActiveSourcesToConnections = () => {
  calendarConnections.value.ui = {
    ...createDefaultCalendarConnections().ui,
    ...calendarConnections.value.ui,
    sourceFilters: {
      google: activeCalendarSources.value.includes("google"),
      apple: activeCalendarSources.value.includes("apple"),
    },
  };
};

const toggleCalendarSource = (sourceKey) => {
  if (!["google", "apple"].includes(sourceKey)) return;

  if (activeCalendarSources.value.includes(sourceKey)) {
    activeCalendarSources.value = activeCalendarSources.value.filter((key) => key !== sourceKey);
    persistCalendarConnections();
    return;
  }

  activeCalendarSources.value = [...activeCalendarSources.value, sourceKey];
  persistCalendarConnections();
};

const getDefaultConnectionArtistId = () =>
  scopedArtist.value?.id || artistFilter.value || visibleArtists.value[0]?.id || "";

const reloadCalendarConnections = () => {
  calendarConnections.value = loadCalendarConnections(connectionUserId.value);
  syncActiveSourcesFromConnections();
};

const persistCalendarConnections = () => {
  writeActiveSourcesToConnections();
  calendarConnections.value = saveCalendarConnections(connectionUserId.value, calendarConnections.value);
};

const setExternalSyncError = (messages) => {
  externalSyncError.value = messages.filter(Boolean).join(" · ");
};

const syncExternalEvents = async (start, end) => {
  const syncedEvents = [];
  const syncErrors = [];

  if (calendarConnections.value.google.connected && calendarConnections.value.google.tokens) {
    try {
      const tokens = await ensureGoogleCalendarAccessToken(calendarConnections.value.google.tokens);
      calendarConnections.value.google.tokens = tokens;

      const googleCalendars = calendarConnections.value.google.calendars.map((calendar) => ({
        ...calendar,
        artistId: calendar.artistId || getDefaultConnectionArtistId(),
      }));

      syncedEvents.push(...(await fetchGoogleCalendarEvents(tokens, googleCalendars, { start, end })));
      calendarConnections.value.google.lastSyncedAt = new Date().toISOString();
      persistCalendarConnections();
    } catch (error) {
      syncErrors.push(error?.message || "Google Calendar sync failed.");
    }
  }

  if (calendarConnections.value.apple.feeds.length) {
    const feedEvents = await Promise.all(
      calendarConnections.value.apple.feeds
        .filter((feed) => feed.enabled)
        .map(async (feed) => {
          try {
            return await fetchIcsFeedEvents(
              {
                ...feed,
                artistId: feed.artistId || getDefaultConnectionArtistId(),
              },
              { start, end },
            );
          } catch (error) {
            syncErrors.push(
              `${feed.label || feed.calendarName || "Calendar feed"}: ${error?.message || "Sync failed."}`,
            );
            return [];
          }
        }),
    );

    syncedEvents.push(...feedEvents.flat());
  }

  externalEvents.value = syncedEvents;
  setExternalSyncError(syncErrors);
};

const syncDateRange = async () => {
  let start;
  let end;

  if (view.value === "day") {
    start = new Date(todayDate.value);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(-1);
  } else if (view.value === "week") {
    start = startOfWeek(todayDate.value);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setMilliseconds(-1);
  } else {
    start = new Date(todayDate.value.getFullYear(), todayDate.value.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(
      todayDate.value.getFullYear(),
      todayDate.value.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  calendarStore.setDateRange(start, end);
  await calendarStore.loadEvents();
  await syncExternalEvents(start, new Date(end));
};

const refreshGoogleCalendars = async () => {
  connectionBusy.value = true;
  try {
    const tokens = await ensureGoogleCalendarAccessToken(calendarConnections.value.google.tokens);
    const calendars = await fetchGoogleCalendarList(tokens);
    const existingCalendars = new Map(
      calendarConnections.value.google.calendars.map((calendar) => [calendar.id, calendar]),
    );

    calendarConnections.value.google = {
      ...calendarConnections.value.google,
      connected: true,
      tokens,
      calendars: calendars.map((calendar) => {
        const existing = existingCalendars.get(calendar.id);
        return {
          id: calendar.id,
          summary: calendar.summary || calendar.id,
          enabled: existing?.enabled ?? true,
          artistId:
            existing?.artistId ||
            (isArtistScopedCalendar.value ? scopedArtist.value?.id || "" : ""),
        };
      }),
      lastSyncedAt: new Date().toISOString(),
    };

    persistCalendarConnections();
    await syncDateRange();
    showToast({ message: "Google calendars refreshed.", type: "success" });
  } catch (error) {
    setExternalSyncError([error?.message || "Unable to refresh Google calendars."]);
    showToast({ message: error?.message || "Unable to refresh Google calendars.", type: "error" });
  } finally {
    connectionBusy.value = false;
  }
};

const connectGoogleCalendars = async () => {
  connectionBusy.value = true;
  try {
    const tokens = await authenticateGoogleCalendar();
    calendarConnections.value.google = {
      ...calendarConnections.value.google,
      connected: true,
      tokens,
    };
    persistCalendarConnections();
    await refreshGoogleCalendars();
  } catch (error) {
    setExternalSyncError([error?.message || "Unable to connect Google Calendar."]);
    showToast({ message: error?.message || "Unable to connect Google Calendar.", type: "error" });
  } finally {
    connectionBusy.value = false;
  }
};

const disconnectGoogleCalendars = async () => {
  calendarConnections.value = clearGoogleCalendarConnection(connectionUserId.value);
  externalEvents.value = externalEvents.value.filter((event) => event.source_provider !== "google");
  setExternalSyncError([]);
  await syncDateRange();
  showToast({ message: "Google Calendar disconnected.", type: "success" });
};

const updateGoogleCalendarSettings = async (calendarId, patch) => {
  calendarConnections.value.google.calendars = calendarConnections.value.google.calendars.map((calendar) =>
    calendar.id === calendarId ? { ...calendar, ...patch } : calendar,
  );
  persistCalendarConnections();
  await syncDateRange();
};

const addAppleFeed = async () => {
  if (!newAppleFeed.url.trim()) {
    showToast({ message: "Paste an iCloud or ICS feed URL first.", type: "error" });
    return;
  }

  connectionBusy.value = true;
  try {
    const preview = await fetchIcsFeedPreview(newAppleFeed.url);
    calendarConnections.value.apple.feeds.unshift({
      id: `ics-${Date.now()}`,
      label: newAppleFeed.label.trim() || preview.calendarName || "Shared calendar",
      calendarName: preview.calendarName || "",
      url: preview.url,
      eventCount: preview.eventCount,
      enabled: true,
      artistId: isArtistScopedCalendar.value
        ? scopedArtist.value?.id || ""
        : newAppleFeed.artistId || "",
    });
    persistCalendarConnections();
    newAppleFeed.label = "";
    newAppleFeed.url = "";
    newAppleFeed.artistId = "";
    await syncDateRange();
    showToast({ message: "Calendar feed connected.", type: "success" });
  } catch (error) {
    setExternalSyncError([error?.message || "Unable to connect calendar feed."]);
    showToast({ message: error?.message || "Unable to connect calendar feed.", type: "error" });
  } finally {
    connectionBusy.value = false;
  }
};

const updateAppleFeed = async (feedId, patch) => {
  calendarConnections.value.apple.feeds = calendarConnections.value.apple.feeds.map((feed) =>
    feed.id === feedId ? { ...feed, ...patch } : feed,
  );
  persistCalendarConnections();
  await syncDateRange();
};

const removeAppleFeed = async (feedId) => {
  calendarConnections.value.apple.feeds = calendarConnections.value.apple.feeds.filter(
    (feed) => feed.id !== feedId,
  );
  persistCalendarConnections();
  await syncDateRange();
  showToast({ message: "Calendar feed removed.", type: "success" });
};

const changeDate = (delta) => {
  const nextDate = new Date(todayDate.value);
  if (view.value === "month") {
    nextDate.setMonth(nextDate.getMonth() + delta);
  } else if (view.value === "week") {
    nextDate.setDate(nextDate.getDate() + delta * 7);
  } else {
    nextDate.setDate(nextDate.getDate() + delta);
  }
  todayDate.value = nextDate;
};

const prev = () => changeDate(-1);
const next = () => changeDate(1);
const today = () => {
  todayDate.value = new Date();
};

const goToDay = (date) => {
  todayDate.value = new Date(date);
  view.value = "day";
};

const resetEventForm = (seedDate = null) => {
  const now = seedDate ? new Date(seedDate) : new Date();
  if (seedDate) {
    now.setHours(10, 0, 0, 0);
  }
  const later = new Date(now);
  later.setHours(later.getHours() + 1);

  newEvent.title = "";
  newEvent.startDate = now.toISOString().split("T")[0];
  newEvent.startTime = now.toTimeString().slice(0, 5);
  newEvent.endDate = later.toISOString().split("T")[0];
  newEvent.endTime = later.toTimeString().slice(0, 5);
  newEvent.artist_id = scopedArtist.value?.id || visibleArtists.value[0]?.id || "";
  newEvent.description = "";
};

const populateEventForm = (eventModel) => {
  const start = new Date(eventModel.start);
  const end = new Date(eventModel.end);

  newEvent.title = eventModel.title || "";
  newEvent.startDate = start.toISOString().split("T")[0];
  newEvent.startTime = start.toTimeString().slice(0, 5);
  newEvent.endDate = end.toISOString().split("T")[0];
  newEvent.endTime = end.toTimeString().slice(0, 5);
  newEvent.artist_id = scopedArtist.value?.id || eventModel.artist_id || visibleArtists.value[0]?.id || "";
  newEvent.description = eventModel.description || "";
};

const closeEventModal = () => {
  showCreateEvent.value = false;
  eventModalMode.value = "create";
  activeEventId.value = "";
};

const openCreateEvent = (seedDate = null) => {
  eventModalMode.value = "create";
  activeEventId.value = "";
  resetEventForm(seedDate);
  showCreateEvent.value = true;
};

const openEditEvent = (eventModel) => {
  eventModalMode.value = "edit";
  activeEventId.value = eventModel.id;
  populateEventForm(eventModel);
  showCreateEvent.value = true;
};

const saveEvent = async () => {
  const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime}`);
  const endDateTime = new Date(`${newEvent.endDate}T${newEvent.endTime}`);

  if (!newEvent.artist_id) {
    showToast({ message: "Please select an artist for this event.", type: "error" });
    return;
  }

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    showToast({ message: "Please provide valid date and time values.", type: "error" });
    return;
  }

  if (endDateTime <= startDateTime) {
    showToast({ message: "End time must be after start time.", type: "error" });
    return;
  }

  const payload = {
    title: newEvent.title.trim(),
    description: newEvent.description.trim(),
    artist_id: newEvent.artist_id,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
    event_type: "meeting",
  };

  if (eventModalMode.value === "edit" && activeEventId.value) {
    try {
      await calendarStore.updateEvent({ id: activeEventId.value, ...payload });
      await calendarStore.loadEvents();
      showToast({ message: "Event updated successfully.", type: "success" });
    } catch {
      const localIndex = localEvents.value.findIndex((event) => event.id === activeEventId.value);
      if (localIndex >= 0) {
        localEvents.value[localIndex] = {
          ...localEvents.value[localIndex],
          ...payload,
          start: payload.start_time,
          end: payload.end_time,
        };
        showToast({ message: "Saved locally in demo mode.", type: "info" });
      } else {
        showToast({ message: "Unable to update this event yet.", type: "error" });
        return;
      }
    }

    closeEventModal();
    return;
  }

  try {
    await calendarStore.createEvent(payload);
    await calendarStore.loadEvents();
    showToast({ message: "Event created successfully.", type: "success" });
  } catch {
    localEvents.value.unshift({
      id: `local-${Date.now()}`,
      ...payload,
      start: payload.start_time,
      end: payload.end_time,
      created_at: new Date().toISOString(),
    });
    showToast({ message: "Saved locally in demo mode.", type: "info" });
  }

  closeEventModal();
};

const copyEventDate = async (eventModel) => {
  const value = formatDate(eventModel.start);

  try {
    await navigator.clipboard.writeText(value);
    showToast({ message: "Event date copied", type: "success" });
  } catch {
    showToast({ message: value, type: "info" });
  }
};

const deleteCalendarEvent = async (eventModel) => {
  const localIndex = localEvents.value.findIndex((event) => event.id === eventModel.id);

  try {
    if (localIndex >= 0) {
      localEvents.value.splice(localIndex, 1);
    } else {
      await calendarStore.deleteEvent(eventModel.id);
      await calendarStore.loadEvents();
    }
    showToast({ message: `Removed "${eventModel.title}"`, type: "success" });
  } catch {
    showToast({ message: "Unable to delete this event yet.", type: "error" });
  }
};

const openCalendarEventMenu = (event, eventModel) => {
  const actions = [];

  if (!eventModel.external) {
    actions.push({ label: "Edit Event", handler: () => openEditEvent(eventModel) });
  }

  actions.push({ label: "Copy Date", handler: () => void copyEventDate(eventModel) });

  if (eventModel.artist_id) {
    actions.push({
      label: `Show ${getArtistName(eventModel.artist_id)}`,
      handler: () => {
        artistFilter.value = eventModel.artist_id;
      },
    });
  }

  if (eventModel.external) {
    actions.push({
      label: `Connected via ${eventModel.source_provider === "google" ? "Google Calendar" : "iCloud feed"}`,
      disabled: true,
    });
  } else {
    actions.push(
      { separator: true },
      {
        label: "Delete Event",
        destructive: true,
        handler: () => void deleteCalendarEvent(eventModel),
      },
    );
  }

  showContextMenu(event, actions, "custom");
};

const openCalendarDayMenu = (event, date) => {
  showContextMenu(
    event,
    [
      { label: "Open Day", handler: () => goToDay(date) },
      { label: "New Event Here", handler: () => openCreateEvent(date) },
      {
        label: "Jump to Month",
        handler: () => {
          todayDate.value = new Date(date);
          view.value = "month";
        },
      },
    ],
    "custom",
  );
};

const openCalendarWorkspaceMenu = (event) => {
  if (
    event.target.closest(".event-row") ||
    event.target.closest(".week-event") ||
    event.target.closest(".month-day")
  ) {
    return;
  }

  showContextMenu(
    event,
    [
      { label: "New Event", handler: () => openCreateEvent() },
      { label: "Today", handler: () => today() },
      { separator: true },
      { label: "List View", handler: () => (view.value = "list") },
      { label: "Week View", handler: () => (view.value = "week") },
      { label: "Month View", handler: () => (view.value = "month") },
    ],
    "custom",
  );
};

watch(
  [view, todayDate],
  () => {
    void syncDateRange();
  },
  { deep: false },
);

onMounted(async () => {
  try {
    await dashboardStore.loadArtists();
  } catch (error) {
    console.error("Failed to load artists for calendar:", error);
  }

  reloadCalendarConnections();
  resetEventForm();

  try {
    await syncDateRange();
  } catch (error) {
    console.error("Failed to sync calendar date range:", error);
  }
});

watch(
  [scopedArtist, visibleArtists],
  () => {
    if (isArtistScopedCalendar.value && scopedArtist.value?.id) {
      artistFilter.value = "";
      if (!newEvent.artist_id || newEvent.artist_id !== scopedArtist.value.id) {
        newEvent.artist_id = scopedArtist.value.id;
      }
      return;
    }

    if (!newEvent.artist_id && visibleArtists.value.length) {
      newEvent.artist_id = visibleArtists.value[0].id;
    }
  },
  { immediate: true },
);

watch(
  connectionUserId,
  async () => {
    reloadCalendarConnections();
    await syncDateRange();
  },
  { immediate: false },
);
</script>

<style scoped>
.calendar-view {
  color: #fff;
}

.calendar-header {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 28px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
    rgba(10, 10, 12, 0.9);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.34);
}

.header-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(28px);
}

.orb-1 {
  width: 220px;
  height: 220px;
  top: -80px;
  right: 8%;
  background: rgba(232, 90, 25, 0.16);
}

.orb-2 {
  width: 170px;
  height: 170px;
  left: 14%;
  bottom: -90px;
  background: rgba(214, 64, 50, 0.12);
}

.header-main,
.header-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.calendar-view :deep(.workspace-context-panel) {
  padding-bottom: 20px;
}

.calendar-view :deep(.workspace-context-toolbar) {
  align-items: flex-start;
  row-gap: 12px;
  padding-top: 8px;
}

.calendar-view .header-left {
  flex: 1 1 220px;
}

.calendar-view .header-right {
  flex: 0 1 392px;
  justify-content: flex-end;
  align-items: flex-start;
  row-gap: 10px;
  margin-left: auto;
}

.calendar-view .header-right .control-select {
  flex: 1 1 180px;
  min-width: 180px;
}

.header-copy {
  display: grid;
  gap: 8px;
}

.calendar-eyebrow {
  margin: 0;
  color: rgba(255, 255, 255, 0.46);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.calendar-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 16px;
}

.quick-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-sm);
  min-width: 0;
  padding: 0 var(--control-px);
  border-radius: var(--radius-pill);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.stat-label {
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stat-pill strong {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.92);
}

.connected-calendars-strip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-height: var(--control-sm);
  padding: 0;
}

.connected-calendars-strip-label {
  color: rgba(255, 255, 255, 0.44);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.connected-calendar-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    opacity 160ms ease;
}

.connected-calendar-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  flex-shrink: 0;
}

.connected-calendar-chip-label {
  font-size: 13px;
  font-weight: 600;
}

.connected-calendar-chip-detail {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.54);
}

.connected-calendar-chip.inactive {
  opacity: 0.56;
}

.connected-calendar-chip:focus-visible {
  outline: 2px solid rgba(200, 75, 17, 0.24);
  outline-offset: 2px;
}

.nav-group {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-btn {
  border: 1px solid transparent;
  background: transparent;
  color: rgba(255, 255, 255, 0.86);
  height: 34px;
  min-width: 34px;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

.nav-btn-today {
  font-weight: 600;
}

.calendar-title {
  margin: 0;
  font-size: clamp(34px, 4vw, 48px);
  font-weight: 250;
  letter-spacing: -0.04em;
}

.control-select {
  height: 42px;
  min-width: 140px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 0 12px;
}

.control-select:focus {
  outline: none;
  border-color: rgba(232, 90, 25, 0.45);
  box-shadow: 0 0 0 3px rgba(232, 90, 25, 0.14);
}

.create-event-btn {
  height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: #fff;
  color: #050505;
  padding: 0 14px;
  font-weight: 600;
  cursor: pointer;
}

.create-event-btn svg {
  width: 16px;
  height: 16px;
}

.create-event-btn:hover {
  background: rgba(255, 255, 255, 0.92);
}

.calendar-content {
  flex: 1;
  min-height: 520px;
}

.content-shell {
  min-height: 520px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015)),
    rgba(7, 7, 9, 0.9);
  padding: 20px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
}

.state-message {
  padding: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.62);
  font-size: 14px;
}

.state-message.compact {
  margin: 8px 0;
  padding: 16px;
}

.list-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.event-row {
  display: grid;
  grid-template-columns: 180px 1fr 180px;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.4);
}

.event-row.source-local,
.week-event.source-local {
  box-shadow: inset 3px 0 0 rgba(232, 90, 25, 0.6);
}

.event-row.source-google,
.week-event.source-google {
  box-shadow: inset 3px 0 0 rgba(66, 133, 244, 0.6);
}

.event-row.source-apple,
.week-event.source-apple {
  box-shadow: inset 3px 0 0 rgba(224, 76, 76, 0.58);
}

.event-date-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-date,
.event-time {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.event-main {
  min-width: 0;
}

.event-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.event-description {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.58);
}

.event-source {
  margin: 6px 0 0;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.48);
}

.event-artist {
  justify-self: end;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.68);
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.month-cell {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.34);
}

.month-header {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.62);
}

.month-day {
  min-height: 100px;
  padding: 10px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
}

.month-day:hover {
  border-color: rgba(255, 255, 255, 0.16);
}

.month-day.other {
  opacity: 0.45;
}

.month-day.active {
  border-color: rgba(232, 90, 25, 0.5);
  box-shadow: inset 0 0 0 1px rgba(232, 90, 25, 0.35);
}

.day-number {
  font-size: 13px;
  font-weight: 700;
}

.day-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.56);
}

.mini-dots {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mini-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
}

.mini-dot.source-google {
  background: #4285f4;
}

.mini-dot.source-apple {
  background: #e04c4c;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.week-day {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.36);
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

.week-day-header {
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.week-day-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.week-day-date {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
}

.week-day-list {
  list-style: none;
  margin: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.week-event {
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  display: grid;
  gap: 2px;
}

.week-event-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.week-event-title {
  font-size: 12px;
  font-weight: 600;
}

.week-event-source {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.week-empty {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.day-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(16px);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  width: min(520px, 100%);
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
    rgba(10, 10, 12, 0.96);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
}

.modal-header {
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.72);
  font-size: 20px;
  cursor: pointer;
}

.modal-form {
  padding: 22px 24px 24px;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}

.form-input {
  width: 100%;
  height: 42px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 0 12px;
}

.form-input:focus {
  outline: none;
  border-color: rgba(232, 90, 25, 0.48);
  box-shadow: 0 0 0 3px rgba(232, 90, 25, 0.14);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-textarea {
  min-height: 88px;
  padding-top: 10px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.calendar-connections-modal {
  width: min(860px, 100%);
}

.connections-intro {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.62);
}

.connections-body {
  padding: 22px 24px 24px;
  display: grid;
  gap: 18px;
}

.connections-section {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  display: grid;
  gap: 16px;
}

.connections-section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.connections-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.46);
}

.connections-section h4 {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
}

.connections-copy,
.connections-status {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.62);
}

.connections-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.connection-list {
  display: grid;
  gap: 12px;
}

.connection-card {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.18);
  display: grid;
  gap: 12px;
}

.connection-toggle {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
}

.connection-toggle input {
  margin-top: 3px;
}

.connection-toggle span {
  display: grid;
  gap: 3px;
}

.connection-toggle strong {
  font-size: 14px;
}

.connection-toggle small {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.56);
  word-break: break-all;
}

.connection-field {
  display: grid;
  gap: 6px;
}

.connections-form {
  display: grid;
  gap: 14px;
}

.connections-form-wide {
  grid-column: span 1;
}

.connections-form-artist {
  max-width: 220px;
}

.connections-error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(232, 90, 25, 0.18);
  background: rgba(232, 90, 25, 0.08);
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
}

.btn-primary,
.btn-secondary {
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #fff;
  color: #050505;
  border-color: transparent;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.14);
}

@media (max-width: 1024px) {
  .calendar-view {
    padding: 22px 22px 120px;
  }

  .header-main,
  .header-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .quick-stats {
    justify-content: flex-start;
  }

  .event-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .event-artist {
    justify-self: start;
  }

  .week-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .connections-section-head {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .calendar-view {
    padding: 18px 16px 110px;
  }

  .calendar-header,
  .content-shell {
    border-radius: 24px;
  }

  .calendar-header {
    padding: 22px;
  }

  .content-shell {
    min-height: 440px;
    padding: 14px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .week-grid {
    grid-template-columns: 1fr;
  }

  .month-grid {
    gap: 6px;
  }

  .month-day {
    min-height: 84px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .connections-actions {
    width: 100%;
  }

  .connection-card {
    padding: 14px;
  }
}

/* Theme override */
.calendar-view {
  color: var(--color-text);
}

.calendar-view .stat-pill,
.calendar-view .nav-group,
.calendar-view .control-select,
.calendar-view .create-event-btn,
.calendar-view .content-shell,
.calendar-view .event-row,
.calendar-view .month-cell,
.calendar-view .week-day,
.calendar-view .week-event,
.calendar-view .modal-content,
.calendar-view .nav-btn,
.calendar-view .btn-primary,
.calendar-view .btn-secondary,
.calendar-view .modal-close,
.calendar-view .form-input {
  border-color: var(--color-border);
}

.calendar-view .stat-pill,
.calendar-view .nav-group,
.calendar-view .control-select,
.calendar-view .content-shell,
.calendar-view .event-row,
.calendar-view .month-cell,
.calendar-view .week-day,
.calendar-view .week-event,
.calendar-view .modal-content,
.calendar-view .nav-btn,
.calendar-view .btn-secondary,
.calendar-view .modal-close,
.calendar-view .form-input {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  color: var(--color-text);
}

.calendar-view .stat-pill,
.calendar-view .nav-group,
.calendar-view .control-select,
.calendar-view .nav-btn,
.calendar-view .btn-secondary,
.calendar-view .modal-close,
.calendar-view .form-input {
  box-shadow: none;
}

.calendar-view .content-shell {
  box-shadow: var(--shadow-1);
}

.calendar-view .event-row,
.calendar-view .month-cell,
.calendar-view .week-day,
.calendar-view .week-event {
  box-shadow: none;
}

.calendar-view .create-event-btn,
.calendar-view .btn-primary {
  background: rgba(19, 18, 17, 0.94);
  border-color: rgba(19, 18, 17, 0.08);
  color: var(--color-text-inverse);
}

.calendar-view .state-message,
.calendar-view .event-date,
.calendar-view .event-time,
.calendar-view .event-description,
.calendar-view .event-source,
.calendar-view .event-artist,
.calendar-view .day-count,
.calendar-view .week-day-date,
.calendar-view .week-event-time,
.calendar-view .week-event-source,
.calendar-view .week-empty,
.calendar-view .form-label,
.calendar-view .connections-copy,
.calendar-view .connections-status,
.calendar-view .connection-toggle small {
  color: var(--color-text-secondary);
}

.calendar-view .stat-label,
.calendar-view .month-header,
.calendar-view .connections-eyebrow {
  color: var(--color-text-tertiary);
}

.calendar-view .stat-pill strong,
.calendar-view .event-title,
.calendar-view .week-event-title,
.calendar-view .connection-toggle strong,
.calendar-view .connections-section h4,
.calendar-view .day-title,
.calendar-view .day-number,
.calendar-view .week-day-label,
.calendar-view .modal-title {
  color: var(--color-text);
}

.calendar-view .month-day.active {
  border-color: rgba(200, 75, 17, 0.28);
  box-shadow: inset 0 0 0 1px rgba(200, 75, 17, 0.16);
}

.calendar-view .mini-dot {
  background: var(--color-accent);
}

.calendar-view .connected-calendars-strip-label {
  color: var(--color-text-tertiary);
}

.calendar-view .connected-calendar-chip {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
}

.calendar-view .connected-calendar-chip.inactive {
  background: rgba(255, 255, 255, 0.42);
  border-color: rgba(19, 18, 17, 0.08);
  color: var(--color-text-secondary);
}

.calendar-view .connected-calendar-chip-detail {
  color: var(--color-text-secondary);
}

.calendar-view .connected-calendar-chip.source-local {
  color: rgb(200, 75, 17);
}

.calendar-view .connected-calendar-chip.source-google {
  color: #2f6fe4;
}

.calendar-view .connected-calendar-chip.source-apple {
  color: #cf4b4b;
}

.calendar-view .event-row.source-local,
.calendar-view .week-event.source-local {
  box-shadow: inset 3px 0 0 rgba(200, 75, 17, 0.52);
}

.calendar-view .event-row.source-google,
.calendar-view .week-event.source-google {
  box-shadow: inset 3px 0 0 rgba(47, 111, 228, 0.48);
}

.calendar-view .event-row.source-apple,
.calendar-view .week-event.source-apple {
  box-shadow: inset 3px 0 0 rgba(207, 75, 75, 0.44);
}

.calendar-view .event-row.source-google .event-source,
.calendar-view .week-event.source-google .week-event-source {
  color: #2f6fe4;
}

.calendar-view .event-row.source-apple .event-source,
.calendar-view .week-event.source-apple .week-event-source {
  color: #cf4b4b;
}

.calendar-view .event-row.source-local .event-source,
.calendar-view .week-event.source-local .week-event-source {
  color: rgb(200, 75, 17);
}

.calendar-view .mini-dot.source-google {
  background: #2f6fe4;
}

.calendar-view .mini-dot.source-apple {
  background: #cf4b4b;
}

.calendar-view .modal-overlay {
  background: rgba(19, 18, 17, 0.16);
  backdrop-filter: blur(22px);
}

.calendar-view .modal-content {
  box-shadow: var(--shadow-overlay);
}

.calendar-view .connections-section,
.calendar-view .connection-card {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
}

.calendar-view .connections-error {
  border-color: rgba(200, 75, 17, 0.18);
  background: rgba(200, 75, 17, 0.08);
  color: var(--color-text);
}

.calendar-view .modal-header {
  border-bottom-color: var(--color-border);
}

.calendar-view .btn-secondary:hover,
.calendar-view .nav-btn:hover,
.calendar-view .modal-close:hover {
  background: rgba(19, 18, 17, 0.06);
}

.calendar-view .form-input::placeholder {
  color: var(--color-text-tertiary);
}
</style>
