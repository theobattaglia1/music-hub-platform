// Real Supabase client integration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId = null) => {
  const targetUserId = userId || (await getCurrentUser())?.id
  if (!targetUserId) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .single()

  if (error) throw error
  return profile
}

// Helper function to upload files
export const uploadFile = async (bucket, file, fileName = null) => {
  const fileExt = file.name.split('.').pop()
  const finalFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${bucket}/${finalFileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return { ...data, publicUrl, path: filePath }
}

// Helper function to get storage URL
export const getStorageUrl = (bucket, path) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}

// Helper function to log file access
export const logFileAccess = async (mediaId, action, metadata = {}) => {
  try {
    const user = await getCurrentUser()
    await supabase
      .from('file_access_logs')
      .insert({
        media_id: mediaId,
        user_id: user?.id || null,
        action,
        metadata
      })
  } catch (error) {
    console.error('Failed to log file access:', error)
  }
}

// Helper function to create artist team member
export const addTeamMember = async (artistId, userId, role = 'viewer') => {
  const { data, error } = await supabase
    .from('artist_team')
    .insert({
      artist_id: artistId,
      user_id: userId,
      role,
      invited_by: (await getCurrentUser())?.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper function to update team member role
export const updateTeamMemberRole = async (artistId, userId, role) => {
  const { data, error } = await supabase
    .from('artist_team')
    .update({ role })
    .eq('artist_id', artistId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper function to remove team member
export const removeTeamMember = async (artistId, userId) => {
  const { error } = await supabase
    .from('artist_team')
    .delete()
    .eq('artist_id', artistId)
    .eq('user_id', userId)

  if (error) throw error
}