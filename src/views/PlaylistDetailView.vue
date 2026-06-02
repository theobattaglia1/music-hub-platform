<template>
  <div class="playlist-detail-view">
    <div v-if="loading" class="state-shell">
      <div class="state-card">
        <div class="spinner"></div>
        <p>Loading playlist workspace...</p>
      </div>
    </div>

    <div v-else-if="!playlist" class="state-shell">
      <div class="state-card">
        <h2>Playlist not found</h2>
        <p>This playlist may have been deleted or is no longer available.</p>
        <button class="primary-btn" @click="router.push('/playlists')">Back to Playlists</button>
      </div>
    </div>

    <template v-else>
      <header class="playlist-header">
        <div class="header-gradient" :style="headerStyle"></div>
        <div class="header-main">
          <div class="cover-block">
            <img v-if="draft.cover_image" :src="draft.cover_image" :alt="draft.name" />
            <div v-else class="cover-fallback">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"
                />
              </svg>
            </div>
          </div>

          <div class="header-copy">
            <p class="eyebrow">Playlist Workspace</p>
            <input
              v-model="draft.name"
              class="title-input"
              type="text"
              placeholder="Playlist name"
            />
            <textarea
              v-model="draft.description"
              class="description-input"
              rows="3"
              placeholder="Add context, sequencing notes, or share intent for this playlist"
            ></textarea>

            <div class="meta-row">
              <span class="meta-pill">{{ songCount }} tracks</span>
              <span class="meta-pill">{{ totalDuration }}</span>
              <span class="meta-pill">Updated {{ formattedUpdatedAt }}</span>
            </div>

            <div class="toggle-row">
              <button
                class="toggle-chip"
                :class="{ active: draft.is_public }"
                @click="togglePlaylistFlag('is_public')"
              >
                {{ draft.is_public ? "Public" : "Private" }}
              </button>
              <button
                class="toggle-chip"
                :class="{ active: draft.is_favorite }"
                @click="togglePlaylistFlag('is_favorite')"
              >
                {{ draft.is_favorite ? "Favorited" : "Favorite" }}
              </button>
            </div>
          </div>

          <div class="header-side">
            <div class="header-actions">
              <button class="play-btn" @click="playAll">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button class="icon-btn" @click="shufflePlay">Shuffle</button>
              <button class="icon-btn" @click="copyLink">Copy Link</button>
              <button class="icon-btn" @click="openInNewTab">Open in New Tab</button>
              <button class="primary-btn" :disabled="saving" @click="saveChanges">
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="playlist-layout">
        <main class="playlist-main">
          <section class="toolbar-card">
            <div class="toolbar-copy">
              <h2>Tracklist</h2>
              <p>Adjust ordering, remove tracks, and add more songs without leaving this page.</p>
            </div>
            <div class="toolbar-actions">
              <input
                v-model="trackSearch"
                class="search-input"
                type="search"
                placeholder="Filter playlist tracks..."
              />
              <button class="icon-btn" @click="showAddSongs = !showAddSongs">
                {{ showAddSongs ? "Hide Library" : "Add Songs" }}
              </button>
              <button
                class="icon-btn"
                :disabled="selectedTrackIds.size === 0"
                @click="removeSelectedTracks"
              >
                Remove Selected
              </button>
              <button
                class="icon-btn danger"
                :disabled="!playlist.track_ids.length"
                @click="clearPlaylist"
              >
                Clear Playlist
              </button>
            </div>
          </section>

          <section v-if="showAddSongs" class="library-card">
            <div class="library-head">
              <div>
                <h3>Add from Library</h3>
                <p>{{ availableSongs.length }} tracks available to add</p>
              </div>
              <input
                v-model="addSongQuery"
                class="search-input"
                type="search"
                placeholder="Search library songs..."
              />
            </div>

            <div v-if="filteredAvailableSongs.length" class="library-list">
              <button
                v-for="song in filteredAvailableSongs.slice(0, 18)"
                :key="song.id"
                class="library-row"
                @click="addSong(song)"
              >
                <div>
                  <strong>{{ song.name }}</strong>
                  <p>
                    {{ song.artist }}<span v-if="song.album"> • {{ song.album }}</span>
                  </p>
                </div>
                <span>{{ formatDuration(song.duration) }}</span>
              </button>
            </div>
            <div v-else class="library-empty">
              <p>No additional library tracks match this search.</p>
            </div>
          </section>

          <section class="tracks-card">
            <div v-if="filteredTracks.length" class="track-table">
              <div class="track-table-head">
                <label class="select-all-cell">
                  <input
                    type="checkbox"
                    :checked="allVisibleSelected"
                    :indeterminate.prop="someVisibleSelected && !allVisibleSelected"
                    @change="toggleAllVisibleTracks($event)"
                  />
                </label>
                <span>#</span>
                <span>Title</span>
                <span>Artist</span>
                <span>Album</span>
                <span>Duration</span>
                <span class="align-right">Actions</span>
              </div>

              <div
                v-for="song in filteredTracks"
                :key="song.id"
                class="track-row"
                :class="{
                  selected: selectedTrackIds.has(song.id),
                  dragging: draggedTrackId === song.id,
                  'drop-target': dragOverTrackId === song.id && draggedTrackId !== song.id,
                }"
                draggable="true"
                @dblclick="playTrack(song)"
                @dragstart="startTrackDrag(song.id, $event)"
                @dragover.prevent="handleTrackDragOver(song.id)"
                @dragleave="handleTrackDragLeave(song.id)"
                @drop.prevent="handleTrackDrop(song.id)"
                @dragend="finishTrackDrag"
              >
                <label class="select-cell">
                  <input
                    :checked="selectedTrackIds.has(song.id)"
                    type="checkbox"
                    @change="toggleTrackSelection(song.id)"
                  />
                </label>
                <span class="track-index">{{ displayIndex(song.id) }}</span>
                <div class="track-title">
                  <span class="drag-handle" aria-hidden="true">⋮⋮</span>
                  <strong>{{ song.name }}</strong>
                  <p>{{ song.file_name || "Library track" }}</p>
                </div>
                <span>{{ song.artist }}</span>
                <span>{{ song.album || "—" }}</span>
                <span>{{ formatDuration(song.duration) }}</span>
                <div class="row-actions">
                  <button class="mini-btn" @click="moveTrack(song.id, 'up')">↑</button>
                  <button class="mini-btn" @click="moveTrack(song.id, 'down')">↓</button>
                  <button class="mini-btn" @click="playTrack(song)">Play</button>
                  <button class="mini-btn danger" @click="removeTrack(song.id)">Remove</button>
                </div>
              </div>
            </div>

            <div v-else class="empty-card">
              <h3>
                {{
                  playlist.track_ids.length
                    ? "No tracks match this filter"
                    : "This playlist is empty"
                }}
              </h3>
              <p>
                {{
                  playlist.track_ids.length
                    ? "Clear the search or adjust the track order."
                    : "Open the library panel and add songs to build the sequence."
                }}
              </p>
              <button class="primary-btn" @click="showAddSongs = true">Add Songs</button>
            </div>

            <div v-if="unresolvedTrackCount > 0" class="inline-note">
              {{ unresolvedTrackCount }} linked track{{ unresolvedTrackCount === 1 ? "" : "s" }}
              could not be resolved from the current library data.
            </div>
          </section>
        </main>

        <aside class="playlist-sidebar">
          <section class="sidebar-card stats-grid">
            <article>
              <span class="stat-label">Tracks</span>
              <strong>{{ songCount }}</strong>
            </article>
            <article>
              <span class="stat-label">Duration</span>
              <strong>{{ totalDuration }}</strong>
            </article>
            <article>
              <span class="stat-label">Owner</span>
              <strong>{{ draft.owner_name || "Unassigned" }}</strong>
            </article>
            <article>
              <span class="stat-label">Visibility</span>
              <strong>{{ draft.is_public ? "Shared" : "Private" }}</strong>
            </article>
          </section>

          <section class="sidebar-card form-card">
            <h3>Playlist Settings</h3>
            <label>
              <span>Owner Name</span>
              <input v-model="draft.owner_name" type="text" placeholder="Demo User" />
            </label>
            <label>
              <span>Cover Image URL</span>
              <input v-model="draft.cover_image" type="url" placeholder="https://..." />
            </label>
            <label>
              <span>Notes</span>
              <textarea
                v-model="draft.description"
                rows="4"
                placeholder="Describe intended use, audience, or rollout context"
              ></textarea>
            </label>
            <button class="primary-btn full-width" :disabled="saving" @click="saveChanges">
              Save Playlist Settings
            </button>
          </section>
        </aside>
      </div>

      <teleport to="body">
        <transition name="fade">
          <div
            v-if="clearPlaylistModalOpen"
            class="modal-overlay"
            @click.self="closeClearPlaylistModal"
          >
            <div class="confirm-modal">
              <div class="confirm-head">
                <div>
                  <h2>Clear Playlist</h2>
                  <p>Remove all tracks from this playlist without deleting the playlist itself.</p>
                </div>
                <button class="icon-btn" @click="closeClearPlaylistModal">Close</button>
              </div>

              <div class="confirm-copy">
                <strong>{{ playlist?.name }}</strong>
                <p>
                  {{ songCount }} track{{ songCount === 1 ? "" : "s" }} will be removed from the
                  current sequence.
                </p>
              </div>

              <div class="confirm-actions">
                <button class="icon-btn" @click="closeClearPlaylistModal">Cancel</button>
                <button class="primary-btn danger-fill" @click="confirmClearPlaylist">
                  Clear Tracks
                </button>
              </div>
            </div>
          </div>
        </transition>
      </teleport>
    </template>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlaylistsStore } from "@/stores/playlists";
