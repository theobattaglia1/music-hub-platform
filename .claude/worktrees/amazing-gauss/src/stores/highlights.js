import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHighlightsStore = defineStore('highlights', () => {
  const highlights = ref([])

  const addHighlight = (item) => {
    // item: { id, title, description, link, date_added }
    if (!highlights.value.find(h => h.id === item.id)) {
      highlights.value.unshift({ ...item, pinned_at: Date.now() })
    }
  }

  const removeHighlight = (id) => {
    const idx = highlights.value.findIndex(h => h.id === id)
    if (idx > -1) highlights.value.splice(idx, 1)
  }

  return { highlights, addHighlight, removeHighlight }
})
