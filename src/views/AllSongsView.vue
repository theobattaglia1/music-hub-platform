<template>
  <WorkspacePage
    class="songs-page"
    artist-scoped-header
    eyebrow="Music"
    title="Songs"
    :count="totalSongs"
    subtitle="Library workspace for demos, masters, and release-ready tracks."
  >
    <template #actions>
      <div class="header-actions">
        <div v-if="selectedSongs.size > 0" class="selection-actions">
          <button class="workspace-header-secondary-btn" @click="clearSelection">Cancel</button>
          <button class="workspace-header-secondary-btn" @click="openEditSongsModal">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              />
            </svg>
            Edit Metadata
          </button>
          <button class="workspace-header-secondary-btn" @click="openAddToPlaylistModal">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"
              />
            </svg>
            Add to Playlist
          </button>
          <button class="workspace-header-danger-btn" @click="deleteSelectedSongs">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
            Delete
          </button>
        </div>

        <div v-else class="playback-actions">
          <button class="workspace-header-primary-btn" @click="playAll">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play All
          </button>
          <button class="workspace-header-secondary-btn" @click="shufflePlay">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
              />
            </svg>
            Shuffle
          </button>
        </div>
      </div>
    </template>

    <template #stats>
      <div class="quick-stats">
        <div class="stat-pill">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"
            />
          </svg>
          <span>{{ totalArtists }} artists</span>
        </div>
        <div class="stat-pill">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm.5 11H11V7h1.5v5l4.25 2.52-.75 1.23-5-2.97V13z"
            />
          </svg>
          <span>{{ libraryRuntime }}</span>
        </div>
      </div>
    </template>

    <div class="songs-view">
      <section class="browser-toolbar surface-panel">
        <div class="finder-toolbar">
          <div class="controls-section">
            <div class="search-wrapper">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="search-icon"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search songs, artists, and albums..."
                class="search-input"
                @keydown.escape="searchQuery = ''"
              />
              <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>

            <div class="filter-group">
              <div class="custom-select compact-select">
                <select v-model="sortBy" class="filter-select" @change="setSort(sortBy, true)">
                  <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <button class="sort-direction-btn" type="button" @click="toggleSortDirection">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  :class="{ desc: sortDirection === 'desc' }"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
                <span>{{ sortDirection === "desc" ? "Descending" : "Ascending" }}</span>
              </button>
            </div>
          </div>

          <div class="toolbar-summary">
            <div class="summary-pill">
              <span class="summary-label">Selection</span>
              <strong>{{ selectionSummary }}</strong>
            </div>
            <div class="summary-pill">
              <span class="summary-label">Visible</span>
              <strong>{{ filteredSongs.length }} songs</strong>
            </div>
            <div class="summary-pill">
              <span class="summary-label">Sort</span>
              <strong>{{ sortOptions.find((option) => option.value === sortBy)?.label }}</strong>
            </div>
            <div class="summary-pill" v-if="focusedSongName">
              <span class="summary-label">Focused Track</span>
              <strong>{{ focusedSongName }}</strong>
            </div>
          </div>
        </div>

        <div class="filter-racks">
          <div class="filter-rack">
            <span class="filter-rack-label">Artists</span>
            <div class="filter-chip-group segmented-control">
              <button
                class="filter-chip"
                :class="{ active: selectedArtists.length === 0 }"
                @click="clearArtistFilters"
              >
                <span>All</span>
              </button>
              <button
                v-for="option in artistOptions"
                :key="option.value"
                class="filter-chip"
                :class="{ active: selectedArtists.includes(option.value) }"
                @click="toggleArtistFilter(option.value)"
              >
                <span>{{ option.label }}</span>
                <small>{{ option.count }}</small>
              </button>
            </div>
          </div>

          <div class="filter-rack">
            <span class="filter-rack-label">Albums</span>
            <div class="filter-chip-group segmented-control">
              <button
                class="filter-chip"
                :class="{ active: selectedAlbums.length === 0 }"
                @click="clearAlbumFilters"
              >
                <span>All</span>
              </button>
              <button
                v-for="option in albumOptions"
                :key="option.value"
                class="filter-chip"
                :class="{ active: selectedAlbums.includes(option.value) }"
                @click="toggleAlbumFilter(option.value)"
              >
                <span>{{ option.label }}</span>
                <small>{{ option.count }}</small>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Songs Table -->
      <div class="songs-container">
        <div class="songs-panel">
          <!-- Table Header -->
          <div class="table-header">
            <div class="col-number">#</div>
            <button class="song-header-btn col-title" :class="{ active: sortBy === 'title' }" @click="setSort('title')">
              <span>Title</span>
              <svg
                v-if="sortBy === 'title'"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="sort-indicator"
                :class="{ desc: sortDirection === 'desc' }"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            <button class="song-header-btn col-artist" :class="{ active: sortBy === 'artist' }" @click="setSort('artist')">
              <span>Artist</span>
              <svg
                v-if="sortBy === 'artist'"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="sort-indicator"
                :class="{ desc: sortDirection === 'desc' }"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            <button class="song-header-btn col-album" :class="{ active: sortBy === 'album' }" @click="setSort('album')">
              <span>Album</span>
              <svg
                v-if="sortBy === 'album'"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="sort-indicator"
                :class="{ desc: sortDirection === 'desc' }"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            <button class="song-header-btn col-duration" :class="{ active: sortBy === 'duration' }" @click="setSort('duration')">
              <span>Duration</span>
              <svg
                v-if="sortBy === 'duration'"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="sort-indicator"
                :class="{ desc: sortDirection === 'desc' }"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            <div class="col-actions"></div>
          </div>

          <!-- Songs List -->
          <div
            ref="scrollerRef"
            class="songs-list"
            @scroll="handleScroll"
            @drop.prevent="handleDrop"
            @dragover.prevent="handleDragOver"
            @dragleave="isDraggingOver = false"
          >
            <div :style="{ height: totalHeight + 'px', position: 'relative' }">
              <div
                v-for="song in visibleSongs"
                :key="song.id"
                class="song-row"
                :style="{
                  position: 'absolute',
                  top: song._index * rowHeight + 'px',
                  left: 0,
                  right: 0,
                  height: rowHeight + 'px',
                }"
                :class="{
                  selected: selectedSongs.has(song.id),
                  playing: currentSong?.id === song.id,
                  highlighted: highlightedSong?.id === song.id,
                  focused: focusedSongId === String(song.id),
                }"
                :draggable="true"
                @click="handleRowClick(song, song._index, $event)"
                @dblclick="playSong(song)"
                @mouseenter="highlightedSong = song"
                @mouseleave="highlightedSong = null"
                @dragstart="handleDragStart(song, $event)"
                @dragend="handleDragEnd"
                @contextmenu.prevent="showSongContextMenu(song, $event)"
              >
                <div class="col-number">
                  <span v-if="currentSong?.id !== song.id" class="track-number">
                    {{ song._index + 1 }}
                  </span>
                  <div v-else class="playing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>

                <div class="col-title">
                  <div class="song-info">
                    <div class="song-artwork">
                      <img
                        v-if="song.artwork_path"
                        :src="getArtworkUrl(song.artwork_path)"
                        :alt="song.album"
                        loading="lazy"
                        @error="handleImageError"
                      />
                      <div v-else class="artwork-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path
                            d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
                          />
                        </svg>
                      </div>
                    </div>
                    <span class="song-name">{{ song.name }}</span>
                  </div>
                </div>

                <div class="col-artist">
                  <span class="artist-link" @click.stop="navigateToArtist(song.artist_id)">
                    {{ song.artist }}
                  </span>
                </div>
                <div class="col-album">{{ song.album || "—" }}</div>
                <div class="col-duration">{{ formatDuration(song.duration) }}</div>

                <div class="col-actions">
                  <button
                    class="action-icon"
                    @click.stop="showSongMenu(song, $event)"
                    v-show="highlightedSong?.id === song.id || selectedSongs.has(song.id)"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Drop Zone Overlay -->
      <div v-if="isDraggingOver" class="drop-overlay">
        <div class="drop-content">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
            />
          </svg>
          <p>Drop files to import</p>
        </div>
      </div>

      <teleport to="body">
        <transition name="fade">
          <div v-if="showPlaylistPicker" class="modal-overlay" @click.self="closePlaylistPicker">
            <div class="playlist-picker-modal">
              <div class="playlist-picker-head">
                <div>
                  <h3>Add to Playlist</h3>
                  <p>
                    {{ selectedSongs.size }} selected song{{ selectedSongs.size === 1 ? "" : "s" }}
                  </p>
                </div>
                <button class="close-picker-btn" @click="closePlaylistPicker">×</button>
              </div>

              <input
                v-model="playlistPickerQuery"
                class="playlist-picker-search"
                type="search"
                placeholder="Search playlists..."
              />

              <div class="playlist-picker-list">
                <button
                  v-for="playlist in selectablePlaylists"
                  :key="playlist.id"
                  class="playlist-picker-row"
                  @click="addSelectedSongsToPlaylist(playlist)"
                >
                  <div>
                    <strong>{{ playlist.name || playlist.title }}</strong>
                    <p>{{ playlist.song_count || playlist.track_ids?.length || 0 }} tracks</p>
                  </div>
                  <span>{{ playlist.is_public ? "Public" : "Private" }}</span>
                </button>
              </div>

              <div class="playlist-picker-actions">
                <button class="picker-secondary-btn" @click="createPlaylistFromSelection">
                  Create New Playlist
                </button>
                <button class="picker-primary-btn" @click="closePlaylistPicker">Done</button>
              </div>
            </div>
          </div>
        </transition>

        <transition name="fade">
          <div v-if="showEditSongsModal" class="modal-overlay" @click.self="closeEditSongsModal">
            <div class="song-edit-modal">
              <div class="playlist-picker-head">
                <div>
                  <h3>Edit Song Metadata</h3>
                  <p>
                    {{ selectedSongs.size }} selected song{{ selectedSongs.size === 1 ? "" : "s" }}
                  </p>
                </div>
                <button class="close-picker-btn" @click="closeEditSongsModal">×</button>
              </div>

              <form class="song-edit-form" @submit.prevent="saveSelectedSongMetadata">
                <label>
                  <span>Title</span>
                  <input
                    v-model.trim="songMetadataForm.title"
                    class="playlist-picker-search"
                    type="text"
                    placeholder="Leave blank to keep current titles"
                  />
                </label>

                <label>
                  <span>Album</span>
                  <input
                    v-model.trim="songMetadataForm.album"
                    class="playlist-picker-search"
                    type="text"
                    placeholder="Leave blank to keep current album metadata"
                  />
                </label>

                <div class="playlist-picker-actions">
                  <button type="button" class="picker-secondary-btn" @click="closeEditSongsModal">
                    Cancel
                  </button>
                  <button type="submit" class="picker-primary-btn">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </transition>

        <transition name="fade">
          <div
            v-if="showDeleteSongsModal"
            class="modal-overlay"
            @click.self="closeDeleteSongsModal"
          >
            <div class="song-edit-modal confirmation-modal">
              <div class="playlist-picker-head">
                <div>
                  <h3>Delete Songs</h3>
                  <p>
                    {{ selectedSongs.size }} selected song{{ selectedSongs.size === 1 ? "" : "s" }}
                  </p>
                </div>
                <button class="close-picker-btn" @click="closeDeleteSongsModal">×</button>
              </div>

              <div class="confirm-copy">
                <strong>{{ deleteSongsSummary }}</strong>
                <p>These files will be removed from the library. This cannot be undone.</p>
              </div>

              <div class="playlist-picker-actions">
                <button class="picker-secondary-btn" @click="closeDeleteSongsModal">Cancel</button>
                <button class="picker-danger-btn" @click="confirmDeleteSelectedSongs">
                  Delete Songs
                </button>
              </div>
            </div>
          </div>
        </transition>
      </teleport>
    </div>
  </WorkspacePage>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, inject, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDashboardStore } from "@/stores/dashboard";
