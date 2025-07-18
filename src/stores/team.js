import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { apiService } from '@/shared/services/api'

export const useTeamStore = defineStore('team', () => {
  const queryClient = useQueryClient()
  const selectedArtistIds = ref([])
  const roleFilter = ref('all') // 'all', 'owner', 'editor', 'artist', 'viewer'
  const statusFilter = ref('all') // 'all', 'active', 'pending', 'inactive'
  const searchQuery = ref('')

  // Query keys
  const queryKeys = {
    teamMembers: (artistIds = [], role = 'all', status = 'all', search = '') => [
      'team_members', 
      { artistIds: artistIds.sort(), role, status, search }
    ],
    artists: () => ['artists', 'team_access']
  }

  // Load team members for selected artists
  const {
    data: teamMembers,
    isLoading: loading,
    error: teamError,
    refetch: refetchTeam
  } = useQuery({
    queryKey: computed(() => queryKeys.teamMembers(
      selectedArtistIds.value,
      roleFilter.value,
      statusFilter.value,
      searchQuery.value
    )),
    queryFn: async () => {
      const allMembers = []
      
      if (selectedArtistIds.value.length === 0) {
        // Load team members for all artists user has access to
        const { data: userArtists } = await apiService.getArtistsByUser()
        if (userArtists?.length) {
          for (const artist of userArtists) {
            const { data: artistTeam } = await apiService.getArtistTeam(artist.id)
            if (artistTeam) {
              // Add artist info to each team member
              const membersWithArtist = artistTeam.map(member => ({
                ...member,
                artist: {
                  id: artist.id,
                  name: artist.name,
                  avatar_url: artist.avatar_url
                }
              }))
              allMembers.push(...membersWithArtist)
            }
          }
        }
      } else {
        // Load team members for selected artists
        for (const artistId of selectedArtistIds.value) {
          const { data: artistTeam } = await apiService.getArtistTeam(artistId)
          if (artistTeam) {
            // We'll need to fetch artist info separately
            const { data: artist } = await apiService.getById('artists', artistId)
            const membersWithArtist = artistTeam.map(member => ({
              ...member,
              artist: artist || { id: artistId, name: 'Unknown Artist' }
            }))
            allMembers.push(...membersWithArtist)
          }
        }
      }
      
      // Apply filters
      let filteredMembers = allMembers
      
      if (roleFilter.value !== 'all') {
        filteredMembers = filteredMembers.filter(member => member.role === roleFilter.value)
      }
      
      if (statusFilter.value !== 'all') {
        if (statusFilter.value === 'active') {
          filteredMembers = filteredMembers.filter(member => member.accepted_at)
        } else if (statusFilter.value === 'pending') {
          filteredMembers = filteredMembers.filter(member => !member.accepted_at)
        }
      }
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filteredMembers = filteredMembers.filter(member => 
          member.profiles?.full_name?.toLowerCase().includes(query) ||
          member.profiles?.email?.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query)
        )
      }
      
      return filteredMembers
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  // Load artists the current user has access to
  const {
    data: userArtists,
    isLoading: artistsLoading,
    error: artistsError,
    refetch: refetchArtists
  } = useQuery({
    queryKey: queryKeys.artists(),
    queryFn: async () => {
      const { data, error } = await apiService.getArtistsByUser()
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // Computed properties
  const membersByRole = computed(() => {
    const grouped = {
      owner: [],
      editor: [],
      artist: [],
      viewer: []
    }
    
    ;(teamMembers.value || []).forEach(member => {
      if (grouped[member.role]) {
        grouped[member.role].push(member)
      }
    })
    
    return grouped
  })

  const membersByArtist = computed(() => {
    const grouped = {}
    
    ;(teamMembers.value || []).forEach(member => {
      const artistId = member.artist_id
      if (!grouped[artistId]) {
        grouped[artistId] = {
          artist: member.artist,
          members: []
        }
      }
      grouped[artistId].members.push(member)
    })
    
    return grouped
  })

  const pendingInvitations = computed(() => {
    return (teamMembers.value || []).filter(member => !member.accepted_at)
  })

  const activeMembers = computed(() => {
    return (teamMembers.value || []).filter(member => member.accepted_at)
  })

  const totalMembers = computed(() => teamMembers.value?.length || 0)

  // Add team member mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async ({ artistId, email, role = 'viewer' }) => {
      const { data, error } = await apiService.inviteTeamMember(artistId, email, role)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] })
    }
  })

  // Update team member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ artistId, userId, role }) => {
      const { data, error } = await apiService.updateTeamMemberRole(artistId, userId, role)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] })
    }
  })

  // Remove team member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ artistId, userId }) => {
      const { error } = await apiService.removeTeamMember(artistId, userId)
      if (error) throw error
      return { artistId, userId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] })
    }
  })

  // Accept invitation mutation (for current user)
  const acceptInvitationMutation = useMutation({
    mutationFn: async ({ artistId, userId }) => {
      const { data, error } = await apiService.update('artist_team', null, {
        accepted_at: new Date().toISOString()
      }, {
        filters: { artist_id: artistId, user_id: userId }
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] })
      queryClient.invalidateQueries({ queryKey: ['artists'] })
    }
  })

  // Bulk operations
  const bulkUpdateRolesMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = updates.map(({ artistId, userId, role }) => 
        apiService.updateTeamMemberRole(artistId, userId, role)
      )
      const results = await Promise.all(promises)
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] })
    }
  })

  const bulkRemoveMembersMutation = useMutation({
    mutationFn: async (removals) => {
      const promises = removals.map(({ artistId, userId }) => 
        apiService.removeTeamMember(artistId, userId)
      )
      const results = await Promise.all(promises)
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members'] })
    }
  })

  // Helper methods
  const setArtistFilter = (artistIds) => {
    selectedArtistIds.value = Array.isArray(artistIds) ? artistIds : [artistIds]
  }

  const clearArtistFilter = () => {
    selectedArtistIds.value = []
  }

  const setRoleFilter = (role) => {
    roleFilter.value = role
  }

  const setStatusFilter = (status) => {
    statusFilter.value = status
  }

  const setSearch = (query) => {
    searchQuery.value = query
  }

  const clearAllFilters = () => {
    roleFilter.value = 'all'
    statusFilter.value = 'all'
    searchQuery.value = ''
  }

  // Get member by ID
  const getMemberById = (memberId) => {
    return teamMembers.value?.find(member => member.id === memberId)
  }

  // Get members for specific artist
  const getMembersForArtist = (artistId) => {
    return (teamMembers.value || []).filter(member => member.artist_id === artistId)
  }

  // Check if user has permission
  const hasPermission = (artistId, permission) => {
    const member = (teamMembers.value || []).find(member => 
      member.artist_id === artistId && 
      member.user_id === currentUserId.value
    )
    
    if (!member) return false
    
    const rolePermissions = {
      owner: ['create', 'read', 'update', 'delete', 'manage_team'],
      editor: ['create', 'read', 'update', 'manage_content'],
      artist: ['create', 'read', 'update_own'],
      viewer: ['read']
    }
    
    return rolePermissions[member.role]?.includes(permission) || false
  }

  // Check if user can manage team for artist
  const canManageTeam = (artistId) => {
    return hasPermission(artistId, 'manage_team')
  }

  // Check if user is owner of artist
  const isOwner = (artistId) => {
    const member = (teamMembers.value || []).find(member => 
      member.artist_id === artistId && 
      member.user_id === currentUserId.value
    )
    return member?.role === 'owner'
  }

  // Invite multiple users at once
  const inviteMultipleUsers = async (artistId, invitations) => {
    const promises = invitations.map(({ email, role }) => 
      addTeamMemberMutation.mutateAsync({ artistId, email, role })
    )
    return Promise.all(promises)
  }

  // Get role hierarchy for validation
  const getRoleHierarchy = () => {
    return {
      owner: 4,
      editor: 3,
      artist: 2,
      viewer: 1
    }
  }

  // Check if role change is valid
  const canChangeRole = (currentRole, newRole, userRole) => {
    const hierarchy = getRoleHierarchy()
    return hierarchy[userRole] >= Math.max(hierarchy[currentRole], hierarchy[newRole])
  }

  // We'll need to get current user ID from auth store
  const currentUserId = computed(() => {
    // This would typically come from the auth store
    // For now, return null - will be implemented when integrating with auth
    return null
  })

  return {
    // State
    teamMembers: computed(() => teamMembers.value || []),
    userArtists: computed(() => userArtists.value || []),
    loading,
    artistsLoading,
    teamError,
    artistsError,
    selectedArtistIds,
    roleFilter,
    statusFilter,
    searchQuery,
    
    // Computed
    membersByRole,
    membersByArtist,
    pendingInvitations,
    activeMembers,
    totalMembers,
    
    // Methods
    refetchTeam,
    refetchArtists,
    setArtistFilter,
    clearArtistFilter,
    setRoleFilter,
    setStatusFilter,
    setSearch,
    clearAllFilters,
    getMemberById,
    getMembersForArtist,
    hasPermission,
    canManageTeam,
    isOwner,
    canChangeRole,
    getRoleHierarchy,
    inviteMultipleUsers,
    
    // Mutations
    addTeamMember: addTeamMemberMutation.mutateAsync,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    acceptInvitation: acceptInvitationMutation.mutateAsync,
    bulkUpdateRoles: bulkUpdateRolesMutation.mutateAsync,
    bulkRemoveMembers: bulkRemoveMembersMutation.mutateAsync,
    isAddingMember: addTeamMemberMutation.isPending,
    isUpdatingRole: updateMemberRoleMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    isAcceptingInvitation: acceptInvitationMutation.isPending,
    isBulkUpdating: computed(() => 
      bulkUpdateRolesMutation.isPending.value || 
      bulkRemoveMembersMutation.isPending.value
    )
  }
})