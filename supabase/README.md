# Supabase Configuration

This directory contains the Supabase configuration and migrations for the Music Hub Platform.

## Project Structure

```
supabase/
├── migrations/           # Database migrations
│   ├── 001_initial_setup.sql
│   ├── 002_media_uploads.sql
│   ├── 003_calendar_events.sql
│   ├── 004_kanban_notes.sql
│   ├── 005_moodboard_items.sql
│   ├── 006_timeline_events.sql
│   ├── 007_artist_team_management.sql
│   ├── 008_file_access_logs.sql
│   └── README.md
└── README.md            # This file
```

## Environment Variables

Make sure your `.env` file contains the correct Supabase configuration:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema Overview

The database schema supports the following core features:

### User Management
- **profiles**: Extended user profiles with roles and preferences
- User authentication handled by Supabase Auth

### Content Management
- **media_files**: File uploads with metadata and access control
- **artists**: Artist profiles and information
- **media_file_artists**: Many-to-many relationships

### Calendar & Events
- **calendar_events**: Event scheduling and management
- **calendar_event_attendees**: Event participation tracking
- **calendar_event_reminders**: Notification system

### Notes & Tasks
- **kanban_notes**: Task management with workflow states
- **note_categories**: Organization and categorization
- **note_attachments**: File attachments for notes
- **note_comments**: Collaborative discussion
- **note_collaborators**: Shared access permissions

### Visual Collaboration
- **moodboards**: Visual inspiration boards
- **moodboard_items**: Individual items on boards
- **moodboard_collaborators**: Shared board access
- **moodboard_comments**: Feedback and discussion
- **moodboard_versions**: Version history tracking

### Timeline & Milestones
- **timeline_events**: Career and project milestones
- **timeline_event_media**: Media attachments
- **timeline_event_participants**: People involved
- **timeline_event_achievements**: Awards and recognitions
- **timeline_event_links**: External references

### Team Management
- **team_members**: Team member profiles and roles
- **team_roles**: Custom role definitions
- **team_invitations**: Invitation system
- **team_activities**: Audit trail
- **team_permissions**: Granular permission system

### Analytics & Logging
- **file_access_logs**: Comprehensive access tracking
- **file_shares**: File sharing with permissions
- **file_downloads**: Download management
- **file_usage_analytics**: Aggregated statistics

## Security Features

### Row Level Security (RLS)
All tables implement RLS policies ensuring:
- Data isolation between users
- Proper permission checking for shared content
- Secure access for collaborative features

### Key Security Functions
- `public.current_profile_id()`: Safe user identification for RLS
- Comprehensive permission checking
- Secure token generation for shares and invitations

## Getting Started

1. **Apply Migrations**: Run all migration files in order (001-008)
2. **Verify Setup**: Check that all tables and policies are created
3. **Test Authentication**: Ensure user signup creates profiles correctly
4. **Update Application**: Replace mock data with real Supabase queries

## Migration Commands

If using Supabase CLI:

```bash
# Initialize Supabase project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push migrations to remote
supabase db push

# Or apply individual migrations
supabase db reset
```

## Development Workflow

1. **Local Development**: Use the existing mock data during development
2. **Database Integration**: Apply migrations to development database
3. **Replace Mocks**: Gradually replace mock calls with Supabase queries
4. **Testing**: Verify all features work with real data
5. **Production**: Apply migrations to production database

## Troubleshooting

### Common Issues
- **Permission Denied**: Check RLS policies are correctly configured
- **Foreign Key Errors**: Ensure migrations are applied in correct order
- **Extension Errors**: Verify uuid-ossp and pgcrypto extensions are enabled

### Verification Queries
```sql
-- Check if extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Test current_profile_id function
SELECT public.current_profile_id();
```