<template>
  <WorkspacePage
    class="playlists-shell"
    artist-scoped-header
    eyebrow="Music"
    title="Playlists"
    :count="filteredPlaylists.length"
    subtitle="Curate your working collections, listening sets, and release sequencing."
  >
    <template #actions>
      <button class="workspace-header-primary-btn" @click="openCreatePlaylistModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Create Playlist</span>
      </button>
    </template>

    <template #stats>
      <div class="quick-stats">
        <div class="stat-pill">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
            />
          </svg>
          <span>{{ totalSongs }} songs</span>
        </div>
        <div class="stat-pill">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
            />
          </svg>
          <span>{{ formatDuration(totalDuration) }}</span>
        </div>
      </div>
    </template>

    <template #toolbar>
      <div class="header-controls">
        <div class="search-container">
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
              placeholder="Search playlists, moods, or genres..."
              class="search-input"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
            />
            <transition name="fade">
              <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </transition>
          </div>
        </div>

        <div class="action-buttons">
          <button class="icon-btn" @click="showSortMenu = !showSortMenu" title="Sort">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="6" y1="12" x2="18" y2="12"></line>
              <line x1="9" y1="18" x2="15" y2="18"></line>
            </svg>
          </button>
        </div>

        <transition name="dropdown">
          <div v-if="showSortMenu" class="sort-dropdown">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              @click="setSortBy(option.value)"
              :class="['sort-option', { active: sortBy === option.value }]"
            >
              <span>{{ option.label }}</span>
              <svg v-if="sortBy === option.value" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </button>
          </div>
        </transition>
      </div>
    </template>

    <div class="playlists-view">
      <!-- Filter Pills -->
      <div class="filter-section">
        <div class="filter-pills segmented-control">
          <button
            v-for="filter in filterOptions"
            :key="filter.value"
            @click="activeFilter = filter.value"
            :class="['filter-pill', { active: activeFilter === filter.value }]"
          >
            <span>{{ filter.label }}</span>
            <span v-if="filter.count" class="filter-count">{{ filter.count }}</span>
          </button>
        </div>
      </div>

      <!-- Playlists Container -->
      <div class="playlists-container" @contextmenu.prevent="showPlaylistWorkspaceMenu">
        <!-- Empty State -->
        <transition name="fade">
          <div v-if="filteredPlaylists.length === 0 && !loading" class="empty-state">
            <div class="empty-illustration">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle
                  cx="100"
                  cy="100"
                  r="60"
                  stroke="currentColor"
                  stroke-width="2"
                  opacity="0.1"
                />
                <path
                  d="M100 60v40M80 80l20 20 20-20"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  opacity="0.2"
                />
                <rect
                  x="70"
                  y="120"
                  width="60"
                  height="40"
                  rx="4"
                  fill="currentColor"
                  opacity="0.05"
                />
                <line
                  x1="85"
                  y1="135"
                  x2="115"
                  y2="135"
                  stroke="currentColor"
                  stroke-width="2"
                  opacity="0.2"
                />
                <line
                  x1="85"
                  y1="145"
                  x2="105"
                  y2="145"
                  stroke="currentColor"
                  stroke-width="2"
                  opacity="0.1"
                />
              </svg>
            </div>
            <h3 class="empty-title">
              {{ searchQuery ? "No playlists found" : "Start your collection" }}
            </h3>
            <p class="empty-text">
              {{
                searchQuery
                  ? "Try a different search term"
                  : "Create playlists to organize your favorite tracks"
              }}
            </p>
            <button v-if="!searchQuery" class="empty-action-btn" @click="openCreatePlaylistModal">
              <div class="btn-glow"></div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Create Your First Playlist</span>
            </button>
          </div>
        </transition>

        <!-- Loading State -->
        <transition name="fade">
          <div v-if="loading" class="loading-grid collection-grid-compact">
            <div
              v-for="i in 8"
              :key="i"
              class="skeleton-card"
              :style="{ animationDelay: `${i * 0.1}s` }"
            >
              <div class="skeleton-cover"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-subtitle"></div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Playlists Grid -->
        <transition name="fade">
          <div
            v-if="!loading && filteredPlaylists.length > 0"
            class="playlists-grid collection-grid-compact"
          >
            <transition-group name="playlist-list">
              <div
                v-for="(playlist, index) in filteredPlaylists"
                :key="playlist.id"
                class="playlist-card"
                :style="{ animationDelay: `${index * 0.05}s` }"
                @click="navigateToPlaylist(playlist)"
                @mouseenter="hoveredPlaylist = playlist.id"
                @mouseleave="hoveredPlaylist = null"
                @contextmenu.prevent="showPlaylistMenu(playlist, $event)"
              >
                <!-- Cover Art -->
                <div class="playlist-cover">
                  <div v-if="playlist.cover_image" class="cover-image">
                    <img :src="playlist.cover_image" :alt="playlist.name" />
                  </div>
                  <div v-else class="cover-placeholder">
                    <div class="placeholder-grid">
                      <div
                        v-for="i in 4"
                        :key="i"
                        class="grid-item"
                        :style="{ background: getPlaylistColor(playlist, i) }"
                      ></div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="currentColor" class="playlist-icon">
                      <path
                        d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"
                      />
                    </svg>
                  </div>

                  <!-- Play Overlay -->
                  <transition name="fade">
                    <div v-if="hoveredPlaylist === playlist.id" class="play-overlay">
                      <button class="play-btn" @click.stop="playPlaylist(playlist)">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </transition>

                  <!-- Playlist Badge -->
                  <div v-if="playlist.is_public" class="playlist-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      />
                    </svg>
                    <span>Public</span>
                  </div>
                </div>

                <!-- Playlist Info -->
                <div class="playlist-info">
                  <h3 class="playlist-name">{{ playlist.name }}</h3>
                  <p class="playlist-meta">
                    <span class="meta-item">{{ playlist.song_count || 0 }} songs</span>
                    <span class="meta-dot">•</span>
                    <span class="meta-item">{{ formatPlaylistDuration(playlist) }}</span>
                  </p>
                  <p v-if="playlist.description" class="playlist-description">
                    {{ playlist.description }}
                  </p>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions">
                  <button
                    class="action-btn"
                    @click.stop="toggleFavorite(playlist)"
                    :class="{ active: playlist.is_favorite }"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                      />
                    </svg>
                  </button>
                  <button class="action-btn" @click.stop="showPlaylistMenu(playlist, $event)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>
                </div>
              </div>
            </transition-group>
          </div>
        </transition>
      </div>

      <!-- Create Playlist Modal -->
      <teleport to="body">
        <transition name="modal">
          <div v-if="playlistModalOpen" class="modal-overlay" @click.self="closePlaylistModal">
            <div class="modal-content">
              <div class="modal-header">
                <h2>
                  {{ playlistModalMode === "create" ? "Create New Playlist" : "Edit Playlist" }}
                </h2>
                <button class="close-btn" @click="closePlaylistModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <form @submit.prevent="submitPlaylistModal" class="modal-body">
                <div class="form-group">
                  <label for="playlist-name">Name</label>
                  <input
                    id="playlist-name"
                    v-model="playlistForm.name"
                    type="text"
                    placeholder="My Awesome Playlist"
                    required
                    autofocus
                    maxlength="100"
                  />
                  <span class="char-count">{{ playlistForm.name.length }}/100</span>
                </div>

                <div class="form-group">
                  <label for="playlist-description">Description</label>
                  <textarea
                    id="playlist-description"
                    v-model="playlistForm.description"
                    placeholder="What's the vibe?"
                    rows="3"
                    maxlength="300"
                  ></textarea>
                  <span class="char-count">{{ playlistForm.description.length }}/300</span>
                </div>

                <div class="form-group">
                  <label class="toggle-label">
                    <input v-model="playlistForm.isPublic" type="checkbox" class="toggle-input" />
                    <span class="toggle-switch"></span>
                    <span class="toggle-text">
                      <strong>Public Playlist</strong>
                      <small>Anyone can view and follow this playlist</small>
                    </span>
                  </label>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn-secondary" @click="closePlaylistModal">
                    Cancel
                  </button>
                  <button type="submit" class="btn-primary" :disabled="!playlistForm.name.trim()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>{{
                      playlistModalMode === "create" ? "Create Playlist" : "Save Playlist"
                    }}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </transition>

        <transition name="modal">
          <div
            v-if="deletePlaylistModalOpen"
            class="modal-overlay"
            @click.self="closeDeletePlaylistModal"
          >
            <div class="modal-content confirm-modal">
              <div class="modal-header">
                <h2>Delete Playlist</h2>
                <button class="close-btn" @click="closeDeletePlaylistModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div class="modal-body">
                <div class="confirm-copy">
                  <strong>{{ pendingDeletePlaylist?.name }}</strong>
                  <p>
                    This removes the playlist shell and its current track ordering from the
                    workspace.
                  </p>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn-secondary" @click="closeDeletePlaylistModal">
                    Cancel
                  </button>
                  <button type="button" class="btn-danger" @click="confirmDeletePlaylist">
                    Delete Playlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </teleport>
    </div>
  </WorkspacePage>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlaylistsStore } from "@/stores/playlists";
