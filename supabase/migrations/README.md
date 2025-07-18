# Supabase Database Migrations

This directory contains the database migrations for the Music Hub Platform. These migrations create the foundation for replacing mock data with real Supabase queries throughout the application.

## Migration Files

### 001_initial_setup.sql
- Creates the `public.current_profile_id()` utility function for Row Level Security
- Creates/updates the `profiles` table with the missing `user_id` column
- Sets up basic RLS policies for user profiles
- Creates triggers for automatic profile creation on user signup

### 002_media_uploads.sql
- Creates `media_files` table for tracking uploaded files with metadata
- Creates `artists` table for artist management
- Creates `media_file_artists` junction table for many-to-many relationships
- Includes comprehensive RLS policies for secure access
- Supports file types: audio, video, image, document, other

### 003_calendar_events.sql
- Creates `calendar_events` table for event management
- Creates `calendar_event_attendees` table for tracking attendees
- Creates `calendar_event_reminders` table for notifications
- Supports event types: studio, performance, meeting, deadline, release, general
- Includes recurrence rules and external calendar integration

### 004_kanban_notes.sql
- Creates `note_categories` table for organizing notes
- Creates `kanban_notes` table with workflow status tracking
- Creates `note_attachments` table for file attachments
- Creates `note_comments` table for collaboration
- Creates `note_collaborators` table for shared notes
- Supports note types: task, idea, reminder, reference, meeting

### 005_moodboard_items.sql
- Creates `moodboards` table for visual collaboration boards
- Creates `moodboard_items` table for individual board items
- Creates `moodboard_collaborators` table for shared access
- Creates `moodboard_comments` table for feedback
- Creates `moodboard_versions` table for version history
- Supports item types: image, video, audio, text, link, color, shape

### 006_timeline_events.sql
- Creates `timeline_events` table for career milestones
- Creates `timeline_event_media` table for media attachments
- Creates `timeline_event_participants` table for tracking involvement
- Creates `timeline_event_achievements` table for awards/certifications
- Creates `timeline_event_links` table for external references
- Supports event types: release, performance, milestone, collaboration, award, media

### 007_artist_team_management.sql
- Creates `team_roles` table for defining roles and permissions
- Creates `team_members` table for team management
- Creates `team_invitations` table for invitation tracking
- Creates `team_activities` table for audit logging
- Creates `team_permissions` table with default permissions
- Supports both registered and external team members

### 008_file_access_logs.sql
- Creates `file_access_logs` table for comprehensive access tracking
- Creates `file_shares` table for file sharing functionality
- Creates `file_share_access_logs` table for share access tracking
- Creates `file_downloads` table for download management
- Creates `file_usage_analytics` table for aggregated statistics
- Includes utility functions for logging and analytics

## Key Features

### Row Level Security (RLS)
All tables implement comprehensive RLS policies to ensure:
- Users can only access their own data
- Collaborative features respect permission levels
- Public content is appropriately accessible
- System operations can function properly

### Utility Functions
- `public.current_profile_id()` - Gets current user's profile ID for RLS
- `public.handle_updated_at()` - Automatically updates `updated_at` timestamps
- `public.log_file_access()` - Logs file access events
- `public.generate_share_token()` / `public.generate_invitation_token()` - Generate secure tokens

### Triggers
- Automatic profile creation on user signup
- Updated timestamp management
- Activity logging for team changes
- Analytics aggregation for file access
- Note completion tracking

### Indexes
All tables include appropriate indexes for:
- Primary and foreign key relationships
- Common query patterns
- Full-text search capabilities (using GIN indexes for arrays/JSONB)
- Performance optimization for large datasets

## Data Types and Constraints

### Common Patterns
- UUIDs for all primary keys with `uuid_generate_v4()`
- Consistent timestamp fields: `created_at`, `updated_at`
- JSONB for flexible metadata storage
- Text arrays for tags and lists
- Check constraints for enum-like values
- Foreign key cascades for data integrity

### User References
- All user-owned content references `auth.users(id)`
- Support for both registered users and external contacts
- Cascade deletes to maintain data integrity

## Running Migrations

These migrations should be applied to your Supabase project in order:

1. Enable the required extensions (uuid-ossp, pgcrypto)
2. Run migrations 001-008 in sequence
3. Verify RLS policies are active
4. Test with sample data

## Next Steps

After applying these migrations:
1. Update the application's Supabase client configuration
2. Replace mock data calls with real Supabase queries
3. Implement proper error handling for database operations
4. Add data validation on the frontend
5. Set up real-time subscriptions for collaborative features