-- Storage + media bootstrap for Music Hub
-- This migration intentionally enables anon/authenticated upload/read while auth wiring is in-progress.
-- Tighten these policies before production launch.

-- Create expected buckets (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('media', 'media', false),
  ('avatars', 'avatars', true),
  ('covers', 'covers', true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Storage policies
DROP POLICY IF EXISTS "bootstrap_media_select" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_media_update" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_media_delete" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_avatars_delete" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_covers_select" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_covers_insert" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_covers_update" ON storage.objects;
DROP POLICY IF EXISTS "bootstrap_covers_delete" ON storage.objects;

CREATE POLICY "bootstrap_media_select"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

CREATE POLICY "bootstrap_media_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'media');

CREATE POLICY "bootstrap_media_update"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

CREATE POLICY "bootstrap_media_delete"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'media');

CREATE POLICY "bootstrap_avatars_select"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "bootstrap_avatars_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "bootstrap_avatars_update"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "bootstrap_avatars_delete"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "bootstrap_covers_select"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'covers');

CREATE POLICY "bootstrap_covers_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'covers');

CREATE POLICY "bootstrap_covers_update"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'covers')
WITH CHECK (bucket_id = 'covers');

CREATE POLICY "bootstrap_covers_delete"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'covers');

-- Media table policies (guarded in case media table has not been migrated yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'media'
  ) THEN
    EXECUTE 'ALTER TABLE public.media ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "bootstrap_media_table_select" ON public.media';
    EXECUTE 'DROP POLICY IF EXISTS "bootstrap_media_table_insert" ON public.media';
    EXECUTE 'DROP POLICY IF EXISTS "bootstrap_media_table_update" ON public.media';
    EXECUTE 'DROP POLICY IF EXISTS "bootstrap_media_table_delete" ON public.media';

    EXECUTE ''CREATE POLICY "bootstrap_media_table_select" ON public.media FOR SELECT TO anon, authenticated USING (true)'';
    EXECUTE ''CREATE POLICY "bootstrap_media_table_insert" ON public.media FOR INSERT TO anon, authenticated WITH CHECK (true)'';
    EXECUTE ''CREATE POLICY "bootstrap_media_table_update" ON public.media FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)'';
    EXECUTE ''CREATE POLICY "bootstrap_media_table_delete" ON public.media FOR DELETE TO anon, authenticated USING (true)'';

    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.media TO anon, authenticated';
  END IF;
END
$$;