import { usePlaybackStore } from "@/stores/playback";
import { useLibraryStore } from "@/stores/library";
import { useDashboardStore } from "@/stores/dashboard";
import WorkspacePage from "@/components/layout/WorkspacePage.vue";

const router = useRouter();
const route = useRoute();
const store = usePlaylistsStore();
const playbackStore = usePlaybackStore();
const libraryStore = useLibraryStore();
const dashboardStore = useDashboardStore();

// Inject global methods
const showContextMenu = inject("showContextMenu", () => {});
const showToast = inject("showToast", () => {});

// State
const searchQuery = ref("");
const searchFocused = ref(false);
const playlistModalOpen = ref(false);
const playlistModalMode = ref("create");
const activePlaylistId = ref("");
const deletePlaylistModalOpen = ref(false);
const pendingDeletePlaylist = ref(null);
const showSortMenu = ref(false);
const loading = ref(true);
const hoveredPlaylist = ref(null);
const sortBy = ref("recent");
const activeFilter = ref("all");

const playlistForm = reactive({
  name: "",
  description: "",
  isPublic: false,
});

const normalizePlaylist = (playlist) => ({
  ...playlist,
  name: playlist.name || playlist.title || "Untitled Playlist",
  description: playlist.description || "",
  cover_image: playlist.cover_image || playlist.cover_image_url || null,
  song_ids: playlist.song_ids || playlist.track_ids || [],
  is_public: Boolean(playlist.is_public),
  is_favorite: Boolean(playlist.is_favorite),
  total_duration: playlist.total_duration || 0,
  updated_at: playlist.updated_at || playlist.created_at || new Date().toISOString(),
});

