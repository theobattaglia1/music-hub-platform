<template>
  <AllSongsView :songs="songs" />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AllSongsView from './AllSongsView.vue'
import { useLibraryStore } from '@/stores/library'

const libraryStore = useLibraryStore()

onMounted(() => {
  if (libraryStore.songs.length === 0 && !libraryStore.loading) {
    libraryStore.loadSongs()
  }
})

const songs = computed(() => libraryStore.songs)
</script>
