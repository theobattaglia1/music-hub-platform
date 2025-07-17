/**
 * Core API service - MOCK MODE FOR LOCAL TESTING
 * TODO: Re-enable Supabase integration when moving to production
 */

// Mock data storage
const MOCK_DATA_STORE = {
  user_profiles: new Map(),
  user_preferences: new Map(),
  artists: new Map(),
  artist_activity: new Map(),
  playlists: new Map(),
  songs: new Map()
}

class MockApiService {
  constructor() {
    this.timeout = 5000 // Mock timeout
    this.retryAttempts = 3
    this.retryDelay = 1000
    
    console.log('🎭 MOCK MODE: API Service initialized with local data storage')
  }

  // Generic request handler with mock delay
  async request(operation, retryCount = 0) {
    try {
      // Add small delay to simulate network request
      await this.delay(Math.random() * 100 + 50)
      
      const result = await operation()
      
      if (result.error) {
        throw this.handleMockError(result.error)
      }
      
      return result
    } catch (error) {
      if (retryCount < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount))
        return this.request(operation, retryCount + 1)
      }
      
      throw error
    }
  }

  // Handle mock errors
  handleMockError(error) {
    const errorMap = {
      'NOT_FOUND': 'Resource not found',
      'UNAUTHORIZED': 'Unauthorized access',
      'VALIDATION_ERROR': 'Invalid data provided'
    }

    const message = errorMap[error.code] || error.message || 'Unknown error'
    
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message,
      details: error,
      timestamp: new Date().toISOString()
    }
  }

  // Determine if an error should trigger a retry
  shouldRetry(error) {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE']
    return retryableCodes.includes(error.code) || error.status >= 500
  }

  // Delay utility for retries
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Mock query builder - returns local data
  buildQuery(table, options = {}) {
    console.log('🎭 MOCK MODE: Building query for', table, options)
    
    const store = MOCK_DATA_STORE[table] || new Map()
    let data = Array.from(store.values())

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            data = data.filter(item => value.includes(item[key]))
          } else if (typeof value === 'string' && value.includes('*')) {
            const regex = new RegExp(value.replace(/\*/g, '.*'), 'i')
            data = data.filter(item => regex.test(item[key]))
          } else {
            data = data.filter(item => item[key] === value)
          }
        }
      })
    }

    // Apply search
    if (options.search && options.searchColumns) {
      const searchTerm = options.search.toLowerCase()
      data = data.filter(item => 
        options.searchColumns.some(column => 
          item[column]?.toString().toLowerCase().includes(searchTerm)
        )
      )
    }

    // Apply sorting
    if (options.sort) {
      const ascending = options.order !== 'desc'
      data.sort((a, b) => {
        const aVal = a[options.sort]
        const bVal = b[options.sort]
        
        if (aVal < bVal) return ascending ? -1 : 1
        if (aVal > bVal) return ascending ? 1 : -1
        return 0
      })
    }

    // Apply pagination
    if (options.page && options.pageSize) {
      const from = (options.page - 1) * options.pageSize
      const to = from + options.pageSize
      data = data.slice(from, to)
    }

    return {
      data,
      error: null
    }
  }

  // Pagination helper
  async getPaginated(table, options = {}) {
    const pageSize = options.pageSize || 20
    const page = options.page || 1

    // Get total count
    const allData = Array.from(MOCK_DATA_STORE[table]?.values() || [])
    const count = allData.length

    // Get paginated data
    const result = this.buildQuery(table, { ...options, page, pageSize })

    return {
      data: result.data || [],
      total: count,
      page,
      pageSize,
      hasNext: page * pageSize < count,
      hasPrevious: page > 1
    }
  }

  // Storage helpers (mocked)
  async uploadFile(bucket, file, path = null) {
    console.log('🎭 MOCK MODE: Uploading file to', bucket, file.name)
    
    const fileExt = file.name.split('.').pop()
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Mock file upload
    await this.delay(Math.random() * 500 + 200) // Simulate upload time

    const publicUrl = `https://mock-storage.example.com/${bucket}/${fileName}`

    return {
      path: fileName,
      publicUrl,
      fileName
    }
  }

  async deleteFile(bucket, path) {
    console.log('🎭 MOCK MODE: Deleting file from', bucket, path)
    await this.delay(100)
    return true
  }

  // Real-time subscriptions (mocked)
  createSubscription(table, callback, filter = null) {
    console.log('🎭 MOCK MODE: Creating subscription for', table)
    
    // Mock subscription that doesn't actually do anything
    const mockSubscription = {
      unsubscribe: () => {
        console.log('🎭 MOCK MODE: Unsubscribing from', table)
      }
    }

    return mockSubscription
  }

  // Auth helpers (mocked)
  async getCurrentUser() {
    return {
      id: 'mock-user-123',
      email: 'demo@example.com',
      user_metadata: {
        full_name: 'Demo User',
        avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff&size=256'
      }
    }
  }

  async signOut() {
    console.log('🎭 MOCK MODE: Sign out simulated')
    return true
  }

  // Generic CRUD operations
  async create(table, data) {
    console.log('🎭 MOCK MODE: Creating record in', table, data)
    
    return this.request(async () => {
      const store = MOCK_DATA_STORE[table] || new Map()
      const id = data.id || `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      const record = {
        ...data,
        id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      store.set(id, record)
      MOCK_DATA_STORE[table] = store
      
      return {
        data: record,
        error: null
      }
    })
  }

  async getById(table, id, select = '*') {
    console.log('🎭 MOCK MODE: Getting record from', table, 'with id', id)
    
    return this.request(async () => {
      const store = MOCK_DATA_STORE[table] || new Map()
      const record = store.get(id)
      
      if (!record) {
        return {
          data: null,
          error: { code: 'NOT_FOUND', message: 'Record not found' }
        }
      }
      
      return {
        data: record,
        error: null
      }
    })
  }

  async update(table, id, data) {
    console.log('🎭 MOCK MODE: Updating record in', table, 'with id', id, data)
    
    return this.request(async () => {
      const store = MOCK_DATA_STORE[table] || new Map()
      const existing = store.get(id)
      
      if (!existing) {
        return {
          data: null,
          error: { code: 'NOT_FOUND', message: 'Record not found' }
        }
      }
      
      const updated = {
        ...existing,
        ...data,
        updated_at: new Date().toISOString()
      }
      
      store.set(id, updated)
      
      return {
        data: updated,
        error: null
      }
    })
  }

  async delete(table, id) {
    console.log('🎭 MOCK MODE: Deleting record from', table, 'with id', id)
    
    return this.request(async () => {
      const store = MOCK_DATA_STORE[table] || new Map()
      const deleted = store.delete(id)
      
      if (!deleted) {
        return {
          data: null,
          error: { code: 'NOT_FOUND', message: 'Record not found' }
        }
      }
      
      return {
        data: { success: true },
        error: null
      }
    })
  }

  async getAll(table, options = {}) {
    console.log('🎭 MOCK MODE: Getting all records from', table, options)
    
    return this.request(async () => {
      const result = this.buildQuery(table, options)
      return result
    })
  }

  // Initialize mock data
  initializeMockData() {
    console.log('🎭 MOCK MODE: Initializing mock data stores')
    
    // Initialize empty stores if they don't exist
    Object.keys(MOCK_DATA_STORE).forEach(table => {
      if (!MOCK_DATA_STORE[table]) {
        MOCK_DATA_STORE[table] = new Map()
      }
    })
  }
}

export const apiService = new MockApiService()
export default apiService

// Initialize mock data on import
apiService.initializeMockData()