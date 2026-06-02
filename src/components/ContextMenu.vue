<!-- components/ContextMenu.vue -->
<template>
  <teleport to="body">
    <div v-if="visible" class="context-menu-overlay" @click="close" @contextmenu.prevent>
      <div
        class="context-menu glassmorphic"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
        @click.stop
        ref="menuEl"
      >
        <!-- Header with selection count -->
        <div v-if="items.length > 1" class="context-menu-header">
          {{ items.length }} items selected
        </div>

        <!-- Menu Items -->
        <template v-for="(action, index) in visibleActions" :key="index">
          <hr v-if="action.separator" class="context-menu-separator" />

          <button
            v-else
            class="context-menu-item"
            :class="{
              'with-submenu': action.submenu,
              destructive: action.destructive,
            }"
            @click="handleAction(action)"
            @mouseenter="showSubmenu(action)"
            @mouseleave="hideSubmenu"
          >
            <svg v-if="action.icon" viewBox="0 0 24 24" fill="currentColor">
              <path :d="action.icon" />
            </svg>
            <span>{{ action.label }}</span>
            <svg
              v-if="action.submenu"
              class="submenu-arrow"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </button>
        </template>

        <!-- Playlist Submenu -->
        <div v-if="showPlaylistSubmenu" class="playlist-submenu glassmorphic" @click.stop>
          <div class="playlist-submenu-header">Add to Playlist</div>

          <!-- Existing Playlists -->
          <template v-if="playlists.length > 0">
            <button
              v-for="playlist in playlists"
              :key="playlist.id"
              class="playlist-item"
              @click="addToPlaylist(playlist)"
            >
              <div
                class="playlist-color"
                :style="{ backgroundColor: playlist.color || '#e85a19' }"
              ></div>
              <span class="playlist-name">{{ playlist.name }}</span>
              <span class="playlist-count">{{ playlist.song_count || 0 }} songs</span>
            </button>
            <hr class="context-menu-separator" />
          </template>

          <!-- Create New Playlist -->
          <button class="playlist-item new" @click="createNewPlaylist">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <span>Create New Playlist</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="confirmationOpen" class="confirm-overlay" @click.self="closeConfirmation">
      <div class="confirm-modal glassmorphic">
        <div class="confirm-head">
          <div>
            <h3>{{ confirmationTitle }}</h3>
            <p>{{ confirmationMessage }}</p>
          </div>
          <button class="confirm-close" @click="closeConfirmation">×</button>
        </div>

        <div class="confirm-actions">
          <button class="confirm-btn" @click="closeConfirmation">Cancel</button>
          <button class="confirm-btn destructive" @click="confirmPendingAction">
            {{ confirmationLabel }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, nextTick, inject } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useHighlightsStore } from "@/stores/highlights";
import { useArtistProjectsStore } from "@/stores/artistProjects";
import { usePlaylistsStore } from "@/stores/playlists";
import { useLibraryStore } from "@/stores/library";
import { usePlaybackStore } from "@/stores/playback";
import { useRoute, useRouter } from "vue-router";

// Injected services
const showToast = inject("showToast", () => {});

// State
const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const items = ref([]);
const itemType = ref("");
const menuEl = ref(null);
const showPlaylistSubmenu = ref(false);
const customActions = ref([]);
const confirmationOpen = ref(false);
const confirmationTitle = ref("");
const confirmationMessage = ref("");
const confirmationLabel = ref("Confirm");
const pendingConfirmationAction = ref(null);

const authStore = useAuthStore();
const highlightsStore = useHighlightsStore();
const artistProjectsStore = useArtistProjectsStore();
const playlistsStore = usePlaylistsStore();
const libraryStore = useLibraryStore();
const playbackStore = usePlaybackStore();
const route = useRoute();
const router = useRouter();

const playlists = computed(() => playlistsStore.playlists || []);

// Detect dev environment
const devMode = import.meta.env.DEV;

// Action definitions based on item type
const buildActionsWithPin = (base) => {
  if (authStore.isManager) {
    return [
      ...base,
      { separator: true },
      {
        label: "Pin to Highlights",
        action: "pin-highlight",
        icon: "M12 2l3 7h7l-5.5 4.5L18 22l-6-3.5L6 22l1.5-8.5L2 9h7l3-7z",
      },
    ];
  }
  return base;
};

