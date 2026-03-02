<template>
  <DragDropProvider>
    <div id="app">
      <!-- Standalone pages (one-sheets, EPKs) render without app chrome -->
      <router-view v-if="$route.meta.standalone" />

      <!-- Loading Screen -->
      <div v-else-if="!authStore.isInitialized" class="app-loading">
        <div class="loading-spinner"></div>
        <p class="caption-text">Loading&hellip;</p>
      </div>

      <!-- Main Application -->
      <div v-else-if="authStore.isAuthenticated" class="app-container">
        <!-- Mobile Overlay -->
        <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false"></div>

        <!-- Sidebar Navigation -->
        <aside
          class="sidebar"
          :class="{
            'sidebar-mobile-open': mobileMenuOpen,
            'artist-shell-sidebar': usesArtistShell,
          }"
          @contextmenu.prevent="handleSidebarContextMenu"
          role="navigation"
          aria-label="Main navigation"
        >
          <div class="sidebar-content">
            <!-- Brand + Workspace -->
            <div class="sidebar-header">
              <div class="sidebar-brand">
                <router-link :to="homeRoute" class="app-brand-link" aria-label="All My Friends">
                  <AmfBrandLogo variant="sidebar" />
                </router-link>

                <button
                  v-if="showWorkspaceControls"
                  class="workspace-selector"
                  :class="{ open: showArtistPicker }"
                  @click.stop="showArtistPicker = !showArtistPicker"
                  :aria-expanded="showArtistPicker"
                  aria-label="Switch workspace"
                >
                  <div v-if="activeArtist" class="ws-avatar">
                    <img
                      v-if="hasCustomAvatar(activeArtist.avatar_url)"
                      :src="activeArtist.avatar_url"
                      :alt="activeArtist.name"
                    />
                    <span v-else>{{ getInitials(activeArtist.name) }}</span>
                  </div>
                  <div v-else class="ws-avatar ws-all">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
                    </svg>
                  </div>
                  <span class="ws-name">{{ activeArtist?.name ?? "All Artists" }}</span>
                  <svg
                    class="ws-chevron"
                    :class="{ open: showArtistPicker }"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
                <div v-else-if="artistShellWorkspace" class="workspace-indicator">
                  <div class="ws-avatar">
                    <img
                      v-if="hasCustomAvatar(artistShellWorkspace.avatar_url)"
                      :src="artistShellWorkspace.avatar_url"
                      :alt="artistShellWorkspace.name"
                    />
                    <span v-else>{{ getInitials(artistShellWorkspace.name) }}</span>
                  </div>
                  <span class="ws-name">{{ artistShellWorkspace.name }}</span>
                </div>
              </div>

              <Transition name="fade">
                <div
                  v-if="showWorkspaceControls && showArtistPicker"
                  class="artist-picker-dropdown"
                >
                  <button
                    v-if="showAllArtistsOption"
                    class="picker-item"
                    :class="{ active: !activeArtist }"
                    @click="setArtistContext(null)"
                  >
                    <div class="context-all-dot">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
                      </svg>
                    </div>
                    <span class="picker-name">All Artists</span>
                    <svg
                      v-if="!activeArtist"
                      class="picker-check"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </button>
                  <div
                    v-if="showAllArtistsOption && recentArtists.length"
                    class="picker-divider-line"
                  ></div>
                  <button
                    v-for="artist in recentArtists"
                    :key="artist.id"
                    class="picker-item"
                    :class="{ active: activeArtist?.id === artist.id }"
                    @click="setArtistContext(artist)"
                  >
                    <div class="artist-avatar mini">
                      <img
                        v-if="hasCustomAvatar(artist.avatar_url)"
                        :src="artist.avatar_url"
                        :alt="artist.name"
                      />
                      <span v-else class="avatar-initial">{{ getInitials(artist.name) }}</span>
                    </div>
                    <span class="picker-name">{{ artist.name }}</span>
                    <svg
                      v-if="activeArtist?.id === artist.id"
                      class="picker-check"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Navigation -->
            <nav v-if="!usesArtistShell" class="sidebar-nav" role="navigation">
              <div class="nav-row-list">
                <router-link
                  to="/dashboard"
                  class="nav-item"
                  :class="{ active: isRouteActive('/dashboard', true) }"
                  @click="mobileMenuOpen = false"
                >
                  Home
                </router-link>

                <!-- Library -->
                <div class="nav-section-label">Library</div>
                <router-link
                  :to="projectsWorkspaceRoute"
                  class="nav-item"
                  :class="{ active: isProjectsWorkspaceActive }"
                  @click="mobileMenuOpen = false"
                >
                  Projects
                </router-link>
                <router-link
                  to="/songs"
                  class="nav-item"
                  :class="{ active: isRouteActive('/songs', true) }"
                  @click="mobileMenuOpen = false"
                  >Songs</router-link
                >
                <router-link
                  to="/playlists"
                  class="nav-item"
                  :class="{ active: isRouteActive('/playlists') }"
                  @click="mobileMenuOpen = false"
                  >Playlists</router-link
                >
                <router-link
                  to="/releases"
                  class="nav-item"
                  :class="{ active: isRouteActive('/releases', true) }"
                  @click="mobileMenuOpen = false"
                  >Releases</router-link
                >

                <!-- Assets -->
                <div class="nav-section-label">Assets</div>
                <router-link
                  to="/media"
                  class="nav-item"
                  :class="{ active: isRouteActive('/media') || isRouteActive('/media-library') }"
                  @click="mobileMenuOpen = false"
                  >Media Library</router-link
                >
                <router-link
                  to="/moodboards"
                  class="nav-item"
                  :class="{ active: isRouteActive('/moodboards') }"
                  @click="mobileMenuOpen = false"
                  >Moodboards</router-link
                >
                <router-link
                  to="/files"
                  class="nav-item"
                  :class="{ active: isRouteActive('/files', true) }"
                  @click="mobileMenuOpen = false"
                  >Files</router-link
                >

                <!-- Insights -->
                <div class="nav-section-label">Insights</div>
                <router-link
                  to="/financials"
                  class="nav-item"
                  :class="{ active: isRouteActive('/financials', true) }"
                  @click="mobileMenuOpen = false"
                  >Financials</router-link
                >

                <!-- Planning -->
                <div class="nav-section-label">Planning</div>
                <router-link
                  to="/calendar"
                  class="nav-item"
                  :class="{ active: isRouteActive('/calendar', true) }"
                  @click="mobileMenuOpen = false"
                  >Calendar</router-link
                >
                <router-link
                  to="/timeline"
                  class="nav-item"
                  :class="{ active: isRouteActive('/timeline', true) }"
                  @click="mobileMenuOpen = false"
                  >Timeline</router-link
                >
                <router-link
                  to="/notes"
                  class="nav-item"
                  :class="{ active: isRouteActive('/notes', true) }"
                  @click="mobileMenuOpen = false"
                  >Notes</router-link
                >

                <div class="nav-section-label">People</div>

                <router-link
                  to="/team"
                  class="nav-item"
                  :class="{ active: isRouteActive('/team', true) }"
                  @click="mobileMenuOpen = false"
                  >Team</router-link
                >

                <!-- Account -->
                <div class="nav-section-label">Account</div>
                <router-link
                  to="/profile"
                  class="nav-item"
                  :class="{ active: isRouteActive('/profile', true) }"
                  @click="mobileMenuOpen = false"
                  >Profile</router-link
                >
                <router-link
                  to="/preferences"
                  class="nav-item"
                  :class="{ active: isRouteActive('/preferences', true) }"
                  @click="mobileMenuOpen = false"
                  >Preferences</router-link
                >
              </div>
            </nav>

            <!-- Footer -->
            <div class="sidebar-footer">
              <div class="user-footer">
                <div class="user-footer-text">
                  <span class="user-footer-name">{{ authStore.userName }}</span>
                  <span class="user-footer-role">{{ userRoleLabel }}</span>
                  <span class="user-footer-email">{{ authStore.userEmail }}</span>
                </div>
                <div class="footer-actions">
                  <button
                    class="footer-icon-btn"
                    @click="showPreferences = true"
                    title="Preferences"
                    aria-label="Preferences"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path
                        d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
                      />
                    </svg>
                  </button>
                  <button
                    class="footer-icon-btn"
                    @click="handleSignOut"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path
                        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main
          class="main-content"
          @dragover.prevent="onMainDragOver"
          @dragleave="onMainDragLeave"
          @drop.prevent="onMainDrop"
        >
          <!-- Global file drop overlay -->
          <Transition name="fade">
            <div v-if="globalDropActive" class="global-drop-overlay">
              <div class="gdo-inner">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <path
                    d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
                  />
                </svg>
                <span class="gdo-title">Drop to import</span>
                <span class="gdo-hint">Files will be routed to the right place</span>
              </div>
            </div>
          </Transition>

          <!-- Smart import tray (shows after drop) -->
          <Transition name="tray-slide">
            <div v-if="importTray.show" class="import-tray">
              <div class="tray-header">
                <span class="tray-title"
                  >{{ importTray.files.length }} file{{
                    importTray.files.length !== 1 ? "s" : ""
                  }}
                  ready to import</span
                >
                <button class="tray-close" @click="importTray.show = false" aria-label="Dismiss">
                  ×
                </button>
              </div>
              <div class="tray-groups">
                <div v-if="importTray.audio.length" class="tray-group">
                  <span class="tray-group-icon">♪</span>
                  <div class="tray-group-info">
                    <span class="tray-group-label"
                      >{{ importTray.audio.length }} audio file{{
                        importTray.audio.length !== 1 ? "s" : ""
                      }}</span
                    >
                    <span class="tray-group-dest">→ Songs Library</span>
                  </div>
                  <button class="tray-go-btn" @click="goToRoute('/songs', true)">
                    Go to Songs
                  </button>
                </div>
                <div v-if="importTray.images.length" class="tray-group">
                  <span class="tray-group-icon">▣</span>
                  <div class="tray-group-info">
                    <span class="tray-group-label"
                      >{{ importTray.images.length }} image{{
                        importTray.images.length !== 1 ? "s" : ""
                      }}</span
                    >
                    <span class="tray-group-dest">→ Media Library</span>
                  </div>
                  <button class="tray-go-btn" @click="goToRoute('/media-library', true)">
                    Go to Media
                  </button>
                </div>
                <div v-if="importTray.other.length" class="tray-group">
                  <span class="tray-group-icon">◻</span>
                  <div class="tray-group-info">
                    <span class="tray-group-label"
                      >{{ importTray.other.length }} other file{{
                        importTray.other.length !== 1 ? "s" : ""
                      }}</span
                    >
                    <span class="tray-group-dest">→ Files</span>
                  </div>
                  <button class="tray-go-btn" @click="goToRoute('/files', true)">
                    Go to Files
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Mobile top bar -->
          <div class="mobile-topbar">
            <button
              v-if="!usesArtistShell"
              class="mobile-menu-btn"
              @click="mobileMenuOpen = !mobileMenuOpen"
              aria-label="Toggle menu"
            >
              <svg v-if="!mobileMenuOpen" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
            </button>
            <router-link :to="homeRoute" class="mobile-brand-link" aria-label="All My Friends">
              <AmfBrandLogo variant="mobile" />
            </router-link>
          </div>

          <div class="content-scroll">
            <router-view />
          </div>
        </main>

        <!-- Now Playing Bar -->
        <NowPlayingBar
          v-if="playbackStore.currentSong"
          :currentSong="playbackStore.currentSong"
          :isPlaying="playbackStore.isPlaying"
          :currentTime="playbackStore.currentTime"
          :duration="playbackStore.duration"
          :volume="playbackStore.volume"
          :isShuffled="playbackStore.isShuffled"
          :repeatMode="playbackStore.repeatMode"
          @toggle-playback="playbackStore.togglePlayback"
          @seek="playbackStore.seek"
          @previous="playbackStore.playPrevious"
          @next="playbackStore.playNext"
          @toggle-shuffle="playbackStore.toggleShuffle"
          @toggle-repeat="playbackStore.toggleRepeat"
          @volume-change="playbackStore.setVolume"
        />
      </div>

      <!-- Authentication Views -->
      <div v-else class="auth-container">
        <router-view />
      </div>

      <!-- Modals & Overlays -->
      <CreateArtistModal
        v-if="showCreateArtistModal"
        @close="showCreateArtistModal = false"
        @created="handleArtistCreated"
      />

      <PreferencesModal v-if="showPreferences" @close="showPreferences = false" />

      <SearchModal
        v-if="showSearch"
        :artists="recentArtists"
        @close="showSearch = false"
      />

      <div v-if="showArtistPicker" class="menu-backdrop" @click="showArtistPicker = false"></div>

      <ContextMenu ref="contextMenu" />
      <ToastNotification ref="toastRef" />
    </div>
  </DragDropProvider>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, provide, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useDashboardStore } from "@/stores/dashboard";
import { usePlaybackStore } from "@/stores/playback";
import { useActivityStore } from "@/stores/activity";
import DragDropProvider from "@/components/DragDropProvider.vue";
import CreateArtistModal from "@/components/modals/CreateArtistModal.vue";
import PreferencesModal from "@/components/PreferencesModal.vue";
import SearchModal from "@/components/SearchModal.vue";
import NowPlayingBar from "@/components/NowPlayingBar.vue";
import ContextMenu from "@/components/ContextMenu.vue";
import ToastNotification from "@/components/ToastNotification.vue";
import AmfBrandLogo from "@/components/layout/AmfBrandLogo.vue";
import { getInitials, hasCustomAvatar } from "@/shared/utils/avatar";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const dashboardStore = useDashboardStore();
const playbackStore = usePlaybackStore();
const activityStore = useActivityStore();

// Local state
const showPreferences = ref(false);
const showCreateArtistModal = ref(false);
const mobileMenuOpen = ref(false);
const showArtistPicker = ref(false);
const activeArtist = ref(null);
const showSearch = ref(false);

const contextMenu = ref(null);
const toastRef = ref(null);

provide("activeArtist", activeArtist);

provide("showContextMenu", (event, items, type) => {
  contextMenu.value?.show(event, items, type);
});

provide("showToast", (options) => {
  toastRef.value?.show(options);
});

const artistContextOptions = computed(() =>
  authStore.filterAccessibleArtists(dashboardStore.artists || []),
);
const recentArtists = computed(() =>
  authStore.filterAccessibleArtists(dashboardStore.recentArtists || []),
);
const usesArtistShell = computed(() => authStore.isArtistScoped);
const showAllArtistsOption = computed(() => authStore.isPlatformScoped);
const showWorkspaceControls = computed(() => {
  if (authStore.isPlatformScoped) return authStore.isManager;
  return artistContextOptions.value.length > 1;
});
const userRoleLabel = computed(
  () => `${String(authStore.userRole || "viewer").toUpperCase()} ACCESS`,
);
const defaultArtistSlug = computed(() => authStore.getDefaultArtistSlug(dashboardStore.artists || []));
const artistShellWorkspace = computed(() => {
  if (!usesArtistShell.value) return null;
  return (
    activeArtist.value ||
    artistContextOptions.value.find((artist) => artist.slug === defaultArtistSlug.value) ||
    artistContextOptions.value[0] ||
    null
  );
});
const homeRoute = computed(() => {
  if (usesArtistShell.value && defaultArtistSlug.value) {
    return `/artists/${defaultArtistSlug.value}`;
  }
  return "/dashboard";
});
const artistScopedPathPrefixes = [
  "/artists/",
  "/projects",
  "/songs",
  "/playlists",
  "/releases",
  "/media",
  "/media-library",
  "/moodboards",
  "/files",
  "/financials",
  "/calendar",
  "/timeline",
  "/notes",
  "/team",
];
const isArtistScopedWorkspacePath = (path = route.path) => {
  return artistScopedPathPrefixes.some((prefix) => path.startsWith(prefix));
};
const projectsWorkspaceRoute = computed(() => {
  const routeSlug = typeof route.params.slug === "string" ? route.params.slug : "";
  const scopedArtistSlug = typeof route.query.artist === "string" ? route.query.artist : "";
  const targetSlug =
    routeSlug || scopedArtistSlug || activeArtist.value?.slug || defaultArtistSlug.value || "";

  if (!targetSlug) return "/projects";

  return {
    path: "/projects",
    query: { artist: targetSlug },
  };
});
const isProjectsWorkspaceActive = computed(() => {
  return route.path === "/projects" || route.path.includes("/projects/");
});

const isRouteActive = (path, exact = false) => {
  if (exact) return route.path === path;
  return route.path === path || route.path.startsWith(`${path}/`);
};

const syncActiveArtist = () => {
  const routeSlug = typeof route.params.slug === "string" ? route.params.slug : "";
  const scopedArtistSlug = typeof route.query.artist === "string" ? route.query.artist : "";
  const activeSlug = routeSlug || scopedArtistSlug;

  if (!activeSlug) {
    activeArtist.value = usesArtistShell.value
      ? artistContextOptions.value.find((artist) => artist.slug === defaultArtistSlug.value) || null
      : null;
    return;
  }

  activeArtist.value =
    artistContextOptions.value.find((artist) => artist.slug === activeSlug) || null;
};

const setArtistContext = (artist) => {
  activeArtist.value = artist;
  showArtistPicker.value = false;
  mobileMenuOpen.value = false;

  if (route.path === "/projects") {
    router.push({
      path: "/projects",
      query: artist?.slug ? { artist: artist.slug } : {},
    });
    return;
  }

  if (!artist?.slug) {
    router.push(homeRoute.value);
    return;
  }

  router.push(`/artists/${artist.slug}`);
};

const handleSignOut = async () => {
  await authStore.signOut();
};

// ─── Global file drop routing ─────────────────────────────────────────────────
const globalDropActive = ref(false);
let globalDragCounter = 0; // track nested dragenter/dragleave

const importTray = ref({
  show: false,
  files: [],
  audio: [],
  images: [],
  other: [],
});

const onMainDragOver = (e) => {
  if (!e.dataTransfer?.types.includes("Files")) return;
  globalDragCounter++;
  globalDropActive.value = true;
};

const onMainDragLeave = () => {
  globalDragCounter--;
  if (globalDragCounter <= 0) {
    globalDragCounter = 0;
    globalDropActive.value = false;
  }
};

const onMainDrop = (e) => {
  globalDropActive.value = false;
  globalDragCounter = 0;
  const files = Array.from(e.dataTransfer?.files || []);
  if (!files.length) return;

  const audio = files.filter((f) => f.type.startsWith("audio/"));
  const images = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
  const other = files.filter(
    (f) =>
      !f.type.startsWith("audio/") && !f.type.startsWith("image/") && !f.type.startsWith("video/"),
  );

  importTray.value = { show: true, files, audio, images, other };
};

const goToRoute = (path, closeTray = false) => {
  router.push(path);
  if (closeTray) importTray.value.show = false;
};

const handleArtistCreated = async (artistData, avatarFile) => {
  try {
    const artist = await dashboardStore.createArtist(artistData, avatarFile);
    showCreateArtistModal.value = false;
    await activityStore.logActivity({
      artist_id: artist.id,
      action_type: "artist_created",
      target_type: "artist",
      target_id: artist.id,
      description: `Created artist "${artist.name}"`,
    });
    router.push(`/artists/${artist.slug}`);
  } catch (error) {
    console.error("Failed to create artist:", error);
  }
};

const handleSidebarContextMenu = (event) => {
  if (usesArtistShell.value) return;
  const navItem = { link: route.path, name: route.name || "Navigation" };
  contextMenu.value?.show(event, navItem, "navigation");
};

const openWorkspaceContextMenu = (event, items) => {
  contextMenu.value?.show(event, items, "custom");
};

const getRouteWorkspaceMenu = () => {
  const artistSlug =
    typeof route.params.slug === "string"
      ? route.params.slug
      : activeArtist.value?.slug || recentArtists.value[0]?.slug || artistContextOptions.value[0]?.slug;
  const artistName = activeArtist.value?.name || "Artist";

  if (route.path === "/dashboard") {
    return [
      {
        label: "New Artist",
        handler: () => {
          if (authStore.canCreateArtist) showCreateArtistModal.value = true;
        },
      },
      { label: "Open Calendar", handler: () => router.push("/calendar") },
      { label: "Open Financials", handler: () => router.push("/financials") },
      { label: "Open Files", handler: () => router.push("/files") },
    ];
  }

  if (route.path === "/artists") {
    return [
      {
        label: "Add Artist",
        handler: () => {
          if (authStore.canCreateArtist) showCreateArtistModal.value = true;
        },
      },
      { label: "Open Team", handler: () => router.push("/team") },
      { label: "Open Releases", handler: () => router.push("/releases") },
    ];
  }

  if (route.path === "/projects") {
    return [
      { label: "Show All Projects", handler: () => router.push("/projects") },
      { label: "Open Timeline", handler: () => router.push("/timeline") },
      { label: "Open Files", handler: () => router.push("/files") },
      { label: "Open Team", handler: () => router.push("/team") },
    ];
  }

  if (route.path.startsWith("/artists/")) {
    return [
      {
        label: `Open ${artistName} Projects`,
        handler: () => {
          if (artistSlug) {
            router.push({ path: "/projects", query: { artist: artistSlug } });
          }
        },
      },
      { label: "New Release", handler: () => router.push("/releases") },
      { label: "Open Files", handler: () => router.push("/files") },
      { label: "Open Timeline", handler: () => router.push("/timeline") },
    ];
  }

  if (route.path === "/songs") {
    return [
      { label: "Open Playlists", handler: () => router.push("/playlists") },
      { label: "Open Files", handler: () => router.push("/files") },
      { label: "Open Artists", handler: () => router.push("/artists") },
    ];
  }

  if (route.path === "/playlists") {
    return [
      { label: "Create Playlist", handler: () => router.push("/playlists") },
      { label: "Open Songs", handler: () => router.push("/songs") },
      { label: "Open Artists", handler: () => router.push("/artists") },
    ];
  }

  if (route.path === "/releases") {
    return [
      { label: "New Release", handler: () => router.push("/releases") },
      { label: "Open Calendar", handler: () => router.push("/calendar") },
      { label: "Open Files", handler: () => router.push("/files") },
    ];
  }

  if (route.path === "/media" || route.path === "/media-library") {
    return [
      { label: "Open Files", handler: () => router.push("/files") },
      { label: "Open Moodboards", handler: () => router.push("/moodboards") },
      { label: "Open Releases", handler: () => router.push("/releases") },
    ];
  }

  if (route.path === "/moodboards") {
    return [
      { label: "Open Media Library", handler: () => router.push("/media-library") },
      { label: "Open Files", handler: () => router.push("/files") },
      { label: "Open Releases", handler: () => router.push("/releases") },
    ];
  }

  if (route.path === "/files") {
    return [
      { label: "Open Media Library", handler: () => router.push("/media-library") },
      { label: "Open Moodboards", handler: () => router.push("/moodboards") },
      { label: "Open Releases", handler: () => router.push("/releases") },
    ];
  }

  if (route.path === "/financials") {
    return [
      { label: "Open Calendar", handler: () => router.push("/calendar") },
      { label: "Open Timeline", handler: () => router.push("/timeline") },
      { label: "Open Notes", handler: () => router.push("/notes") },
    ];
  }

  if (route.path === "/calendar") {
    return [
      { label: "Open Timeline", handler: () => router.push("/timeline") },
      { label: "Open Notes", handler: () => router.push("/notes") },
      { label: "Open Releases", handler: () => router.push("/releases") },
    ];
  }

  if (route.path === "/timeline") {
    return [
      { label: "Add Event", handler: () => router.push("/timeline") },
      { label: "Open Calendar", handler: () => router.push("/calendar") },
      { label: "Open Notes", handler: () => router.push("/notes") },
    ];
  }

  if (route.path === "/notes") {
    return [
      { label: "Open Calendar", handler: () => router.push("/calendar") },
      { label: "Open Timeline", handler: () => router.push("/timeline") },
      { label: "Open Files", handler: () => router.push("/files") },
    ];
  }

  if (route.path === "/team") {
    return [
      {
        label: "Add Artist",
        handler: () => {
          if (authStore.canCreateArtist) showCreateArtistModal.value = true;
        },
      },
      { label: "Open Artists", handler: () => router.push("/artists") },
      { label: "Open Calendar", handler: () => router.push("/calendar") },
    ];
  }

  if (route.path === "/preferences") {
    return [
      { label: "Open Profile", handler: () => router.push("/profile") },
      { label: "Open Dashboard", handler: () => router.push("/dashboard") },
      { label: "Open Team", handler: () => router.push("/team") },
    ];
  }

  if (route.path === "/profile") {
    return [
      { label: "Open Preferences", handler: () => router.push("/preferences") },
      { label: "Open Team", handler: () => router.push("/team") },
      { label: "Open Artists", handler: () => router.push("/artists") },
    ];
  }

  return null;
};

