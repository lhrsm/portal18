-- ============================================================================
-- MIGRATION 00010: Phase 7 — Media Pipeline, Video, CDN, & Automated Moderation
-- ============================================================================

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE public.processing_status AS ENUM ('uploaded', 'queued', 'processing', 'processed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extend advertiser_media table (Section 4, 5, 8, 15, 25, 38)
ALTER TABLE public.advertiser_media
    ADD COLUMN IF NOT EXISTS processing_status public.processing_status NOT NULL DEFAULT 'uploaded',
    ADD COLUMN IF NOT EXISTS processing_error text,
    ADD COLUMN IF NOT EXISTS content_hash text,
    ADD COLUMN IF NOT EXISTS storage_path_original text,
    ADD COLUMN IF NOT EXISTS card_path text,
    ADD COLUMN IF NOT EXISTS profile_path text,
    ADD COLUMN IF NOT EXISTS full_path text,
    ADD COLUMN IF NOT EXISTS video_thumbnail_path text,
    ADD COLUMN IF NOT EXISTS duration_seconds integer,
    ADD COLUMN IF NOT EXISTS width integer,
    ADD COLUMN IF NOT EXISTS height integer,
    ADD COLUMN IF NOT EXISTS file_size bigint,
    ADD COLUMN IF NOT EXISTS mime_type text,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS watermark_applied boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_adv_media_proc_status ON public.advertiser_media(processing_status);
CREATE INDEX IF NOT EXISTS idx_adv_media_content_hash ON public.advertiser_media(content_hash);

-- 3. Media Processing Jobs Table (Section 31 & 32)
CREATE TABLE IF NOT EXISTS public.media_processing_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id uuid NOT NULL REFERENCES public.advertiser_media(id) ON DELETE CASCADE,
    job_type text NOT NULL,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'failed_permanent')),
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    started_at timestamptz,
    finished_at timestamptz,
    error_code text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_jobs_status ON public.media_processing_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_media_jobs_media ON public.media_processing_jobs(media_id);

-- 4. Blocked Media Hashes Table (Section 40 & 41)
CREATE TABLE IF NOT EXISTS public.blocked_media_hashes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hash_type text NOT NULL DEFAULT 'sha256',
    hash_value text NOT NULL UNIQUE,
    reason text NOT NULL,
    source_media_id uuid REFERENCES public.advertiser_media(id) ON DELETE SET NULL,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_hashes_val ON public.blocked_media_hashes(hash_value);

-- 5. Automated Moderation Results Table (Section 46, 47, 48, 49)
CREATE TABLE IF NOT EXISTS public.automated_moderation_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id uuid NOT NULL REFERENCES public.advertiser_media(id) ON DELETE CASCADE,
    provider text NOT NULL DEFAULT 'manual',
    provider_reference text,
    status text NOT NULL DEFAULT 'completed',
    risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
    categories jsonb NOT NULL DEFAULT '[]'::jsonb,
    result_summary text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_mod_media ON public.automated_moderation_results(media_id);
CREATE INDEX IF NOT EXISTS idx_auto_mod_risk ON public.automated_moderation_results(risk_level);

-- 6. Media Upload Reservations Table (Section 73, 74, 75)
CREATE TABLE IF NOT EXISTS public.media_upload_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES public.advertiser_profiles(id) ON DELETE CASCADE,
    media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
    reserved_bytes bigint NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'cancelled', 'expired')),
    expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_res_adv_status ON public.media_upload_reservations(advertiser_id, status, expires_at);

