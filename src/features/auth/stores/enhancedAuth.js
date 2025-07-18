/**
 * Enhanced Auth Store with real Supabase integration
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'

export const useEnhancedAuthStore = defineStore('enhancedAuth', () => {
  // State
  const user = ref(null)
  const session = ref(null)
  const loading = ref(true)
  const isInitialized = ref(false)

  // Get query client for cache management
  const queryClient = useQueryClient()

  // Computed
  const isAuthenticated = computed(() => !!user.value && !!session.value)
  const userEmail = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.id || null)

  // Initialize auth state
  const initialize = async () => {
    if (isInitialized.value) return

    try {
      loading.value = true
      
      // Get current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) throw error

      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email)
        
        session.value = newSession
        user.value = newSession?.user || null

        if (event === 'SIGNED_IN') {
          // Invalidate queries to refresh data
          await queryClient.invalidateQueries()
        } else if (event === 'SIGNED_OUT') {
          // Clear all cached data
          await queryClient.clear()
        }
      })

      isInitialized.value = true
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }
  // Query keys for caching
  const queryKeys = {
    user: {
      profile: (userId) => ['user', 'profile', userId?.value || userId],
      preferences: (userId) => ['user', 'preferences', userId?.value || userId]
    }
  }

  // Vue Query: User Profile
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile
  } = useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: async () => {
      if (!userId.value) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId.value)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: computed(() => !!userId.value),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  })

  // Vue Query: User Preferences (could be part of profile or separate table)
  const {
    data: preferences,
    isLoading: preferencesLoading,
    refetch: refetchPreferences
  } = useQuery({
    queryKey: queryKeys.user.preferences(userId),
    queryFn: async () => {
      // For now, return preferences from profile
      return profile.value?.preferences || {}
    },
    enabled: computed(() => !!profile.value),
    staleTime: 15 * 60 * 1000 // 15 minutes
  })

  // Derived computed values
  const userName = computed(() => profile.value?.full_name || userEmail.value || 'User')
  const userRole = computed(() => profile.value?.role || 'viewer')
  const isManager = computed(() => ['owner', 'editor', 'artist'].includes(userRole.value))
  const userAvatar = computed(() => profile.value?.avatar_url || '')

  // Role-based permissions
  const canCreateArtist = computed(() => {
    return ['owner', 'editor'].includes(userRole.value)
  })

  const canManageUsers = computed(() => {
    return ['owner'].includes(userRole.value)
  })

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ profileData, avatarFile }) => {
      let updateData = { ...profileData }

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${userId.value}-avatar.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError

        updateData.avatar_url = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName).data.publicUrl
      }

      // Update profile in database
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId.value)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async ({ profileData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.user.profile(userId.value) })

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(queryKeys.user.profile(userId.value))

      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.user.profile(userId.value), old => ({
        ...old,
        ...profileData
      }))

      return { previousProfile }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(
        queryKeys.user.profile(userId.value),
        context.previousProfile
      )
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(userId.value) })
    }
  })

  // Authentication methods
  const signIn = async (email, password) => {
    try {
      loading.value = true
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    try {
      loading.value = true
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      loading.value = true
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear state
      user.value = null
      session.value = null
      
      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      loading.value = false
    }
  }

  const signInWithOtp = async (email) => {
    try {
      loading.value = true
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Initialize auth on store creation
  initialize()

  return {
    // State
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    isInitialized: readonly(isInitialized),
    
    // Computed
    isAuthenticated,
    userEmail,
    userId,
    userName,
    userRole,
    isManager,
    userAvatar,
    
    // Profile data
    profile,
    profileLoading,
    profileError,
    preferences,
    preferencesLoading,
    
    // Permissions
    canCreateArtist,
    canManageUsers,
    
    // Methods
    initialize,
    signIn,
    signUp,
    signOut,
    signInWithOtp,
    resetPassword,
    updatePassword,
    refetchProfile,
    refetchPreferences,
    
    // Mutations
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending
  }
})