// Replace actionMap creation to use builder
const actionMap = {
  song: buildActionsWithPin([
    {
      label: "Play Now",
      action: "play",
      icon: "M8 5v14l11-7z",
    },
    {
      label: "Add to Queue",
      action: "queue",
      icon: "M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z",
    },
    {
      label: "Add to Playlist",
      action: "add-to-playlist",
      icon: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
      submenu: true,
    },
    { separator: true },
    {
      label: "Go to Artist",
      action: "go-to-artist",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
    },
    {
      label: "Show in Folder",
      action: "show-in-folder",
      icon: "M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
    },
    { separator: true },
    {
      label: "Edit Metadata",
      action: "edit",
      icon: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    },
    {
      label: "Download",
      action: "download",
      icon: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    },
    { separator: true },
    {
      label: "Remove from Library",
      action: "delete",
      icon: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
      destructive: true,
    },
  ]),
  playlist: buildActionsWithPin([
    {
      label: "Play Playlist",
      action: "play",
      icon: "M8 5v14l11-7z",
    },
    {
      label: "Shuffle Play",
      action: "shuffle-play",
      icon: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
    },
    { separator: true },
    {
      label: "Add to Queue",
      action: "queue",
      icon: "M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z",
    },
    { separator: true },
    {
      label: "Edit Playlist",
      action: "edit",
      icon: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    },
    {
      label: "Duplicate Playlist",
      action: "duplicate",
      icon: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
    },
    {
      label: "Share Playlist",
      action: "share",
      icon: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
    },
    { separator: true },
    {
      label: "Delete Playlist",
      action: "delete",
      icon: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
      destructive: true,
    },
  ]),
  artist: buildActionsWithPin([
    {
      label: "Play Artist",
      action: "play",
      icon: "M8 5v14l11-7z",
    },
    {
      label: "Shuffle Artist",
      action: "shuffle-play",
      icon: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
    },
    { separator: true },
    {
      label: "Go to Artist Page",
      action: "go-to-artist",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
    },
    { separator: true },
    {
      label: "Edit Artist Info",
      action: "edit",
      icon: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    },
  ]),
  project: buildActionsWithPin([
    {
      label: "Open Project",
      action: "open-project",
      icon: "M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z",
    },
    {
      label: "Open in New Tab",
      action: "open-new-tab",
      icon: "M14 3H5c-1.1 0-2 .9-2 2v14c0 1.1 .9 2 2 2h14c1.1 0 2-.9 2-2v-9l-8-8zM14 3v6h6",
    },
    { separator: true },
    {
      label: "Move to Planning",
      action: "project-status-planning",
      icon: "M4 4h16v2H4zm0 4h10v2H4zm0 4h16v2H4zm0 4h8v2H4z",
    },
    {
      label: "Move to In Progress",
      action: "project-status-active",
      icon: "M3 13h8v8H3zm10-10h8v18h-8z",
    },
    {
      label: "Move to Review",
      action: "project-status-review",
      icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm-1 5h2v6h-2zm0 8h2v2h-2z",
    },
    {
      label: "Move to Released",
      action: "project-status-completed",
      icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    },
    { separator: true },
    {
      label: "Priority: High",
      action: "project-priority-high",
      icon: "M12 4l8 16H4z",
    },
    {
      label: "Priority: Medium",
      action: "project-priority-medium",
      icon: "M4 11h16v2H4z",
    },
    {
      label: "Priority: Low",
      action: "project-priority-low",
      icon: "M4 13l8 7 8-7z",
    },
    { separator: true },
    {
      label: "Mark Complete",
      action: "project-mark-complete",
      icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    },
  ]),
  // Context menu for navigation/sidebar items
  navigation: buildActionsWithPin([
    {
      label: "Back",
      action: "go-back",
      icon: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    },
    {
      label: "Forward",
      action: "go-forward",
      icon: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z",
    },
    { separator: true },
    {
      label: "Reload",
      action: "reload",
      icon: "M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6a6 6 0 01-6-6H4a8 8 0 108-8z",
    },
    {
      label: "Toggle Dark Mode",
      action: "toggle-dark",
      icon: "M12 3.1a9 9 0 000 17.8 7 7 0 010-17.8z",
    },
    { separator: true },
    {
      label: "Open in New Tab",
      action: "open-new-tab",
      icon: "M14 3H5c-1.1 0-2 .9-2 2v14c0 1.1 .9 2 2 2h14c1.1 0 2-.9 2-2v-9l-8-8zM14 3v6h6",
    },
    {
      label: "Split View",
      action: "split-view",
      icon: "M3 3h18v18H3V3zm2 2v14h14V5H5zm7 0h7v7h-7V5z",
    },
    {
      label: "Copy Link",
      action: "copy-link",
      icon: "M3 13h2v-2H3v2zm3 0h8v-2H6v2zm0 4h8v-2H6v2zm0-8h8V7H6v2zm9 4h2v-2h-2v2zm0 4h2v-2h-2v2zm0-8h2V7h-2v2z",
    },
    {
      label: "Copy Embed Code",
      action: "copy-embed",
      icon: "M4 4h16v2H4zm0 14h16v2H4zM4 8h16v8H4z",
    },
    ...(devMode
      ? [
          { separator: true },
          {
            label: "Dev Utilities",
            action: "dev-utils",
            icon: "M3 3h2v2H3zm0 4h2v2H3zm0 4h2v2H3zm0 4h2v2H3zm14-12h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z",
          },
        ]
      : []),
  ]),
};