-- 7. Storage Buckets Setup (Section 8 & 9)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('advertiser-private-media', 'advertiser-private-media', false, 314572800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime']),
    ('advertiser-media-public', 'advertiser-media-public', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 8. RPC: reserve_media_upload (Section 69, 70, 71, 73, 74)
CREATE OR REPLACE FUNCTION public.reserve_media_upload(
    p_media_type text,
    p_file_size bigint DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv_id uuid;
    v_entitlements jsonb;
    v_media_limit integer;
    v_video_limit integer;
    v_current_count integer;
    v_reserved_count integer;
    v_reservation_id uuid;
    v_target_path text;
    v_unique_id text;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT id INTO v_adv_id
    FROM public.advertiser_profiles
    WHERE profile_id = v_profile_id AND deleted_at IS NULL;

    IF v_adv_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- Validate Media Type
    IF p_media_type NOT IN ('image', 'video') THEN
        RAISE EXCEPTION 'Tipo de mídia inválido. Permitido apenas image ou video.';
    END IF;

    -- Query Plan Entitlements (Section 69, 70, 71)
    v_entitlements := public.get_advertiser_entitlements(v_adv_id);
    v_media_limit := (v_entitlements->>'media_limit')::integer;
    v_video_limit := (v_entitlements->>'video_limit')::integer;

    -- Video Entitlement Guard (Requirement 19 & 71)
    IF p_media_type = 'video' AND v_video_limit <= 0 THEN
        RAISE EXCEPTION 'Seu plano atual não possui autorização para envio de vídeos. Faça upgrade para o plano Premium ou VIP.';
    END IF;

    -- Atomic Quota Calculation (Section 74)
    SELECT count(*) INTO v_current_count
    FROM public.advertiser_media
    WHERE advertiser_id = v_adv_id 
      AND media_type = p_media_type 
      AND deleted_at IS NULL 
      AND moderation_status <> 'blocked';

    SELECT count(*) INTO v_reserved_count
    FROM public.media_upload_reservations
    WHERE advertiser_id = v_adv_id 
      AND media_type = p_media_type 
      AND status = 'active' 
      AND expires_at > now();

    IF p_media_type = 'image' AND (v_current_count + v_reserved_count) >= v_media_limit THEN
        RAISE EXCEPTION 'Limite de fotos do seu plano atingido (%/% fotos). Faça upgrade do seu plano para liberar mais espaço.', v_current_count, v_media_limit;
    END IF;

    IF p_media_type = 'video' AND (v_current_count + v_reserved_count) >= v_video_limit THEN
        RAISE EXCEPTION 'Limite de vídeos do seu plano atingido (%/% vídeos).', v_current_count, v_video_limit;
    END IF;

    -- Generate safe unguessable storage path (Section 8 & 115)
    v_unique_id := gen_random_uuid()::text;
    v_target_path := 'advertiser-private-media/' || v_adv_id || '/' || v_unique_id || '/original';

    INSERT INTO public.media_upload_reservations (
        advertiser_id,
        media_type,
        reserved_bytes,
        status,
        expires_at
    )
    VALUES (
        v_adv_id,
        p_media_type,
        p_file_size,
        'active',
        now() + INTERVAL '15 minutes'
    )
    RETURNING id INTO v_reservation_id;

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation_id,
        'target_path', v_target_path,
        'bucket', 'advertiser-private-media',
        'expires_at', now() + INTERVAL '15 minutes'
    );
END;
$$;

-- 9. RPC: finalize_media_upload (Section 38, 41, 104, 106, 114)
CREATE OR REPLACE FUNCTION public.finalize_media_upload(
    p_reservation_id uuid,
    p_storage_path text,
    p_mime_type text,
    p_file_size bigint,
    p_content_hash text,
    p_width integer DEFAULT NULL,
    p_height integer DEFAULT NULL,
    p_duration integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_res public.media_upload_reservations%ROWTYPE;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_media_id uuid;
    v_is_blocked boolean := false;
    v_block_reason text;
    v_mod_status text := 'pending';
    v_proc_status public.processing_status := 'queued';
    v_job_id uuid;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_res FROM public.media_upload_reservations WHERE id = p_reservation_id FOR UPDATE;
    IF v_res.id IS NULL OR v_res.status <> 'active' OR v_res.expires_at <= now() THEN
        RAISE EXCEPTION 'Reserva de upload inválida ou expirada.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = v_res.advertiser_id;
    IF v_adv.profile_id <> v_profile_id THEN
        RAISE EXCEPTION 'Acesso negado: Reserva pertence a outro usuário.';
    END IF;

    -- Strict MIME and Extension Validation (Sections 104, 106, 107, 108, 109)
    IF p_mime_type IN ('image/svg+xml', 'text/html', 'application/javascript', 'application/x-msdownload', 'application/zip') THEN
        RAISE EXCEPTION 'Tipo de arquivo proibido por motivos de segurança.';
    END IF;

    IF v_res.media_type = 'image' AND p_mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif') THEN
        RAISE EXCEPTION 'Formato de imagem não suportado. Utilize JPEG, PNG, WebP ou AVIF.';
    END IF;

    IF v_res.media_type = 'video' AND p_mime_type NOT IN ('video/mp4', 'video/webm', 'video/quicktime') THEN
        RAISE EXCEPTION 'Formato de vídeo não suportado. Utilize MP4, WebM ou QuickTime.';
    END IF;

    -- Blocked Hash Matching (Section 40 & 41)
    SELECT reason INTO v_block_reason
    FROM public.blocked_media_hashes
    WHERE hash_value = p_content_hash;

    IF v_block_reason IS NOT NULL THEN
        v_is_blocked := true;
        v_mod_status := 'blocked';
        v_proc_status := 'processed';
    END IF;

    -- Create Advertiser Media Record
    INSERT INTO public.advertiser_media (
        advertiser_id,
        media_type,
        storage_path,
        storage_path_original,
        thumbnail_path,
        mime_type,
        file_size,
        content_hash,
        width,
        height,
        duration_seconds,
        processing_status,
        moderation_status,
        visibility
    )
    VALUES (
        v_res.advertiser_id,
        v_res.media_type,
        p_storage_path,
        p_storage_path,
        p_storage_path, -- Temporary thumbnail until processed
        p_mime_type,
        p_file_size,
        p_content_hash,
        p_width,
        p_height,
        p_duration,
        v_proc_status,
        v_mod_status,
        'public'
    )
    RETURNING id INTO v_media_id;

    -- Mark reservation consumed
    UPDATE public.media_upload_reservations
    SET status = 'consumed'
    WHERE id = p_reservation_id;

    -- Enqueue Media Processing Job if not blocked (Section 30, 31, 32)
    IF NOT v_is_blocked THEN
        INSERT INTO public.media_processing_jobs (
            media_id,
            job_type,
            status
        )
        VALUES (
            v_media_id,
            CASE WHEN v_res.media_type = 'image' THEN 'image_variants' ELSE 'video_transcode' END,
            'queued'
        )
        RETURNING id INTO v_job_id;
    ELSE
        -- Audit Log for Blocked Hash Match (Section 41 & 52)
        INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
        VALUES (
            v_profile_id,
            'media_hash_matched_blocked',
            'advertiser_media',
            v_media_id,
            jsonb_build_object('hash', p_content_hash, 'reason', v_block_reason)
        );
    END IF;

    -- Audit Log for Upload
    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_profile_id,
        'media_uploaded',
        'advertiser_media',
        v_media_id,
        jsonb_build_object('mime_type', p_mime_type, 'size', p_file_size, 'hash', p_content_hash)
    );

    RETURN jsonb_build_object(
        'success', true,
        'media_id', v_media_id,
        'processing_status', v_proc_status,
        'moderation_status', v_mod_status,
        'is_blocked', v_is_blocked,
        'job_id', v_job_id
    );
END;
$$;

-- 10. RPC: publish_approved_media (Section 53, 54, 55)
CREATE OR REPLACE FUNCTION public.publish_approved_media(p_media_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_media public.advertiser_media%ROWTYPE;
BEGIN
    v_actor_id := public.current_profile_id();
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Apenas membros do staff podem publicar mídias.';
    END IF;

    SELECT * INTO v_media FROM public.advertiser_media WHERE id = p_media_id;
    IF v_media.id IS NULL THEN
        RAISE EXCEPTION 'Mídia não encontrada.';
    END IF;

    IF v_media.processing_status <> 'processed' THEN
        RAISE EXCEPTION 'A mídia não pode ser publicada pois o processamento técnico ainda não foi concluído (status: %).', v_media.processing_status;
    END IF;

    IF v_media.moderation_status <> 'approved' THEN
        RAISE EXCEPTION 'A mídia não pode ser publicada pois não foi aprovada na moderação (status: %).', v_media.moderation_status;
    END IF;

    UPDATE public.advertiser_media
    SET visibility = 'public',
        reviewed_at = now(),
        reviewed_by = v_actor_id,
        updated_at = now()
    WHERE id = p_media_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'media_published',
        'advertiser_media',
        p_media_id,
        jsonb_build_object('advertiser_id', v_media.advertiser_id)
    );

    RETURN jsonb_build_object('success', true, 'status', 'published');
END;
$$;

-- 11. RPC: reprocess_failed_media (Section 118 & 119)
CREATE OR REPLACE FUNCTION public.reprocess_failed_media(p_media_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id uuid;
    v_media public.advertiser_media%ROWTYPE;
    v_job_id uuid;
BEGIN
    v_actor_id := public.current_profile_id();
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem reprocessar mídias.';
    END IF;

    SELECT * INTO v_media FROM public.advertiser_media WHERE id = p_media_id;
    IF v_media.id IS NULL THEN
        RAISE EXCEPTION 'Mídia não encontrada.';
    END IF;

    UPDATE public.advertiser_media
    SET processing_status = 'queued',
        processing_error = NULL,
        updated_at = now()
    WHERE id = p_media_id;

    INSERT INTO public.media_processing_jobs (
        media_id,
        job_type,
        status
    )
    VALUES (
        p_media_id,
        CASE WHEN v_media.media_type = 'image' THEN 'image_variants' ELSE 'video_transcode' END,
        'queued'
    )
    RETURNING id INTO v_job_id;

    INSERT INTO public.audit_logs (actor_profile_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_actor_id,
        'media_reprocess_triggered',
        'advertiser_media',
        p_media_id,
        jsonb_build_object('job_id', v_job_id)
    );

    RETURN jsonb_build_object('success', true, 'job_id', v_job_id);
END;
$$;

-- 12. Storage RLS Policies (Section 56, 127, 128)
CREATE POLICY "adv_private_media_owner_select"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'advertiser-private-media'
        AND (
            EXISTS (
                SELECT 1 FROM public.advertiser_profiles ap
                JOIN public.profiles p ON ap.profile_id = p.id
                WHERE p.auth_user_id = auth.uid()
                  AND (storage.foldername(name))[2] = ap.id::text
            )
            OR public.is_staff()
        )
    );

CREATE POLICY "adv_private_media_owner_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'advertiser-private-media'
        AND EXISTS (
            SELECT 1 FROM public.advertiser_profiles ap
            JOIN public.profiles p ON ap.profile_id = p.id
            WHERE p.auth_user_id = auth.uid()
              AND (storage.foldername(name))[2] = ap.id::text
        )
    );

-- Public Media Bucket: Public READ only for approved files
CREATE POLICY "adv_public_media_select"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'advertiser-media-public');
