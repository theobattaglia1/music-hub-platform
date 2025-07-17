// supabase.js - MOCK MODE FOR LOCAL TESTING
// TODO: Re-enable Supabase integration when moving to production

// Mock user for local testing
const MOCK_USER = {
  id: 'mock-user-123',
  email: 'demo@example.com',
  user_metadata: {
    full_name: 'Demo User',
    avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=256'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Mock user profile
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

// Mock session
const MOCK_SESSION = {
  user: MOCK_USER,
  access_token: 'mock-token',
  refresh_token: 'mock-refresh-token'
}

// Create mock Supabase client
const createMockSupabaseClient = () => {
  const authCallbacks = []
  
  return {
    // Auth methods
    auth: {
      getSession: async () => ({
        data: { session: MOCK_SESSION },
        error: null
      }),
      
      getUser: async () => ({
        data: { user: MOCK_USER },
        error: null
      }),
      
      signInWithPassword: async (credentials) => ({
        data: { user: MOCK_USER, session: MOCK_SESSION },
        error: null
      }),
      
      signInWithOtp: async (options) => ({
        data: {},
        error: null
      }),
      
      signUp: async (credentials) => ({
        data: { user: MOCK_USER, session: MOCK_SESSION },
        error: null
      }),
      
      signOut: async () => ({
        error: null
      }),
      
      updateUser: async (attributes) => ({
        data: { user: { ...MOCK_USER, ...attributes } },
        error: null
      }),
      
      resetPasswordForEmail: async (email, options) => ({
        error: null
      }),
      
      onAuthStateChange: (callback) => {
        authCallbacks.push(callback)
        // Immediately call with current session
        setTimeout(() => callback('SIGNED_IN', MOCK_SESSION), 0)
        return {
          data: { subscription: { unsubscribe: () => {} } }
        }
      }
    },
    
    // Database methods
    from: (table) => ({
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: async () => ({ data: null, error: null }),
          data: [],
          error: null
        }),
        in: (column, values) => ({ data: [], error: null }),
        order: (column, options) => ({ data: [], error: null }),
        limit: (count) => ({ data: [], error: null }),
        range: (from, to) => ({ data: [], error: null }),
        data: [],
        error: null
      }),
      
      insert: (data) => ({
        select: (columns = '*') => ({
          single: async () => ({
            data: Array.isArray(data) ? data[0] : data,
            error: null
          }),
          data: Array.isArray(data) ? data : [data],
          error: null
        }),
        data: Array.isArray(data) ? data : [data],
        error: null
      }),
      
      update: (data) => ({
        eq: (column, value) => ({
          select: (columns = '*') => ({
            single: async () => ({ data, error: null }),
            data: [data],
            error: null
          }),
          data: [data],
          error: null
        })
      }),
      
      delete: () => ({
        eq: (column, value) => ({
          data: null,
          error: null
        })
      }),
      
      upsert: (data) => ({
        select: (columns = '*') => ({
          single: async () => ({
            data: Array.isArray(data) ? data[0] : data,
            error: null
          }),
          data: Array.isArray(data) ? data : [data],
          error: null
        })
      })
    }),
    
    // Storage methods
    storage: {
      from: (bucket) => ({
        upload: async (path, file, options) => ({
          data: { path },
          error: null
        }),
        
        remove: async (paths) => ({
          data: { message: 'Files deleted' },
          error: null
        }),
        
        getPublicUrl: (path) => ({
          data: { 
            publicUrl: `https://mock-storage.example.com/${bucket}/${path}` 
          }
        })
      })
    },
    
    // Real-time channels (mock)
    channel: (name) => ({
      on: (event, config, callback) => ({
        subscribe: () => {}
      })
    })
  }
}

export const supabase = createMockSupabaseClient()

// Helper function to get the current user (mocked)
export const getCurrentUser = async () => {
  return MOCK_USER
}

// Helper function to get user profile (mocked)
export const getUserProfile = async (userId = null) => {
  return MOCK_PROFILE
}

// Helper function to upload files (mocked)
export const uploadFile = async (bucket, file, fileName = null) => {
  const fileExt = file.name.split('.').pop()
  const finalFileName = fileName || `${Math.random()}.${fileExt}`
  
  // Mock upload
  const mockData = { path: finalFileName }
  const publicUrl = `https://mock-storage.example.com/${bucket}/${finalFileName}`
  
  return { ...mockData, publicUrl }
}

// Helper function to get storage URL (mocked)
export const getStorageUrl = (bucket, path) => {
  return `https://mock-storage.example.com/${bucket}/${path}`
}