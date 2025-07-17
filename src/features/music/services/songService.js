/**
 * Song service for API operations
 */

import { apiService } from '@/shared/services/api'
import { STORAGE_BUCKETS } from '@/core/constants'

class SongService {
  // Get all songs with filtering and pagination
  async getSongs(options = {}) {
    return apiService.getPaginated('songs', {
      select: `
        id, title, duration, file_url, cover_url, genre, release_date, created_at,
        artist:artists(id, name, slug, avatar_url)
      `,
      searchColumns: ['title', 'genre'],
      sort: 'created_at',
      order: 'desc',
      ...options
    })
  }

  // Get single song by ID
  async getSong(id) {
    const { data } = await apiService.getById('songs', id, `
      id, title, duration, file_url, cover_url, genre, release_date, lyrics, created_at, updated_at,
      artist:artists(id, name, slug, avatar_url)
    `)
    return data
  }

  // Create new song
  async createSong(songData, coverFile = null, audioFile = null) {
    let coverUrl = null
    let fileUrl = null

    // Upload cover if provided
    if (coverFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.SONG_COVERS, 
        coverFile,
        `${songData.title?.replace(/[^a-zA-Z0-9]/g, '-')}-cover`
      )
      coverUrl = uploadResult.publicUrl
    }

    // Upload audio file if provided
    if (audioFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.MEDIA_FILES, 
        audioFile,
        `${songData.title?.replace(/[^a-zA-Z0-9]/g, '-')}-audio`
      )
      fileUrl = uploadResult.publicUrl
    }

    const { data } = await apiService.create('songs', {
      ...songData,
      cover_url: coverUrl,
      file_url: fileUrl
    })

    return data
  }

  // Update song
  async updateSong(id, songData, coverFile = null, audioFile = null) {
    let updateData = { ...songData }

    // Upload new cover if provided
    if (coverFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.SONG_COVERS, 
        coverFile,
        `${id}-cover-${Date.now()}`
      )
      updateData.cover_url = uploadResult.publicUrl
    }

    // Upload new audio file if provided
    if (audioFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.MEDIA_FILES, 
        audioFile,
        `${id}-audio-${Date.now()}`
      )
      updateData.file_url = uploadResult.publicUrl
    }

    const { data } = await apiService.update('songs', id, updateData)
    return data
  }

  // Delete song
  async deleteSong(id) {
    return apiService.delete('songs', id)
  }

  // Get recent songs
  async getRecentSongs(limit = 50) {
    const { data } = await apiService.getAll('songs', {
      select: `
        id, title, duration, cover_url, genre, created_at,
        artist:artists(id, name, slug)
      `,
      sort: 'created_at',
      order: 'desc',
      page: 1,
      pageSize: limit
    })
    return data
  }

  // Search songs
  async searchSongs(query, options = {}) {
    return this.getSongs({
      search: query,
      searchColumns: ['title', 'genre'],
      ...options
    })
  }

  // Get songs by genre
  async getSongsByGenre(genre, options = {}) {
    return this.getSongs({
      filters: { genre },
      ...options
    })
  }

  // Get songs by artist
  async getSongsByArtist(artistId, options = {}) {
    return this.getSongs({
      filters: { artist_id: artistId },
      ...options
    })
  }
}

export const songService = new SongService()
export default songService