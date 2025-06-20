import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCalendarStore = defineStore('calendar', () => {
  const loading = ref(false)
  const events = ref([]) // [{ id, artist_id, title, start, end, location, all_day }]
  const selectedArtistIds = ref([]) // empty = all
  const viewMode = ref('month') // day | week | month | list

  const loadEvents = async () => {
    try {
      loading.value = true
      // TODO: fetch from Supabase. For now mock data.
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      events.value = [
        {
          id: 'ev1',
          artist_id: '1',
          title: 'Studio session – Taylor',
          start: today.toISOString(),
          end: new Date(today.getTime() + 2 * 3600 * 1000).toISOString(),
          location: 'AMF Studio A',
          all_day: false
        },
        {
          id: 'ev2',
          artist_id: '2',
          title: 'Video shoot – The Weeknd',
          start: tomorrow.toISOString(),
          end: new Date(tomorrow.getTime() + 4 * 3600 * 1000).toISOString(),
          location: 'Downtown LA',
          all_day: false
        }
      ]
    } finally {
      loading.value = false
    }
  }

  const filteredEvents = computed(() => {
    if (selectedArtistIds.value.length === 0) return events.value
    return events.value.filter(e => selectedArtistIds.value.includes(e.artist_id))
  })

  const eventsOnDate = (date) => {
    const ymd = date.toISOString().split('T')[0]
    return filteredEvents.value.filter(e => e.start.startsWith(ymd))
  }

  return {
    loading,
    events,
    selectedArtistIds,
    viewMode,
    loadEvents,
    filteredEvents,
    eventsOnDate
  }
})
