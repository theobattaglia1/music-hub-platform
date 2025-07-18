-- Row Level Security Policies for Music Hub Platform
-- These policies control access to data based on user roles and relationships

-- Profiles policies
-- Users can view their own profile and profiles of artists they're associated with
CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles of team members" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artist_team at1, artist_team at2 
            WHERE at1.user_id = auth.uid() 
            AND at2.user_id = profiles.user_id 
            AND at1.artist_id = at2.artist_id
        )
    );

-- Artists policies  
-- Users can view artists they're part of the team for
CREATE POLICY "Team members can view artist" ON artists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = artists.id 
            AND user_id = auth.uid()
        )
    );

-- Only owners and editors can create artists
CREATE POLICY "Owners and editors can create artists" ON artists
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Only owners and editors can update artists
CREATE POLICY "Owners and editors can update artists" ON artists
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = artists.id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Only owners can delete artists
CREATE POLICY "Only owners can delete artists" ON artists
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = artists.id 
            AND user_id = auth.uid() 
            AND role = 'owner'
        )
    );

-- Artist team policies
-- Team members can view team info for their artists
CREATE POLICY "Team members can view team" ON artist_team
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM artist_team at 
            WHERE at.artist_id = artist_team.artist_id 
            AND at.user_id = auth.uid()
        )
    );

-- Owners and editors can manage team members
CREATE POLICY "Owners and editors can manage team" ON artist_team
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = artist_team.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Media policies
-- Team members can view media for their artists
CREATE POLICY "Team members can view media" ON media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = media.artist_id 
            AND user_id = auth.uid()
        ) OR 
        is_public = true
    );

-- Artists, editors, and owners can upload media
CREATE POLICY "Artists and editors can upload media" ON media
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = media.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor', 'artist')
        )
    );

-- Artists, editors, and owners can update media
CREATE POLICY "Artists and editors can update media" ON media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = media.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor', 'artist')
        )
    );

-- Only owners and editors can delete media
CREATE POLICY "Owners and editors can delete media" ON media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = media.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Events policies
-- Team members can view events for their artists  
CREATE POLICY "Team members can view events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = events.artist_id 
            AND user_id = auth.uid()
        )
    );

-- All team members can create events
CREATE POLICY "Team members can create events" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = events.artist_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update events they created or if they're owner/editor
CREATE POLICY "Event creators and editors can update events" ON events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = events.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Users can delete events they created or if they're owner/editor
CREATE POLICY "Event creators and editors can delete events" ON events
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = events.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Notes policies  
-- Team members can view notes for their artists
CREATE POLICY "Team members can view notes" ON notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = notes.artist_id 
            AND user_id = auth.uid()
        )
    );

-- All team members can create notes
CREATE POLICY "Team members can create notes" ON notes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = notes.artist_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update notes they created or are assigned to, or if they're owner/editor
CREATE POLICY "Note creators, assignees and editors can update notes" ON notes
    FOR UPDATE USING (
        created_by = auth.uid() OR
        assignee_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = notes.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Users can delete notes they created or if they're owner/editor
CREATE POLICY "Note creators and editors can delete notes" ON notes
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = notes.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Moodboard items policies
-- Team members can view moodboard items for their artists
CREATE POLICY "Team members can view moodboard items" ON moodboard_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = moodboard_items.artist_id 
            AND user_id = auth.uid()
        )
    );

-- All team members can create moodboard items
CREATE POLICY "Team members can create moodboard items" ON moodboard_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = moodboard_items.artist_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update moodboard items they created or if they're owner/editor
CREATE POLICY "Item creators and editors can update moodboard items" ON moodboard_items
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = moodboard_items.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Users can delete moodboard items they created or if they're owner/editor
CREATE POLICY "Item creators and editors can delete moodboard items" ON moodboard_items
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = moodboard_items.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Timeline events policies
-- Team members can view timeline events for their artists, or if public
CREATE POLICY "Team members can view timeline events" ON timeline_events
    FOR SELECT USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = timeline_events.artist_id 
            AND user_id = auth.uid()
        )
    );