import { usePlaybackStore } from "@/stores/playback";
import { useLibraryStore } from "@/stores/library";
import { usePlaylistsStore } from "@/stores/playlists";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";

const props = defineProps({
  songs: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["refresh", "import-files"]);

const router = useRouter();
const route = useRoute();
const dashboardStore = useDashboardStore();
const playbackStore = usePlaybackStore();
const libraryStore = useLibraryStore();
const playlistsStore = usePlaylistsStore();

// Inject global methods
const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});

// Refs
const scrollerRef = ref(null);
const searchQuery = ref("");
const debouncedSearchQuery = ref("");
const sortBy = ref("title");
const sortDirection = ref("asc");
const selectedArtists = ref([]);
const selectedAlbums = ref([]);
const selectedSongs = ref(new Set());
const highlightedSong = ref(null);
const lastSelectedIndex = ref(-1);
const isDraggingOver = ref(false);
const showPlaylistPicker = ref(false);
const playlistPickerQuery = ref("");
const showEditSongsModal = ref(false);
const showDeleteSongsModal = ref(false);
const focusedSongId = ref("");
const songMetadataForm = reactive({
  title: "",
  album: "",
});

// Virtual scrolling
const scrollTop = ref(0);
const containerHeight = ref(600);
const rowHeight = 60;
const buffer = 5;

