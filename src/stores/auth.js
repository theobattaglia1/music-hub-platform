import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const isInitialized = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => profile.value?.full_name || userEmail.value || 'User')
  const userRole = computed(() => profile.value?.role || 'artist')
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
        full_name: authUser.user_metadata?.full_name || '',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        role: 'artist', // Default role
        preferences: {},
        social_links: {}
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  const signInWithMagicLink = async (email) => {
    try {
      loading.value = true

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`
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

      await setUser(data.user)
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
          emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`
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

      clearUser()

      // Redirect to login
      window.location.href = '/auth/login'
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

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)
        .select()
        .single()

      if (error) throw error

      profile.value = data
      return data
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      // First verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.value.email,
        password: currentPassword
      })

      if (verifyError) throw new Error('Current password is incorrect')

      // Update password
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

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.value.id}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('artist-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artist-avatars')
        .getPublicUrl(fileName)

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
    // This will be expanded when we add artist team members
    return true // For now, all authenticated users can access
  }

  const canEditArtist = (artistId) => {
    // This will be expanded when we add artist team members
    return isAuthenticated.value
  }

  const canDeleteArtist = (artistId) => {
    return ['owner', 'admin'].includes(userRole.value)
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-password`
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