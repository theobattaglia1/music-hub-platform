import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, getCurrentUser, getUserProfile, upsertProfile, uploadFile } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true) // Start with true to handle initial auth check
  const isInitialized = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => profile.value?.full_name || userEmail.value || 'User')
  const userRole = computed(() => profile.value?.role || 'artist')
  const isManager = computed(() => ['manager','admin','owner'].includes(userRole.value))
  const userAvatar = computed(() => profile.value?.avatar_url || '')

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

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return
      }

      if (session?.user) {
        await setUser(session.user)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          clearUser()
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          await setUser(session.user)
        }
      })

      isInitialized.value = true
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  const setUser = async (authUser) => {
    try {
      user.value = authUser
      
      // Get or create user profile
      let userProfile = await getUserProfile(authUser.id)
      
      if (!userProfile) {
        // Create profile if it doesn't exist
        userProfile = await createUserProfile(authUser)
      }
      
      profile.value = userProfile
    } catch (error) {
      console.error('Error setting user:', error)
    }
  }

  const clearUser = () => {
    user.value = null
    profile.value = null
  }

  const createUserProfile = async (authUser) => {
    try {
      const profileData = {
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: 'artist', // Default role
        preferences: {},
        social_links: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const profile = await upsertProfile(profileData)
      return profile
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  // Authentication methods
  const signInWithMagicLink = async (email) => {
    try {
      loading.value = true
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      
      return { success: true, user: data.user }
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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      
      return { success: true, user: data.user }
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
      
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
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

      const updatedProfile = {
        ...profile.value,
        ...updates,
        updated_at: new Date().toISOString()
      }

      const result = await upsertProfile(updatedProfile)
      profile.value = result
      
      return result
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      throw error
    }
  }

  const uploadAvatar = async (file) => {
    try {
      if (!user.value) throw new Error('No user logged in')
      
      // Upload to avatars bucket
      const { publicUrl } = await uploadFile('avatars', file)
      
      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })

      return publicUrl
    } catch (error) {
      console.error('Avatar upload error:', error)
      throw error
    }
  }

  // Artist access control helpers
  const canAccessArtist = (artistId) => {
    if (!isAuthenticated.value) return false
    
    // For now, authenticated users can access any artist
    // This can be enhanced with proper team-based permissions
    return true
  }

  const canEditArtist = (artistId) => {
    if (!isAuthenticated.value) return false
    
    // Managers and above can edit any artist
    if (isManager.value) return true
    
    // Regular users can edit if they have specific permissions
    // This would need to be checked against team memberships
    return true
  }

  const canDeleteArtist = (artistId) => {
    return ['owner', 'admin'].includes(userRole.value)
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
      
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