// Sort options
const sortOptions = [
  { value: "title", label: "Title" },
  { value: "artist", label: "Artist" },
  { value: "album", label: "Album" },
  { value: "duration", label: "Duration" },
  { value: "dateAdded", label: "Date Added" },
];

// Computed
const totalSongs = computed(() => props.songs.length);
const currentSong = computed(() => playbackStore.currentSong);
const focusedRouteSongId = computed(() => String(route.query.focus || ""));
const totalArtists = computed(
  () => new Set(props.songs.map((song) => song.artist || "Unknown Artist")).size,
);
const libraryRuntime = computed(() => {
  const totalSeconds = props.songs.reduce((sum, song) => sum + Number(song.duration || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min total`;
});
const focusedSongName = computed(() => {
  const focusedSong = props.songs.find((song) => String(song.id) === focusedSongId.value);
  return focusedSong?.name || "";
});
const selectionSummary = computed(() => {
  if (selectedSongs.value.size === 0) return "No songs selected";
  if (selectedSongs.value.size === 1) {
    const [songId] = Array.from(selectedSongs.value);
    const selectedSong = props.songs.find((song) => String(song.id) === String(songId));
    return selectedSong?.name || "1 song selected";
  }
  return `${selectedSongs.value.size} songs selected`;
});
const searchedSongs = computed(() => {
  const query = debouncedSearchQuery.value;
  let filtered = props.songs;

  if (query) {
    filtered = filtered.filter(
      (song) =>
        song.name.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.album?.toLowerCase().includes(query),
    );
  }

  return filtered;
});
const artistOptions = computed(() =>
  [...new Map(
    searchedSongs.value
      .filter((song) => song.artist)
      .map((song) => [
        song.artist,
        {
          value: song.artist,
          label: song.artist,
          count: searchedSongs.value.filter((entry) => entry.artist === song.artist).length,
        },
      ]),
  ).values()].sort((a, b) => a.label.localeCompare(b.label)),
);
const albumOptions = computed(() =>
  [...new Map(
    searchedSongs.value
      .filter((song) => song.album)
      .map((song) => [
        song.album,
        {
          value: song.album,
          label: song.album,
          count: searchedSongs.value.filter((entry) => entry.album === song.album).length,
        },
      ]),
  ).values()].sort((a, b) => a.label.localeCompare(b.label)),
);
const deleteSongsSummary = computed(() => {
  const count = selectedSongs.value.size;
  if (count === 0) return "No songs selected";
  if (count === 1) return "1 song will be removed";
  return `${count} songs will be removed`;
});
const selectablePlaylists = computed(() => {
  const query = playlistPickerQuery.value.trim().toLowerCase();
  const entries = playlistsStore.playlists || [];
  if (!query) return entries;
  return entries.filter(
    (playlist) =>
      (playlist.name || playlist.title || "").toLowerCase().includes(query) ||
      (playlist.description || "").toLowerCase().includes(query),
  );
});

// Debounced search
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const updateDebouncedSearch = debounce((value) => {
  debouncedSearchQuery.value = value.toLowerCase();
}, 300);

watch(searchQuery, (newValue) => {
  updateDebouncedSearch(newValue);
});

const getDefaultSortDirection = (value) => (value === "dateAdded" ? "desc" : "asc");

const filteredSongs = computed(() => {
  let filtered = searchedSongs.value;

  if (selectedArtists.value.length > 0) {
    filtered = filtered.filter((song) => selectedArtists.value.includes(song.artist));
  }

  if (selectedAlbums.value.length > 0) {
    filtered = filtered.filter((song) => selectedAlbums.value.includes(song.album || ""));
  }

  const sorted = [...filtered];
  switch (sortBy.value) {
    case "title":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "artist":
      sorted.sort((a, b) => a.artist.localeCompare(b.artist));
      break;
    case "album":
      sorted.sort((a, b) => (a.album || "").localeCompare(b.album || ""));
      break;
    case "duration":
      sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      break;
    case "dateAdded":
      sorted.sort((a, b) => (b.date_added || 0) - (a.date_added || 0));
      break;
  }

  if (sortDirection.value === "desc" && sortBy.value !== "dateAdded") {
    sorted.reverse();
  }
  if (sortDirection.value === "asc" && sortBy.value === "dateAdded") {
    sorted.reverse();
  }

  return sorted.map((song, index) => ({ ...song, _index: index }));
});

const totalHeight = computed(() => filteredSongs.value.length * rowHeight);

const visibleSongs = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / rowHeight) - buffer);
  const end = Math.min(
    filteredSongs.value.length,
    Math.ceil((scrollTop.value + containerHeight.value) / rowHeight) + buffer,
  );

  return filteredSongs.value.slice(start, end);
});

// Methods
const handleScroll = (event) => {
  scrollTop.value = event.target.scrollTop;
};

const updateContainerHeight = () => {
  if (scrollerRef.value) {
    containerHeight.value = scrollerRef.value.clientHeight;
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const getArtworkUrl = (path) => {
  if (!path) return null;
  // For web app, assume path is already a valid URL or relative path
  // Add timestamp to prevent caching issues
  const timestamp = new Date().getTime();
  return path + "?t=" + timestamp;
};

const handleImageError = (e) => {
  e.target.style.display = "none";
};

const handleRowClick = (song, index, event) => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const isCmd = isMac ? event.metaKey : event.ctrlKey;
  const isShift = event.shiftKey;

  if (isCmd) {
    if (selectedSongs.value.has(song.id)) {
      selectedSongs.value.delete(song.id);
    } else {
      selectedSongs.value.add(song.id);
    }
    lastSelectedIndex.value = index;
  } else if (isShift && lastSelectedIndex.value !== -1) {
    const start = Math.min(lastSelectedIndex.value, index);
    const end = Math.max(lastSelectedIndex.value, index);

    if (!isCmd) {
      selectedSongs.value.clear();
    }

    for (let i = start; i <= end; i++) {
      selectedSongs.value.add(filteredSongs.value[i].id);
    }
  } else {
    if (selectedSongs.value.size > 0) {
      selectedSongs.value.clear();
    }
    highlightedSong.value = song;
    lastSelectedIndex.value = index;
  }

  focusedSongId.value = String(song.id);
  selectedSongs.value = new Set(selectedSongs.value);
};

const clearSelection = () => {
  selectedSongs.value.clear();
  selectedSongs.value = new Set(selectedSongs.value);
  focusedSongId.value = "";
};

const playSong = async (song) => {
  try {
    await playbackStore.playSong(song, filteredSongs.value);
  } catch (error) {
    console.error("Failed to play song:", error);
    showToast({
      message: `Failed to play ${song.name}`,
      type: "error",
    });
  }
};

const playAll = async () => {
  if (filteredSongs.value.length === 0) return;

  try {
    await playbackStore.playSong(filteredSongs.value[0], filteredSongs.value);
  } catch (error) {
    console.error("Failed to play all:", error);
  }
};

const shufflePlay = async () => {
  if (filteredSongs.value.length === 0) return;

  try {
    const shuffled = [...filteredSongs.value].sort(() => Math.random() - 0.5);
    await playbackStore.playSong(shuffled[0], shuffled);
  } catch (error) {
    console.error("Failed to shuffle play:", error);
  }
};

const deleteSelectedSongs = async () => {
  if (selectedSongs.value.size === 0) return;
  showDeleteSongsModal.value = true;
};

const closeDeleteSongsModal = () => {
  showDeleteSongsModal.value = false;
};

const confirmDeleteSelectedSongs = async () => {
  const count = selectedSongs.value.size;
  if (count === 0) return;

  try {
    const ids = Array.from(selectedSongs.value);
    await Promise.all(ids.map((id) => libraryStore.deleteMedia(id)));
    selectedSongs.value.clear();
    selectedSongs.value = new Set(selectedSongs.value);
    emit("refresh");
    showToast({
      message: `Deleted ${count} song(s)`,
      type: "success",
    });
  } catch (error) {
    showToast({
      message: `Failed to delete songs: ${error}`,
      type: "error",
    });
  } finally {
    closeDeleteSongsModal();
  }
};

const setSort = (value, resetDirection = false) => {
  if (sortBy.value === value && !resetDirection) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
    return;
  }

  const isNewColumn = sortBy.value !== value;
  sortBy.value = value;
  if (resetDirection) {
    sortDirection.value = getDefaultSortDirection(value);
  } else if (isNewColumn) {
    sortDirection.value = getDefaultSortDirection(value);
  }
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

const toggleArtistFilter = (value) => {
  selectedArtists.value = selectedArtists.value.includes(value)
    ? selectedArtists.value.filter((entry) => entry !== value)
    : [...selectedArtists.value, value];
};

const clearArtistFilters = () => {
  selectedArtists.value = [];
};

const toggleAlbumFilter = (value) => {
  selectedAlbums.value = selectedAlbums.value.includes(value)
    ? selectedAlbums.value.filter((entry) => entry !== value)
    : [...selectedAlbums.value, value];
};

const clearAlbumFilters = () => {
  selectedAlbums.value = [];
};

const showSongMenu = (song, event) => {
  showContextMenu(event, [song], "song");
};

const showSongContextMenu = (song, event) => {
  const items = selectedSongs.value.has(song.id)
    ? Array.from(selectedSongs.value)
        .map((id) => filteredSongs.value.find((s) => s.id === id))
        .filter(Boolean)
    : [song];
  showContextMenu(event, items, "song");
};

const getSelectedSongEntries = () => {
  const selectedIds = new Set(Array.from(selectedSongs.value).map((id) => String(id)));
  return filteredSongs.value.filter((song) => selectedIds.has(String(song.id)));
};

const openEditSongsModal = () => {
  const entries = getSelectedSongEntries();
  if (!entries.length) return;

  const firstEntry = entries[0];
  const sameAlbum = entries.every((song) => (song.album || "") === (firstEntry.album || ""));

  songMetadataForm.title = entries.length === 1 ? firstEntry.name || "" : "";
  songMetadataForm.album = sameAlbum ? firstEntry.album || "" : "";
  showEditSongsModal.value = true;
};

const closeEditSongsModal = () => {
  showEditSongsModal.value = false;
  songMetadataForm.title = "";
  songMetadataForm.album = "";
};

const saveSelectedSongMetadata = async () => {
  const entries = getSelectedSongEntries();
  if (!entries.length) return;

  const nextTitle = songMetadataForm.title.trim();
  const nextAlbum = songMetadataForm.album.trim();

  if (!nextTitle && !nextAlbum) {
    closeEditSongsModal();
    return;
  }

  try {
    await Promise.all(
      entries.map((song) => {
        const payload = { id: song.id };
        if (nextTitle) payload.title = nextTitle;
        if (nextAlbum) {
          payload.metadata = {
            ...song.metadata,
            album: nextAlbum,
          };
        }
        return libraryStore.updateMedia(payload);
      }),
    );

    emit("refresh");
    showToast({
      message: `Updated ${entries.length} song(s)`,
      type: "success",
    });
    closeEditSongsModal();
  } catch (error) {
    showToast({
      message: `Metadata update failed: ${error?.message || error}`,
      type: "error",
    });
  }
};

const openAddToPlaylistModal = async () => {
  const ids = Array.from(selectedSongs.value);
  if (!ids.length) return;

  try {
    if (playlistsStore.playlists.length === 0 && !playlistsStore.loading) {
      await playlistsStore.loadPlaylists();
    }
  } catch (error) {
    showToast({
      message: `Failed to load playlists: ${error?.message || error}`,
      type: "error",
    });
    return;
  }

  showPlaylistPicker.value = true;
};

const closePlaylistPicker = () => {
  showPlaylistPicker.value = false;
  playlistPickerQuery.value = "";
};

const addSelectedSongsToPlaylist = async (targetPlaylist) => {
  const ids = Array.from(selectedSongs.value);
  if (!ids.length || !targetPlaylist) return;

  try {
    await Promise.all(
      ids.map((songId) =>
        playlistsStore.addTrackToPlaylist({ playlistId: targetPlaylist.id, trackId: songId }),
      ),
    );
    showToast({
      message: `Added ${ids.length} song(s) to ${targetPlaylist.name || targetPlaylist.title}`,
      type: "success",
    });
    closePlaylistPicker();
  } catch (error) {
    showToast({
      message: `Failed to add to playlist: ${error?.message || error}`,
      type: "error",
    });
  }
};

const createPlaylistFromSelection = async () => {
  const ids = Array.from(selectedSongs.value);
  if (!ids.length) return;

  try {
    const playlist = await playlistsStore.createPlaylist({
      title: `New Playlist ${playlistsStore.playlists.length + 1}`,
      track_ids: ids,
    });
    showToast({
      message: `Created ${playlist.name || playlist.title}`,
      type: "success",
    });
    closePlaylistPicker();
    router.push(`/playlists/${playlist.id}`);
  } catch (error) {
    showToast({
      message: `Failed to create playlist: ${error?.message || error}`,
      type: "error",
    });
  }
};

const navigateToArtist = (artistId) => {
  if (artistId) {
    const artist = dashboardStore.artists.find((a) => a.id === artistId);
    if (artist) {
      router.push(`/artists/${artist.slug}`);
    }
  }
};

const focusSongById = async (songId) => {
  const normalizedId = String(songId || "");
  if (!normalizedId) return;

  let targetSong = filteredSongs.value.find((song) => String(song.id) === normalizedId);
  if (!targetSong && searchQuery.value) {
    searchQuery.value = "";
    await nextTick();
    targetSong = filteredSongs.value.find((song) => String(song.id) === normalizedId);
  }

  if (!targetSong) return;

  const index = targetSong._index;
  focusedSongId.value = normalizedId;
  highlightedSong.value = targetSong;
  selectedSongs.value = new Set([targetSong.id]);
  lastSelectedIndex.value = index;

  await nextTick();
  if (scrollerRef.value) {
    const top = Math.max(0, index * rowHeight - containerHeight.value / 2 + rowHeight / 2);
    scrollerRef.value.scrollTo({ top, behavior: "smooth" });
  }
};

watch(
  () => focusedRouteSongId.value,
  (songId) => {
    if (!songId) return;
    focusSongById(songId);
  },
  { immediate: true },
);

watch(filteredSongs, () => {
  if (focusedRouteSongId.value) {
    focusSongById(focusedRouteSongId.value);
  }
});

// Drag and drop
const handleDragStart = (song, event) => {
  const items = selectedSongs.value.has(song.id)
    ? Array.from(selectedSongs.value)
        .map((id) => filteredSongs.value.find((s) => s.id === id))
        .filter(Boolean)
    : [song];

  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData("text/plain", "internal-drag:songs");
  event.dataTransfer.setData("application/x-music-player-songs", JSON.stringify({ items }));
};

const handleDragEnd = () => {
  // Clean up
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  isDraggingOver.value = true;
};

const handleDrop = async (e) => {
  isDraggingOver.value = false;

  if (e.dataTransfer.files?.length) {
    const filePaths = Array.from(e.dataTransfer.files).map((f) => f.path);
    emit("import-files", filePaths);
  }
};

// Keyboard shortcuts
const handleKeyboard = (e) => {
  if (e.target.tagName === "INPUT") return;

  if ((e.metaKey || e.ctrlKey) && e.key === "a") {
    e.preventDefault();
    selectedSongs.value.clear();
    filteredSongs.value.forEach((song) => selectedSongs.value.add(song.id));
    selectedSongs.value = new Set(selectedSongs.value);
  }
  if (e.key === "Escape") {
    selectedSongs.value.clear();
    selectedSongs.value = new Set(selectedSongs.value);
    searchQuery.value = "";
  }
};

// Resize observer
let resizeObserver = null;

onMounted(() => {
  document.addEventListener("keydown", handleKeyboard);

  updateContainerHeight();

  if (scrollerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateContainerHeight();
    });
    resizeObserver.observe(scrollerRef.value);
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyboard);

  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
.songs-view {
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: white;
  gap: 14px;
}

/* Header */
.view-header {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)),
    rgba(10, 10, 12, 0.88);
  backdrop-filter: blur(28px);
  padding: 30px;
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
  opacity: 0.8;
}

.orb-1 {
  width: 220px;
  height: 220px;
  top: -80px;
  right: 10%;
  background: rgba(232, 90, 25, 0.16);
}

.orb-2 {
  width: 180px;
  height: 180px;
  bottom: -90px;
  left: 22%;
  background: rgba(214, 64, 50, 0.12);
}

.header-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.browser-toolbar {
  display: grid;
  gap: 10px;
  padding: 20px 22px;
}

.finder-toolbar {
  display: grid;
  gap: 10px;
}

.controls-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.search-wrapper {
  position: relative;
  flex: 1 1 420px;
  max-width: 640px;
}

.filter-group {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.compact-select {
  min-width: 180px;
}

.filter-select {
  min-height: var(--control-md);
  padding: 0 40px 0 16px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
  font: inherit;
}

.sort-direction-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-md);
  padding: 0 14px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.sort-direction-btn svg {
  width: 16px;
  height: 16px;
  transition: transform var(--motion-default);
}

.sort-direction-btn svg.desc {
  transform: rotate(180deg);
}

.toolbar-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-sm);
  padding: 0 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text-secondary);
}

.summary-label {
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-pill strong {
  color: var(--color-text);
  font-size: 13px;
  font-weight: var(--weight-semibold);
}

.filter-racks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px 24px;
  margin-top: 2px;
}

.filter-rack {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 0 1 auto;
  max-width: 100%;
}

.filter-rack-label {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.filter-chip-group {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
  gap: 6px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  overflow-x: auto;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-sm);
  padding: 0 12px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  font: inherit;
  transition:
    background var(--motion-default),
    color var(--motion-default);
}

.filter-chip:hover {
  color: var(--color-text);
}

.filter-chip.active {
  background: rgba(200, 75, 17, 0.1);
  color: var(--color-text);
}

.filter-chip small {
  color: var(--color-text-tertiary);
  font-size: var(--text-small);
  font-weight: var(--weight-semibold);
}

.filter-chip.active small {
  color: var(--color-accent);
}

.stat-pill,
.insight-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
}

.stat-pill svg {
  width: 16px;
  height: 16px;
  opacity: 0.72;
}

.view-title {
  display: flex;
  align-items: baseline;
  gap: 14px;
  font-size: 46px;
  font-weight: 250;
  margin: 0;
  letter-spacing: -0.04em;
}

.title-accent {
  font-size: 22px;
  font-weight: 450;
  color: rgba(255, 255, 255, 0.42);
}

.view-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.56);
  margin: 0;
}

.selection-count {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* Header Controls */
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 16px;
  position: relative;
  z-index: 1;
  min-width: 0;
}

.search-box {
  flex: 1 1 420px;
  max-width: 520px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.search-input {
  width: 100%;
  min-height: var(--control-md);
  padding: 0 46px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-control);
  color: white;
  font-size: 14px;
  transition: all 0.15s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.clear-search:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
}

/* View Options */
.view-options {
  position: relative;
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
}

.sort-button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control-md);
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-control);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.sort-button:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.sort-button svg {
  width: 18px;
  height: 18px;
}

.sort-menu {
  position: fixed;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(18px);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 6px;
  min-width: 180px;
  box-shadow: var(--shadow-overlay);
  color: var(--color-text);
  z-index: 2400;
}

.sort-option {
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.sort-option:hover {
  background: var(--color-accent-subtle);
  color: var(--color-text);
}

.sort-option.active {
  background: var(--color-accent-subtle);
  color: var(--color-text);
  font-weight: 500;
}

/* Action Buttons */
.header-actions {
  display: flex;
  position: relative;
  z-index: 1;
  gap: 12px;
}

.selection-actions,
.playback-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.primary {
  background: white;
  color: black;
}

.action-btn.primary:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.action-btn.ghost {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.action-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.action-btn.danger {
  color: #ff5555;
  border-color: rgba(255, 85, 85, 0.3);
}

.action-btn.danger:hover {
  background: rgba(255, 85, 85, 0.1);
  border-color: rgba(255, 85, 85, 0.5);
}

.header-insights {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
}

.insight-pill {
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  min-height: var(--control-md);
  border-radius: var(--radius-control);
  padding: 0 16px;
  min-width: 180px;
  max-width: 240px;
}

.insight-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
  white-space: nowrap;
}

.insight-pill strong {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

/* Songs Container */
.songs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.songs-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015)),
    rgba(7, 7, 9, 0.9);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
}

/* Table Header */
.table-header {
  display: grid;
  grid-template-columns: 50px 1fr 200px 200px 80px 50px;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 18px 28px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.025);
}

.song-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
}

.song-header-btn.active {
  color: var(--color-text);
}

.song-header-btn.col-duration {
  justify-content: center;
}

.sort-indicator {
  width: 14px;
  height: 14px;
  transition: transform var(--motion-default);
}

.sort-indicator.desc {
  transform: rotate(180deg);
}

.col-duration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-duration svg {
  width: 16px;
  height: 16px;
}

/* Songs List */
.songs-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 18px 18px;
}

/* Song Row */
.song-row {
  display: grid;
  grid-template-columns: 50px 1fr 200px 200px 80px 50px;
  gap: 16px;
  padding: 0 14px;
  border-radius: 18px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
  align-items: center;
  user-select: none;
  border: 1px solid transparent;
}

.song-row:hover {
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.05);
}

.song-row.highlighted {
  background: rgba(255, 255, 255, 0.05);
}

.song-row.focused {
  background: rgba(232, 90, 25, 0.1);
  border-color: rgba(232, 90, 25, 0.24);
  box-shadow: inset 0 0 0 1px rgba(232, 90, 25, 0.16);
}

.song-row.selected {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.08);
}

.song-row.playing {
  color: var(--color-accent);
}

/* Columns */
.col-number {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.track-number {
  opacity: 0.7;
}

.playing-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
}

.playing-indicator span {
  width: 3px;
  height: 12px;
  background: var(--color-accent);
  border-radius: 3px;
  animation: playing 0.8s ease-in-out infinite;
}

.playing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.playing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes playing {
  0%,
  100% {
    height: 12px;
    opacity: 0.8;
  }
  50% {
    height: 4px;
    opacity: 1;
  }
}

.col-title {
  overflow: hidden;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.song-artwork {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.song-artwork img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artwork-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.artwork-placeholder svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.song-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.95);
}

.col-artist,
.col-album {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.64);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist-link {
  cursor: pointer;
  transition: all 0.15s ease;
}

.artist-link:hover {
  color: white;
  text-decoration: underline;
}

.col-duration {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
}

.col-actions {
  display: flex;
  justify-content: center;
}

.action-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-icon:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.action-icon svg {
  width: 18px;
  height: 18px;
}

/* Drop Overlay */
.drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.drop-content {
  text-align: center;
}

.drop-content svg {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
}

.drop-content p {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.playlist-picker-modal {
  width: min(560px, 100%);
  max-height: 78vh;
  overflow: auto;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.38);
  padding: 20px;
}

.song-edit-modal {
  width: min(520px, 100%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.38);
  padding: 20px;
}

.confirmation-modal {
  width: min(480px, 100%);
}

.playlist-picker-head,
.playlist-picker-row,
.playlist-picker-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.playlist-picker-head {
  margin-bottom: 16px;
}

.playlist-picker-head h3,
.playlist-picker-row strong {
  margin: 0;
}

.playlist-picker-head p,
.playlist-picker-row p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.58);
}

.confirm-copy {
  margin-bottom: 16px;
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

.song-edit-form {
  display: grid;
  gap: 14px;
}

.song-edit-form label {
  display: grid;
  gap: 8px;
}

.song-edit-form span {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.close-picker-btn,
.picker-secondary-btn,
.picker-primary-btn {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
}

.close-picker-btn {
  width: 36px;
  height: 36px;
  font-size: 22px;
}

.playlist-picker-search {
  width: 100%;
  margin-bottom: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  padding: 12px 14px;
  font: inherit;
}

.playlist-picker-list {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.playlist-picker-row {
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #fff;
  text-align: left;
  cursor: pointer;
}

.playlist-picker-row span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.picker-secondary-btn,
.picker-primary-btn,
.picker-danger-btn {
  min-height: 40px;
  padding: 0 16px;
  font-weight: 600;
}

.picker-primary-btn {
  background: #fff;
  color: #000;
  border-color: transparent;
}

.picker-danger-btn {
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
  border-color: rgba(239, 68, 68, 0.3);
}

/* Scrollbar */
.songs-list::-webkit-scrollbar {
  width: 12px;
}

.songs-list::-webkit-scrollbar-track {
  background: transparent;
}

.songs-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.songs-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}

@media (max-width: 1100px) {
  .songs-view {
    gap: 16px;
  }

  .controls-section,
  .header-content,
  .header-controls,
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper,
  .search-box {
    max-width: none;
  }

  .quick-stats {
    justify-content: flex-start;
  }

  .filter-rack {
    flex-basis: 100%;
  }

  .selection-actions,
  .playback-actions {
    flex-wrap: wrap;
  }

  .table-header,
  .song-row {
    grid-template-columns: 44px minmax(0, 1fr) 160px 76px 42px;
  }

  .col-album {
    display: none;
  }
}

@media (max-width: 720px) {
  .songs-view {
    gap: 14px;
  }

  .view-header,
  .songs-panel {
    border-radius: 24px;
  }

  .view-header {
    padding: 22px;
  }

  .view-title {
    font-size: 34px;
  }

  .header-insights {
    flex-direction: column;
    justify-content: stretch;
  }

  .insight-pill {
    min-width: 0;
    max-width: none;
  }

  .controls-section,
  .filter-group,
  .toolbar-summary,
  .filter-racks,
  .filter-rack {
    gap: 12px;
  }

  .browser-toolbar {
    padding: 16px;
  }

  .search-wrapper,
  .filter-rack {
    flex-basis: 100%;
    max-width: none;
  }

  .table-header,
  .song-row {
    grid-template-columns: 38px minmax(0, 1fr) 72px 40px;
    gap: 12px;
  }

  .col-artist {
    display: none;
  }

  .songs-list {
    padding: 8px 12px 16px;
  }

  .table-header {
    padding: 16px 18px 12px;
  }

  .action-btn {
    justify-content: center;
  }
}

/* Theme override: preserve the structured root layout while moving the body
   onto the lighter glass system. */
.songs-page {
  color: var(--color-text);
}

.songs-page :deep(.workspace-body) {
  gap: var(--space-4);
}

.songs-page :deep(.workspace-toolbar) {
  align-items: stretch;
}

.songs-page :is(.stat-pill, .summary-pill, .insight-pill) {
  border-color: rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.72);
  color: var(--color-text-secondary);
  box-shadow: none;
}

.songs-page .stat-pill strong,
.songs-page .summary-pill strong,
.songs-page .insight-pill strong,
.songs-page .song-name,
.songs-page .selection-count {
  color: var(--color-text);
}

.songs-page :is(.search-input, .filter-select, .sort-direction-btn, .sort-button, .action-btn, .clear-search) {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-text);
  box-shadow: none;
}

.songs-page .action-btn.primary {
  background:
    linear-gradient(180deg, rgba(200, 75, 17, 0.16), rgba(200, 75, 17, 0.08)),
    rgba(255, 255, 255, 0.88);
  border-color: rgba(200, 75, 17, 0.22);
  color: var(--color-accent);
}

.songs-page .action-btn.ghost.danger,
.songs-page .picker-danger-btn {
  border-color: rgba(192, 57, 43, 0.18);
  background: rgba(192, 57, 43, 0.08);
  color: var(--color-danger);
}

.songs-page .search-input::placeholder {
  color: var(--color-text-tertiary);
}

.songs-page
  :is(.search-icon, .clear-search, .summary-label, .insight-label, .track-number, .col-album, .col-duration) {
  color: var(--color-text-tertiary);
}

.songs-page .browser-toolbar,
.songs-page .sort-menu,
.songs-page :is(.playlist-picker-modal, .song-edit-modal, .confirmation-modal, .drop-content) {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-overlay);
  color: var(--color-text);
}

.songs-page .sort-option {
  color: var(--color-text-secondary);
}

.songs-page .sort-option:hover,
.songs-page .sort-option.active {
  background: var(--color-accent-subtle);
  color: var(--color-text);
}

.songs-view .songs-panel {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(250, 250, 248, 0.82)),
    var(--color-surface);
  box-shadow: var(--shadow-1);
}

.songs-view .table-header {
  border-bottom-color: var(--color-border);
  background: rgba(237, 236, 233, 0.55);
  color: var(--color-text-tertiary);
}

.songs-view .song-header-btn:hover,
.songs-view .song-header-btn.active {
  color: var(--color-text);
}

.songs-view .song-row {
  border-color: rgba(19, 18, 17, 0.05);
  background: transparent;
  color: var(--color-text-secondary);
}

.songs-view .song-row:hover {
  background: rgba(19, 18, 17, 0.035);
}

.songs-view .song-row.selected,
.songs-view .song-row.focused {
  background: rgba(200, 75, 17, 0.08);
  border-color: rgba(200, 75, 17, 0.12);
}

.songs-view .song-row.playing {
  background: rgba(26, 122, 74, 0.08);
  border-color: rgba(26, 122, 74, 0.12);
}

.songs-view .artist-link {
  color: var(--color-accent);
}

.songs-view .artist-link:hover {
  color: var(--color-accent-hover);
}

.songs-view .artwork-placeholder {
  background: linear-gradient(135deg, rgba(200, 75, 17, 0.12), rgba(19, 18, 17, 0.08));
  color: var(--color-text-secondary);
}

.songs-view .playing-indicator span {
  background: var(--color-accent);
}
</style>