const scopedArtist = computed(() => {
  const slug = typeof route.query.artist === "string" ? route.query.artist : "";
  if (!slug) return null;
  return (
    (dashboardStore.artists || []).find(
      (artist) => artist.slug === slug || String(artist.id) === slug,
    ) || null
  );
});

const scopedArtistSongIds = computed(() => {
  if (!scopedArtist.value) return new Set();
  return new Set(
    libraryStore.songs
      .filter(
        (song) =>
          String(song.artist_id || "") === String(scopedArtist.value.id) ||
          song.artist === scopedArtist.value.name,
      )
      .map((song) => String(song.id)),
  );
});

const playlists = computed(() =>
  store.playlists
    .map((playlist) => normalizePlaylist(playlist))
    .filter((playlist) => {
      if (!scopedArtist.value) return true;
      if (playlist.artist_id && String(playlist.artist_id) === String(scopedArtist.value.id)) {
        return true;
      }
      const ids = playlist.song_ids || playlist.track_ids || [];
      return ids.some((id) => scopedArtistSongIds.value.has(String(id)));
    }),
);

// Sort options
const sortOptions = [
  { value: "recent", label: "Recently Updated" },
  { value: "name", label: "Name (A-Z)" },
  { value: "songs", label: "Most Songs" },
  { value: "duration", label: "Longest Duration" },
];

