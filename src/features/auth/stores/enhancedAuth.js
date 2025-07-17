/**
 * Enhanced Auth Store with Vue Query integration - MOCK MODE FOR LOCAL TESTING
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// Mock user data
const MOCK_USER = {
  id: 'mock-user-123',
  email: 'demo@example.com',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=256'
  }
}

const MOCK_PROFILE = {
  id: 'mock-user-123',
  email: 'demo@example.com',
  full_name: 'Demo User',
  avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=256',
  role: 'owner',
  preferences: {},
  social_links: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const MOCK_PREFERENCES = {
  id: 'mock-user-123',
  theme: 'light',
  notifications_enabled: true,
  email_notifications: true,
  auto_save: true
}

export const useEnhancedAuthStore = defineStore('enhancedAuth', () => {
  // State
  const user = ref(null)
  const loading = ref(false) // Start with false since we're mocked
  const isInitialized = ref(false)

  // Get query client for cache management
  const queryClient = useQueryClient()

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.id)

  // Mock query keys for consistency
  const mockQueryKeys = {
    user: {
      profile: (userId) => ['user', 'profile', userId?.value || userId],
      preferences: (userId) => ['user', 'preferences', userId?.value || userId]
    }
  }

  // Vue Query: User Profile (mocked)
  const {
    data: profile,
    isLoading: profileLoading,
    error: _profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: mockQueryKeys.user.profile(userId),
    queryFn: async () => {
      console.log('🎭 MOCK MODE: Fetching user profile')
      return MOCK_PROFILE
    },
    enabled: computed(() => !!userId.value),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    initialData: MOCK_PROFILE
  })

  // Vue Query: User Preferences (mocked)
  const {
    data: preferences,
    isLoading: preferencesLoading,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: mockQueryKeys.user.preferences(userId),
    queryFn: async () => {
      console.log('🎭 MOCK MODE: Fetching user preferences')
      return MOCK_PREFERENCES
    },
    enabled: computed(() => !!userId.value),
    staleTime: 15 * 60 * 1000, // 15 minutes
    initialData: MOCK_PREFERENCES
  })

  // Derived computed values
  const userName = computed(() => profile.value?.full_name || userEmail.value || 'User')
  const userRole = computed(() => profile.value?.role || 'artist')
  const isManager = computed(() => ['manager', 'admin', 'owner'].includes(userRole.value))
  const userAvatar = computed(() => profile.value?.avatar_url || '')

  // Role-based permissions
  const canCreateArtist = computed(() => {
    return ['owner', 'admin', 'manager'].includes(userRole.value)
  })

  const canManageUsers = computed(() => {
    return ['owner', 'admin'].includes(userRole.value)
  })

  // Update Profile Mutation (mocked)
  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileData, avatarFile }) => {
      console.log('🎭 MOCK MODE: Updating profile', profileData)
      
      let updateData = { ...profileData }

      // Mock avatar upload
      if (avatarFile) {
        updateData.avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(updateData.full_name || 'User')}&background=6366f1&color=fff&size=256`
      }

      const updatedProfile = {
        ...MOCK_PROFILE,
        ...updateData,
        updated_at: new Date().toISOString()
      }

      // Update the local mock data
      Object.assign(MOCK_PROFILE, updatedProfile)
      
      return updatedProfile
    },
    onMutate: async ({ profileData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: mockQueryKeys.user.profile(userId.value) })

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(mockQueryKeys.user.profile(userId.value))

      // Optimistically update
      queryClient.setQueryData(
        mockQueryKeys.user.profile(userId.value),
        (old) => ({ ...old, ...profileData })
      )

      return { previousProfile }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          mockQueryKeys.user.profile(userId.value),
          context.previousProfile
        )
      }
    },
    onSuccess: (updatedProfile) => {
      // Update cache with server response
      queryClient.setQueryData(
        mockQueryKeys.user.profile(userId.value),
        updatedProfile
      )
    }
  })

  // Update Preferences Mutation (mocked)
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferencesData) => {
      console.log('🎭 MOCK MODE: Updating preferences', preferencesData)
      
      const updatedPreferences = {
        ...MOCK_PREFERENCES,
        ...preferencesData,
        updated_at: new Date().toISOString()
      }

      // Update the local mock data
      Object.assign(MOCK_PREFERENCES, updatedPreferences)
      
      return updatedPreferences
    },
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(
        mockQueryKeys.user.preferences(userId.value),
        updatedPreferences
      )
    }
  })

  // Actions
  const initialize = async () => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Initializing enhanced auth with demo user')

      // Auto-authenticate with mock user
      user.value = MOCK_USER

      // Invalidate and refetch user-related queries
      await Promise.all([
        refetchProfile(),
        refetchPreferences()
      ])

    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
      isInitialized.value = true
    }
  }

  const setUser = async (newUser) => {
    user.value = newUser || MOCK_USER
    
    // Invalidate and refetch user-related queries
    if (user.value?.id) {
      await Promise.all([
        refetchProfile(),
        refetchPreferences()
      ])
    }
  }

  const clearUser = () => {
    console.log('🎭 MOCK MODE: Clear user called, but keeping demo user authenticated')
    // In mock mode, we don't actually clear the user for testing purposes
  }

  const signIn = async (email, password) => {
    loading.value = true
    try {
      console.log('🎭 MOCK MODE: Sign in for', email)
      
      // Auto-authenticate with mock user
      user.value = MOCK_USER
      
      return { data: { user: MOCK_USER, session: { user: MOCK_USER } } }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    loading.value = true
    try {
      console.log('🎭 MOCK MODE: Sign up for', email)
      
      // Auto-authenticate with mock user
      user.value = MOCK_USER
      
      return { data: { user: MOCK_USER, session: { user: MOCK_USER } } }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    loading.value = true
    try {
      console.log('🎭 MOCK MODE: Sign out called, but staying authenticated for testing')
      // In mock mode, don't actually sign out
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email) => {
    console.log('🎭 MOCK MODE: Password reset simulated for', email)
    // Mock password reset
  }

  const updatePassword = async (newPassword) => {
    console.log('🎭 MOCK MODE: Password update simulated')
    // Mock password update
  }

  // Convenience methods that use mutations
  const updateProfile = (profileData, avatarFile = null) => {
    return updateProfileMutation.mutateAsync({ profileData, avatarFile })
  }

  const updatePreferences = (preferencesData) => {
    return updatePreferencesMutation.mutateAsync(preferencesData)
  }

  // Artist access control helpers
  const canAccessArtist = (_artistId) => {
    return isAuthenticated.value
  }

  const canEditArtist = (_artistId) => {
    return isAuthenticated.value
  }

  const canDeleteArtist = (_artistId) => {
    return ['owner', 'admin'].includes(userRole.value)
  }

  return {
    // State
    user: computed(() => user.value),
    loading: computed(() => loading.value || profileLoading.value),
    isInitialized: computed(() => isInitialized.value),
    profile: computed(() => profile.value),
    preferences: computed(() => preferences.value),
    
    // Computed
    isAuthenticated,
    userEmail,
    userId,
    userName,
    userRole,
    isManager,
    userAvatar,
    canCreateArtist,
    canManageUsers,
    
    // Loading states
    profileLoading: computed(() => profileLoading.value),
    preferencesLoading: computed(() => preferencesLoading.value),
    
    // Mutation states
    isUpdatingProfile: computed(() => updateProfileMutation.isPending.value),
    isUpdatingPreferences: computed(() => updatePreferencesMutation.isPending.value),
    
    // Actions
    initialize,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    updatePreferences,
    refetchProfile,
    refetchPreferences,
    
    // Artist permissions
    canAccessArtist,
    canEditArtist,
    canDeleteArtist
  }
})