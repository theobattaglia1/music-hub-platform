// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
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

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', targetUserId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Helper function to upload files
export const uploadFile = async (bucket, file, fileName = null) => {
  const fileExt = file.name.split('.').pop()
  const finalFileName = fileName || `${Math.random()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(finalFileName, file)

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(finalFileName)

  return { ...data, publicUrl }
}

// Helper function to get storage URL
export const getStorageUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return data.publicUrl
}