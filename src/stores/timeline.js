import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const useTimelineStore = defineStore('timeline', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([])
  const eventTypeFilter = ref('all') // 'all', 'milestone', 'release', 'achievement', 'collaboration'
  const yearFilter = ref('all') // 'all', or specific year
  const publicOnlyFilter = ref(false) // Show only public events
  const searchQuery = ref('')
  const viewMode = ref('timeline') // 'timeline', 'grid', 'list'
  const dateRange = ref({
    start: null,
    end: null
  })

  // Query keys
  const queryKeys = {
    timelineEvents: (artistIds = [], type = 'all', year = 'all', publicOnly = false, search = '', dateRange = {}) => [
      'timeline_events', 
      { 
        artistIds: artistIds.sort(), 
        type, 
        year, 
        publicOnly, 
        search,
        dateRange
      }
    ]
  }

  // Load timeline events for selected artists
  const {
    data: timelineEvents,
    isLoading: loading,
    error: timelineError,
    refetch: refetchTimeline
  } = useQuery({
    queryKey: computed(() => queryKeys.timelineEvents(
      selectedArtistIds.value,
      eventTypeFilter.value,
      yearFilter.value,
      publicOnlyFilter.value,
      searchQuery.value,
      dateRange.value
    )),
    queryFn: async () => {
      const allEvents = []
      
      if (selectedArtistIds.value.length === 0) {
        // Load events for all artists user has access to
        const { data: userArtists } = await apiService.getArtistsByUser()
        if (userArtists?.length) {
          for (const artist of userArtists) {
            const { data: artistEvents } = await apiService.getArtistTimelineEvents(artist.id, {
              filters: buildFilters(),
              search: searchQuery.value,
              searchFields: ['title', 'description'],
              sortBy: 'event_date',
              sortOrder: 'desc'
            })
            if (artistEvents) allEvents.push(...artistEvents)
          }
        }
      } else {
        // Load events for selected artists
        for (const artistId of selectedArtistIds.value) {
          const { data: artistEvents } = await apiService.getArtistTimelineEvents(artistId, {
            filters: buildFilters(),
            search: searchQuery.value,
            searchFields: ['title', 'description'],
            sortBy: 'event_date',
            sortOrder: 'desc'
          })
          if (artistEvents) allEvents.push(...artistEvents)
        }
      }
      
      // Sort by date descending (most recent first)
      return allEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // Helper function to build filters
  const buildFilters = () => {
    const filters = {}
    
    if (eventTypeFilter.value !== 'all') {
      filters.event_type = eventTypeFilter.value
    }
    
    if (publicOnlyFilter.value) {
      filters.is_public = true
    }
    
    if (yearFilter.value !== 'all') {
      const year = parseInt(yearFilter.value)
      filters.event_date = `gte.${year}-01-01`
      filters.event_date = `lt.${year + 1}-01-01`
    }
    
    if (dateRange.value.start) {
      filters.event_date = `gte.${dateRange.value.start}`
    }
    
    if (dateRange.value.end) {
      filters.event_date = `lte.${dateRange.value.end}`
    }
    
    return filters
  }

  // Computed properties for timeline visualization
  const eventsByYear = computed(() => {
    const grouped = {}
    
    ;(timelineEvents.value || []).forEach(event => {
      const year = new Date(event.event_date).getFullYear()
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(event)
    })
    
    // Sort years descending
    const sortedYears = Object.keys(grouped).sort((a, b) => b - a)
    const result = {}
    sortedYears.forEach(year => {
      result[year] = grouped[year].sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
    })
    
    return result
  })

  const eventsByType = computed(() => {
    const grouped = {
      milestone: [],
      release: [],
      achievement: [],
      collaboration: []
    }
    
    ;(timelineEvents.value || []).forEach(event => {
      if (grouped[event.event_type]) {
        grouped[event.event_type].push(event)
      }
    })
    
    return grouped
  })

  const upcomingEvents = computed(() => {
    const now = new Date()
    return (timelineEvents.value || [])
      .filter(event => new Date(event.event_date) > now)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
  })

  const recentEvents = computed(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return (timelineEvents.value || [])
      .filter(event => new Date(event.event_date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
      .slice(0, 10)
  })

  const availableYears = computed(() => {
    const years = new Set()
    ;(timelineEvents.value || []).forEach(event => {
      years.add(new Date(event.event_date).getFullYear())
    })
    return Array.from(years).sort((a, b) => b - a)
  })

  // Create timeline event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const { data, error } = await apiService.create('timeline_events', eventData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline_events'] })
    }
  })

  // Update timeline event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }) => {
      const { data, error } = await apiService.update('timeline_events', id, eventData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline_events'] })
    }
  })

  // Delete timeline event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      const { error } = await apiService.delete('timeline_events', eventId)
      if (error) throw error
      return eventId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline_events'] })
    }
  })

  // Upload media for timeline event mutation
  const attachMediaMutation = useMutation({
    mutationFn: async ({ eventId, file, metadata = {} }) => {
      // First upload the media
      const artistId = selectedArtistIds.value[0] // Assume first selected artist
      const { data: media } = await apiService.uploadArtistMedia(artistId, file, metadata)
      
      // Then associate it with the timeline event
      const { data: event, error } = await apiService.update('timeline_events', eventId, {
        associated_media_id: media.id
      })
      
      if (error) throw error
      return { event, media }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline_events'] })
    }
  })

  // Helper methods
  const setArtistFilter = (artistIds) => {
    selectedArtistIds.value = Array.isArray(artistIds) ? artistIds : [artistIds]
  }

  const clearArtistFilter = () => {
    selectedArtistIds.value = []
  }

  const setEventTypeFilter = (type) => {
    eventTypeFilter.value = type
  }

  const setYearFilter = (year) => {
    yearFilter.value = year
  }

  const setPublicOnlyFilter = (publicOnly) => {
    publicOnlyFilter.value = publicOnly
  }

  const setSearch = (query) => {
    searchQuery.value = query
  }

  const setViewMode = (mode) => {
    viewMode.value = mode
  }

  const setDateRange = (start, end) => {
    dateRange.value = { start, end }
  }

  const clearAllFilters = () => {
    eventTypeFilter.value = 'all'
    yearFilter.value = 'all'
    publicOnlyFilter.value = false
    searchQuery.value = ''
    dateRange.value = { start: null, end: null }
  }

  // Get event by ID
  const getEventById = async (id) => {
    // First check cache
    const cachedEvent = timelineEvents.value?.find(e => e.id === id)
    if (cachedEvent) return cachedEvent
    
    // Otherwise fetch from API
    const { data, error } = await apiService.getById('timeline_events', id)
    if (error) throw error
    return data
  }

  // Convenience methods for creating different types of events
  const addMilestone = async (artistId, title, date, description = '') => {
    return createEventMutation.mutateAsync({
      artist_id: artistId,
      title,
      description,
      event_type: 'milestone',
      event_date: date,
      is_public: false
    })
  }

  const addRelease = async (artistId, title, date, description = '', isPublic = true) => {
    return createEventMutation.mutateAsync({
      artist_id: artistId,
      title,
      description,
      event_type: 'release',
      event_date: date,
      is_public: isPublic
    })
  }

  const addAchievement = async (artistId, title, date, description = '', isPublic = true) => {
    return createEventMutation.mutateAsync({
      artist_id: artistId,
      title,
      description,
      event_type: 'achievement',
      event_date: date,
      is_public: isPublic
    })
  }

  const addCollaboration = async (artistId, title, date, description = '', collaboratorInfo = {}) => {
    return createEventMutation.mutateAsync({
      artist_id: artistId,
      title,
      description,
      event_type: 'collaboration',
      event_date: date,
      metadata: collaboratorInfo,
      is_public: true
    })
  }

  // Toggle event visibility
  const toggleEventVisibility = async (eventId) => {
    const event = await getEventById(eventId)
    return updateEventMutation.mutateAsync({
      id: eventId,
      is_public: !event.is_public
    })
  }

  // Add external link to event
  const addExternalLink = async (eventId, title, url) => {
    const event = await getEventById(eventId)
    const currentLinks = event.external_links || []
    const updatedLinks = [...currentLinks, { title, url }]
    
    return updateEventMutation.mutateAsync({
      id: eventId,
      external_links: updatedLinks
    })
  }

  // Remove external link from event
  const removeExternalLink = async (eventId, linkIndex) => {
    const event = await getEventById(eventId)
    const currentLinks = event.external_links || []
    const updatedLinks = currentLinks.filter((_, index) => index !== linkIndex)
    
    return updateEventMutation.mutateAsync({
      id: eventId,
      external_links: updatedLinks
    })
  }

  return {
    // State
    timelineEvents: computed(() => timelineEvents.value || []),
    loading,
    timelineError,
    selectedArtistIds,
    eventTypeFilter,
    yearFilter,
    publicOnlyFilter,
    searchQuery,
    viewMode,
    dateRange,
    
    // Computed
    eventsByYear,
    eventsByType,
    upcomingEvents,
    recentEvents,
    availableYears,
    
    // Methods
    refetchTimeline,
    setArtistFilter,
    clearArtistFilter,
    setEventTypeFilter,
    setYearFilter,
    setPublicOnlyFilter,
    setSearch,
    setViewMode,
    setDateRange,
    clearAllFilters,
    getEventById,
    toggleEventVisibility,
    addExternalLink,
    removeExternalLink,
    
    // Convenience creators
    addMilestone,
    addRelease,
    addAchievement,
    addCollaboration,
    
    // Mutations
    createEvent: createEventMutation.mutateAsync,
    updateEvent: updateEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    attachMedia: attachMediaMutation.mutateAsync,
    isCreatingEvent: createEventMutation.isPending,
    isUpdatingEvent: updateEventMutation.isPending,
    isDeletingEvent: deleteEventMutation.isPending,
    isAttachingMedia: attachMediaMutation.isPending
  }
})