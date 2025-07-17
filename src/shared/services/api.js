/**
 * Core API service for Supabase integration
 */

import { supabase } from '@/lib/supabase'
import { API_CONFIG, ERROR_MESSAGES } from '@/core/constants'

class ApiService {
  constructor() {
    this.supabase = supabase
    this.timeout = API_CONFIG.REQUEST_TIMEOUT
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS
    this.retryDelay = API_CONFIG.RETRY_DELAY
  }

  // Generic request handler with retry logic
  async request(operation, retryCount = 0) {
    try {
      const result = await operation()
      
      if (result.error) {
        throw this.handleSupabaseError(result.error)
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

  // Handle Supabase-specific errors
  handleSupabaseError(error) {
    const errorMap = {
      'auth/invalid-email': ERROR_MESSAGES.VALIDATION_ERROR,
      'auth/user-not-found': ERROR_MESSAGES.NOT_FOUND,
      'auth/wrong-password': ERROR_MESSAGES.UNAUTHORIZED,
      'PGRST116': ERROR_MESSAGES.NOT_FOUND,
      'PGRST301': ERROR_MESSAGES.UNAUTHORIZED,
    }

    const message = errorMap[error.code] || error.message || ERROR_MESSAGES.GENERIC_ERROR
    
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

  // Query builder helpers
  buildQuery(table, options = {}) {
    let query = supabase.from(table)

    // Select specific columns
    if (options.select) {
      query = query.select(options.select)
    }

    // Filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'string' && value.includes('*')) {
            query = query.ilike(key, value.replace(/\*/g, '%'))
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Search
    if (options.search && options.searchColumns) {
      const searchConditions = options.searchColumns.map(column => 
        `${column}.ilike.%${options.search}%`
      ).join(',')
      query = query.or(searchConditions)
    }

    // Sorting
    if (options.sort) {
      const ascending = options.order !== 'desc'
      query = query.order(options.sort, { ascending })
    }

    // Pagination
    if (options.page && options.pageSize) {
      const from = (options.page - 1) * options.pageSize
      const to = from + options.pageSize - 1
      query = query.range(from, to)
    }

    return query
  }

  // Pagination helper
  async getPaginated(table, options = {}) {
    const pageSize = options.pageSize || API_CONFIG.DEFAULT_PAGE_SIZE
    const page = options.page || 1

    // Get total count
    const countQuery = this.buildQuery(table, { ...options, page: undefined, pageSize: undefined })
    const { count } = await this.request(() => 
      countQuery.select('*', { count: 'exact', head: true })
    )

    // Get data
    const dataQuery = this.buildQuery(table, { ...options, page, pageSize })
    const { data } = await this.request(() => dataQuery)

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasNext: page * pageSize < count,
      hasPrevious: page > 1
    }
  }

  // Storage helpers
  async uploadFile(bucket, file, path = null) {
    const fileExt = file.name.split('.').pop()
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw this.handleSupabaseError(error)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return {
      ...data,
      publicUrl,
      fileName
    }
  }

  async deleteFile(bucket, path) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw this.handleSupabaseError(error)
    return true
  }

  // Real-time subscriptions
  createSubscription(table, callback, filter = null) {
    let subscription = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          ...(filter && { filter })
        }, 
        callback
      )

    subscription.subscribe()

    return subscription
  }

  // Auth helpers
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw this.handleSupabaseError(error)
    return user
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw this.handleSupabaseError(error)
    return true
  }

  // Generic CRUD operations
  async create(table, data) {
    return this.request(() => 
      supabase
        .from(table)
        .insert(data)
        .select()
        .single()
    )
  }

  async getById(table, id, select = '*') {
    return this.request(() =>
      supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single()
    )
  }

  async update(table, id, data) {
    return this.request(() =>
      supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()
    )
  }

  async delete(table, id) {
    return this.request(() =>
      supabase
        .from(table)
        .delete()
        .eq('id', id)
    )
  }

  async getAll(table, options = {}) {
    const query = this.buildQuery(table, options)
    return this.request(() => query)
  }
}

export const apiService = new ApiService()
export default apiService