import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State - MOCK MODE: Always authenticated with demo user
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(false) // Start with false since we're mocked
  const isInitialized = ref(false)

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
    role: 'owner', // Give full permissions for testing
    preferences: {},
    social_links: {}
  }

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => profile.value?.full_name || userEmail.value || 'User')
  const userRole = computed(() => profile.value?.role || 'artist')
  const isManager = computed(() => ['manager','admin','owner'].includes(userRole.value))
  const userAvatar = computed(() => profile.value?.avatar_url || '') // empty string instead of null

  // Role-based permissions
  const canCreateArtist = computed(() => {
    return ['owner', 'admin', 'manager'].includes(userRole.value)
  })

  const canManageUsers = computed(() => {
    return ['owner', 'admin'].includes(userRole.value)
  })

  // Actions
  const initialize = async () => {
    try {
      loading.value = true

      // MOCK MODE: Immediately set mock user as authenticated
      console.log('🎭 MOCK MODE: Auto-authenticating demo user')
      user.value = MOCK_USER
      profile.value = MOCK_PROFILE

      isInitialized.value = true
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  const setUser = async (authUser) => {
    try {
      user.value = authUser || MOCK_USER
      profile.value = MOCK_PROFILE
    } catch (error) {
      console.error('Error setting user:', error)
    }
  }

  const clearUser = () => {
    // In mock mode, we don't actually clear the user
    console.log('🎭 MOCK MODE: Clear user called, but keeping demo user authenticated')
  }

  const createUserProfile = async (authUser) => {
    // MOCK MODE: Just return the mock profile
    return MOCK_PROFILE
  }

  // All auth methods are mocked to work locally
  const signInWithMagicLink = async (email) => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Magic link sign in for', email)
      
      // Auto-authenticate with mock user
      user.value = MOCK_USER
      profile.value = MOCK_PROFILE
      
      return { success: true }
    } catch (error) {
      console.error('Magic link error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const signInWithPassword = async (email, password) => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Password sign in for', email)
      
      // Auto-authenticate with mock user
      user.value = MOCK_USER
      profile.value = MOCK_PROFILE
      
      return { success: true, user: MOCK_USER }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Sign up for', email)
      
      // Auto-authenticate with mock user
      user.value = MOCK_USER
      profile.value = MOCK_PROFILE
      
      return { success: true, user: MOCK_USER }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      loading.value = true
      console.log('🎭 MOCK MODE: Sign out called, but staying authenticated for testing')
      
      // In mock mode, don't actually sign out
      // Just simulate the action
      return true
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user.value) throw new Error('No user logged in')

      // MOCK MODE: Update local profile data
      profile.value = {
        ...profile.value,
        ...updates,
        updated_at: new Date().toISOString()
      }

      console.log('🎭 MOCK MODE: Profile updated locally', updates)
      return profile.value
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      console.log('🎭 MOCK MODE: Password update simulated')
      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      throw error
    }
  }

  const uploadAvatar = async (file) => {
    try {
      if (!user.value) throw new Error('No user logged in')

      console.log('🎭 MOCK MODE: Avatar upload simulated for', file.name)
      
      // Generate a mock URL
      const publicUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName.value)}&background=6366f1&color=fff&size=256`
      
      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })

      return publicUrl
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw error
    }
  }

  // Artist access control helpers
  const canAccessArtist = (_artistId) => {
    return true // Mock mode: allow all access
  }

  const canEditArtist = (_artistId) => {
    return isAuthenticated.value
  }

  const canDeleteArtist = (_artistId) => {
    return ['owner', 'admin'].includes(userRole.value)
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      console.log('🎭 MOCK MODE: Password reset simulated for', email)
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  return {
    // State
    user,
    profile,
    loading,
    isInitialized,

    // Computed
    isAuthenticated,
    userEmail,
    userName,
    userRole,
    isManager,
    userAvatar,
    canCreateArtist,
    canManageUsers,

    // Actions
    initialize,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    uploadAvatar,
    resetPassword,
    canAccessArtist,
    canEditArtist,
    canDeleteArtist
  }
})
