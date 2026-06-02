<template>
  <AllSongsView :songs="songs" />
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import AllSongsView from "./AllSongsView.vue";
import { useLibraryStore } from "@/stores/library";
import { useDashboardStore } from "@/stores/dashboard";

const libraryStore = useLibraryStore();
const dashboardStore = useDashboardStore();
const route = useRoute();

onMounted(() => {
  if (libraryStore.songs.length === 0 && !libraryStore.loading) {
    libraryStore.loadSongs();
  }
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

const songs = computed(() => {
  if (!scopedArtist.value) return libraryStore.songs;
  return libraryStore.songs.filter(
    (song) =>
      String(song.artist_id || "") === String(scopedArtist.value.id) ||
      song.artist === scopedArtist.value.name,
  );
});
</script>