import { useLibraryStore } from "@/stores/library";
import { usePlaybackStore } from "@/stores/playback";

const route = useRoute();
const router = useRouter();

const showToast = inject("showToast", () => {});

const playlistsStore = usePlaylistsStore();
const libraryStore = useLibraryStore();
const playbackStore = usePlaybackStore();

const loading = ref(true);
const saving = ref(false);
const showAddSongs = ref(false);
const addSongQuery = ref("");
const trackSearch = ref("");
const playlist = ref(null);
const selectedTrackIds = ref(new Set());
const draggedTrackId = ref("");
const dragOverTrackId = ref("");
const clearPlaylistModalOpen = ref(false);

const draft = reactive({
  name: "",
  description: "",
  owner_name: "",
  cover_image: "",
  is_public: false,
  is_favorite: false,
});

const normalizePlaylist = (playlistRecord = {}) => {
  const trackIds = [
    ...new Set((playlistRecord.track_ids || playlistRecord.song_ids || []).map((id) => String(id))),
  ];
  return {
    ...playlistRecord,
    id: String(playlistRecord.id || ""),
    name: playlistRecord.name || playlistRecord.title || "Untitled Playlist",
    title: playlistRecord.name || playlistRecord.title || "Untitled Playlist",
    track_ids: trackIds,
    song_ids: trackIds,
    description: playlistRecord.description || "",
    owner_name: playlistRecord.owner_name || "Demo User",
    cover_image: playlistRecord.cover_image || "",
    is_public: Boolean(playlistRecord.is_public),
    is_favorite: Boolean(playlistRecord.is_favorite),
    updated_at: playlistRecord.updated_at || playlistRecord.created_at || new Date().toISOString(),
  };
};

