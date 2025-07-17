// stores/activity.js - MOCK MODE FOR LOCAL TESTING
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

// Local reactive activity data
const LOCAL_ACTIVITIES = []

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [...LOCAL_ACTIVITIES],
    loading: false,
    error: null
  }),

  getters: {
    recentActivities: (state) => {
      return state.activities
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
    },

    activitiesByArtist: (state) => (artistId) => {
      return state.activities.filter(activity => activity.artist_id === artistId)
    },

    activitiesByUser: (state) => (userId) => {
      return state.activities.filter(activity => activity.user_id === userId)
    }
  },

  actions: {
    // Load activities for a specific artist or all activities
    async loadActivities(artistId = null) {
      this.loading = true
      this.error = null

      try {
        console.log('🎭 MOCK MODE: Loading activities locally', artistId ? `for artist ${artistId}` : 'for all artists')
        
        // Generate some mock activities if none exist
        if (this.activities.length === 0) {
          this.generateMockActivities(artistId)
        }

        // Filter by artist if specified
        let filteredActivities = this.activities
        if (artistId) {
          filteredActivities = this.activities.filter(activity => activity.artist_id === artistId)
        }

        return filteredActivities
      } catch (err) {
        console.error('Failed to load activities:', err)
        this.error = err.message
        return []
      } finally {
        this.loading = false
      }
    },

    // Log a new activity
    async logActivity(activity) {
      const authStore = useAuthStore()

      if (!authStore.user) {
        console.warn('Cannot log activity: No user authenticated')
        return null
      }

      try {
        console.log('🎭 MOCK MODE: Logging activity locally', activity.action_type)

        const activityData = {
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: authStore.user.id,
          artist_id: activity.artist_id,
          action_type: activity.action_type,
          target_type: activity.target_type || 'general',
          target_id: activity.target_id,
          description: activity.description,
          metadata: activity.metadata || {},
          created_at: new Date().toISOString(),
          user: {
            name: authStore.userName,
            avatar_url: authStore.userAvatar
          },
          artist: {
            name: 'Mock Artist',
            slug: 'mock-artist'
          }
        }

        // Validate required fields
        if (!activityData.action_type) {
          console.warn('Cannot log activity: action_type is required')
          return null
        }

        // Add to local state
        this.activities.unshift(activityData)

        // Keep only recent activities in memory
        if (this.activities.length > 100) {
          this.activities = this.activities.slice(0, 100)
        }

        return activityData
      } catch (err) {
        console.error('Failed to log activity:', err)
        this.error = err.message
        return null
      }
    },

    // Helper methods for common activities
    async logMediaUpload(artistId, fileName, fileType) {
      return await this.logActivity({
        artist_id: artistId,
        action_type: 'media_upload',
        target_type: 'media',
        target_id: null,
        description: `Uploaded ${fileName}`,
        metadata: {
          file_name: fileName,
          file_type: fileType,
          upload_time: new Date().toISOString()
        }
      })
    },

    async logEventCreated(artistId, eventId, eventName) {
      return await this.logActivity({
        artist_id: artistId,
        action_type: 'event_created',
        target_type: 'event',
        target_id: eventId,
        description: `Created event "${eventName}"`,
        metadata: {
          event_name: eventName,
          event_id: eventId
        }
      })
    },

    async logTeamJoined(artistId, userId, userName, role) {
      return await this.logActivity({
        artist_id: artistId,
        action_type: 'team_joined',
        target_type: 'user',
        target_id: userId,
        description: `${userName} joined as ${role}`,
        metadata: {
          user_name: userName,
          role: role,
          joined_at: new Date().toISOString()
        }
      })
    },

    async logMoodboardUpdated(artistId, moodboardId, moodboardName) {
      return await this.logActivity({
        artist_id: artistId,
        action_type: 'moodboard_updated',
        target_type: 'moodboard',
        target_id: moodboardId,
        description: `Updated moodboard "${moodboardName}"`,
        metadata: {
          moodboard_name: moodboardName,
          moodboard_id: moodboardId
        }
      })
    },

    async logNoteAdded(artistId, noteId, noteTitle) {
      return await this.logActivity({
        artist_id: artistId,
        action_type: 'note_added',
        target_type: 'note',
        target_id: noteId,
        description: `Added note "${noteTitle}"`,
        metadata: {
          note_title: noteTitle,
          note_id: noteId
        }
      })
    },

    async logPlaylistCreated(artistId, playlistId, playlistName) {
      return await this.logActivity({
        artist_id: artistId,
        action_type: 'playlist_created',
        target_type: 'playlist',
        target_id: playlistId,
        description: `Created playlist "${playlistName}"`,
        metadata: {
          playlist_name: playlistName,
          playlist_id: playlistId
        }
      })
    },

    // Initialize or fix the activity table structure (mocked)
    async initializeActivityTable() {
      try {
        console.log('🎭 MOCK MODE: Activity table initialized locally')
        return true
      } catch (err) {
        console.error('Failed to initialize activity table:', err)
        return false
      }
    },

    // Clear activities (for testing or reset)
    clearActivities() {
      console.log('🎭 MOCK MODE: Clearing local activities')
      this.activities = []
      this.error = null
    },

    // Generate mock activities for development
    generateMockActivities(artistId, count = 10) {
      console.log('🎭 MOCK MODE: Generating mock activities', { artistId, count })
      
      const mockActivities = []
      const actionTypes = [
        'media_upload',
        'event_created',
        'team_joined',
        'moodboard_updated',
        'note_added',
        'playlist_created'
      ]

      const descriptions = {
        media_upload: ['Uploaded demo track', 'Added album artwork', 'Shared voice memo'],
        event_created: ['Created studio session', 'Scheduled recording', 'Added tour date'],
        team_joined: ['Sarah joined as producer', 'Mike joined as engineer', 'Anna joined as manager'],
        moodboard_updated: ['Updated visual concepts', 'Added inspiration images', 'Refined color palette'],
        note_added: ['Added songwriting idea', 'Noted production feedback', 'Saved lyric concept'],
        playlist_created: ['Created demo collection', 'Made reference playlist', 'Organized unreleased tracks']
      }

      const mockArtistIds = artistId ? [artistId] : ['1', '2', '3']
      
      for (let i = 0; i < count; i++) {
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
        const description = descriptions[actionType][Math.floor(Math.random() * descriptions[actionType].length)]
        const selectedArtistId = mockArtistIds[Math.floor(Math.random() * mockArtistIds.length)]

        mockActivities.push({
          id: `mock-activity-${i}`,
          user_id: 'mock-user-123',
          artist_id: selectedArtistId,
          action_type: actionType,
          target_type: actionType.split('_')[0],
          target_id: `mock-target-${i}`,
          description: description,
          metadata: {},
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            name: ['Demo User', 'Sarah Chen', 'Mike Johnson', 'Anna Rodriguez'][Math.floor(Math.random() * 4)],
            avatar_url: null
          },
          artist: {
            name: 'Mock Artist',
            slug: 'mock-artist'
          }
        })
      }

      this.activities = mockActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return mockActivities
    }
  }
})