const isCustomActionMenu = (menuItems) =>
  Array.isArray(menuItems) &&
  menuItems.length > 0 &&
  menuItems.every(
    (item) =>
      item &&
      typeof item === "object" &&
      (Object.prototype.hasOwnProperty.call(item, "label") ||
        Object.prototype.hasOwnProperty.call(item, "separator") ||
        Object.prototype.hasOwnProperty.call(item, "divider")),
  );

const normalizeCustomActions = (actions = []) =>
  actions.map((action) => ({
    ...action,
    separator: Boolean(action.separator || action.divider),
    destructive: Boolean(action.destructive || action.danger),
  }));

// Computed
const visibleActions = computed(() => {
  if (customActions.value.length > 0) {
    return customActions.value;
  }
  return actionMap[itemType.value] || [];
});

// Methods
const show = async (event, menuItems, type = "song") => {
  if (isCustomActionMenu(menuItems)) {
    customActions.value = normalizeCustomActions(menuItems);
    items.value = [];
    itemType.value = "custom";
  } else {
    items.value = Array.isArray(menuItems) ? menuItems : [menuItems];
    itemType.value = type;
    customActions.value = [];
  }

  // Position menu relative to cursor
  const x = Math.min(event.clientX, window.innerWidth - 250);
  const y = Math.min(event.clientY, window.innerHeight - 400);

  position.value = { x, y };
  visible.value = true;
  showPlaylistSubmenu.value = false;

  // Focus menu for keyboard navigation
  await nextTick();
  if (menuEl.value) {
    menuEl.value.focus();
  }
};

const close = () => {
  visible.value = false;
  showPlaylistSubmenu.value = false;
  customActions.value = [];
  items.value = [];
  itemType.value = "";
};

const openConfirmation = ({ title, message, label = "Confirm", handler }) => {
  confirmationTitle.value = title;
  confirmationMessage.value = message;
  confirmationLabel.value = label;
  pendingConfirmationAction.value = handler;
  confirmationOpen.value = true;
};

const closeConfirmation = () => {
  confirmationOpen.value = false;
  confirmationTitle.value = "";
  confirmationMessage.value = "";
  confirmationLabel.value = "Confirm";
  pendingConfirmationAction.value = null;
};

const confirmPendingAction = async () => {
  const action = pendingConfirmationAction.value;
  if (typeof action !== "function") {
    closeConfirmation();
    return;
  }

  try {
    await action();
  } finally {
    closeConfirmation();
  }
};

const handleAction = async (action) => {
  if (action.submenu && action.action === "add-to-playlist") {
    showPlaylistSubmenu.value = !showPlaylistSubmenu.value;
    return;
  }

  const callback =
    typeof action.handler === "function"
      ? action.handler
      : typeof action.action === "function"
        ? action.action
        : null;

  if (callback) {
    await callback();
    close();
    return;
  }

  // Execute the action
  await executeAction(action.action, items.value);
  close();
};