const syncDraft = (value) => {
  draft.name = value?.name || "";
  draft.description = value?.description || "";
  draft.owner_name = value?.owner_name || "Demo User";
  draft.cover_image = value?.cover_image || "";
  draft.is_public = Boolean(value?.is_public);
  draft.is_favorite = Boolean(value?.is_favorite);
};

const songMap = computed(
  () => new Map((libraryStore.songs || []).map((song) => [String(song.id), song])),
);

const orderedSongs = computed(() => {
  if (!playlist.value) return [];
  return playlist.value.track_ids
    .map((trackId) => songMap.value.get(String(trackId)))
    .filter(Boolean);
});

const unresolvedTrackCount = computed(() => {
  if (!playlist.value) return 0;
  return Math.max(0, playlist.value.track_ids.length - orderedSongs.value.length);
});

const filteredTracks = computed(() => {
  const query = trackSearch.value.trim().toLowerCase();
  if (!query) return orderedSongs.value;
  return orderedSongs.value.filter(
    (song) =>
      song.name?.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query),
  );
});

const availableSongs = computed(() => {
  const existing = new Set((playlist.value?.track_ids || []).map((id) => String(id)));
  return (libraryStore.songs || []).filter((song) => !existing.has(String(song.id)));
});

const filteredAvailableSongs = computed(() => {
  const query = addSongQuery.value.trim().toLowerCase();
  if (!query) return availableSongs.value;
  return availableSongs.value.filter(
    (song) =>
      song.name?.toLowerCase().includes(query) ||
      song.artist?.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query),
  );
});

const songCount = computed(() => orderedSongs.value.length);

const totalDuration = computed(() => {
  const totalSeconds = orderedSongs.value.reduce(
    (sum, song) => sum + Number(song.duration || 0),
    0,
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  return `${minutes} min`;
});

const headerStyle = computed(() => {
  if (draft.cover_image) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.8)), url(${draft.cover_image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {
    background:
      "radial-gradient(circle at top left, rgba(232, 90, 25, 0.28), transparent 36%), linear-gradient(135deg, rgba(32, 29, 26, 0.18), rgba(214, 64, 50, 0.16))",
  };
});

const formattedUpdatedAt = computed(() => {
  if (!playlist.value?.updated_at) return "just now";
  return new Date(playlist.value.updated_at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
});

const visibleTrackIds = computed(() => filteredTracks.value.map((song) => String(song.id)));
const allVisibleSelected = computed(
  () =>
    visibleTrackIds.value.length > 0 &&
    visibleTrackIds.value.every((id) => selectedTrackIds.value.has(id)),
);
const someVisibleSelected = computed(() =>
  visibleTrackIds.value.some((id) => selectedTrackIds.value.has(id)),
);

const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

const displayIndex = (trackId) =>
  (playlist.value?.track_ids.findIndex((id) => String(id) === String(trackId)) ?? -1) + 1;

const computeDurationForTrackIds = (trackIds) =>
  trackIds.reduce((sum, id) => sum + Number(songMap.value.get(String(id))?.duration || 0), 0);

const persistPlaylist = async (updates, successMessage) => {
  if (!playlist.value) return;
  saving.value = true;
  try {
    const updated = await playlistsStore.updatePlaylist({ id: playlist.value.id, ...updates });
    playlist.value = normalizePlaylist(updated);
    syncDraft(playlist.value);
    if (successMessage) {
      showToast({ message: successMessage, type: "success" });
    }
  } catch (error) {
    console.error("Failed to update playlist:", error);
    showToast({ message: "Failed to save playlist changes", type: "error" });
  } finally {
    saving.value = false;
  }
};

const persistTrackIds = async (trackIds, successMessage) => {
  if (!playlist.value) return;
  try {
    const updated = await playlistsStore.setPlaylistTracks({
      playlistId: playlist.value.id,
      trackIds,
      totalDuration: computeDurationForTrackIds(trackIds),
    });
    playlist.value = normalizePlaylist(updated);
    selectedTrackIds.value = new Set();
    if (successMessage) {
      showToast({ message: successMessage, type: "success" });
    }
  } catch (error) {
    console.error("Failed to update playlist tracks:", error);
    showToast({ message: "Could not update track ordering", type: "error" });
  }
};

const loadPlaylist = async () => {
  loading.value = true;
  try {
    if (!playlistsStore.playlists.length && !playlistsStore.loading) {
      await playlistsStore.loadPlaylists();
    }

    if (!libraryStore.songs.length && !libraryStore.loading) {
      await libraryStore.loadSongs();
    }

    const playlistRecord = await playlistsStore.getPlaylistById(route.params.id);
    playlist.value = playlistRecord ? normalizePlaylist(playlistRecord) : null;
    syncDraft(playlist.value);
    selectedTrackIds.value = new Set();
  } catch (error) {
    console.error("Failed to load playlist detail:", error);
    showToast({ message: "Failed to load playlist", type: "error" });
  } finally {
    loading.value = false;
  }
};

const saveChanges = async () => {
  await persistPlaylist(
    {
      name: draft.name.trim() || "Untitled Playlist",
      title: draft.name.trim() || "Untitled Playlist",
      description: draft.description.trim(),
      owner_name: draft.owner_name.trim() || "Demo User",
      cover_image: draft.cover_image.trim(),
      is_public: draft.is_public,
      is_favorite: draft.is_favorite,
      total_duration: computeDurationForTrackIds(playlist.value?.track_ids || []),
    },
    `Saved ${draft.name.trim() || "playlist"} changes`,
  );
};

const togglePlaylistFlag = async (key) => {
  draft[key] = !draft[key];
  await saveChanges();
};

const playAll = () => {
  if (!orderedSongs.value.length) return;
  playbackStore.playArtist(
    { id: playlist.value.id, name: playlist.value.name },
    orderedSongs.value,
  );
  showToast({ message: `Playing ${playlist.value.name}`, type: "success" });
};

const shufflePlay = () => {
  if (!orderedSongs.value.length) return;
  const shuffled = [...orderedSongs.value].sort(() => Math.random() - 0.5);
  playbackStore.playArtist({ id: playlist.value.id, name: playlist.value.name }, shuffled);
  showToast({ message: `Shuffling ${playlist.value.name}`, type: "success" });
};

const playTrack = (song) => {
  if (!song || !playlist.value) return;
  playbackStore.queue = [...orderedSongs.value];
  playbackStore.queueIndex = Math.max(
    0,
    orderedSongs.value.findIndex((entry) => entry.id === song.id),
  );
  playbackStore.playSong(song);
  showToast({ message: `Playing ${song.name}`, type: "success" });
};

const copyLink = async () => {
  const href = `${window.location.origin}${router.resolve(`/playlists/${playlist.value.id}`).href}`;
  try {
    await navigator.clipboard.writeText(href);
    showToast({ message: "Playlist link copied", type: "success" });
  } catch {
    showToast({ message: href, type: "info" });
  }
};

const openInNewTab = () => {
  window.open(
    router.resolve(`/playlists/${playlist.value.id}`).href,
    "_blank",
    "noopener,noreferrer",
  );
};

const addSong = async (song) => {
  if (!playlist.value) return;
  const nextTrackIds = [...playlist.value.track_ids, String(song.id)];
  await persistTrackIds(nextTrackIds, `Added ${song.name}`);
};

const toggleTrackSelection = (trackId) => {
  const nextSelection = new Set(selectedTrackIds.value);
  if (nextSelection.has(trackId)) {
    nextSelection.delete(trackId);
  } else {
    nextSelection.add(trackId);
  }
  selectedTrackIds.value = nextSelection;
};

const toggleAllVisibleTracks = (event) => {
  const checked = Boolean(event.target.checked);
  const nextSelection = new Set(selectedTrackIds.value);
  visibleTrackIds.value.forEach((trackId) => {
    if (checked) nextSelection.add(trackId);
    else nextSelection.delete(trackId);
  });
  selectedTrackIds.value = nextSelection;
};

const removeTrack = async (trackId) => {
  if (!playlist.value) return;
  const song = songMap.value.get(String(trackId));
  const nextTrackIds = playlist.value.track_ids.filter((id) => String(id) !== String(trackId));
  await persistTrackIds(nextTrackIds, `Removed ${song?.name || "track"}`);
};

const removeSelectedTracks = async () => {
  if (!playlist.value || selectedTrackIds.value.size === 0) return;
  const nextTrackIds = playlist.value.track_ids.filter(
    (id) => !selectedTrackIds.value.has(String(id)),
  );
  await persistTrackIds(
    nextTrackIds,
    `Removed ${selectedTrackIds.value.size} track${selectedTrackIds.value.size === 1 ? "" : "s"}`,
  );
};

const moveTrack = async (trackId, direction) => {
  if (!playlist.value) return;
  try {
    const updated = await playlistsStore.reorderPlaylistTrack({
      playlistId: playlist.value.id,
      trackId,
      direction,
    });
    playlist.value = normalizePlaylist(updated);
  } catch (error) {
    console.error("Failed to reorder track:", error);
    showToast({ message: "Could not reorder track", type: "error" });
  }
};

const startTrackDrag = (trackId, event) => {
  draggedTrackId.value = String(trackId);
  dragOverTrackId.value = String(trackId);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(trackId));
};

const handleTrackDragOver = (trackId) => {
  if (!draggedTrackId.value) return;
  dragOverTrackId.value = String(trackId);
};

const handleTrackDragLeave = (trackId) => {
  if (dragOverTrackId.value === String(trackId)) {
    dragOverTrackId.value = "";
  }
};

const finishTrackDrag = () => {
  draggedTrackId.value = "";
  dragOverTrackId.value = "";
};

const handleTrackDrop = async (targetTrackId) => {
  if (!playlist.value || !draggedTrackId.value) {
    finishTrackDrag();
    return;
  }

  const draggedId = String(draggedTrackId.value);
  const targetId = String(targetTrackId);
  if (draggedId === targetId) {
    finishTrackDrag();
    return;
  }

  const currentTrackIds = [...playlist.value.track_ids];
  const sourceIndex = currentTrackIds.findIndex((id) => String(id) === draggedId);
  const targetIndex = currentTrackIds.findIndex((id) => String(id) === targetId);

  if (sourceIndex === -1 || targetIndex === -1) {
    finishTrackDrag();
    return;
  }

  const nextTrackIds = [...currentTrackIds];
  const [movedId] = nextTrackIds.splice(sourceIndex, 1);
  nextTrackIds.splice(targetIndex, 0, movedId);

  finishTrackDrag();
  await persistTrackIds(nextTrackIds, "Updated track order");
};

const clearPlaylist = async () => {
  if (!playlist.value) return;
  clearPlaylistModalOpen.value = true;
};

const closeClearPlaylistModal = () => {
  clearPlaylistModalOpen.value = false;
};

const confirmClearPlaylist = async () => {
  await persistTrackIds([], "Cleared playlist");
  closeClearPlaylistModal();
};

watch(
  () => route.params.id,
  () => {
    loadPlaylist();
  },
);

onMounted(() => {
  loadPlaylist();
});
</script>

<style scoped>
.playlist-detail-view {
  min-height: 100%;
  padding: 20px 0 120px;
  background: transparent;
  color: var(--color-text);
}

.state-shell {
  min-height: 70vh;
  display: grid;
  place-items: center;
}

.state-card,
.playlist-header,
.toolbar-card,
.library-card,
.tracks-card,
.sidebar-card,
.empty-card {
  border: 1px solid var(--color-border);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  box-shadow: var(--shadow-1);
  color: var(--color-text);
}

.state-card {
  min-width: 320px;
  padding: 30px;
  text-align: center;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(19, 18, 17, 0.12);
  border-top-color: var(--color-accent);
  border-radius: 999px;
  margin: 0 auto 12px;
  animation: spin 900ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.playlist-header {
  position: relative;
  overflow: hidden;
  padding: 34px 36px;
}

.header-gradient {
  position: absolute;
  inset: 0;
  opacity: 0.16;
  mix-blend-mode: multiply;
}

.header-main,
.header-actions,
.meta-row,
.toggle-row,
.toolbar-actions,
.library-head,
.row-actions,
.playlist-layout {
  display: flex;
  gap: 14px;
}

.header-main,
.header-actions,
.meta-row,
.toggle-row,
.toolbar-actions,
.library-head,
.row-actions {
  align-items: center;
}

.header-main,
.playlist-layout {
  position: relative;
  z-index: 1;
}

.header-main {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) auto;
  align-items: center;
  gap: 28px;
}

.cover-block {
  width: 220px;
  height: 220px;
  border-radius: 30px;
  overflow: hidden;
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.74);
  box-shadow:
    0 28px 52px rgba(19, 18, 17, 0.18),
    0 6px 18px rgba(19, 18, 17, 0.06);
}

