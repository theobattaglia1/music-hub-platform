// stores/activity.js
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [],
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
        let query = supabase
          .from('artist_activity')
          .select(`
            *,
            user:profiles(name, avatar_url),
            artist:artists(name, slug)
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        if (artistId) {
          query = query.eq('artist_id', artistId)
        }

        const { data, error } = await query

        if (error) {
          // If table doesn't exist or has schema issues, handle gracefully
          if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('column')) {
            console.warn('Activity table schema issue:', error.message)
            // Try to create/fix the table
            await this.initializeActivityTable()
            return []
          }
          throw error
        }

        this.activities = data || []
        return this.activities
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
        const activityData = {
          user_id: authStore.user.id,
          artist_id: activity.artist_id,
          action_type: activity.action_type,
          target_type: activity.target_type || 'general',
          target_id: activity.target_id,
          description: activity.description,
          metadata: activity.metadata || {},
          created_at: new Date().toISOString()
        }

        // Validate required fields
        if (!activityData.action_type) {
          console.warn('Cannot log activity: action_type is required')
          return null
        }

        const { data, error } = await supabase
          .from('artist_activity')
          .insert([activityData])
          .select(`
            *,
            user:profiles(name, avatar_url),
            artist:artists(name, slug)
          `)
          .single()

        if (error) {
          // Handle constraint errors gracefully
          if (error.code === '23505') {
            console.warn('Duplicate activity prevented')
            return null
          }

          if (error.message.includes('target_type')) {
            console.warn('Invalid target_type:', activity.target_type)
            // Try with default target_type
            return await this.logActivity({
              ...activity,
              target_type: 'general'
            })
          }

          throw error
        }

        // Add to local state
        if (data) {
          this.activities.unshift(data)

          // Keep only recent activities in memory
          if (this.activities.length > 100) {
            this.activities = this.activities.slice(0, 100)
          }
        }

        return data
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

    // Initialize or fix the activity table structure
    async initializeActivityTable() {
      try {
        // This would typically be handled by migrations
        // For now, we'll just ensure the expected structure exists
        console.log('Checking artist_activity table structure...')

        // Try a simple query to test table existence
        const { error } = await supabase
          .from('artist_activity')
          .select('id')
          .limit(1)

        if (error) {
          console.error('Activity table needs setup:', error.message)

          // In a real app, you'd run a migration here
          // For now, we'll provide SQL that needs to be run manually

          const createTableSQL = `
            -- Run this SQL in your Supabase SQL editor to fix the activity table:

            CREATE TABLE IF NOT EXISTS artist_activity (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
              action_type TEXT NOT NULL,
              target_type TEXT DEFAULT 'general',
              target_id UUID,
              description TEXT NOT NULL,
              metadata JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Add RLS policies
            ALTER TABLE artist_activity ENABLE ROW LEVEL SECURITY;

            -- Policy: Users can view activities for artists they have access to
            CREATE POLICY "Users can view artist activities" ON artist_activity
              FOR SELECT USING (
                artist_id IN (
                  SELECT artist_id FROM artist_team_members
                  WHERE user_id = auth.uid()
                )
              );

            -- Policy: Users can insert activities for artists they have access to
            CREATE POLICY "Users can create artist activities" ON artist_activity
              FOR INSERT WITH CHECK (
                user_id = auth.uid() AND
                artist_id IN (
                  SELECT artist_id FROM artist_team_members
                  WHERE user_id = auth.uid()
                )
              );

            -- Add indexes for performance
            CREATE INDEX IF NOT EXISTS idx_artist_activity_artist_id ON artist_activity(artist_id);
            CREATE INDEX IF NOT EXISTS idx_artist_activity_user_id ON artist_activity(user_id);
            CREATE INDEX IF NOT EXISTS idx_artist_activity_created_at ON artist_activity(created_at);
            CREATE INDEX IF NOT EXISTS idx_artist_activity_action_type ON artist_activity(action_type);
          `

          console.log('Activity table SQL for manual setup:', createTableSQL)

          // Return empty array for now
          return []
        }

        console.log('Activity table structure OK')
        return true
      } catch (err) {
        console.error('Failed to initialize activity table:', err)
        return false
      }
    },

    // Clear activities (for testing or reset)
    clearActivities() {
      this.activities = []
      this.error = null
    },

    // Generate mock activities for development
    generateMockActivities(artistId, count = 10) {
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

      for (let i = 0; i < count; i++) {
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
        const description = descriptions[actionType][Math.floor(Math.random() * descriptions[actionType].length)]

        mockActivities.push({
          id: `mock-${i}`,
          user_id: 'mock-user',
          artist_id: artistId,
          action_type: actionType,
          target_type: actionType.split('_')[0],
          target_id: `mock-target-${i}`,
          description: description,
          metadata: {},
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          user: {
            name: ['Sarah Chen', 'Mike Johnson', 'Anna Rodriguez'][Math.floor(Math.random() * 3)],
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