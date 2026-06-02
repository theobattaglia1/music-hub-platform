import { defineStore } from "pinia";
import { ref, computed } from "vue";

const STORAGE_KEY = "musicHub.playlists.v2";

const seedPlaylists = [
  {
    id: "playlist-1",
    name: "Release Week",
    description: "Priority tracks for launch week sequencing.",
    is_public: false,
    is_favorite: true,
    owner_name: "Demo User",
    track_ids: ["song-1", "song-2", "song-3"],
    total_duration: 7420,
    cover_image: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "playlist-2",
    name: "Late Night Cuts",
    description: "Moody reference playlist for sessions and revisions.",
    is_public: true,
    is_favorite: false,
    owner_name: "Demo User",
    track_ids: ["song-4", "song-5"],
    total_duration: 5240,
    cover_image: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: "playlist-3",
    name: "Creative References",
    description: "Shared playlist for visual and sonic references.",
    is_public: false,
    is_favorite: true,
    owner_name: "Demo User",
    track_ids: ["song-6", "song-7", "song-8", "song-9"],
    total_duration: 9600,
    cover_image: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
];

const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

const normalizePlaylist = (playlist = {}) => {
  const trackIds = [...new Set(playlist.track_ids || playlist.song_ids || [])];
  const updatedAt = playlist.updated_at || playlist.created_at || new Date().toISOString();

  return {
    id: String(playlist.id || `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    artist_id: playlist.artist_id || null,
    name: playlist.name || playlist.title || "Untitled Playlist",
    title: playlist.name || playlist.title || "Untitled Playlist",
    description: playlist.description || "",
    is_public: Boolean(playlist.is_public),
    is_favorite: Boolean(playlist.is_favorite),
    owner_name: playlist.owner_name || "Demo User",
    cover_image: playlist.cover_image || playlist.cover_image_url || null,
    track_ids: trackIds,
    song_ids: trackIds,
    song_count: playlist.song_count ?? trackIds.length,
    total_duration: Number(playlist.total_duration) || 0,
    created_at: playlist.created_at || updatedAt,
    updated_at: updatedAt,
  };
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export const usePlaylistsStore = defineStore("playlists", () => {
  const playlistItems = ref([]);
  const loading = ref(false);
  const playlistsError = ref(null);
  const selectedArtistIds = ref([]);
  const searchQuery = ref("");
  const includePublic = ref(true);
  const initialized = ref(false);

  const persist = () => {
    if (!canUseStorage()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlistItems.value));
  };

  const hydrate = () => {
    if (initialized.value) return;
    initialized.value = true;

    try {
      if (canUseStorage()) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            playlistItems.value = parsed.map((playlist) => normalizePlaylist(playlist));
            return;
          }
        }
      }
    } catch (error) {
      console.error("Failed to load playlist cache:", error);
      playlistsError.value = error;
    }

    playlistItems.value = seedPlaylists.map((playlist) => normalizePlaylist(playlist));
    persist();
  };

  const touchPlaylist = (playlist, overrides = {}) => {
    Object.assign(playlist, overrides);
    const normalized = normalizePlaylist({
      ...playlist,
      updated_at: new Date().toISOString(),
    });
    Object.assign(playlist, normalized);
    return playlist;
  };

  const loadPlaylists = async () => {
    loading.value = true;
    playlistsError.value = null;

    try {
      hydrate();
      return playlistItems.value;
    } catch (error) {
      playlistsError.value = error;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const filteredPlaylists = computed(() => {
    hydrate();

    let items = [...playlistItems.value];

    if (selectedArtistIds.value.length > 0) {
      items = items.filter(
        (playlist) => !playlist.artist_id || selectedArtistIds.value.includes(playlist.artist_id),
      );
    }

    if (!includePublic.value) {
      items = items.filter((playlist) => !playlist.is_public);
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase();
      items = items.filter(
        (playlist) =>
          playlist.name.toLowerCase().includes(query) ||
          playlist.description.toLowerCase().includes(query),
      );
    }

    return items;
  });

  const createPlaylist = async (playlistData = {}) => {
    hydrate();

    const playlist = normalizePlaylist({
      ...playlistData,
      id: `playlist-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    playlistItems.value.unshift(playlist);
    persist();
    return clone(playlist);
  };

  const updatePlaylist = async ({ id, ...playlistData }) => {
    hydrate();
    const playlist = playlistItems.value.find((entry) => String(entry.id) === String(id));
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    const nextTrackIds = playlistData.track_ids || playlistData.song_ids || playlist.track_ids;
    const nextDuration = playlistData.total_duration ?? playlist.total_duration;

    touchPlaylist(playlist, {
      ...playlistData,
      name: playlistData.name || playlistData.title || playlist.name,
      title: playlistData.name || playlistData.title || playlist.title,
      track_ids: nextTrackIds,
      song_ids: nextTrackIds,
      song_count: playlistData.song_count ?? nextTrackIds.length,
      total_duration: nextDuration,
    });

    persist();
    return clone(playlist);
  };

  const deletePlaylist = async (playlistId) => {
    hydrate();
    const nextItems = playlistItems.value.filter(
      (playlist) => String(playlist.id) !== String(playlistId),
    );
    playlistItems.value = nextItems;
    persist();
    return playlistId;
  };

  const duplicatePlaylist = async (playlistId) => {
    hydrate();
    const source = playlistItems.value.find(
      (playlist) => String(playlist.id) === String(playlistId),
    );
    if (!source) {
      throw new Error("Playlist not found");
    }

    const duplicate = normalizePlaylist({
      ...clone(source),
      id: `playlist-${Date.now()}`,
      name: `${source.name} Copy`,
      title: `${source.name} Copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    playlistItems.value.unshift(duplicate);
    persist();
    return clone(duplicate);
  };

  const addTrackToPlaylist = async ({ playlistId, trackId }) => {
    hydrate();
    const playlist = playlistItems.value.find((entry) => String(entry.id) === String(playlistId));
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    if (!playlist.track_ids.includes(trackId)) {
      const nextTrackIds = [...playlist.track_ids, trackId];
      touchPlaylist(playlist, {
        track_ids: nextTrackIds,
        song_ids: nextTrackIds,
        song_count: nextTrackIds.length,
      });
      persist();
    }

    return clone(playlist);
  };

  const setPlaylistTracks = async ({ playlistId, trackIds = [], totalDuration }) => {
    hydrate();
    const playlist = playlistItems.value.find((entry) => String(entry.id) === String(playlistId));
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    const uniqueTrackIds = [...new Set(trackIds.map((id) => String(id)).filter(Boolean))];
    touchPlaylist(playlist, {
      track_ids: uniqueTrackIds,
      song_ids: uniqueTrackIds,
      song_count: uniqueTrackIds.length,
      ...(typeof totalDuration === "number" ? { total_duration: totalDuration } : {}),
    });

    persist();
    return clone(playlist);
  };

  const reorderPlaylistTrack = async ({ playlistId, trackId, direction = "down" }) => {
    hydrate();
    const playlist = playlistItems.value.find((entry) => String(entry.id) === String(playlistId));
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    const currentIndex = playlist.track_ids.findIndex((id) => String(id) === String(trackId));
    if (currentIndex === -1) {
      throw new Error("Track not found in playlist");
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= playlist.track_ids.length) {
      return clone(playlist);
    }

    const nextTrackIds = [...playlist.track_ids];
    const [movedTrack] = nextTrackIds.splice(currentIndex, 1);
    nextTrackIds.splice(targetIndex, 0, movedTrack);

    touchPlaylist(playlist, {
      track_ids: nextTrackIds,
      song_ids: nextTrackIds,
      song_count: nextTrackIds.length,
    });

    persist();
    return clone(playlist);
  };

  const removeTrackFromPlaylist = async ({ playlistId, trackId }) => {
    hydrate();
    const playlist = playlistItems.value.find((entry) => String(entry.id) === String(playlistId));
    if (!playlist) {
      throw new Error("Playlist not found");
    }

    const nextTrackIds = playlist.track_ids.filter((id) => String(id) !== String(trackId));
    touchPlaylist(playlist, {
      track_ids: nextTrackIds,
      song_ids: nextTrackIds,
      song_count: nextTrackIds.length,
    });
    persist();
    return clone(playlist);
  };

  const getPlaylistById = async (id) => {
    hydrate();
    const playlist = playlistItems.value.find((entry) => String(entry.id) === String(id));
    return playlist ? clone(playlist) : null;
  };

  const setArtistFilter = (artistIds) => {
    selectedArtistIds.value = Array.isArray(artistIds) ? artistIds : [artistIds];
  };

  const clearArtistFilter = () => {
    selectedArtistIds.value = [];
  };

  const setSearch = (query) => {
    searchQuery.value = query;
  };

  const setIncludePublic = (include) => {
    includePublic.value = include;
  };

  const playlistsForArtist = computed(() => {
    hydrate();
    return (artistId) => playlistItems.value.filter((playlist) => playlist.artist_id === artistId);
  });

  const globalPlaylists = computed(() => {
    hydrate();
    return () => filteredPlaylists.value;
  });

  const isCreatingPlaylist = computed(() => false);
  const isUpdatingPlaylist = computed(() => false);
  const isDeletingPlaylist = computed(() => false);
  const isModifyingTracks = computed(() => false);

  return {
    playlists: computed(() => filteredPlaylists.value),
    loading,
    playlistsError,
    selectedArtistIds,
    searchQuery,
    includePublic,
    playlistsForArtist,
    globalPlaylists,
    loadPlaylists,
    refetchPlaylists: loadPlaylists,
    setArtistFilter,
    clearArtistFilter,
    setSearch,
    setIncludePublic,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    duplicatePlaylist,
    addTrackToPlaylist,
    setPlaylistTracks,
    reorderPlaylistTrack,
    removeTrackFromPlaylist,
    isCreatingPlaylist,
    isUpdatingPlaylist,
    isDeletingPlaylist,
    isModifyingTracks,
  };
});