-- Artists, editors, and owners can create timeline events
CREATE POLICY "Artists and editors can create timeline events" ON timeline_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = timeline_events.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor', 'artist')
        )
    );

-- Users can update timeline events they created or if they're owner/editor
CREATE POLICY "Event creators and editors can update timeline events" ON timeline_events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = timeline_events.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Users can delete timeline events they created or if they're owner/editor
CREATE POLICY "Event creators and editors can delete timeline events" ON timeline_events
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = timeline_events.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- File access logs policies
-- Only owners and editors can view file access logs
CREATE POLICY "Owners and editors can view file access logs" ON file_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM media m
            JOIN artist_team at ON m.artist_id = at.artist_id
            WHERE m.id = file_access_logs.media_id 
            AND at.user_id = auth.uid() 
            AND at.role IN ('owner', 'editor')
        )
    );

-- System can insert file access logs (no user restrictions)
CREATE POLICY "System can insert file access logs" ON file_access_logs
    FOR INSERT WITH CHECK (true);

-- Playlists policies
-- Team members can view playlists for their artists, or if public
CREATE POLICY "Team members can view playlists" ON playlists
    FOR SELECT USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = playlists.artist_id 
            AND user_id = auth.uid()
        )
    );

-- All team members can create playlists
CREATE POLICY "Team members can create playlists" ON playlists
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = playlists.artist_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update playlists they created or if they're owner/editor
CREATE POLICY "Playlist creators and editors can update playlists" ON playlists
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = playlists.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Users can delete playlists they created or if they're owner/editor
CREATE POLICY "Playlist creators and editors can delete playlists" ON playlists
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM artist_team 
            WHERE artist_id = playlists.artist_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

-- Function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || encode(COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'escape') || '&background=6366f1&color=fff&size=256')
    );
    RETURN new;
END;
$$;

-- Trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Storage policies for file uploads
-- Create storage bucket policies (to be run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Media bucket policies (private by default)
-- CREATE POLICY "Users can view media they have access to" ON storage.objects FOR SELECT USING (
--     bucket_id = 'media' AND (
--         EXISTS (
--             SELECT 1 FROM media m
--             JOIN artist_team at ON m.artist_id = at.artist_id 
--             WHERE m.file_path = name 
--             AND at.user_id = auth.uid()
--         ) OR 
--         EXISTS (
--             SELECT 1 FROM media m 
--             WHERE m.file_path = name 
--             AND m.is_public = true
--         )
--     )
-- );

-- CREATE POLICY "Team members can upload media" ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'media' AND auth.role() = 'authenticated'
-- );

-- CREATE POLICY "Team members can delete their media" ON storage.objects FOR DELETE USING (
--     bucket_id = 'media' AND (
--         EXISTS (
--             SELECT 1 FROM media m
--             JOIN artist_team at ON m.artist_id = at.artist_id 
--             WHERE m.file_path = name 
--             AND at.user_id = auth.uid()
--             AND at.role IN ('owner', 'editor')
--         )
--     )
-- );

-- Avatar bucket policies (public)
-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'avatars' AND auth.role() = 'authenticated'
-- );
-- CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE USING (
--     bucket_id = 'avatars' AND auth.role() = 'authenticated'
-- );
-- CREATE POLICY "Users can delete avatars" ON storage.objects FOR DELETE USING (
--     bucket_id = 'avatars' AND auth.role() = 'authenticated'
-- );

-- Cover images bucket policies (public)
-- CREATE POLICY "Anyone can view covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
-- CREATE POLICY "Team members can upload covers" ON storage.objects FOR INSERT WITH CHECK (
--     bucket_id = 'covers' AND auth.role() = 'authenticated'
-- );
-- CREATE POLICY "Team members can update covers" ON storage.objects FOR UPDATE USING (
--     bucket_id = 'covers' AND auth.role() = 'authenticated'
-- );
-- CREATE POLICY "Team members can delete covers" ON storage.objects FOR DELETE USING (
--     bucket_id = 'covers' AND auth.role() = 'authenticated'
-- );