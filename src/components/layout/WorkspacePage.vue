<template>
  <div class="workspace-page">
    <header
      v-if="usesArtistScopedHeader"
      class="workspace-header workspace-header-uniform workspace-header-artist"
    >
      <div class="workspace-header-glow workspace-header-glow-left"></div>
      <div class="workspace-header-glow workspace-header-glow-right"></div>

      <div class="workspace-header-main workspace-header-main-artist">
        <div class="workspace-artist-identity">
          <div class="workspace-artist-avatar">
            <img
              v-if="hasCustomAvatar(artistWorkspaceArtist?.avatar_url)"
              :src="artistWorkspaceArtist.avatar_url"
              :alt="artistWorkspaceArtist?.name || 'Artist'"
            />
            <span v-else class="workspace-artist-avatar-fallback">
              {{ getInitials(artistWorkspaceArtist?.name || "Artist") }}
            </span>
          </div>

          <div class="workspace-artist-copy">
            <h1 class="workspace-artist-name">{{ artistWorkspaceArtist?.name || "Artist" }}</h1>
            <p class="workspace-artist-subtitle">
              {{ artistWorkspaceArtist?.genre || "Artist workspace" }}
            </p>
          </div>
        </div>

        <div v-if="$slots.actions" class="workspace-actions">
          <slot name="actions" />
        </div>
      </div>
    </header>

    <header v-else class="workspace-header workspace-header-uniform">
      <div class="workspace-header-glow workspace-header-glow-left"></div>
      <div class="workspace-header-glow workspace-header-glow-right"></div>

      <div class="workspace-header-main">
        <div class="workspace-copy">
          <p v-if="eyebrow" class="workspace-eyebrow">{{ eyebrow }}</p>
          <div class="workspace-title-row">
            <h1 class="workspace-title">{{ title }}</h1>
            <span v-if="count !== null && count !== undefined" class="workspace-count">{{
              count
            }}</span>
          </div>
          <p v-if="subtitle" class="workspace-subtitle">{{ subtitle }}</p>
        </div>

        <div v-if="$slots.actions" class="workspace-actions">
          <slot name="actions" />
        </div>
      </div>

      <div v-if="$slots.stats" class="workspace-stats">
        <slot name="stats" />
      </div>

      <div v-if="$slots.toolbar" class="workspace-toolbar">
        <slot name="toolbar" />
      </div>
    </header>

    <section class="workspace-body">
      <ArtistWorkspaceNav
        v-if="showArtistWorkspaceNav"
        class="workspace-artist-nav"
        :artist-slug="artistWorkspaceSlug"
        :project-count="artistWorkspaceProjectCount"
        :activity-count="artistWorkspaceActivityCount"
        :team-count="artistWorkspaceTeamCount"
      />
      <section
        v-if="usesArtistScopedHeader && ($slots.stats || $slots.toolbar)"
        class="workspace-context-panel surface-panel"
      >
        <div v-if="$slots.stats" class="workspace-stats workspace-context-stats">
          <slot name="stats" />
        </div>

        <div v-if="$slots.toolbar" class="workspace-toolbar workspace-context-toolbar">
          <slot name="toolbar" />
        </div>
      </section>
      <slot />
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import ArtistWorkspaceNav from "@/components/layout/ArtistWorkspaceNav.vue";
import { useDashboardStore } from "@/stores/dashboard";
import { getInitials, hasCustomAvatar } from "@/shared/utils/avatar";

const route = useRoute();
const dashboardStore = useDashboardStore();

const artistWorkspacePaths = [
  "/artists",
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

const artistWorkspaceSlug = computed(() =>
  typeof route.query.artist === "string" && route.query.artist
    ? route.query.artist
    : typeof route.params.slug === "string" && route.params.slug
      ? route.params.slug
      : "",
);

const showArtistWorkspaceNav = computed(() => {
  if (!artistWorkspaceSlug.value) return false;
  if (route.name === "ArtistHub") return true;
  return artistWorkspacePaths.some(
    (path) => route.path === path || route.path.startsWith(`${path}/`),
  );
});

const props = defineProps({
  eyebrow: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  count: {
    type: [String, Number],
    default: null,
  },
  artistWorkspaceProjectCount: {
    type: [String, Number],
    default: null,
  },
  artistWorkspaceActivityCount: {
    type: [String, Number],
    default: null,
  },
  artistWorkspaceTeamCount: {
    type: [String, Number],
    default: null,
  },
  artistScopedHeader: {
    type: Boolean,
    default: false,
  },
});

const artistWorkspaceArtist = computed(() => {
  if (!artistWorkspaceSlug.value) return null;

  const artists = Array.isArray(dashboardStore.artists) ? dashboardStore.artists : [];
  const matchedArtist = artists.find(
    (artist) =>
      artist?.slug === artistWorkspaceSlug.value || String(artist?.id) === artistWorkspaceSlug.value,
  );

  if (matchedArtist) return matchedArtist;

  return {
    slug: artistWorkspaceSlug.value,
    name: artistWorkspaceSlug.value
      .split("-")
      .filter(Boolean)
      .map((chunk) => `${chunk.charAt(0).toUpperCase()}${chunk.slice(1)}`)
      .join(" "),
    genre: "Artist workspace",
    avatar_url: "",
  };
});

const usesArtistScopedHeader = computed(
  () => props.artistScopedHeader && showArtistWorkspaceNav.value && Boolean(artistWorkspaceArtist.value),
);
</script>

<style scoped>
.workspace-page {
  min-height: 100%;
  display: grid;
  gap: var(--section-gap);
  align-content: start;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 0 0 calc(var(--now-playing-height) + var(--space-10));
  color: var(--color-text);
  background: transparent;
}

.workspace-page > * {
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.workspace-header {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.84)),
    var(--color-surface);
  box-shadow: var(--shadow-1);
  padding: var(--workspace-header-padding);
  display: grid;
  gap: var(--space-3);
  min-height: clamp(228px, 22vw, var(--workspace-header-min-height));
  align-content: space-between;
}