.cover-block img,
.cover-fallback {
  width: 100%;
  height: 100%;
}

.cover-block img {
  object-fit: cover;
}

.cover-fallback {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(200, 75, 17, 0.12), rgba(255, 255, 255, 0.5));
  color: var(--color-text);
}

.cover-fallback svg {
  width: 84px;
  height: 84px;
}

.header-copy {
  min-width: 0;
  display: grid;
  gap: 14px;
}

.eyebrow,
.meta-row,
.toolbar-copy p,
.track-title p,
.library-row p,
.library-empty p,
.stat-label,
.form-card label span,
.inline-note,
.confirm-head p,
.confirm-copy p,
.state-card p {
  color: var(--color-text-secondary);
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.title-input {
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text);
  font: inherit;
  font-size: clamp(42px, 5vw, 70px);
  font-weight: 320;
  line-height: 0.92;
  letter-spacing: -0.065em;
}

.description-input {
  width: 100%;
  max-width: 58ch;
  min-height: 60px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text-secondary);
  font: inherit;
  line-height: 1.48;
  resize: none;
}

.title-input:focus,
.description-input:focus {
  outline: none;
}

.title-input::placeholder,
.description-input::placeholder,
.search-input::placeholder,
.form-card input::placeholder,
.form-card textarea::placeholder {
  color: var(--color-text-tertiary);
}

