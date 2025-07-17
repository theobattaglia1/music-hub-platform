// supabase.js - Production Supabase client configuration
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client with optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window?.localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'music-hub-platform'
    }
  }
})

// Helper function to get the current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper function to get user profile
export const getUserProfile = async (userId = null) => {
  try {
    const user = userId || await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      // If profile doesn't exist, return null (user can create one)
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Helper function to upload files to Supabase storage
export const uploadFile = async (bucket, file, fileName = null, options = {}) => {
  try {
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const finalFileName = fileName || `${timestamp}_${randomString}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalFileName, file, {
        cacheControl: '3600',
        upsert: false,
        ...options
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalFileName)

    return { 
      ...data, 
      publicUrl,
      fileName: finalFileName 
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Helper function to get storage URL
export const getStorageUrl = (bucket, path) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}

// Helper function to delete files from storage
export const deleteFile = async (bucket, filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error
    
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

// Helper function to create or update user profile
export const upsertProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id',
        returning: 'representation'
      })
      .select()
      .single()

    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error upserting profile:', error)
    throw error
  }
}