// Filter options
const filterOptions = computed(() => [
  { value: "all", label: "All Playlists", count: playlists.value.length },
  { value: "public", label: "Public", count: playlists.value.filter((p) => p.is_public).length },
  { value: "private", label: "Private", count: playlists.value.filter((p) => !p.is_public).length },
  {
    value: "favorites",
    label: "Favorites",
    count: playlists.value.filter((p) => p.is_favorite).length,
  },
]);

// Computed
const filteredPlaylists = computed(() => {
  let result = [...playlists.value];

  // Apply filter
  switch (activeFilter.value) {
    case "public":
      result = result.filter((p) => p.is_public);
      break;
    case "private":
      result = result.filter((p) => !p.is_public);
      break;
    case "favorites":
      result = result.filter((p) => p.is_favorite);
      break;
  }

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(query) ||
        playlist.description?.toLowerCase().includes(query),
    );
  }

  // Apply sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case "name":
        return a.name.localeCompare(b.name);
      case "songs":
        return (b.song_count || 0) - (a.song_count || 0);
      case "duration":
        return (b.total_duration || 0) - (a.total_duration || 0);
      case "recent":
      default:
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    }
  });

  return result;
});

const totalSongs = computed(() => {
  return playlists.value.reduce((sum, p) => sum + (p.song_count || 0), 0);
});

const totalDuration = computed(() => {
  return playlists.value.reduce((sum, p) => sum + (p.total_duration || 0), 0);
});

// Methods
const resetPlaylistForm = () => {
  playlistForm.name = "";
  playlistForm.description = "";
  playlistForm.isPublic = false;
  activePlaylistId.value = "";
  playlistModalMode.value = "create";
};

const openCreatePlaylistModal = () => {
  resetPlaylistForm();
  playlistModalMode.value = "create";
  playlistModalOpen.value = true;
};

const openEditPlaylistModal = (playlist) => {
  playlistModalMode.value = "edit";
  activePlaylistId.value = playlist.id;
  playlistForm.name = playlist.name || "";
  playlistForm.description = playlist.description || "";
  playlistForm.isPublic = Boolean(playlist.is_public);
  playlistModalOpen.value = true;
};

const closePlaylistModal = () => {
  playlistModalOpen.value = false;
  resetPlaylistForm();
};

const submitPlaylistModal = async () => {
  if (!playlistForm.name.trim()) return;

  try {
    const submittedName = playlistForm.name.trim();
    if (playlistModalMode.value === "create") {
      const playlist = await store.createPlaylist({
        title: submittedName,
        description: playlistForm.description,
        is_public: playlistForm.isPublic,
        artist_id: scopedArtist.value?.id || null,
        track_ids: [],
      });

      const normalized = normalizePlaylist(playlist);
      closePlaylistModal();

      showToast({
        message: `Created playlist "${normalized.name}"`,
        type: "success",
      });

      router.push(`/playlists/${normalized.id}`);
      return;
    }

    await store.updatePlaylist({
      id: activePlaylistId.value,
      title: submittedName,
      name: submittedName,
      description: playlistForm.description,
      is_public: playlistForm.isPublic,
    });

    closePlaylistModal();
    showToast({
      message: `Updated "${submittedName}"`,
      type: "success",
    });
  } catch (error) {
    console.error("Failed to save playlist:", error);
    showToast({
      message: "Failed to save playlist",
      type: "error",
    });
  }
};

const navigateToPlaylist = (playlist) => {
  router.push(`/playlists/${playlist.id}`);
};

const getPlaylistTracks = async (playlist) => {
  if (libraryStore.songs.length === 0 && !libraryStore.loading) {
    try {
      await libraryStore.loadSongs();
    } catch {
      return [];
    }
  }

  const ids = playlist.song_ids || playlist.track_ids || [];
  if (!ids.length) return [];

  const map = new Map(libraryStore.songs.map((song) => [song.id, song]));
  return ids.map((id) => map.get(id)).filter(Boolean);
};

const playPlaylist = async (playlist) => {
  const tracks = await getPlaylistTracks(playlist);

  if (tracks.length) {
    playbackStore.playArtist({ id: playlist.id, name: playlist.name }, tracks);
    showToast({
      message: `Playing "${playlist.name}"`,
      type: "success",
    });
    return;
  }

  // Local fallback if playlist has no linked media yet.
  playbackStore.playArtist({ id: playlist.id, name: playlist.name }, [
    {
      id: `${playlist.id}-preview`,
      name: `${playlist.name} Preview`,
      artist: playlist.name,
      duration: 180,
    },
  ]);
  showToast({
    message: `Started demo playback for "${playlist.name}"`,
    type: "info",
  });
};

