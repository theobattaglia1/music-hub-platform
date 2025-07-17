/**
 * Artist service for API operations
 */

import { apiService } from '@/shared/services/api'
import { STORAGE_BUCKETS } from '@/core/constants'

class ArtistService {
  // Get all artists with filtering and pagination
  async getArtists(options = {}) {
    return apiService.getPaginated('artists', {
      select: 'id, name, slug, bio, avatar_url, website_url, social_links, created_at',
      searchColumns: ['name', 'bio'],
      sort: 'name',
      ...options
    })
  }

  // Get single artist by ID
  async getArtist(id) {
    const { data } = await apiService.getById('artists', id, 
      'id, name, slug, bio, avatar_url, website_url, social_links, created_at, updated_at'
    )
    return data
  }

  // Get artist by slug
  async getArtistBySlug(slug) {
    const { data } = await apiService.request(() =>
      apiService.supabase
        .from('artists')
        .select('id, name, slug, bio, avatar_url, website_url, social_links, created_at, updated_at')
        .eq('slug', slug)
        .single()
    )
    return data
  }

  // Create new artist
  async createArtist(artistData, avatarFile = null) {
    let avatarUrl = null

    // Upload avatar if provided
    if (avatarFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.ARTIST_AVATARS, 
        avatarFile,
        `${artistData.slug || Date.now()}-avatar`
      )
      avatarUrl = uploadResult.publicUrl
    }

    const { data } = await apiService.create('artists', {
      ...artistData,
      avatar_url: avatarUrl
    })

    return data
  }

  // Update artist
  async updateArtist(id, artistData, avatarFile = null) {
    let updateData = { ...artistData }

    // Upload new avatar if provided
    if (avatarFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.ARTIST_AVATARS, 
        avatarFile,
        `${id}-avatar-${Date.now()}`
      )
      updateData.avatar_url = uploadResult.publicUrl
    }

    const { data } = await apiService.update('artists', id, updateData)
    return data
  }

  // Delete artist
  async deleteArtist(id) {
    return apiService.delete('artists', id)
  }

  // Get artist's songs
  async getArtistSongs(artistId, options = {}) {
    return apiService.getPaginated('songs', {
      select: 'id, title, duration, file_url, cover_url, genre, release_date, created_at',
      filters: { artist_id: artistId },
      sort: 'created_at',
      order: 'desc',
      ...options
    })
  }

  // Get artist's events
  async getArtistEvents(artistId, options = {}) {
    return apiService.getPaginated('artist_events', {
      select: 'id, title, description, start_date, end_date, venue, event_type, created_at',
      filters: { artist_id: artistId },
      sort: 'start_date',
      order: 'asc',
      ...options
    })
  }

  // Get recent artists (for dashboard/sidebar)
  async getRecentArtists(limit = 10) {
    const { data } = await apiService.getAll('artists', {
      select: 'id, name, slug, avatar_url',
      sort: 'updated_at',
      order: 'desc',
      page: 1,
      pageSize: limit
    })
    return data
  }

  // Search artists
  async searchArtists(query, options = {}) {
    return this.getArtists({
      search: query,
      searchColumns: ['name', 'bio'],
      ...options
    })
  }
}

export const artistService = new ArtistService()
export default artistService