.meta-row,
.toggle-row {
  flex-wrap: wrap;
}

.meta-row {
  gap: 10px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.74);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.toggle-chip,
.icon-btn,
.primary-btn,
.mini-btn {
  border-radius: 999px;
  border: 1px solid rgba(19, 18, 17, 0.1);
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text);
  cursor: pointer;
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    border-color 140ms ease;
  box-shadow: none;
}

.toggle-chip,
.icon-btn,
.primary-btn {
  min-height: 40px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
}

.mini-btn {
  min-height: 34px;
  padding: 0 12px;
  font-size: 12px;
}

.toggle-chip:hover,
.icon-btn:hover,
.primary-btn:hover,
.mini-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.96);
}

.toggle-chip.active,
.track-row.selected {
  border-color: rgba(200, 75, 17, 0.24);
  background: rgba(200, 75, 17, 0.1);
  color: var(--color-accent);
}

.header-side {
  display: flex;
  justify-content: flex-end;
  align-self: stretch;
}

.header-actions {
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: flex-end;
  gap: 10px;
  max-width: 420px;
}

.play-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 999px;
  background: var(--color-accent);
  color: #fff7f2;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 14px 30px rgba(200, 75, 17, 0.2);
}

.play-btn svg {
  width: 24px;
  height: 24px;
  margin-left: 2px;
}