const toggleFavorite = async (playlist) => {
  const nextFavorite = !playlist.is_favorite;
  await store.updatePlaylist({ id: playlist.id, is_favorite: nextFavorite });
  showToast({
    message: nextFavorite ? "Added to favorites" : "Removed from favorites",
    type: "success",
  });
};

const showPlaylistMenu = (playlist, event) => {
  const menuItems = [
    {
      label: "Play",
      handler: () => playPlaylist(playlist),
    },
    {
      label: "Play Next",
      handler: () => queuePlaylist(playlist, "next"),
    },
    {
      label: "Add to Queue",
      handler: () => queuePlaylist(playlist, "end"),
    },
    { separator: true },
    {
      label: playlist.is_favorite ? "Remove from Favorites" : "Add to Favorites",
      handler: () => toggleFavorite(playlist),
    },
    {
      label: "Rename Playlist",
      handler: () => openEditPlaylistModal(playlist),
    },
    {
      label: "Duplicate Playlist",
      handler: () => duplicatePlaylist(playlist),
    },
    {
      label: "Copy Link",
      handler: () => sharePlaylist(playlist),
    },
    {
      label: "Open in New Tab",
      handler: () => openPlaylistInNewTab(playlist),
    },
    { separator: true },
    {
      label: "Delete",
      destructive: true,
      handler: () => deletePlaylist(playlist),
    },
  ];

  showContextMenu(event, menuItems, "custom");
};

const showPlaylistWorkspaceMenu = (event) => {
  if (event.target.closest(".playlist-card") || event.target.closest(".modal-content")) return;

  showContextMenu(
    event,
    [
      {
        label: "New Playlist",
        handler: () => {
          openCreatePlaylistModal();
        },
      },
      { separator: true },
      { label: "Sort by Recently Updated", handler: () => setSortBy("recent") },
      { label: "Sort by Name", handler: () => setSortBy("name") },
      { label: "Sort by Most Songs", handler: () => setSortBy("songs") },
      { label: "Refresh", handler: () => refreshPlaylists() },
    ],
    "custom",
  );
};

const queuePlaylist = async (playlist, position) => {
  const tracks = await getPlaylistTracks(playlist);
  if (tracks.length) {
    if (position === "next") {
      playbackStore.addToQueueNext(tracks);
    } else {
      playbackStore.addToQueue(tracks);
    }
  } else {
    const fallbackTrack = {
      id: `${playlist.id}-preview`,
      name: `${playlist.name} Preview`,
      artist: playlist.name,
      duration: 180,
    };
    if (position === "next") {
      playbackStore.addToQueueNext(fallbackTrack);
    } else {
      playbackStore.addToQueue(fallbackTrack);
    }
  }
  showToast({
    message: position === "next" ? "Added to play next" : "Added to queue",
    type: "info",
  });
};

const duplicatePlaylist = async (playlist) => {
  const duplicate = await store.duplicatePlaylist(playlist.id);
  showToast({
    message: `Duplicated "${playlist.name}"`,
    type: "success",
  });
  router.push(`/playlists/${duplicate.id}`);
};