const handleGlobalContextMenu = (event) => {
  const tag = (event.target?.tagName || "").toLowerCase();
  if (["input", "textarea", "select"].includes(tag) || event.target?.isContentEditable) return;
  if (contextMenu.value?.isVisible && contextMenu.value.isVisible()) return;
  event.preventDefault();
  const menuItems = getRouteWorkspaceMenu();
  if (Array.isArray(menuItems) && menuItems.length > 0) {
    openWorkspaceContextMenu(event, menuItems);
    return;
  }
  const pageItem = { link: route.path, name: document.title || "Page" };
  contextMenu.value?.show(event, pageItem, "navigation");
};

const ensureScopedRouteAccess = () => {
  if (!authStore.isAuthenticated || !usesArtistShell.value) return;

  const fallbackSlug = defaultArtistSlug.value;
  if (!fallbackSlug) return;

  const fallbackPath = `/artists/${fallbackSlug}`;
  const isAccountRoute = route.path === "/preferences" || route.path === "/profile";
  const isArtistListRoute = route.path === "/artists";
  const isArtistWorkspaceRoute = route.path.startsWith("/artists/");
  const isAllowedWorkspaceRoute = isArtistScopedWorkspacePath(route.path);

  if (isArtistListRoute && route.path !== fallbackPath) {
    router.replace(fallbackPath);
    return;
  }

  if (!isAccountRoute && !isAllowedWorkspaceRoute) {
    router.replace(fallbackPath);
    return;
  }

  if (!isAccountRoute && !isArtistWorkspaceRoute) {
    const routeArtist = typeof route.query.artist === "string" ? route.query.artist : "";
    if (routeArtist !== fallbackSlug) {
      router.replace({
        path: route.path,
        params: route.params,
        query: {
          ...route.query,
          artist: fallbackSlug,
        },
      });
    }
    return;
  }

  if (!isArtistWorkspaceRoute) return;

  const routeSlug = typeof route.params.slug === "string" ? route.params.slug : "";
  if (!routeSlug) return;

  const hasArtistAccess = artistContextOptions.value.some((artist) => artist.slug === routeSlug);
  if (!hasArtistAccess && route.path !== fallbackPath) {
    router.replace(fallbackPath);
  }
};

