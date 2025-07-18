/**
 * Core API service with real Supabase integration
 */

import { supabase } from '@/lib/supabase'

class ApiService {
  constructor() {
    this.timeout = 30000 // 30 second timeout
    this.retryAttempts = 3
    this.retryDelay = 1000
  }

  // Generic request handler with retry logic
  async request(operation, retryCount = 0) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.timeout)
        )
      ])
      
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

  // Handle Supabase errors
  handleSupabaseError(error) {
    const errorMap = {
      'PGRST301': 'Resource not found',
      'PGRST116': 'Unauthorized access',
      '22P02': 'Invalid data format',
      '23505': 'Resource already exists',
      '42501': 'Insufficient permissions'
    }

    const message = errorMap[error.code] || error.message || 'Database error'
    
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
    return retryableCodes.includes(error.code) || 
           error.message?.includes('timeout') ||
           error.message?.includes('network')
  }

  // Delay utility for retries
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Query builder for Supabase
  buildQuery(table, options = {}) {
    let query = supabase.from(table)

    // Select columns
    if (options.select) {
      query = query.select(options.select)
    } else {
      query = query.select('*')
    }

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'string' && value.includes('*')) {
            const searchValue = value.replace(/\*/g, '%')
            query = query.like(key, searchValue)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Apply search
    if (options.search && options.searchFields) {
      const searchFields = Array.isArray(options.searchFields) 
        ? options.searchFields 
        : [options.searchFields]
      
      // Use textSearch for full-text search or ilike for pattern matching
      if (searchFields.length === 1) {
        query = query.ilike(searchFields[0], `%${options.search}%`)
      } else {
        // For multiple fields, we need to use or() with multiple conditions
        const orConditions = searchFields.map(field => `${field}.ilike.%${options.search}%`).join(',')
        query = query.or(orConditions)
      }
    }

    // Apply sorting
    if (options.sortBy) {
      const ascending = options.sortOrder !== 'desc'
      query = query.order(options.sortBy, { ascending })
    }

    // Apply pagination
    if (options.page && options.pageSize) {
      const from = (options.page - 1) * options.pageSize
      const to = from + options.pageSize - 1
      query = query.range(from, to)
    } else if (options.limit) {
      query = query.limit(options.limit)
    }

    return query
  }

  // Generic CRUD operations

  // Get all records with optional filtering/sorting/pagination
  async getAll(table, options = {}) {
    return this.request(async () => {
      const query = this.buildQuery(table, options)
      return await query
    })
  }

  // Get a single record by ID
  async getById(table, id, select = '*') {
    return this.request(async () => {
      return await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single()
    })
  }

  // Create a new record
  async create(table, data) {
    return this.request(async () => {
      return await supabase
        .from(table)
        .insert(data)
        .select()
        .single()
    })
  }

  // Update a record by ID
  async update(table, id, data) {
    return this.request(async () => {
      return await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()
    })
  }

  // Delete a record by ID
  async delete(table, id) {
    return this.request(async () => {
      return await supabase
        .from(table)
        .delete()
        .eq('id', id)
    })
  }

  // Upsert (insert or update) a record
  async upsert(table, data, onConflict = 'id') {
    return this.request(async () => {
      return await supabase
        .from(table)
        .upsert(data, { onConflict })
        .select()
        .single()
    })
  }

  // Get count of records
  async getCount(table, options = {}) {
    return this.request(async () => {
      let query = supabase
        .from(table)
        .select('id', { count: 'exact', head: true })

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              query = query.in(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      return await query
    })
  }

  // Real-time subscriptions
  createSubscription(table, callback, filter = null) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        callback
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      }
    }
  }

  // Storage operations
  async uploadFile(bucket, file, path = null) {
    const fileExt = file.name.split('.').pop()
    const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    return this.request(async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return { ...data, publicUrl }
    })
  }

  async deleteFile(bucket, path) {
    return this.request(async () => {
      return await supabase.storage
        .from(bucket)
        .remove([path])
    })
  }

  getFileUrl(bucket, path) {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return publicUrl
  }

  // Domain-specific API methods

  // Profile methods
  async getProfile(userId = null) {
    const targetUserId = userId || (await this.getCurrentUser())?.id
    if (!targetUserId) return { data: null, error: { message: 'No user found' } }

    return this.getById('profiles', targetUserId)
  }

  async updateProfile(userId, data) {
    return this.update('profiles', userId, data)
  }

  // Artist methods
  async getArtistsByUser(userId = null) {
    const targetUserId = userId || (await this.getCurrentUser())?.id
    if (!targetUserId) return { data: [], error: null }

    return this.request(async () => {
      return await supabase
        .from('artists')
        .select(`
          *,
          artist_team!inner(role)
        `)
        .eq('artist_team.user_id', targetUserId)
    })
  }

  async getArtistTeam(artistId) {
    return this.request(async () => {
      return await supabase
        .from('artist_team')
        .select(`
          *,
          profiles(id, full_name, email, avatar_url)
        `)
        .eq('artist_id', artistId)
    })
  }

  // Media methods
  async getArtistMedia(artistId, options = {}) {
    return this.getAll('media', {
      ...options,
      filters: { artist_id: artistId, ...options.filters }
    })
  }

  async uploadArtistMedia(artistId, file, metadata = {}) {
    try {
      // Upload file to storage
      const { data: uploadData, publicUrl } = await this.uploadFile('media', file)
      
      // Create media record in database
      const mediaData = {
        artist_id: artistId,
        title: metadata.title || file.name,
        description: metadata.description || '',
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        media_type: this.getMediaType(file.type),
        metadata: metadata.audioMetadata || {},
        uploaded_by: (await this.getCurrentUser())?.id
      }

      const { data: media, error } = await this.create('media', mediaData)
      
      if (error) throw error

      return { data: { ...media, publicUrl }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Calendar methods
  async getArtistEvents(artistId, options = {}) {
    return this.getAll('events', {
      ...options,
      filters: { artist_id: artistId, ...options.filters }
    })
  }

  // Notes methods
  async getArtistNotes(artistId, options = {}) {
    return this.getAll('notes', {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
      sortBy: options.sortBy || 'position'
    })
  }

  async updateNotePosition(noteId, position) {
    return this.update('notes', noteId, { position })
  }

  // Moodboard methods
  async getArtistMoodboardItems(artistId, options = {}) {
    return this.getAll('moodboard_items', {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
      sortBy: options.sortBy || 'z_index'
    })
  }

  // Timeline methods
  async getArtistTimelineEvents(artistId, options = {}) {
    return this.getAll('timeline_events', {
      ...options,
      filters: { artist_id: artistId, ...options.filters },
      sortBy: options.sortBy || 'event_date'
    })
  }

  // Playlist methods
  async getArtistPlaylists(artistId, options = {}) {
    return this.getAll('playlists', {
      ...options,
      filters: { artist_id: artistId, ...options.filters }
    })
  }

  // Team management methods
  async inviteTeamMember(artistId, email, role = 'viewer') {
    try {
      // First check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('email', email)
        .single()

      if (existingUser) {
        // Add to team directly
        return await this.create('artist_team', {
          artist_id: artistId,
          user_id: existingUser.user_id,
          role,
          invited_by: (await this.getCurrentUser())?.id,
          accepted_at: new Date().toISOString()
        })
      } else {
        // Create invitation record (to be implemented with email service)
        return { 
          data: null, 
          error: { message: 'User not found. Email invitation not yet implemented.' } 
        }
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  async removeTeamMember(artistId, userId) {
    return this.request(async () => {
      return await supabase
        .from('artist_team')
        .delete()
        .eq('artist_id', artistId)
        .eq('user_id', userId)
    })
  }

  async updateTeamMemberRole(artistId, userId, role) {
    return this.request(async () => {
      return await supabase
        .from('artist_team')
        .update({ role })
        .eq('artist_id', artistId)
        .eq('user_id', userId)
        .select()
        .single()
    })
  }

  // Utility methods
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  getMediaType(mimeType) {
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('image/')) return 'image'
    return 'document'
  }

  // Activity logging
  async logActivity(artistId, action, metadata = {}) {
    try {
      // This could be implemented with a separate activity table
      console.log('Activity logged:', { artistId, action, metadata })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }
}

export const apiService = new ApiService()
export default apiService