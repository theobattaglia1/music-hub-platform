# Database Migrations

This directory contains the database schema and migration files for the Music Hub Platform.

## Setup Instructions

### 1. Run Migrations in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migrations in order:
   - First: `001_comprehensive_schema.sql`
   - Second: `002_rls_policies.sql`

### 2. Set up Storage Buckets

In the Supabase dashboard, go to Storage and create the following buckets:

1. **media** (Private bucket for audio/video/documents)
   - Create bucket with name: `media`
   - Set as private (not public)

2. **avatars** (Public bucket for user avatars)
   - Create bucket with name: `avatars`
   - Set as public

3. **covers** (Public bucket for album/playlist covers)
   - Create bucket with name: `covers`
   - Set as public

### 3. Configure Storage Policies

After creating the buckets, run the following policies in the SQL Editor:

```sql
-- Media bucket policies (private by default)
CREATE POLICY "Users can view media they have access to" ON storage.objects FOR SELECT USING (
    bucket_id = 'media' AND (
        EXISTS (
            SELECT 1 FROM media m
            JOIN artist_team at ON m.artist_id = at.artist_id 
            WHERE m.file_path = name 
            AND at.user_id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM media m 
            WHERE m.file_path = name 
            AND m.is_public = true
        )
    )
);

CREATE POLICY "Team members can upload media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'media' AND auth.role() = 'authenticated'
);

CREATE POLICY "Team members can delete their media" ON storage.objects FOR DELETE USING (
    bucket_id = 'media' AND (
        EXISTS (
            SELECT 1 FROM media m
            JOIN artist_team at ON m.artist_id = at.artist_id 
            WHERE m.file_path = name 
            AND at.user_id = auth.uid()
            AND at.role IN ('owner', 'editor')
        )
    )
);

-- Avatar bucket policies (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete avatars" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- Cover images bucket policies (public)
CREATE POLICY "Anyone can view covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Team members can upload covers" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'covers' AND auth.role() = 'authenticated'
);
CREATE POLICY "Team members can update covers" ON storage.objects FOR UPDATE USING (
    bucket_id = 'covers' AND auth.role() = 'authenticated'
);
CREATE POLICY "Team members can delete covers" ON storage.objects FOR DELETE USING (
    bucket_id = 'covers' AND auth.role() = 'authenticated'
);
```

## Database Schema Overview

### Core Tables

- **profiles** - User profiles with roles and preferences
- **artists** - Artist/band information
- **artist_team** - Many-to-many relationship between users and artists
- **media** - Audio, video, image, and document files
- **events** - Calendar events and scheduling
- **notes** - Kanban-style task management
- **moodboard_items** - Visual mood board elements
- **timeline_events** - Career timeline and milestones
- **playlists** - Music playlists and collections
- **file_access_logs** - Audit trail for file access

### User Roles

- **owner** - Full access to everything
- **editor** - Can edit artist content and manage team
- **invoicer** - Shared pattern with accounting tool (optional)
- **artist** - Access to their own workspace, can upload content
- **viewer** - Read-only access

### Row Level Security (RLS)

All tables have RLS enabled with policies that enforce:
- Users can only access data for artists they're team members of
- Role-based permissions for create/update/delete operations
- Public content can be viewed by anyone
- Audit logs are restricted to owners and editors

### Automatic Profile Creation

A database trigger automatically creates a user profile when a new user signs up through Supabase Auth.

## Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Data Model Relationships

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles
    ↓ (1:many via artist_team)
artists
    ↓ (1:many)
├── media
├── events  
├── notes
├── moodboard_items
├── timeline_events
└── playlists

media
    ↓ (1:many)
file_access_logs
```

## Migration Notes

- The schema is designed to be backwards compatible with existing data
- `user_id` column is added to existing profiles table if missing
- All triggers and indexes are created with `IF NOT EXISTS` where possible
- The migration is idempotent and can be run multiple times safely