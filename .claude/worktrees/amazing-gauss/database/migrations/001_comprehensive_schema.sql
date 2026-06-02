-- Comprehensive Music Hub Platform Database Schema
-- This migration creates all tables needed for the platform

-- Enable RLS globally
ALTER DATABASE postgres SET row_security = on;

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'editor', 'invoicer', 'artist', 'viewer');
CREATE TYPE event_type AS ENUM ('recording', 'performance', 'meeting', 'deadline', 'release');
CREATE TYPE note_status AS ENUM ('todo', 'in_progress', 'done', 'archived');
CREATE TYPE note_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE timeline_event_type AS ENUM ('milestone', 'release', 'achievement', 'collaboration');
CREATE TYPE media_type AS ENUM ('audio', 'video', 'image', 'document');
CREATE TYPE access_action AS ENUM ('view', 'download', 'upload', 'delete', 'share');

-- Profiles table (update existing to add user_id)
-- First check if profiles table exists and add user_id if missing
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON profiles(user_id);
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'viewer';
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'social_links'
    ) THEN
        ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;
EXCEPTION 
    WHEN undefined_table THEN
        -- Create profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            avatar_url TEXT,
            role user_role DEFAULT 'viewer',
            preferences JSONB DEFAULT '{}',
            social_links JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE UNIQUE INDEX profiles_user_id_key ON profiles(user_id);
        CREATE INDEX profiles_email_idx ON profiles(email);
END $$;

-- Artists table
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    genre TEXT,
    location TEXT,
    website TEXT,
    social_links JSONB DEFAULT '{}',
    avatar_url TEXT,
    banner_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS artists_name_idx ON artists(name);
CREATE INDEX IF NOT EXISTS artists_genre_idx ON artists(genre);
CREATE INDEX IF NOT EXISTS artists_created_by_idx ON artists(created_by);

-- Artist team members (many-to-many between users and artists)
CREATE TABLE IF NOT EXISTS artist_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(artist_id, user_id)
);

CREATE INDEX IF NOT EXISTS artist_team_artist_idx ON artist_team(artist_id);
CREATE INDEX IF NOT EXISTS artist_team_user_idx ON artist_team(user_id);
CREATE INDEX IF NOT EXISTS artist_team_role_idx ON artist_team(role);

-- Media files table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    media_type media_type NOT NULL,
    duration INTEGER, -- For audio/video in seconds
    metadata JSONB DEFAULT '{}', -- For audio metadata, image EXIF, etc.
    thumbnail_path TEXT, -- For videos and images
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS media_artist_idx ON media(artist_id);
CREATE INDEX IF NOT EXISTS media_type_idx ON media(media_type);
CREATE INDEX IF NOT EXISTS media_uploaded_by_idx ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS media_tags_idx ON media USING GIN(tags);
CREATE INDEX IF NOT EXISTS media_public_idx ON media(is_public);

-- Calendar events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type event_type DEFAULT 'meeting',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    is_all_day BOOLEAN DEFAULT false,
    recurring_rule TEXT, -- RRULE format
    attendees JSONB DEFAULT '[]', -- Array of user IDs or external emails
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_artist_idx ON events(artist_id);
CREATE INDEX IF NOT EXISTS events_start_time_idx ON events(start_time);
CREATE INDEX IF NOT EXISTS events_end_time_idx ON events(end_time);
CREATE INDEX IF NOT EXISTS events_type_idx ON events(event_type);
CREATE INDEX IF NOT EXISTS events_created_by_idx ON events(created_by);

-- Kanban notes table  
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    status note_status DEFAULT 'todo',
    priority note_priority DEFAULT 'medium',
    position INTEGER DEFAULT 0, -- For drag-and-drop ordering
    due_date TIMESTAMP WITH TIME ZONE,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    labels TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]', -- File references
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_artist_idx ON notes(artist_id);
CREATE INDEX IF NOT EXISTS notes_status_idx ON notes(status);
CREATE INDEX IF NOT EXISTS notes_priority_idx ON notes(priority);
CREATE INDEX IF NOT EXISTS notes_assignee_idx ON notes(assignee_id);
CREATE INDEX IF NOT EXISTS notes_created_by_idx ON notes(created_by);
CREATE INDEX IF NOT EXISTS notes_position_idx ON notes(position);
CREATE INDEX IF NOT EXISTS notes_labels_idx ON notes USING GIN(labels);

-- Moodboard items table
CREATE TABLE IF NOT EXISTS moodboard_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    item_type TEXT NOT NULL, -- 'image', 'text', 'color', 'link', etc.
    content JSONB NOT NULL, -- Stores the actual content (image URL, text, hex color, etc.)
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    width FLOAT DEFAULT 200,
    height FLOAT DEFAULT 200,
    rotation FLOAT DEFAULT 0,
    z_index INTEGER DEFAULT 0,
    style_props JSONB DEFAULT '{}', -- CSS properties, borders, shadows, etc.
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS moodboard_items_artist_idx ON moodboard_items(artist_id);
CREATE INDEX IF NOT EXISTS moodboard_items_type_idx ON moodboard_items(item_type);
CREATE INDEX IF NOT EXISTS moodboard_items_z_index_idx ON moodboard_items(z_index);
CREATE INDEX IF NOT EXISTS moodboard_items_created_by_idx ON moodboard_items(created_by);

-- Timeline events table
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type timeline_event_type DEFAULT 'milestone',
    event_date DATE NOT NULL,
    end_date DATE, -- For events that span multiple days
    location TEXT,
    associated_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    external_links JSONB DEFAULT '[]', -- Array of {title, url} objects
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timeline_events_artist_idx ON timeline_events(artist_id);
CREATE INDEX IF NOT EXISTS timeline_events_date_idx ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS timeline_events_type_idx ON timeline_events(event_type);
CREATE INDEX IF NOT EXISTS timeline_events_public_idx ON timeline_events(is_public);
CREATE INDEX IF NOT EXISTS timeline_events_created_by_idx ON timeline_events(created_by);

-- File access logs table
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action access_action NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS file_access_logs_media_idx ON file_access_logs(media_id);
CREATE INDEX IF NOT EXISTS file_access_logs_user_idx ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS file_access_logs_action_idx ON file_access_logs(action);
CREATE INDEX IF NOT EXISTS file_access_logs_accessed_at_idx ON file_access_logs(accessed_at);

-- Playlists table (if not exists)
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    is_public BOOLEAN DEFAULT false,
    track_ids UUID[] DEFAULT '{}', -- Array of media IDs
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS playlists_artist_idx ON playlists(artist_id);
CREATE INDEX IF NOT EXISTS playlists_public_idx ON playlists(is_public);
CREATE INDEX IF NOT EXISTS playlists_created_by_idx ON playlists(created_by);

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artist_team_updated_at ON artist_team;
CREATE TRIGGER update_artist_team_updated_at BEFORE UPDATE ON artist_team FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_updated_at ON media;
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_moodboard_items_updated_at ON moodboard_items;
CREATE TRIGGER update_moodboard_items_updated_at BEFORE UPDATE ON moodboard_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_timeline_events_updated_at ON timeline_events;
CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;