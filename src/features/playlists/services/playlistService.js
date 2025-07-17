/**
 * Playlist service for API operations
 */

import { apiService } from '@/shared/services/api'
import { STORAGE_BUCKETS } from '@/core/constants'

class PlaylistService {
  // Get all playlists with filtering and pagination
  async getPlaylists(options = {}) {
    return apiService.getPaginated('playlists', {
      select: 'id, name, description, cover_url, is_public, song_count, total_duration, created_at, updated_at',
      searchColumns: ['name', 'description'],
      sort: 'updated_at',
      order: 'desc',
      ...options
    })
  }

  // Get single playlist by ID
  async getPlaylist(id) {
    const { data } = await apiService.getById('playlists', id, 
      'id, name, description, cover_url, is_public, song_count, total_duration, created_at, updated_at'
    )
    return data
  }

  // Create new playlist
  async createPlaylist(playlistData, coverFile = null) {
    let coverUrl = null

    // Upload cover if provided
    if (coverFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.SONG_COVERS, 
        coverFile,
        `${playlistData.name?.replace(/[^a-zA-Z0-9]/g, '-')}-cover`
      )
      coverUrl = uploadResult.publicUrl
    }

    const { data } = await apiService.create('playlists', {
      ...playlistData,
      cover_url: coverUrl,
      song_count: 0,
      total_duration: 0
    })

    return data
  }

  // Update playlist
  async updatePlaylist(id, playlistData, coverFile = null) {
    let updateData = { ...playlistData }

    // Upload new cover if provided
    if (coverFile) {
      const uploadResult = await apiService.uploadFile(
        STORAGE_BUCKETS.SONG_COVERS, 
        coverFile,
        `${id}-cover-${Date.now()}`
      )
      updateData.cover_url = uploadResult.publicUrl
    }

    const { data } = await apiService.update('playlists', id, updateData)
    return data
  }

  // Delete playlist
  async deletePlaylist(id) {
    return apiService.delete('playlists', id)
  }

  // Get playlist songs
  async getPlaylistSongs(playlistId, options = {}) {
    return apiService.getPaginated('playlist_songs', {
      select: `
        id, position, added_at,
        song:songs(
          id, title, duration, cover_url, genre,
          artist:artists(id, name, slug)
        )
      `,
      filters: { playlist_id: playlistId },
      sort: 'position',
      order: 'asc',
      ...options
    })
  }

  // Add song to playlist
  async addSongToPlaylist(playlistId, songId, position = null) {
    // Get current max position if not specified
    if (position === null) {
      const { data: existingSongs } = await apiService.getAll('playlist_songs', {
        select: 'position',
        filters: { playlist_id: playlistId },
        sort: 'position',
        order: 'desc',
        pageSize: 1
      })
      position = existingSongs.length > 0 ? existingSongs[0].position + 1 : 0
    }

    const { data } = await apiService.create('playlist_songs', {
      playlist_id: playlistId,
      song_id: songId,
      position
    })

    // Update playlist stats
    await this.updatePlaylistStats(playlistId)

    return data
  }

  // Remove song from playlist
  async removeSongFromPlaylist(playlistId, songId) {
    const result = await apiService.request(() =>
      apiService.supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId)
    )

    // Update playlist stats
    await this.updatePlaylistStats(playlistId)

    return result
  }

  // Reorder songs in playlist
  async reorderPlaylistSongs(playlistId, songIds) {
    const updates = songIds.map((songId, index) => ({
      playlist_id: playlistId,
      song_id: songId,
      position: index
    }))

    const { data } = await apiService.request(() =>
      apiService.supabase
        .from('playlist_songs')
        .upsert(updates, { onConflict: 'playlist_id,song_id' })
    )

    return data
  }

  // Update playlist statistics (song count, total duration)
  async updatePlaylistStats(playlistId) {
    const { data: stats } = await apiService.request(() =>
      apiService.supabase
        .from('playlist_songs')
        .select(`
          song:songs(duration)
        `)
        .eq('playlist_id', playlistId)
    )

    const songCount = stats.length
    const totalDuration = stats.reduce((total, item) => 
      total + (item.song?.duration || 0), 0
    )

    return apiService.update('playlists', playlistId, {
      song_count: songCount,
      total_duration: totalDuration
    })
  }

  // Get user's playlists
  async getUserPlaylists(userId, options = {}) {
    return this.getPlaylists({
      filters: { user_id: userId },
      ...options
    })
  }

  // Get public playlists
  async getPublicPlaylists(options = {}) {
    return this.getPlaylists({
      filters: { is_public: true },
      ...options
    })
  }

  // Search playlists
  async searchPlaylists(query, options = {}) {
    return this.getPlaylists({
      search: query,
      searchColumns: ['name', 'description'],
      ...options
    })
  }
}

export const playlistService = new PlaylistService()
export default playlistService