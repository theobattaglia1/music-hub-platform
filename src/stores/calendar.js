import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { apiService } from "@/shared/services/api";

export const useCalendarStore = defineStore("calendar", () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
  const selectedArtistIds = ref([]); // empty = all
  const viewMode = ref("month"); // day | week | month | list
  const dateRange = ref({
    start: rangeStart,
    end: rangeEnd,
  });

  // Query keys
  const queryKeys = {
    events: (artistIds = [], start = null, end = null) => [
      "events",
      "calendar",
      { artistIds: [...artistIds].sort(), start, end },
    ],
  };

  // Load events for selected artists and date range
  const {
    data: events,
    isLoading: loading,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: computed(() =>
      queryKeys.events(
        selectedArtistIds.value,
        dateRange.value.start?.toISOString(),
        dateRange.value.end?.toISOString(),
      ),
    ),
    queryFn: async () => {
      const allEvents = [];

      try {
        if (selectedArtistIds.value.length === 0) {
          // Load events for all artists user has access to
          const { data: userArtists } = await apiService.getArtistsByUser();
          if (Array.isArray(userArtists) && userArtists.length) {
            for (const artist of userArtists) {
              const { data: artistEvents } = await apiService.getArtistEvents(artist.id, {
                filters: {
                  start_time: `gte.${dateRange.value.start?.toISOString()}`,
                  end_time: `lte.${dateRange.value.end?.toISOString()}`,
                },
              });
              if (Array.isArray(artistEvents) && artistEvents.length) {
                allEvents.push(...artistEvents);
              }
            }
          } else {
            // Fallback for local/mock sessions without authenticated artist membership
            const { data: publicEvents } = await apiService.getAll("events", {
              sortBy: "start_time",
              sortOrder: "asc",
              limit: 200,
            });
            if (Array.isArray(publicEvents) && publicEvents.length) {
              allEvents.push(...publicEvents);
            }
          }
        } else {
          // Load events for selected artists
          for (const artistId of selectedArtistIds.value) {
            const { data: artistEvents } = await apiService.getArtistEvents(artistId, {
              filters: {
                start_time: `gte.${dateRange.value.start?.toISOString()}`,
                end_time: `lte.${dateRange.value.end?.toISOString()}`,
              },
            });
            if (Array.isArray(artistEvents) && artistEvents.length) {
              allEvents.push(...artistEvents);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load calendar events:", error);
      }

      return allEvents;
    },
    enabled: () => Boolean(dateRange.value.start && dateRange.value.end),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Filtered events (for backward compatibility)
  const filteredEvents = computed(() => (Array.isArray(events.value) ? events.value : []));

  // Events on a specific date
  const eventsOnDate = (date) => {
    const normalizeDay = (value) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toISOString().split("T")[0];
    };

    const ymd = date.toISOString().split("T")[0];
    return filteredEvents.value.filter((event) => {
      const eventStart = normalizeDay(event.start_time || event.start);
      const eventEnd = normalizeDay(event.end_time || event.end || event.start_time || event.start);
      if (!eventStart || !eventEnd) return false;
      return ymd >= eventStart && ymd <= eventEnd;
    });
  };

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData) => {
      const { data, error } = await apiService.create("events", {
        ...eventData,
        start_time: eventData.start_time || eventData.start,
        end_time: eventData.end_time || eventData.end,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }) => {
      const { data, error } = await apiService.update("events", id, {
        ...eventData,
        start_time: eventData.start_time || eventData.start,
        end_time: eventData.end_time || eventData.end,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      const { error } = await apiService.delete("events", eventId);
      if (error) throw error;
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Helper methods
  const setDateRange = (start, end) => {
    dateRange.value = { start, end };
  };

  const addArtistFilter = (artistId) => {
    if (!selectedArtistIds.value.includes(artistId)) {
      selectedArtistIds.value.push(artistId);
    }
  };

  const removeArtistFilter = (artistId) => {
    const index = selectedArtistIds.value.indexOf(artistId);
    if (index > -1) {
      selectedArtistIds.value.splice(index, 1);
    }
  };

  const clearArtistFilters = () => {
    selectedArtistIds.value = [];
  };

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
    loadEvents: async () => {
      try {
        return await refetchEvents();
      } catch (error) {
        console.error("Calendar refetch failed:", error);
        return { data: [] };
      }
    },
  };
});