const normalizeLink = (rawLink) => {
  if (!rawLink) return null;
  if (/^https?:\/\//i.test(rawLink)) return rawLink;
  return `${window.location.origin}${rawLink.startsWith("/") ? rawLink : `/${rawLink}`}`;
};

const resolveItemLink = (action, targetItems) => {
  const target = targetItems?.[0] || {};

  if (target.link || target.path || target.url) {
    return normalizeLink(target.link || target.path || target.url);
  }

  if (action === "go-to-artist") {
    const slug =
      target.artist_slug || target.artistSlug || target.slug || target.artist_id || target.artistId;
    if (slug) {
      return normalizeLink(`/artists/${slug}`);
    }
    return normalizeLink("/artists");
  }

  if (itemType.value === "playlist" && target.id) {
    return normalizeLink(`/playlists/${target.id}`);
  }

  if (itemType.value === "project" && target.id) {
    const artistSlug = target.artist_slug || target.artistSlug;
    if (artistSlug) {
      return normalizeLink(`/artists/${artistSlug}/projects/${target.id}`);
    }
  }

  return normalizeLink(window.location.pathname);
};

const copyText = async (text) => {
  if (!text) return false;
  try {
    await navigator.clipboard?.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const applyProjectUpdates = (targetItems, updater) => {
  let updatedCount = 0;

  targetItems.forEach((target) => {
    const artistSlug = target.artist_slug || target.artistSlug;
    const projectId = target.id || target.project_id || target.projectId;
    if (!artistSlug || !projectId) return;

    const currentProject = artistProjectsStore.getProject(artistSlug, projectId);
    if (!currentProject) return;

    const updates = updater(currentProject);
    artistProjectsStore.updateProject(artistSlug, projectId, updates);
    updatedCount += 1;
  });

  return updatedCount;
};

const resolveSongsForTargets = (targetItems = []) => {
  if (itemType.value === "song") {
    const libraryMap = new Map((libraryStore.songs || []).map((song) => [String(song.id), song]));
    return targetItems.map((item) => libraryMap.get(String(item.id)) || item).filter(Boolean);
  }

  if (itemType.value === "playlist") {
    const playlist = targetItems[0];
    if (!playlist) return [];
    const trackIds = playlist.track_ids || playlist.song_ids || [];
    const libraryMap = new Map((libraryStore.songs || []).map((song) => [String(song.id), song]));
    return trackIds.map((id) => libraryMap.get(String(id))).filter(Boolean);
  }

  return [];
};

const executeAction = async (action, targetItems) => {
  switch (action) {
    case "play": {
      const songs = resolveSongsForTargets(targetItems);
      if (songs.length === 0) {
        showToast({ message: "Nothing playable in this selection", type: "info" });
        break;
      }

      playbackStore.playArtist(
        {
          id: targetItems[0]?.id || itemType.value,
          name: targetItems[0]?.name || targetItems[0]?.title || "Selection",
        },
        songs,
      );
      showToast({
        message: `Playing ${targetItems[0]?.name || targetItems[0]?.title || "selection"}`,
        type: "success",
      });
      break;
    }

    case "queue": {
      const songs = resolveSongsForTargets(targetItems);
      if (songs.length === 0) {
        showToast({ message: "Nothing to queue in this selection", type: "info" });
        break;
      }
      playbackStore.addToQueue(songs);
      showToast({
        message: `Added ${songs.length} track${songs.length > 1 ? "s" : ""} to queue`,
        type: "success",
      });
      break;
    }

    case "shuffle-play": {
      const songs = resolveSongsForTargets(targetItems);
      if (songs.length === 0) {
        showToast({ message: "Nothing playable in this selection", type: "info" });
        break;
      }
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playbackStore.playArtist(
        {
          id: targetItems[0]?.id || itemType.value,
          name: targetItems[0]?.name || targetItems[0]?.title || "Selection",
        },
        shuffled,
      );
      showToast({
        message: `Shuffling ${targetItems[0]?.name || targetItems[0]?.title || "selection"}`,
        type: "success",
      });
      break;
    }

    case "edit":
      {
        const target = targetItems[0] || {};

        if (itemType.value === "artist") {
          const slug = target.slug || target.artist_slug || target.artistSlug;
          if (slug) {
            router.push(`/artists/${slug}`);
          } else {
            router.push("/artists");
          }
        } else if (itemType.value === "playlist") {
          if (target.id) {
            router.push(`/playlists/${target.id}`);
          } else {
            router.push("/playlists");
          }
        } else if (itemType.value === "song") {
          router.push("/songs");
        } else {
          router.push("/preferences");
        }

        showToast({
          message: "Opened edit workspace",
          type: "info",
        });
      }
      break;

    case "delete":
      if (itemType.value === "playlist") {
        const playlist = targetItems[0];
        if (!playlist) break;
        openConfirmation({
          title: "Delete Playlist",
          message: `Delete ${playlist.name || playlist.title}? This cannot be undone.`,
          label: "Delete Playlist",
          handler: async () => {
            await playlistsStore.deletePlaylist(playlist.id);
            showToast({ message: `Deleted ${playlist.name || playlist.title}`, type: "success" });
            if (route.path === `/playlists/${playlist.id}`) {
              router.push("/playlists");
            }
          },
        });
      } else if (itemType.value === "song") {
        openConfirmation({
          title: "Delete Songs",
          message: `Delete ${targetItems.length} selected song${targetItems.length > 1 ? "s" : ""}? This cannot be undone.`,
          label: "Delete Songs",
          handler: async () => {
            await Promise.all(targetItems.map((item) => libraryStore.deleteMedia(item.id)));
            showToast({
              message: `Deleted ${targetItems.length} song${targetItems.length > 1 ? "s" : ""}`,
              type: "success",
            });
          },
        });
      } else {
        showToast({
          message: `Deleted ${targetItems.length} item${targetItems.length > 1 ? "s" : ""}`,
          type: "error",
        });
      }
      break;

    case "duplicate":
      if (itemType.value === "playlist") {
        const playlist = targetItems[0];
        if (!playlist) break;
        const duplicate = await playlistsStore.duplicatePlaylist(playlist.id);
        showToast({ message: `Duplicated ${playlist.name || playlist.title}`, type: "success" });
        router.push(`/playlists/${duplicate.id}`);
      } else {
        showToast({
          message: "Duplicated successfully",
          type: "success",
        });
      }
      break;

    case "share":
      {
        const shareLink = resolveItemLink(action, targetItems);
        copyText(shareLink).then((copied) => {
          showToast({
            message: copied ? "Share link copied" : shareLink || "Share unavailable",
            type: copied ? "success" : "info",
          });
        });
      }
      break;

    case "download":
      showToast({
        message: "Download started",
        type: "success",
      });
      break;

    case "go-to-artist":
      {
        const artistLink = resolveItemLink(action, targetItems);
        const pathname = artistLink?.replace(window.location.origin, "");
        if (pathname) {
          router.push(pathname);
        }
      }
      break;

    case "show-in-folder":
      router.push("/files");
      showToast({ message: "Opened Files", type: "info" });
      break;

    case "pin-highlight": {
      const first = items.value[0];
      highlightsStore.addHighlight({
        id: `${itemType.value}-${first.id || first.name}`,
        title: first.name || first.title || "Item",
        description: itemType.value,
        link: window.location.pathname,
        date_added: Date.now(),
      });
      showToast({ message: "Pinned to Highlights", type: "success" });
      close();
      break;
    }

    case "toggle-dark": {
      const root = document.documentElement;
      root.classList.toggle("dark");
      localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
      showToast({
        message: `Switched to ${root.classList.contains("dark") ? "Dark" : "Light"} mode`,
        type: "success",
      });
      break;
    }

    case "reload":
      window.location.reload();
      break;

    case "go-back":
      router.back();
      break;

    case "go-forward":
      router.forward();
      break;

    case "split-view": {
      const target = targetItems[0];
      const link = target.link || "/";
      const width = Math.floor(screen.availWidth / 2);
      const height = screen.availHeight || window.innerHeight;
      window.open(link, "_blank", `width=${width},height=${height},left=${width}`);
      break;
    }

    case "copy-embed": {
      const target = targetItems[0];
      const link = target.link || "/";
      const embed = `<iframe src="${window.location.origin + link}" width="100%" height="380" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>`;
      navigator.clipboard?.writeText(embed).then(() => {
        showToast({ message: "Embed code copied", type: "success" });
      });
      break;
    }

    case "open-new-tab": {
      const targetLink = resolveItemLink(action, targetItems);
      if (targetLink) {
        window.open(targetLink, "_blank", "noopener,noreferrer");
      }
      break;
    }

    case "copy-link": {
      const targetLink = resolveItemLink(action, targetItems);
      copyText(targetLink).then((copied) => {
        showToast({
          message: copied ? "Link copied" : targetLink || "Unable to copy link",
          type: copied ? "success" : "info",
        });
      });
      break;
    }

    case "open-project": {
      const projectLink = resolveItemLink(action, targetItems);
      const pathname = projectLink?.replace(window.location.origin, "");
      if (pathname) {
        router.push(pathname);
      }
      break;
    }

    case "project-status-planning":
    case "project-status-active":
    case "project-status-review":
    case "project-status-completed": {
      const nextStatus = action.replace("project-status-", "");
      const updated = applyProjectUpdates(targetItems, (project) => {
        if (nextStatus === "completed") {
          const totalTasks = project.tasks?.total || 0;
          return {
            status: nextStatus,
            progress: 100,
            nextMilestone: "Released",
            tasks: {
              ...project.tasks,
              completed: totalTasks,
            },
          };
        }

        return {
          status: nextStatus,
        };
      });

      if (updated > 0) {
        const labels = {
          planning: "Planning",
          active: "In Progress",
          review: "Review",
          completed: "Released",
        };
        showToast({
          message: `Moved ${updated} project${updated > 1 ? "s" : ""} to ${labels[nextStatus] || nextStatus}`,
          type: "success",
        });
      }
      break;
    }

    case "project-priority-high":
    case "project-priority-medium":
    case "project-priority-low": {
      const nextPriority = action.replace("project-priority-", "");
      const updated = applyProjectUpdates(targetItems, () => ({
        priority: nextPriority,
      }));

      if (updated > 0) {
        showToast({
          message: `Updated priority for ${updated} project${updated > 1 ? "s" : ""}`,
          type: "success",
        });
      }
      break;
    }

    case "project-mark-complete": {
      const updated = applyProjectUpdates(targetItems, (project) => {
        const totalTasks = project.tasks?.total || 0;
        return {
          status: "completed",
          progress: 100,
          nextMilestone: "Released",
          tasks: {
            ...project.tasks,
            completed: totalTasks,
          },
        };
      });

      if (updated > 0) {
        showToast({
          message: `Completed ${updated} project${updated > 1 ? "s" : ""}`,
          type: "success",
        });
      }
      break;
    }

    case "dev-utils":
      router.push("/preferences");
      break;

    default:
      showToast({ message: `Action "${action}" is unavailable in this view`, type: "info" });
  }
};

const showSubmenu = (action) => {
  if (action.submenu && action.action === "add-to-playlist") {
    // Position submenu logic would go here
  }
};

const hideSubmenu = () => {
  // Hide submenu logic
};

const addToPlaylist = (playlist) => {
  const trackIds = items.value.map((item) => item.id).filter(Boolean);

  if (trackIds.length === 0) {
    showToast({
      message: "No songs selected for this action",
      type: "info",
    });
    close();
    return;
  }

  Promise.all(
    trackIds.map((trackId) =>
      playlistsStore.addTrackToPlaylist({ playlistId: playlist.id, trackId }),
    ),
  )
    .then(() => {
      showToast({
        message: `Added ${trackIds.length} song${trackIds.length > 1 ? "s" : ""} to "${playlist.name}"`,
        type: "success",
      });
    })
    .catch(() => {
      showToast({
        message: "Could not update playlist",
        type: "error",
      });
    })
    .finally(() => {
      close();
    });
};

const createNewPlaylist = () => {
  const trackIds = items.value.map((item) => item.id).filter(Boolean);
  const nextIndex = (playlists.value?.length || 0) + 1;
  const name = trackIds.length ? `New Playlist ${nextIndex}` : `Untitled Playlist ${nextIndex}`;

  playlistsStore
    .createPlaylist({
      title: name,
      track_ids: trackIds,
    })
    .then((playlist) => {
      showToast({
        message: `Created "${playlist.name}"`,
        type: "success",
      });
      router.push(`/playlists/${playlist.id}`);
    })
    .catch(() => {
      showToast({
        message: "Could not create playlist",
        type: "error",
      });
    })
    .finally(() => {
      close();
    });
};

// Keyboard navigation
const handleKeydown = (event) => {
  if (!visible.value) return;

  switch (event.key) {
    case "Escape":
      close();
      break;
    case "ArrowDown":
      // Navigate down
      event.preventDefault();
      break;
    case "ArrowUp":
      // Navigate up
      event.preventDefault();
      break;
    case "Enter":
      // Execute focused action
      event.preventDefault();
      break;
  }
};

// Expose methods for parent components
defineExpose({ show, close, isVisible: () => visible.value });

// Global event listeners
import { onMounted, onUnmounted } from "vue";

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(14px);
}

.confirm-modal {
  width: min(420px, 100%);
  padding: 20px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(12, 12, 14, 0.94);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.38);
}

.confirm-head,
.confirm-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.confirm-head {
  align-items: flex-start;
  margin-bottom: 18px;
}

.confirm-head h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
}