.primary-btn {
  border-color: transparent;
  background: var(--color-accent);
  color: #fff7f2;
}

.primary-btn:disabled,
.icon-btn:disabled {
  opacity: 0.48;
  cursor: default;
  transform: none;
}

.playlist-layout {
  align-items: flex-start;
  gap: 20px;
  margin-top: 24px;
}

.playlist-main {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 20px;
}

.playlist-sidebar {
  width: 304px;
  flex: 0 0 304px;
  display: grid;
  gap: 16px;
  align-self: stretch;
}

.toolbar-card,
.library-card,
.tracks-card,
.sidebar-card {
  padding: 24px;
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
}

.toolbar-copy h2,
.library-head h3,
.form-card h3,
.empty-card h3 {
  margin: 0 0 6px;
  color: var(--color-text);
}

.toolbar-copy p,
.library-head p,
.empty-card p {
  margin: 0;
}

.toolbar-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.search-input,
.form-card input,
.form-card textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(19, 18, 17, 0.1);
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-text);
  border-radius: 18px;
  padding: 14px 16px;
  font: inherit;
  box-shadow: none;
}

.search-input {
  min-width: 240px;
}

.library-card,
.form-card {
  display: grid;
  gap: 14px;
}

.library-head {
  justify-content: space-between;
  gap: 16px;
}

.library-list {
  display: grid;
  gap: 10px;
  max-height: 420px;
  overflow: auto;
}