// ⌘K / Ctrl+K global search shortcut
const handleSearchShortcut = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    showSearch.value = !showSearch.value;
  }
};

// Apply persisted density on mount
const applyDensity = () => {
  const density = localStorage.getItem("mhDensity");
  if (density === "compact") {
    document.documentElement.classList.add("compact");
  } else {
    document.documentElement.classList.remove("compact");
  }
};

onMounted(async () => {
  applyDensity();
  await authStore.initialize();
  if (authStore.isAuthenticated) {
    await dashboardStore.loadDashboardData();
  }
  if (!authStore.isAuthenticated && !route.path.startsWith("/auth")) {
    router.push("/auth/login");
  }
  window.addEventListener("contextmenu", handleGlobalContextMenu);
  window.addEventListener("keydown", handleSearchShortcut);
  syncActiveArtist();
  ensureScopedRouteAccess();
});

onUnmounted(() => {
  window.removeEventListener("contextmenu", handleGlobalContextMenu);
  window.removeEventListener("keydown", handleSearchShortcut);
});

watch(
  [artistContextOptions, () => route.path, () => route.params.slug, () => route.query.artist],
  () => {
    syncActiveArtist();
    ensureScopedRouteAccess();
  },
  { immediate: true },
);
</script>

<style scoped>
/* ── Loading ──────────────────────────────────────────── */
.app-loading {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  background: var(--color-bg);
}

/* ── Nav rows ─────────────────────────────────────────── */
.nav-row-list {
  display: flex;
  flex-direction: column;
  padding: var(--space-4) 0 var(--space-4);
}

.nav-item-button {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: inherit;
}

/* ── Sidebar Brand (header) ───────────────────────────── */
.sidebar-header {
  padding: var(--space-5) var(--space-4) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  position: relative;
}

.sidebar-brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.app-brand-link {
  display: inline-flex;
  align-items: flex-start;
  width: 100%;
  color: inherit;
  text-decoration: none;
}

.app-brand-link:hover {
  color: inherit;
}

/* Workspace selector — full-width dropdown trigger */
.workspace-selector {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: 5px var(--space-2);
  background: var(--color-accent);
  border: 1px solid rgba(200, 75, 17, 0.14);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-sans);
  color: var(--color-text-inverse);
  text-align: left;
  transition:
    background var(--motion-fast),
    border-color var(--motion-fast);
  margin-top: var(--space-2);
}

.workspace-selector:hover,
.workspace-selector.open {
  background: var(--color-accent-hover);
  border-color: rgba(200, 75, 17, 0.22);
}

.workspace-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 34px;
  padding: 5px var(--space-2);
  margin-top: var(--space-2);
  border: 1px solid rgba(200, 75, 17, 0.14);
  border-radius: var(--radius-md);
  background: rgba(200, 75, 17, 0.08);
  color: var(--color-text);
}

.ws-avatar {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: var(--weight-bold);
  color: var(--color-text-inverse);
  flex-shrink: 0;
  overflow: hidden;
}

.ws-avatar svg {
  width: 11px;
  height: 11px;
}

.ws-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ws-name {
  flex: 1;
  font-size: 12px;
  font-weight: var(--weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
}

.ws-chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--color-text-inverse);
  transition: transform var(--motion-fast);
}

.ws-chevron.open {
  transform: rotate(180deg);
}

/* ── People section mini-header ───────────────────────── */
/* Actions sit on the LEFT, "People" label on the RIGHT — mirrors right-aligned nav */
.nav-people-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px var(--space-4) 3px;
  cursor: pointer;
  user-select: none;
}

.nav-people-label {
  font-size: 9px;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text);
}

.people-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* ── "Soon" badge on disabled items ──────────────────── */
/* No margin-left:auto — parent is justify-content:flex-end, badge sits left of text */
.nav-soon {
  font-size: 9px;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  background: var(--color-border);
  border-radius: var(--radius-sm);
  padding: 1px 4px;
  flex-shrink: 0;
}

/* ── Artist picker dropdown ───────────────────────────── */
.artist-picker-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: var(--space-4);
  right: var(--space-4);
  background: var(--color-dropdown-surface);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: calc(var(--z-dropdown) + 10);
  overflow: hidden;
  padding: var(--space-1) 0;
}