const sharePlaylist = async (playlist) => {
  const shareUrl = `${window.location.origin}${router.resolve(`/playlists/${playlist.id}`).href}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast({ message: "Playlist link copied to clipboard", type: "success" });
  } catch {
    showToast({ message: shareUrl, type: "info" });
  }
};

const openPlaylistInNewTab = (playlist) => {
  const href = router.resolve(`/playlists/${playlist.id}`).href;
  window.open(href, "_blank", "noopener,noreferrer");
};

const deletePlaylist = async (playlist) => {
  pendingDeletePlaylist.value = playlist;
  deletePlaylistModalOpen.value = true;
};

const closeDeletePlaylistModal = () => {
  deletePlaylistModalOpen.value = false;
  pendingDeletePlaylist.value = null;
};

const confirmDeletePlaylist = async () => {
  if (!pendingDeletePlaylist.value) return;

  const playlist = pendingDeletePlaylist.value;

  try {
    await store.deletePlaylist(playlist.id);

    showToast({
      message: `Deleted playlist "${playlist.name}"`,
      type: "success",
    });
  } catch (error) {
    console.error("Failed to delete playlist:", error);
    showToast({
      message: "Failed to delete playlist",
      type: "error",
    });
  } finally {
    closeDeletePlaylistModal();
  }
};

const setSortBy = (value) => {
  sortBy.value = value;
  showSortMenu.value = false;
};

const refreshPlaylists = async () => {
  loading.value = true;
  try {
    await store.loadPlaylists();
    showToast({
      message: "Playlists refreshed",
      type: "success",
    });
  } finally {
    loading.value = false;
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
};

const formatPlaylistDuration = (playlist) => {
  return formatDuration(playlist.total_duration || 0);
};

const getPlaylistColor = (playlist, index) => {
  const colors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  ];
  const baseIndex = playlist.name.charCodeAt(0) % colors.length;
  return colors[(baseIndex + index) % colors.length];
};

// Click outside handler
const handleClickOutside = (event) => {
  if (
    showSortMenu.value &&
    !event.target.closest(".sort-dropdown") &&
    !event.target.closest(".icon-btn")
  ) {
    showSortMenu.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  loading.value = true;
  try {
    await store.loadPlaylists();
    if (scopedArtist.value && libraryStore.songs.length === 0 && !libraryStore.loading) {
      await libraryStore.loadSongs();
    }
  } catch (error) {
    console.error("Failed to load playlists:", error);
    showToast({
      message: "Could not load playlists",
      type: "error",
    });
  } finally {
    loading.value = false;
    document.addEventListener("click", handleClickOutside);
  }
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.playlists-view {
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: white;
  gap: var(--space-5);
}

/* Header Controls */
.header-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  position: relative;
  width: 100%;
}

.search-container {
  min-width: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Sort Dropdown */
.sort-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-control);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 10;
  min-width: 200px;
}

.sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px var(--space-5);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.sort-option:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.sort-option.active {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

.sort-option svg {
  width: 16px;
  height: 16px;
  color: var(--color-accent);
}

/* Filter Section */
.filter-section {
  padding: 0 0 8px;
}

.filter-pills {
  max-width: 100%;
  width: fit-content;
}

.filter-pills::-webkit-scrollbar {
  display: none;
}

.filter-count {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
}

/* Playlists Container */
.playlists-container {
  flex: 1;
  overflow-y: auto;
  padding: 6px 4px 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 48px 32px;
  text-align: center;
}

.empty-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: 32px;
  color: rgba(255, 255, 255, 0.1);
}

.empty-title {
  font-size: 28px;
  font-weight: 300;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.empty-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 32px;
  max-width: 400px;
}

.empty-action-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-pill);
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.empty-action-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.empty-action-btn svg {
  width: 20px;
  height: 20px;
}

/* Loading Grid */
.loading-grid {
  display: grid;
  gap: var(--collection-grid-gap);
}

.skeleton-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-card);
  overflow: hidden;
  animation: skeletonWave 1.5s ease-in-out infinite;
}

@keyframes skeletonWave {
  0% {
    opacity: 0.5;
    transform: translateX(-3px);
  }
  50% {
    opacity: 1;
    transform: translateX(3px);
  }
  100% {
    opacity: 0.5;
    transform: translateX(-3px);
  }
}

.skeleton-cover {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-content {
  padding: var(--space-5);
}

.skeleton-title {
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-subtitle {
  height: 16px;
  width: 60%;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}

/* Playlists Grid */
.playlists-grid {
  display: grid;
  gap: var(--collection-grid-gap);
}

/* Playlist Card */
.playlist-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.playlist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Playlist Cover */
.playlist-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 0.96;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.playlist-card:hover .cover-image img {
  transform: scale(1.1);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.grid-item {
  opacity: 0.3;
}

.playlist-icon {
  position: relative;
  z-index: 1;
  width: 36px;
  height: 36px;
  color: rgba(255, 255, 255, 0.3);
}

/* Play Overlay */
.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.play-btn:hover {
  transform: scale(1.1);
  background: white;
}

.play-btn svg {
  width: 22px;
  height: 22px;
  color: black;
  margin-left: 3px;
}

/* Playlist Badge */
.playlist-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  background: rgba(232, 90, 25, 0.92);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-pill);
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-inverse);
  min-height: 28px;
}

.playlist-badge svg {
  width: 14px;
  height: 14px;
}

/* Playlist Info */
.playlist-info {
  padding: var(--space-4);
}

.playlist-name {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.meta-dot {
  width: 3px;
  height: 3px;
  background: currentColor;
  border-radius: 50%;
}

.playlist-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

/* Quick Actions */
.quick-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.playlist-card:hover .quick-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  transform: scale(1.1);
}

.action-btn.active {
  color: #ef4444;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-5);
}

.modal-content {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-card);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 32px var(--section-gap);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-header h2 {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.01em;
  margin: 0;
}

.close-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 32px;
  overflow-y: auto;
}

.confirm-modal {
  max-width: 460px;
}

.confirm-copy {
  padding: var(--space-5);
  border-radius: var(--radius-card);
  border: 1px solid rgba(239, 68, 68, 0.18);
  background: rgba(239, 68, 68, 0.08);
}

.confirm-copy strong {
  display: block;
  font-size: 18px;
}

.confirm-copy p {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.64);
}

.form-group {
  margin-bottom: 28px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
}

.form-group input[type="text"],
.form-group textarea {
  width: 100%;
  padding: 16px var(--space-5);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-control);
  color: white;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: var(--control-md);
}

.form-group input[type="text"]:focus,
.form-group textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.char-count {
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
}

.toggle-input {
  position: absolute;
  opacity: 0;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-pill);
  transition: all 0.3s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-input:checked + .toggle-switch {
  background: rgba(232, 90, 25, 0.16);
  border-color: rgba(232, 90, 25, 0.4);
}

.toggle-input:checked + .toggle-switch::after {
  transform: translateX(24px);
  background: var(--color-accent);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-text strong {
  font-size: 14px;
  font-weight: 500;
}

.toggle-text small {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: var(--section-gap);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-primary,
.btn-secondary,
.btn-danger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px var(--section-gap);
  border: none;
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: var(--control-md);
}

.btn-primary {
  background: white;
  color: black;
}

.btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.14);
  color: #fecaca;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.22);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary svg,
.btn-secondary svg {
  width: 18px;
  height: 18px;
}

.btn-secondary {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.playlist-list-move,
.playlist-list-enter-active,
.playlist-list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.playlist-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.playlist-list-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.playlist-list-leave-active {
  position: absolute;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}

/* Scrollbar */
.playlists-container::-webkit-scrollbar {
  width: 12px;
}

.playlists-container::-webkit-scrollbar-track {
  background: transparent;
}

.playlists-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.playlists-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.12);
  background-clip: padding-box;
}

/* Responsive */
@media (max-width: 1200px) {
  .playlists-grid {
    gap: var(--space-3);
  }
}

@media (max-width: 768px) {
  .header-controls {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .search-container {
    width: 100%;
  }

  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }

  .filter-section {
    padding: 0;
  }

  .playlists-container {
    padding: 6px 0 0;
  }

  .playlists-grid {
    gap: var(--space-3);
  }
}

@media (max-width: 480px) {
  .quick-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .playlists-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    border-radius: var(--radius-card);
  }

  .modal-header,
  .modal-body {
    padding: var(--section-gap);
  }
}

/* Theme override: keep the glassy cards from the newer root pass, but
   align the page body to the lighter editorial system. */
.playlists-view {
  color: var(--color-text);
}

.playlists-view .sort-dropdown,
.playlists-view .search-input,
.playlists-view .icon-btn {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.78);
  color: var(--color-text);
  box-shadow: none;
}

.playlists-view .search-input::placeholder,
.playlists-view .search-icon,
.playlists-view .clear-btn {
  color: var(--color-text-tertiary);
}

.playlists-view .btn-bg {
  background: rgba(200, 75, 17, 0.08);
}

.playlists-view .sort-dropdown,
.playlists-view .modal-content {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-overlay);
}

.playlists-view .sort-option,
.playlists-view .playlist-meta,
.playlists-view .playlist-description {
  color: var(--color-text-secondary);
}

.playlists-view .sort-option:hover,
.playlists-view .sort-option.active {
  background: var(--color-accent-subtle);
  color: var(--color-text);
}

.playlists-view .playlist-card {
  border: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 250, 248, 0.86)),
    var(--color-surface);
  box-shadow: none;
}

.playlists-view .playlist-card:hover {
  border-color: rgba(200, 75, 17, 0.18);
  box-shadow: var(--shadow-1);
}

.playlists-view .cover-placeholder {
  background: linear-gradient(145deg, rgba(200, 75, 17, 0.08), rgba(19, 18, 17, 0.08));
}

.playlists-view .playlist-icon,
.playlists-view .meta-dot {
  color: var(--color-text-tertiary);
}

.playlists-view .playlist-name,
.playlists-view .empty-title {
  color: var(--color-text);
}

.playlists-view .empty-text,
.playlists-view .empty-state {
  color: var(--color-text-secondary);
}

.playlists-view .playlist-badge {
  background: rgba(26, 122, 74, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(26, 122, 74, 0.14);
}

.playlists-view .play-btn,
.playlists-view .empty-action-btn,
.playlists-view .btn-primary {
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-accent);
  border-color: rgba(200, 75, 17, 0.18);
}

.playlists-view .quick-actions .action-btn {
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(19, 18, 17, 0.08);
  color: var(--color-text-secondary);
}

.playlists-view .quick-actions .action-btn.active {
  color: var(--color-accent);
}

.playlists-view .filter-section,
.playlists-view .playlists-container,
.playlists-view .quick-stats,
.playlists-view .header-controls {
  background: transparent;
}

.playlists-view .quick-stats .stat-pill span,
.playlists-view .filter-count,
.playlists-view .playlist-meta,
.playlists-view .playlist-description,
.playlists-view .empty-text,
.playlists-view .skeleton-card {
  color: var(--color-text-secondary);
}

.playlists-view .create-btn {
  background: rgba(19, 18, 17, 0.94);
  color: var(--color-text-inverse);
  border-color: rgba(19, 18, 17, 0.08);
}

.playlists-view .create-btn:hover {
  background: rgba(19, 18, 17, 1);
}

.playlists-view .action-btn,
.playlists-view .icon-btn,
.playlists-view .clear-btn {
  color: var(--color-text-secondary);
}

.playlists-view .playlist-cover,
.playlists-view .cover-image,
.playlists-view .cover-placeholder {
  background: linear-gradient(135deg, rgba(200, 75, 17, 0.08), rgba(19, 18, 17, 0.06));
}

.playlists-view .play-overlay {
  background: rgba(19, 18, 17, 0.28);
}

.playlists-view .play-btn {
  background: rgba(19, 18, 17, 0.92);
  color: var(--color-text-inverse);
  border-color: rgba(19, 18, 17, 0.08);
}

.playlists-view .empty-state,
.playlists-view .loading-grid {
  color: var(--color-text);
}

.playlists-view .empty-action-btn {
  background: rgba(19, 18, 17, 0.94);
  color: var(--color-text-inverse);
  border-color: rgba(19, 18, 17, 0.08);
  box-shadow: none;
}

.playlists-view .modal-header h2,
.playlists-view .modal-body label,
.playlists-view .confirm-copy strong {
  color: var(--color-text);
}

.playlists-view .char-count,
.playlists-view .toggle-copy,
.playlists-view .confirm-copy p {
  color: var(--color-text-secondary);
}

.playlists-view .modal-body input,
.playlists-view .modal-body textarea {
  border-color: var(--color-border);
  background: rgba(255, 255, 255, 0.92);
  color: var(--color-text);
}

.playlists-view .modal-body input::placeholder,
.playlists-view .modal-body textarea::placeholder {
  color: var(--color-text-tertiary);
}

.playlists-view .btn-secondary {
  background: rgba(19, 18, 17, 0.05);
  color: var(--color-text);
}
</style>