.workspace-header-uniform {
  min-height: clamp(228px, 22vw, var(--workspace-header-min-height));
}

.workspace-header-artist {
  align-content: center;
}

.workspace-header-glow {
  position: absolute;
  inset: auto;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  filter: blur(44px);
  opacity: 0.55;
  pointer-events: none;
}

.workspace-header-glow-left {
  top: -100px;
  left: -40px;
  background: rgba(200, 75, 17, 0.14);
}

.workspace-header-glow-right {
  top: -96px;
  right: -46px;
  background: rgba(19, 18, 17, 0.08);
}

.workspace-header-main,
.workspace-stats,
.workspace-toolbar {
  position: relative;
  z-index: 1;
  min-width: 0;
  max-width: 100%;
}

.workspace-header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-5);
}

.workspace-copy {
  max-width: 760px;
  min-width: 0;
}

.workspace-eyebrow {
  margin: 0 0 var(--space-2);
  font-size: var(--text-utility);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.workspace-title-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.workspace-title {
  margin: 0;
  font-size: clamp(32px, 4.6vw, 48px);
  line-height: 0.88;
  letter-spacing: -0.072em;
  font-weight: 700;
  color: var(--color-text);
  text-wrap: balance;
}

.workspace-count {
  font-size: 24px;
  line-height: 1;
  color: var(--color-text-tertiary);
}

.workspace-subtitle {
  margin: var(--space-2) 0 0;
  font-size: var(--text-body);
  line-height: 1.45;
  color: var(--color-text-secondary);
  max-width: 680px;
}

.workspace-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-wrap: wrap;
  min-width: 0;
  max-width: 100%;
}

.workspace-header-main-artist {
  align-items: center;
}

.workspace-artist-identity {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  min-width: 0;
}

.workspace-artist-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: rgba(19, 18, 17, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workspace-artist-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workspace-artist-avatar-fallback {
  font-size: var(--placeholder-initial-avatar);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.06em;
  color: var(--color-text);
}

.workspace-artist-copy {
  min-width: 0;
}

.workspace-artist-name {
  margin: 0 0 var(--space-1);
  font-size: clamp(32px, 4.6vw, 48px);
  line-height: 0.88;
  letter-spacing: -0.072em;
  font-weight: 700;
  color: var(--color-text);
}

.workspace-artist-subtitle {
  margin: 0;
  font-size: var(--text-body);
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.workspace-stats {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.workspace-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding-top: 6px;
  border-top: 1px solid var(--color-border);
}

.workspace-body {
  display: grid;
  gap: var(--section-gap);
  min-height: 0;
  min-width: 0;
  max-width: 100%;
}

.workspace-context-panel {
  padding: 16px;
  display: grid;
  gap: var(--space-3);
}

.workspace-context-stats {
  gap: var(--space-2);
}

.workspace-context-toolbar {
  padding-top: 0;
  border-top: 1px solid var(--color-border);
}

.workspace-body > * {
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.workspace-artist-nav {
  min-width: 0;
  width: 100%;
}

@media (max-width: 900px) {
  .workspace-header {
    padding: var(--space-5);
  }

  .workspace-header-main,
  .workspace-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .workspace-header-main-artist {
    align-items: flex-start;
  }

  .workspace-actions {
    justify-content: flex-start;
  }

  .workspace-artist-identity {
    width: 100%;
  }

  .workspace-title {
    font-size: clamp(30px, 7vw, 42px);
  }
}

@media (min-width: 901px) {
  .workspace-header,
  .workspace-header-uniform {
    height: var(--workspace-header-min-height);
  }
}
</style>
