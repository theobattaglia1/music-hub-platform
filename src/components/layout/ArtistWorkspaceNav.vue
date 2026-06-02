<template>
  <nav v-if="currentArtistSlug" class="artist-workspace-nav" aria-label="Artist workspace">
    <div class="artist-workspace-nav-track segmented-control">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-tab"
        :class="{ active: isItemActive(item), 'has-count': item.count !== null && item.count !== undefined }"
        @click="navigate(item)"
      >
        <span class="nav-tab-label">{{ item.label }}</span>
        <span v-if="item.count !== null && item.count !== undefined" class="tab-count nav-tab-count">
          {{ item.count }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const props = defineProps({
  artistSlug: {
    type: String,
    default: "",
  },
  projectCount: {
    type: [Number, String],
    default: null,
  },
  activityCount: {
    type: [Number, String],
    default: null,
  },
  teamCount: {
    type: [Number, String],
    default: null,
  },
});

const router = useRouter();
const route = useRoute();

const currentArtistSlug = computed(() => {
  if (props.artistSlug) return props.artistSlug;
  if (typeof route.params.slug === "string" && route.params.slug) return route.params.slug;
  if (typeof route.query.artist === "string" && route.query.artist) return route.query.artist;
  return "";
});

const buildArtistHubTarget = (tab) => {
  const query = {};
  if (tab && tab !== "overview") {
    query.tab = tab;
  }

  return {
    path: `/artists/${currentArtistSlug.value}`,
    query,
  };
};

const buildArtistScopedTarget = (path) => ({
  path,
  query: currentArtistSlug.value ? { artist: currentArtistSlug.value } : {},
});

const navItems = computed(() => {
  return [
    { id: "overview", label: "Overview", type: "artist-tab", to: buildArtistHubTarget("overview") },
    {
      id: "projects",
      label: "Projects",
      type: "artist-tab",
      count: props.projectCount,
      to: buildArtistHubTarget("projects"),
    },
    {
      id: "activity",
      label: "Activity",
      type: "artist-tab",
      count: props.activityCount,
      to: buildArtistHubTarget("activity"),
    },
    {
      id: "analytics",
      label: "Analytics",
      type: "artist-tab",
      to: buildArtistHubTarget("analytics"),
    },
    {
      id: "team",
      label: "Team",
      type: "artist-tab",
      count: props.teamCount,
      to: buildArtistHubTarget("team"),
    },
    { id: "songs", label: "Songs", type: "route", to: buildArtistScopedTarget("/songs") },
    {
      id: "playlists",
      label: "Playlists",
      type: "route",
      to: buildArtistScopedTarget("/playlists"),
    },
    {
      id: "releases",
      label: "Releases",
      type: "route",
      to: buildArtistScopedTarget("/releases"),
    },
    {
      id: "media-library",
      label: "Media Library",
      type: "route",
      to: buildArtistScopedTarget("/media-library"),
    },
    {
      id: "moodboards",
      label: "Moodboards",
      type: "route",
      to: buildArtistScopedTarget("/moodboards"),
    },
    { id: "files", label: "Files", type: "route", to: buildArtistScopedTarget("/files") },
    {
      id: "financials",
      label: "Financials",
      type: "route",
      to: buildArtistScopedTarget("/financials"),
    },
    {
      id: "calendar",
      label: "Calendar",
      type: "route",
      to: buildArtistScopedTarget("/calendar"),
    },
    {
      id: "timeline",
      label: "Timeline",
      type: "route",
      to: buildArtistScopedTarget("/timeline"),
    },
    { id: "notes", label: "Notes", type: "route", to: buildArtistScopedTarget("/notes") },
  ];
});

const isArtistHubTabActive = (id) => {
  if (route.name !== "ArtistHub") return false;
  const currentTab = typeof route.query.tab === "string" ? route.query.tab : "overview";
  return currentTab === id || (!route.query.tab && id === "overview");
};

const isItemActive = (item) => {
  switch (item.id) {
    case "overview":
    case "projects":
    case "activity":
    case "analytics":
      return (
        isArtistHubTabActive(item.id) ||
        (item.id === "projects" &&
          (route.path === "/projects" || route.path.includes("/projects/")))
      );
    case "team":
      return isArtistHubTabActive("team") || route.path === "/team";
    case "songs":
      return route.path === "/songs";
    case "playlists":
      return route.path === "/playlists" || route.path.startsWith("/playlists/");
    case "releases":
      return route.path === "/releases";
    case "media-library":
      return route.path === "/media" || route.path === "/media-library";
    case "moodboards":
      return route.path === "/moodboards" || route.path.startsWith("/moodboards/");
    case "files":
      return route.path === "/files";
    case "financials":
      return route.path === "/financials";
    case "calendar":
      return route.path === "/calendar";
    case "timeline":
      return route.path === "/timeline";
    case "notes":
      return route.path === "/notes";
    default:
      return false;
  }
};

const navigate = (item) => {
  if (!item?.to) return;
  router.push(item.to);
};
</script>

<style scoped>
.artist-workspace-nav {
  width: 100%;
  min-width: 0;
}

.artist-workspace-nav-track {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.artist-workspace-nav-track::-webkit-scrollbar {
  display: none;
}

.artist-workspace-nav-track .nav-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.artist-workspace-nav-track .nav-tab-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  line-height: 1;
}

.artist-workspace-nav-track .nav-tab.has-count {
  padding-left: 34px;
  padding-right: 34px;
}

.artist-workspace-nav-track .nav-tab-count {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
}
</style>