.picker-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-3);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  color: var(--color-text-inverse);
  text-align: left;
  transition: background var(--motion-fast);
}

.picker-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.picker-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-inverse);
}

.context-all-dot {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.context-all-dot svg {
  width: 11px;
  height: 11px;
  color: var(--color-text-inverse);
}

.picker-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-check {
  width: 14px;
  height: 14px;
  color: var(--color-text-inverse);
  flex-shrink: 0;
}

.picker-divider-line {
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  margin: var(--space-1) 0;
}

.artist-picker-dropdown :is(.artist-avatar, .avatar-initial) {
  background: rgba(255, 255, 255, 0.16);
  color: var(--color-text-inverse);
}

.artist-shell-sidebar {
  width: clamp(168px, 13vw, 188px);
  display: flex;
  flex-direction: column;
}

.artist-shell-sidebar .sidebar-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100%;
  justify-content: space-between;
}

.artist-shell-sidebar .sidebar-header {
  border-bottom: none;
}

.artist-shell-sidebar .sidebar-footer {
  margin-top: 0;
}

/* ── Sidebar Footer ───────────────────────────────────── */
.user-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.user-footer-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-footer-name {
  font-size: 12px;
  font-weight: var(--weight-medium);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-footer-role {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-footer-email {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.footer-icon-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition:
    color var(--motion-fast),
    background var(--motion-fast);
}

.footer-icon-btn:hover {
  color: var(--color-text);
  background: var(--color-border);
}

.footer-icon-btn svg {
  width: 14px;
  height: 14px;
}

/* ── Global file drop overlay ─────────────────────────── */
.main-content {
  position: relative;
} /* anchor for absolute children */

.global-drop-overlay {
  position: absolute;
  inset: var(--space-3);
  background: rgba(200, 75, 17, 0.05);
  border: 2px dashed var(--color-accent);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: calc(var(--z-modal) - 10);
  pointer-events: none;
}

.gdo-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-10);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.gdo-inner svg {
  width: 28px;
  height: 28px;
  color: var(--color-accent);
}

.gdo-title {
  font-size: 16px;
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

.gdo-hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* ── Import tray ─────────────────────────────────────── */
.import-tray {
  position: fixed;
  bottom: calc(var(--now-playing-height) + var(--space-4));
  right: var(--space-4);
  width: 320px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: calc(var(--z-modal) - 5);
  overflow: hidden;
}

.tray-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.tray-title {
  font-size: 13px;
  font-weight: var(--weight-semibold);
  color: var(--color-text);
}

.tray-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  font-size: 16px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  line-height: 1;
}

.tray-close:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.tray-groups {
  padding: var(--space-2) 0;
}

.tray-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  transition: background var(--motion-fast);
}

.tray-group:hover {
  background: var(--color-surface-raised);
}

.tray-group-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  flex-shrink: 0;
}

.tray-group-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.tray-group-label {
  font-size: 12px;
  font-weight: var(--weight-medium);
  color: var(--color-text);
}
.tray-group-dest {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.tray-go-btn {
  padding: 4px 10px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: var(--weight-medium);
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--motion-fast),
    border-color var(--motion-fast),
    color var(--motion-fast);
  flex-shrink: 0;
}

.tray-go-btn:hover {
  background: var(--color-accent-subtle);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* Tray slide transition */
.tray-slide-enter-active {
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}
.tray-slide-leave-active {
  transition:
    transform 150ms ease,
    opacity 150ms ease;
}
.tray-slide-enter-from,
.tray-slide-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

/* Fade for global drop overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Mobile topbar ────────────────────────────────────── */
.mobile-topbar {
  display: none;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  height: var(--header-height);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-sidebar);
  flex-shrink: 0;
}

.mobile-menu-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--motion-fast);
}

.mobile-menu-btn:hover {
  background: var(--color-surface);
}

.mobile-menu-btn svg {
  width: 18px;
  height: 18px;
}

.mobile-brand-link {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

/* ── Mobile overlay ───────────────────────────────────── */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: calc(var(--z-sticky) - 1);
  backdrop-filter: blur(2px);
}

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 768px) {
  .mobile-topbar {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: var(--z-sticky);
    transform: translateX(-100%);
    transition: transform var(--motion-default);
  }

  .sidebar.sidebar-mobile-open {
    transform: translateX(0);
    box-shadow: var(--shadow-overlay);
  }

  .main-content {
    flex-direction: column;
  }

  .content-scroll {
    padding: var(--space-4);
  }
}

@media (min-width: 769px) {
  .mobile-topbar {
    display: none !important;
  }

  .mobile-overlay {
    display: none !important;
  }
}
</style>
