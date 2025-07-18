import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const useMoodboardsStore = defineStore('moodboards', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([])
  const selectedMoodboardId = ref(null)
  const searchQuery = ref('')
  const itemTypeFilter = ref('all') // 'all', 'image', 'text', 'color', 'link'

  // Query keys
  const queryKeys = {
    moodboardItems: (artistIds = [], type = 'all', search = '') => [
      'moodboard_items', 
      { artistIds: artistIds.sort(), type, search }
    ]
  }

  // Load moodboard items for selected artists
  const {
    data: moodboardItems,
    isLoading: loading,
    error: moodboardError,
    refetch: refetchMoodboard
  } = useQuery({
    queryKey: computed(() => queryKeys.moodboardItems(
      selectedArtistIds.value,
      itemTypeFilter.value,
      searchQuery.value
    )),
    queryFn: async () => {
      const allItems = []
      
      if (selectedArtistIds.value.length === 0) {
        // Load items for all artists user has access to
        const { data: userArtists } = await apiService.getArtistsByUser()
        if (userArtists?.length) {
          for (const artist of userArtists) {
            const { data: artistItems } = await apiService.getArtistMoodboardItems(artist.id, {
              filters: itemTypeFilter.value !== 'all' ? { item_type: itemTypeFilter.value } : {},
              search: searchQuery.value,
              searchFields: ['title', 'description'],
              sortBy: 'z_index'
            })
            if (artistItems) allItems.push(...artistItems)
          }
        }
      } else {
        // Load items for selected artists
        for (const artistId of selectedArtistIds.value) {
          const { data: artistItems } = await apiService.getArtistMoodboardItems(artistId, {
            filters: itemTypeFilter.value !== 'all' ? { item_type: itemTypeFilter.value } : {},
            search: searchQuery.value,
            searchFields: ['title', 'description'],
            sortBy: 'z_index'
          })
          if (artistItems) allItems.push(...artistItems)
        }
      }
      
      return allItems
    },
    staleTime: 30 * 1000, // 30 seconds (moodboards are interactive)
    retry: 2
  })

  // Computed properties for moodboard canvas
  const itemsByType = computed(() => {
    const grouped = {
      image: [],
      text: [],
      color: [],
      link: [],
      other: []
    }
    
    ;(moodboardItems.value || []).forEach(item => {
      const type = item.item_type
      if (grouped[type]) {
        grouped[type].push(item)
      } else {
        grouped.other.push(item)
      }
    })
    
    return grouped
  })

  const canvasItems = computed(() => {
    // Items formatted for canvas rendering
    return (moodboardItems.value || []).map(item => ({
      ...item,
      x: item.position_x || 0,
      y: item.position_y || 0,
      width: item.width || 200,
      height: item.height || 200,
      rotation: item.rotation || 0,
      zIndex: item.z_index || 0,
      style: item.style_props || {}
    }))
  })

  const selectedItems = ref([])
  const clipboardItems = ref([])

  // Create moodboard item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData) => {
      const { data, error } = await apiService.create('moodboard_items', {
        ...itemData,
        position_x: itemData.x || itemData.position_x || 0,
        position_y: itemData.y || itemData.position_y || 0,
        z_index: itemData.zIndex || itemData.z_index || 0
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodboard_items'] })
    }
  })

  // Update moodboard item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...itemData }) => {
      const updateData = { ...itemData }
      
      // Handle position updates
      if (itemData.x !== undefined) updateData.position_x = itemData.x
      if (itemData.y !== undefined) updateData.position_y = itemData.y
      if (itemData.zIndex !== undefined) updateData.z_index = itemData.zIndex
      
      const { data, error } = await apiService.update('moodboard_items', id, updateData)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodboard_items'] })
    }
  })

  // Delete moodboard item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      const { error } = await apiService.delete('moodboard_items', itemId)
      if (error) throw error
      return itemId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodboard_items'] })
    }
  })

  // Bulk update items mutation (for moving multiple items)
  const bulkUpdateItemsMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = updates.map(({ id, ...data }) => 
        apiService.update('moodboard_items', id, data)
      )
      const results = await Promise.all(promises)
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodboard_items'] })
    }
  })

  // Helper methods
  const setArtistFilter = (artistIds) => {
    selectedArtistIds.value = Array.isArray(artistIds) ? artistIds : [artistIds]
  }

  const clearArtistFilter = () => {
    selectedArtistIds.value = []
  }

  const setItemTypeFilter = (type) => {
    itemTypeFilter.value = type
  }

  const setSearch = (query) => {
    searchQuery.value = query
  }

  const selectItem = (itemId) => {
    if (!selectedItems.value.includes(itemId)) {
      selectedItems.value.push(itemId)
    }
  }

  const deselectItem = (itemId) => {
    const index = selectedItems.value.indexOf(itemId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }

  const clearSelection = () => {
    selectedItems.value = []
  }

  const selectAll = () => {
    selectedItems.value = (moodboardItems.value || []).map(item => item.id)
  }

  // Canvas operations
  const moveItem = async (itemId, x, y) => {
    return updateItemMutation.mutateAsync({
      id: itemId,
      position_x: x,
      position_y: y
    })
  }

  const resizeItem = async (itemId, width, height) => {
    return updateItemMutation.mutateAsync({
      id: itemId,
      width,
      height
    })
  }

  const rotateItem = async (itemId, rotation) => {
    return updateItemMutation.mutateAsync({
      id: itemId,
      rotation
    })
  }

  const changeZIndex = async (itemId, zIndex) => {
    return updateItemMutation.mutateAsync({
      id: itemId,
      z_index: zIndex
    })
  }

  const bringToFront = async (itemId) => {
    const maxZ = Math.max(...(moodboardItems.value || []).map(item => item.z_index || 0))
    return changeZIndex(itemId, maxZ + 1)
  }

  const sendToBack = async (itemId) => {
    const minZ = Math.min(...(moodboardItems.value || []).map(item => item.z_index || 0))
    return changeZIndex(itemId, minZ - 1)
  }

  // Content operations
  const addImage = async (artistId, imageUrl, x = 100, y = 100, title = 'Image') => {
    return createItemMutation.mutateAsync({
      artist_id: artistId,
      title,
      item_type: 'image',
      content: { url: imageUrl },
      position_x: x,
      position_y: y,
      width: 200,
      height: 150
    })
  }

  const addText = async (artistId, text, x = 100, y = 100, style = {}) => {
    return createItemMutation.mutateAsync({
      artist_id: artistId,
      title: 'Text',
      item_type: 'text',
      content: { text },
      position_x: x,
      position_y: y,
      width: 200,
      height: 50,
      style_props: {
        fontSize: '16px',
        color: '#000000',
        fontFamily: 'Arial',
        ...style
      }
    })
  }

  const addColor = async (artistId, color, x = 100, y = 100, title = 'Color') => {
    return createItemMutation.mutateAsync({
      artist_id: artistId,
      title,
      item_type: 'color',
      content: { color },
      position_x: x,
      position_y: y,
      width: 100,
      height: 100
    })
  }

  const addLink = async (artistId, url, title, x = 100, y = 100) => {
    return createItemMutation.mutateAsync({
      artist_id: artistId,
      title: title || url,
      item_type: 'link',
      content: { url, title },
      position_x: x,
      position_y: y,
      width: 250,
      height: 80
    })
  }

  // Clipboard operations
  const copySelectedItems = () => {
    const selected = (moodboardItems.value || []).filter(item => 
      selectedItems.value.includes(item.id)
    )
    clipboardItems.value = selected.map(item => ({
      ...item,
      id: undefined // Remove ID so new items will be created
    }))
  }

  const pasteItems = async (artistId, offsetX = 20, offsetY = 20) => {
    const promises = clipboardItems.value.map(item => 
      createItemMutation.mutateAsync({
        ...item,
        artist_id: artistId,
        position_x: (item.position_x || 0) + offsetX,
        position_y: (item.position_y || 0) + offsetY
      })
    )
    return Promise.all(promises)
  }

  const deleteSelectedItems = async () => {
    const promises = selectedItems.value.map(itemId => 
      deleteItemMutation.mutateAsync(itemId)
    )
    const results = await Promise.all(promises)
    clearSelection()
    return results
  }

  // Template operations
  const saveAsTemplate = async (name, selectedItemsOnly = false) => {
    const items = selectedItemsOnly 
      ? (moodboardItems.value || []).filter(item => selectedItems.value.includes(item.id))
      : (moodboardItems.value || [])
    
    // This could be extended to save templates to a separate table
    return {
      name,
      items: items.map(item => ({
        ...item,
        id: undefined,
        artist_id: undefined
      }))
    }
  }

  const loadTemplate = async (artistId, template) => {
    const promises = template.items.map(item => 
      createItemMutation.mutateAsync({
        ...item,
        artist_id: artistId
      })
    )
    return Promise.all(promises)
  }

  return {
    // State
    moodboardItems: computed(() => moodboardItems.value || []),
    loading,
    moodboardError,
    selectedArtistIds,
    selectedMoodboardId,
    searchQuery,
    itemTypeFilter,
    selectedItems,
    clipboardItems,
    
    // Computed
    itemsByType,
    canvasItems,
    
    // Methods
    refetchMoodboard,
    setArtistFilter,
    clearArtistFilter,
    setItemTypeFilter,
    setSearch,
    selectItem,
    deselectItem,
    clearSelection,
    selectAll,
    
    // Canvas operations
    moveItem,
    resizeItem,
    rotateItem,
    changeZIndex,
    bringToFront,
    sendToBack,
    
    // Content operations
    addImage,
    addText,
    addColor,
    addLink,
    
    // Clipboard operations
    copySelectedItems,
    pasteItems,
    deleteSelectedItems,
    
    // Template operations
    saveAsTemplate,
    loadTemplate,
    
    // Mutations
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    bulkUpdateItems: bulkUpdateItemsMutation.mutateAsync,
    isCreatingItem: createItemMutation.isPending,
    isUpdatingItem: updateItemMutation.isPending,
    isDeletingItem: deleteItemMutation.isPending,
    isBulkUpdating: bulkUpdateItemsMutation.isPending
  }
})