.confirm-head p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.5;
}

.confirm-close,
.confirm-btn {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.confirm-close {
  width: 36px;
  height: 36px;
  font-size: 22px;
  cursor: pointer;
}

.confirm-btn {
  min-height: 40px;
  padding: 0 16px;
  font-weight: 600;
  cursor: pointer;
}

.confirm-btn.destructive {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
}

.context-menu {
  position: absolute;
  min-width: 240px;
  max-width: 320px;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
  overflow: hidden;
  outline: none;
}

.context-menu-header {
  padding: 8px 12px;
  font-weight: 600;
  opacity: 0.7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
}

.context-menu-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 8px;
  border: none;
}

.context-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  gap: 12px;
  background: none;
  border: none;
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  position: relative;
}

.context-menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.with-submenu:hover {
  background: rgba(255, 255, 255, 0.08);
}

.context-menu-item.destructive {
  color: #ff6b6b;
}

.context-menu-item.destructive:hover {
  background: rgba(255, 107, 107, 0.1);
}

.context-menu-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.8;
}

.submenu-arrow {
  margin-left: auto;
  opacity: 0.5;
}

/* Playlist submenu */
.playlist-submenu {
  position: absolute;
  top: -4px;
  left: calc(100% + 4px);
  border-radius: 8px;
  padding: 4px;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 10001;
}

