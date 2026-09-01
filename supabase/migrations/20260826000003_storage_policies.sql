-- ============================================================================
-- MIGRATION 00003: Storage Buckets & Storage RLS Policies
-- ============================================================================

-- 1. Create Buckets in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('advertiser-media', 'advertiser-media', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
    ('verification-private', 'verification-private', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'avatars' Bucket
-- Public can view avatars
CREATE POLICY "avatars_public_select"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

-- Authenticated users can upload to avatars/{auth.uid()}/*
CREATE POLICY "avatars_user_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Authenticated users can update/delete their own avatar
CREATE POLICY "avatars_user_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "avatars_user_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Storage Policies for 'advertiser-media' Bucket
-- Public can view if media is approved or if user is owner/admin
CREATE POLICY "advertiser_media_storage_select"
    ON storage.objects FOR SELECT
    TO public
    USING (
        bucket_id = 'advertiser-media'
        AND (
            -- Owner access (folder named after profile_id or auth.uid())
            (storage.foldername(name))[1] = auth.uid()::text
            -- Or public access to media that has approved record
            OR EXISTS (
                SELECT 1 FROM public.advertiser_media am
                JOIN public.advertiser_profiles ap ON ap.id = am.advertiser_id
                WHERE am.storage_path = storage.objects.name
                AND am.moderation_status = 'approved'
                AND am.visibility = 'public'
                AND ap.profile_status = 'approved'
                AND ap.visibility = 'public'
            )
            -- Or admin/moderator
            OR public.is_moderator()
        )
    );

-- Advertiser can insert into advertiser-media/{auth.uid()}/*
CREATE POLICY "advertiser_media_storage_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'advertiser-media'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Advertiser can delete own media from storage
CREATE POLICY "advertiser_media_storage_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'advertiser-media'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );

-- 4. Storage Policies for 'verification-private' Bucket (STRICT PRIVACY)
-- NO PUBLIC ACCESS EVER!
CREATE POLICY "verification_private_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'verification-private'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_moderator()
        )
    );

CREATE POLICY "verification_private_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'verification-private'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "verification_private_admin_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'verification-private'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );
