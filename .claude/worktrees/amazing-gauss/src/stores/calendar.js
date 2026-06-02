import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const useCalendarStore = defineStore('calendar', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([]) // empty = all
  const viewMode = ref('month') // day | week | month | list
  const dateRange = ref({
    start: new Date(),
    end: new Date()
  })

  // Query keys
  const queryKeys = {
    events: (artistIds = [], start = null, end = null) => [
      'events', 
      'calendar', 
      { artistIds: artistIds.sort(), start, end }
    ]
  }

  // Load events for selected artists and date range
  const {
    data: events,
    isLoading: loading,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: computed(() => queryKeys.events(
      selectedArtistIds.value,
      dateRange.value.start?.toISOString(),
      dateRange.value.end?.toISOString()
    )),
    queryFn: async () => {
      const allEvents = []
      
      if (selectedArtistIds.value.length === 0) {
        // Load events for all artists user has access to
        const { data: userArtists } = await apiService.getArtistsByUser()
        if (userArtists?.length) {
          for (const artist of userArtists) {
            const { data: artistEvents } = await apiService.getArtistEvents(artist.id, {
              filters: {
                start_time: `gte.${dateRange.value.start?.toISOString()}`,
                end_time: `lte.${dateRange.value.end?.toISOString()}`
              }
            })
            if (artistEvents) allEvents.push(...artistEvents)
          }
        }
      } else {
        // Load events for selected artists
        for (const artistId of selectedArtistIds.value) {
          const { data: artistEvents } = await apiService.getArtistEvents(artistId, {
            filters: {
              start_time: `gte.${dateRange.value.start?.toISOString()}`,
              end_time: `lte.${dateRange.value.end?.toISOString()}`
            }
          })
          if (artistEvents) allEvents.push(...artistEvents)
        }
      }
      
      return allEvents
    },
    enabled: computed(() => dateRange.value.start && dateRange.value.end),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // Filtered events (for backward compatibility)
  const filteredEvents = computed(() => events.value || [])

  // Events on a specific date
  const eventsOnDate = (date) => {
    const ymd = date.toISOString().split('T')[0]
    return filteredEvents.value.filter(event => {
      const eventStart = new Date(event.start_time).toISOString().split('T')[0]
      const eventEnd = new Date(event.end_time).toISOString().split('T')[0]
      return ymd >= eventStart && ymd <= eventEnd
    })
  }

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const { data, error } = await apiService.create('events', {
        ...eventData,
        start_time: eventData.start_time || eventData.start,
        end_time: eventData.end_time || eventData.end
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }) => {
      const { data, error } = await apiService.update('events', id, {
        ...eventData,
        start_time: eventData.start_time || eventData.start,
        end_time: eventData.end_time || eventData.end
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      const { error } = await apiService.delete('events', eventId)
      if (error) throw error
      return eventId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  // Helper methods
  const setDateRange = (start, end) => {
    dateRange.value = { start, end }
  }

  const addArtistFilter = (artistId) => {
    if (!selectedArtistIds.value.includes(artistId)) {
      selectedArtistIds.value.push(artistId)
    }
  }

  const removeArtistFilter = (artistId) => {
    const index = selectedArtistIds.value.indexOf(artistId)
    if (index > -1) {
      selectedArtistIds.value.splice(index, 1)
    }
  }

  const clearArtistFilters = () => {
    selectedArtistIds.value = []
  }

  return {
    // State
    events: computed(() => events.value || []),
    loading,
    eventsError,
    selectedArtistIds,
    viewMode,
    dateRange,
    
    // Computed
    filteredEvents,
    
    // Methods
    eventsOnDate,
    refetchEvents,
    setDateRange,
    addArtistFilter,
    removeArtistFilter,
    clearArtistFilters,
    
    // Mutations
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    isCreatingEvent: createEventMutation.isPending,
    isUpdatingEvent: updateEventMutation.isPending,
    isDeletingEvent: deleteEventMutation.isPending,
    
    // Legacy compatibility
    loadEvents: refetchEvents
  }
})