.playlist-submenu-header {
  padding: 8px 12px;
  font-weight: 600;
  opacity: 0.7;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  width: 100%;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: left;
  transition: all 0.15s ease;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.playlist-item.new {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: 4px;
  padding-top: 12px;
  color: var(--accent-primary);
}

.playlist-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.playlist-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.playlist-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.playlist-count {
  font-size: 12px;
  opacity: 0.6;
  flex-shrink: 0;
}

/* Scrollbar */
.playlist-submenu::-webkit-scrollbar {
  width: 6px;
}

.playlist-submenu::-webkit-scrollbar-track {
  background: transparent;
}

.playlist-submenu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.playlist-submenu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Theme override */
.context-menu,
.playlist-submenu,
.confirm-modal {
  border-color: var(--color-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(250, 250, 248, 0.92)),
    var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-overlay);
}

.context-menu-header,
.playlist-submenu-header,
.confirm-head p,
.playlist-count {
  color: var(--color-text-secondary);
}

.confirm-head h3,
.context-menu-item,
.playlist-item,
.playlist-name,
.confirm-btn,
.confirm-close {
  color: var(--color-text);
}

.context-menu-separator {
  background: var(--color-border);
}

.context-menu-item:hover,
.context-menu-item.with-submenu:hover,
.playlist-item:hover,
.confirm-btn:hover,
.confirm-close:hover {
  background: rgba(19, 18, 17, 0.06);
}

.context-menu-item.destructive,
.confirm-btn.destructive {
  color: var(--color-danger);
}

.context-menu-item.destructive:hover,
.confirm-btn.destructive {
  background: rgba(192, 57, 43, 0.08);
  border-color: rgba(192, 57, 43, 0.18);
}

.playlist-item.new {
  border-top-color: var(--color-border);
  color: var(--color-accent);
}

.confirm-overlay {
  background: rgba(19, 18, 17, 0.18);
}

.context-menu,
.playlist-submenu,
.confirm-modal {
  color: var(--color-text) !important;
}

.context-menu-item,
.playlist-item,
.confirm-btn,
.confirm-close,
.context-menu-header,
.playlist-submenu-header,
.playlist-count {
  color: inherit !important;
}

.context-menu-item:hover,
.playlist-item:hover,
.confirm-btn:hover,
.confirm-close:hover {
  color: var(--color-text) !important;
}
</style>