.library-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.74);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
}

.library-row strong,
.track-title strong,
.stats-grid strong,
.confirm-copy strong {
  display: block;
  color: var(--color-text);
}

.library-row p,
.track-title p,
.library-empty p {
  margin: 4px 0 0;
}

.track-table {
  display: grid;
  gap: 12px;
}

.track-table-head,
.track-row {
  display: grid;
  grid-template-columns:
    40px 44px minmax(220px, 2.1fr) minmax(140px, 1.2fr) minmax(120px, 1fr)
    90px 210px;
  gap: 14px;
  align-items: center;
}

.track-table-head {
  padding: 0 12px 8px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.track-row {
  min-height: 68px;
  padding: 0 14px;
  border-radius: 18px;
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.74);
}

.track-row.dragging {
  opacity: 0.42;
}

.track-row.drop-target {
  border-color: rgba(200, 75, 17, 0.35);
  box-shadow: inset 0 0 0 1px rgba(200, 75, 17, 0.22);
}

.select-cell,
.select-all-cell {
  display: grid;
  place-items: center;
}

.track-index,
.align-right {
  text-align: right;
}

.track-title {
  position: relative;
  padding-left: 18px;
}

.drag-handle {
  position: absolute;
  left: 0;
  top: 1px;
  color: var(--color-text-tertiary);
  letter-spacing: -2px;
  cursor: grab;
}

.row-actions {
  justify-content: flex-end;
}

.danger {
  color: var(--color-danger);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(19, 18, 17, 0.16);
  backdrop-filter: blur(12px);
  display: grid;
  place-items: center;
  padding: 24px;
}

.confirm-modal {
  width: min(480px, 100%);
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 250, 248, 0.84)),
    var(--color-surface);
  box-shadow: var(--shadow-overlay);
  color: var(--color-text);
}

.confirm-head,
.confirm-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.confirm-head {
  margin-bottom: 18px;
}

.confirm-head h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 320;
}

.confirm-head p {
  margin: 6px 0 0;
}

.confirm-copy {
  margin-bottom: 18px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(192, 57, 43, 0.18);
  background: rgba(192, 57, 43, 0.08);
}

.confirm-copy strong {
  font-size: 18px;
}

.confirm-copy p {
  margin: 6px 0 0;
}

.confirm-actions {
  justify-content: flex-end;
}

.danger-fill {
  border-color: rgba(192, 57, 43, 0.18);
  background: rgba(192, 57, 43, 0.08);
  color: var(--color-danger);
}

.danger-fill:hover {
  background: rgba(192, 57, 43, 0.14);
}

.empty-card {
  padding: 30px;
  text-align: center;
}

.inline-note {
  margin-top: 14px;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.stats-grid article {
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(19, 18, 17, 0.08);
  background: rgba(255, 255, 255, 0.74);
}

.stat-label,
label span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
}

.form-card label {
  display: grid;
  gap: 8px;
}

.form-card textarea {
  resize: vertical;
}

.full-width {
  width: 100%;
}

@media (max-width: 1200px) {
  .playlist-layout {
    flex-direction: column;
  }

  .playlist-sidebar {
    width: 100%;
    flex-basis: auto;
  }

  .header-main {
    grid-template-columns: 180px minmax(0, 1fr);
  }

  .header-side {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .playlist-detail-view {
    padding: 16px 0 120px;
  }

  .playlist-header {
    padding: 26px 24px;
  }

  .header-main {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .cover-block {
    width: 180px;
    height: 180px;
  }

  .header-side,
  .header-actions {
    justify-content: flex-start;
    max-width: none;
  }

  .toolbar-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-actions,
  .library-head {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 0;
  }

  .track-table-head {
    display: none;
  }

  .track-row {
    grid-template-columns: 40px 1fr;
    grid-auto-rows: auto;
    align-items: flex-start;
    padding: 14px;
  }

  .track-index,
  .track-row > span:nth-of-type(2),
  .track-row > span:nth-of-type(3),
  .track-row > span:nth-of-type(4) {
    display: none;
  }

  .track-title {
    grid-column: 2 / -1;
  }

  .row-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
