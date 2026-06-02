import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const useNotesStore = defineStore('notes', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([])
  const statusFilter = ref('all') // 'all', 'todo', 'in_progress', 'done', 'archived'
  const priorityFilter = ref('all') // 'all', 'low', 'medium', 'high', 'urgent'
  const assigneeFilter = ref('all') // 'all', userId
  const searchQuery = ref('')

  // Query keys
  const queryKeys = {
    notes: (artistIds = [], status = 'all', priority = 'all', assignee = 'all', search = '') => [
      'notes', 
      { 
        artistIds: artistIds.sort(), 
        status, 
        priority, 
        assignee, 
        search 
      }
    ]
  }

  // Load notes for selected artists
  const {
    data: notes,
    isLoading: loading,
    error: notesError,
    refetch: refetchNotes
  } = useQuery({
    queryKey: computed(() => queryKeys.notes(
      selectedArtistIds.value,
      statusFilter.value,
      priorityFilter.value,
      assigneeFilter.value,
      searchQuery.value
    )),
    queryFn: async () => {
      const allNotes = []
      
      if (selectedArtistIds.value.length === 0) {
        // Load notes for all artists user has access to
        const { data: userArtists } = await apiService.getArtistsByUser()
        if (userArtists?.length) {
          for (const artist of userArtists) {
            const { data: artistNotes } = await apiService.getArtistNotes(artist.id, {
              filters: buildFilters(),
              search: searchQuery.value,
              searchFields: ['title', 'content'],
              sortBy: 'position'
            })
            if (artistNotes) allNotes.push(...artistNotes)
          }
        }
      } else {
        // Load notes for selected artists
        for (const artistId of selectedArtistIds.value) {
          const { data: artistNotes } = await apiService.getArtistNotes(artistId, {
            filters: buildFilters(),
            search: searchQuery.value,
            searchFields: ['title', 'content'],
            sortBy: 'position'
          })
          if (artistNotes) allNotes.push(...artistNotes)
        }
      }
      
      // Sort by status and position
      return allNotes.sort((a, b) => {
        const statusOrder = { todo: 0, in_progress: 1, done: 2, archived: 3 }
        const statusDiff = statusOrder[a.status] - statusOrder[b.status]
        if (statusDiff !== 0) return statusDiff
        return a.position - b.position
      })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  // Helper function to build filters
  const buildFilters = () => {
    const filters = {}
    if (statusFilter.value !== 'all') filters.status = statusFilter.value
    if (priorityFilter.value !== 'all') filters.priority = priorityFilter.value
    if (assigneeFilter.value !== 'all') filters.assignee_id = assigneeFilter.value
    return filters
  }

  // Computed properties for Kanban board
  const notesByStatus = computed(() => {
    const grouped = {
      todo: [],
      in_progress: [],
      done: [],
      archived: []
    }
    
    ;(notes.value || []).forEach(note => {
      if (grouped[note.status]) {
        grouped[note.status].push(note)
      }
    })
    
    return grouped
  })

  const notesByPriority = computed(() => {
    const grouped = {
      urgent: [],
      high: [],
      medium: [],
      low: []
    }
    
    ;(notes.value || []).forEach(note => {
      if (grouped[note.priority]) {
        grouped[note.priority].push(note)
      }
    })
    
    return grouped
  })

  const overdueTasks = computed(() => {
    const now = new Date()
    return (notes.value || []).filter(note => 
      note.due_date && 
      new Date(note.due_date) < now && 
      note.status !== 'done' && 
      note.status !== 'archived'
    )
  })

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      const { data, error } = await apiService.create('notes', noteData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...noteData }) => {
      const { data, error } = await apiService.update('notes', id, noteData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId) => {
      const { error } = await apiService.delete('notes', noteId)
      if (error) throw error
      return noteId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })

  // Update note position mutation (for drag & drop)
  const updateNotePositionMutation = useMutation({
    mutationFn: async ({ noteId, newPosition, newStatus }) => {
      const updateData = { position: newPosition }
      if (newStatus) updateData.status = newStatus
      
      const { data, error } = await apiService.update('notes', noteId, updateData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })

  // Bulk update notes mutation
  const bulkUpdateNotesMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = updates.map(({ id, ...data }) => 
        apiService.update('notes', id, data)
      )
      const results = await Promise.all(promises)
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })

  // Helper methods
  const setArtistFilter = (artistIds) => {
    selectedArtistIds.value = Array.isArray(artistIds) ? artistIds : [artistIds]
  }

  const clearArtistFilter = () => {
    selectedArtistIds.value = []
  }

  const setStatusFilter = (status) => {
    statusFilter.value = status
  }

  const setPriorityFilter = (priority) => {
    priorityFilter.value = priority
  }

  const setAssigneeFilter = (assigneeId) => {
    assigneeFilter.value = assigneeId
  }

  const setSearch = (query) => {
    searchQuery.value = query
  }

  const clearAllFilters = () => {
    statusFilter.value = 'all'
    priorityFilter.value = 'all'
    assigneeFilter.value = 'all'
    searchQuery.value = ''
  }

  // Get note by ID
  const getNoteById = async (id) => {
    // First check cache
    const cachedNote = notes.value?.find(n => n.id === id)
    if (cachedNote) return cachedNote
    
    // Otherwise fetch from API
    const { data, error } = await apiService.getById('notes', id)
    if (error) throw error
    return data
  }

  // Move note between statuses
  const moveNote = async (noteId, newStatus, newPosition = 0) => {
    return updateNotePositionMutation.mutateAsync({
      noteId,
      newStatus,
      newPosition
    })
  }

  // Assign note to user
  const assignNote = async (noteId, userId) => {
    return updateNoteMutation.mutateAsync({
      id: noteId,
      assignee_id: userId
    })
  }

  // Set note priority
  const setPriority = async (noteId, priority) => {
    return updateNoteMutation.mutateAsync({
      id: noteId,
      priority
    })
  }

  // Set note due date
  const setDueDate = async (noteId, dueDate) => {
    return updateNoteMutation.mutateAsync({
      id: noteId,
      due_date: dueDate
    })
  }

  // Add label to note
  const addLabel = async (noteId, label) => {
    const note = await getNoteById(noteId)
    const currentLabels = note.labels || []
    if (!currentLabels.includes(label)) {
      const updatedLabels = [...currentLabels, label]
      return updateNoteMutation.mutateAsync({
        id: noteId,
        labels: updatedLabels
      })
    }
    return note
  }

  // Remove label from note
  const removeLabel = async (noteId, label) => {
    const note = await getNoteById(noteId)
    const currentLabels = note.labels || []
    const updatedLabels = currentLabels.filter(l => l !== label)
    return updateNoteMutation.mutateAsync({
      id: noteId,
      labels: updatedLabels
    })
  }

  return {
    // State
    notes: computed(() => notes.value || []),
    loading,
    notesError,
    selectedArtistIds,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    searchQuery,
    
    // Computed
    notesByStatus,
    notesByPriority,
    overdueTasks,
    
    // Methods
    refetchNotes,
    setArtistFilter,
    clearArtistFilter,
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    setSearch,
    clearAllFilters,
    getNoteById,
    moveNote,
    assignNote,
    setPriority,
    setDueDate,
    addLabel,
    removeLabel,
    
    // Mutations
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    updateNotePosition: updateNotePositionMutation.mutateAsync,
    bulkUpdateNotes: bulkUpdateNotesMutation.mutateAsync,
    isCreatingNote: createNoteMutation.isPending,
    isUpdatingNote: updateNoteMutation.isPending,
    isDeletingNote: deleteNoteMutation.isPending,
    isUpdatingPosition: updateNotePositionMutation.isPending,
    isBulkUpdating: bulkUpdateNotesMutation.isPending
  }
})