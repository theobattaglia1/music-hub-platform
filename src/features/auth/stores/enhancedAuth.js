/**
 * Enhanced Auth Store with Vue Query integration
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase'
import { queryKeys, invalidateQueries } from '@/shared/services/queryClient'
import { apiService } from '@/shared/services/api'
import { STORAGE_BUCKETS } from '@/core/constants'

export const useEnhancedAuthStore = defineStore('enhancedAuth', () => {
  // State
  const user = ref(null)
  const loading = ref(true)
  const isInitialized = ref(false)

  // Get query client for cache management
  const queryClient = useQueryClient()

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.id)

  // Vue Query: User Profile
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => getUserProfile(userId.value),
    enabled: computed(() => !!userId.value),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  })

  // Vue Query: User Preferences  
  const {
    data: preferences,
    isLoading: preferencesLoading,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: queryKeys.user.preferences(userId),
    queryFn: async () => {
      if (!userId.value) return null
      const { data } = await apiService.getById('user_preferences', userId.value)
      return data
    },
    enabled: computed(() => !!userId.value),
    staleTime: 15 * 60 * 1000 // 15 minutes
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

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileData, avatarFile }) => {
      let updateData = { ...profileData }

      // Upload new avatar if provided
      if (avatarFile) {
        const uploadResult = await apiService.uploadFile(
          STORAGE_BUCKETS.USER_UPLOADS, 
          avatarFile,
          `${userId.value}-avatar-${Date.now()}`
        )
        updateData.avatar_url = uploadResult.publicUrl
      }

      const { data } = await apiService.update('user_profiles', userId.value, updateData)
      return data
    },
    onMutate: async ({ profileData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile(userId.value) })

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(queryKeys.user.profile(userId.value))

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.user.profile(userId.value),
        (old) => ({ ...old, ...profileData })
      )

      return { previousProfile }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          queryKeys.user.profile(userId.value),
          context.previousProfile
        )
      }
    },
    onSuccess: (updatedProfile) => {
      // Update cache with server response
      queryClient.setQueryData(
        queryKeys.user.profile(userId.value),
        updatedProfile
      )
    }
  })

  // Update Preferences Mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferencesData) => {
      const { data } = await apiService.request(() =>
        supabase
          .from('user_preferences')
          .upsert({
            id: userId.value,
            ...preferencesData
          })
          .select()
          .single()
      )
      return data
    },
    onSuccess: (updatedPreferences) => {
      queryClient.setQueryData(
        queryKeys.user.preferences(userId.value),
        updatedPreferences
      )
    }
  })

  // Actions
  const initialize = async () => {
    try {
      loading.value = true

      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session?.user) {
        await setUser(session.user)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)

        if (session?.user) {
          await setUser(session.user)
        } else {
          clearUser()
        }
      })

    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
      isInitialized.value = true
    }
  }

  const setUser = async (newUser) => {
    user.value = newUser
    
    // Invalidate and refetch user-related queries
    if (newUser?.id) {
      await Promise.all([
        refetchProfile(),
        refetchPreferences()
      ])
    }
  }

  const clearUser = () => {
    user.value = null
    
    // Clear all cached user data
    if (userId.value) {
      queryClient.removeQueries({ queryKey: queryKeys.user.profile(userId.value) })
      queryClient.removeQueries({ queryKey: queryKeys.user.preferences(userId.value) })
    }
    
    // Clear all other cached data on logout
    queryClient.clear()
  }

  const signIn = async (email, password) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      
      // User will be set via the auth state change listener
      return data
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error
      return data
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
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      clearUser()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  // Convenience methods that use mutations
  const updateProfile = (profileData, avatarFile = null) => {
    return updateProfileMutation.mutateAsync({ profileData, avatarFile })
  }

  const updatePreferences = (preferencesData) => {
    return updatePreferencesMutation.mutateAsync(preferencesData)
  }

  // Artist access control helpers
  const canAccessArtist = (artistId) => {
    // This will be expanded when we add artist team members
    return isAuthenticated.value
  }

  const canEditArtist = (artistId) => {
    // This will be expanded when we add artist team members
    return isAuthenticated.value
  }

  const canDeleteArtist = (artistId) => {
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