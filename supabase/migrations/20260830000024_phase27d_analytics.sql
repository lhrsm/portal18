-- ============================================================================
-- MIGRATION 00024: Phase 27D — Advertiser Analytics, Funnel Intelligence & Performance Insights
-- ============================================================================

-- 1. RPC: get_advertiser_funnel_analytics (Consolidated Funnel & Intelligence Engine)
CREATE OR REPLACE FUNCTION public.get_advertiser_funnel_analytics(
    p_advertiser_id uuid,
    p_period_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_adv public.advertiser_profiles%ROWTYPE;
    v_start_date date;
    v_prev_start_date date;
    v_prev_end_date date;
    v_now_date date := CURRENT_DATE;

    -- Current Period Aggregates
    v_impressions integer := 0;
    v_views integer := 0;
    v_contacts integer := 0;

    -- Previous Period Aggregates
    v_prev_impressions integer := 0;
    v_prev_views integer := 0;
    v_prev_contacts integer := 0;

    -- Rates
    v_open_rate numeric := 0.0;
    v_contact_rate numeric := 0.0;
    v_overall_rate numeric := 0.0;

    -- Trends
    v_impressions_trend numeric := 0.0;
    v_views_trend numeric := 0.0;
    v_contacts_trend numeric := 0.0;

    -- Sources Breakdown
    v_organic_impr integer := 0;
    v_organic_views integer := 0;
    v_organic_contacts integer := 0;
    v_sponsored_impr integer := 0;
    v_sponsored_views integer := 0;
    v_sponsored_contacts integer := 0;
    v_direct_impr integer := 0;
    v_direct_views integer := 0;
    v_direct_contacts integer := 0;

    -- Channel Breakdown
    v_whatsapp_count integer := 0;
    v_telegram_count integer := 0;
    v_phone_count integer := 0;
    v_website_count integer := 0;

    -- Daily Time Series Array
    v_time_series jsonb := '[]'::jsonb;
    v_insights jsonb := '[]'::jsonb;
    v_quality jsonb;
    r RECORD;
    d RECORD;
BEGIN
    v_profile_id := public.current_profile_id();
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    SELECT * INTO v_adv FROM public.advertiser_profiles WHERE id = p_advertiser_id;
    IF v_adv.id IS NULL THEN
        RAISE EXCEPTION 'Perfil de anunciante não encontrado.';
    END IF;

    -- Security Guard: Must be owner or staff
    IF v_adv.profile_id <> v_profile_id AND NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Você não possui autorização para visualizar estes analytics.';
    END IF;

    -- Compute Date Windows
    v_start_date := v_now_date - (p_period_days || ' days')::interval;
    v_prev_end_date := v_start_date - INTERVAL '1 day';
    v_prev_start_date := v_prev_end_date - (p_period_days || ' days')::interval;

    -- 1. Current Period Totals from Aggregates & Events
    SELECT
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(profile_views), 0),
        COALESCE(SUM(clicks), 0) + COALESCE(SUM(contact_clicks), 0)
    INTO v_impressions, v_views, v_contacts
    FROM public.advertiser_daily_stats
    WHERE advertiser_id = p_advertiser_id
      AND date >= v_start_date;

    -- Also check direct events for fresh precision
    SELECT COUNT(*) INTO v_organic_impr
    FROM public.discovery_impression_events
    WHERE advertiser_id = p_advertiser_id
      AND event_type = 'organic_impression'
      AND created_at >= v_start_date;

    SELECT COUNT(*) INTO v_sponsored_impr
    FROM public.discovery_impression_events
    WHERE advertiser_id = p_advertiser_id
      AND event_type = 'sponsored_impression'
      AND created_at >= v_start_date;

    IF (v_organic_impr + v_sponsored_impr) > v_impressions THEN
        v_impressions := v_organic_impr + v_sponsored_impr;
    ELSE
        v_organic_impr := v_impressions;
    END IF;

    -- 2. Previous Period Totals for Trends
    SELECT
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(profile_views), 0),
        COALESCE(SUM(clicks), 0) + COALESCE(SUM(contact_clicks), 0)
    INTO v_prev_impressions, v_prev_views, v_prev_contacts
    FROM public.advertiser_daily_stats
    WHERE advertiser_id = p_advertiser_id
      AND date >= v_prev_start_date
      AND date <= v_prev_end_date;

    -- 3. Calculate Funnel Rates with Zero Denominator Protections
    IF v_impressions > 0 THEN
        v_open_rate := ROUND((v_views::numeric / v_impressions::numeric) * 100.0, 1);
        v_overall_rate := ROUND((v_contacts::numeric / v_impressions::numeric) * 100.0, 1);
    END IF;

    IF v_views > 0 THEN
        v_contact_rate := ROUND((v_contacts::numeric / v_views::numeric) * 100.0, 1);
    END IF;

    -- 4. Calculate Trends (% change)
    IF v_prev_impressions > 0 THEN
        v_impressions_trend := ROUND(((v_impressions - v_prev_impressions)::numeric / v_prev_impressions::numeric) * 100.0, 1);
    END IF;

    IF v_prev_views > 0 THEN
        v_views_trend := ROUND(((v_views - v_prev_views)::numeric / v_prev_views::numeric) * 100.0, 1);
    END IF;

    IF v_prev_contacts > 0 THEN
        v_contacts_trend := ROUND(((v_contacts - v_prev_contacts)::numeric / v_prev_contacts::numeric) * 100.0, 1);
    END IF;

    -- 5. Contact Channels Breakdown
    SELECT
        COUNT(*) FILTER (WHERE channel = 'whatsapp'),
        COUNT(*) FILTER (WHERE channel = 'telegram'),
        COUNT(*) FILTER (WHERE channel = 'phone'),
        COUNT(*) FILTER (WHERE channel = 'website')
    INTO v_whatsapp_count, v_telegram_count, v_phone_count, v_website_count
    FROM public.profile_contact_events
    WHERE advertiser_id = p_advertiser_id
      AND created_at >= v_start_date;

    -- 6. Generate Time Series Daily Points
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', ds.date::text,
            'impressions', COALESCE(ads.impressions, 0),
            'profile_views', COALESCE(ads.profile_views, 0),
            'contact_clicks', COALESCE(ads.clicks, 0) + COALESCE(ads.contact_clicks, 0)
        ) ORDER BY ds.date ASC
    ) INTO v_time_series
    FROM (
        SELECT (v_start_date + (i || ' days')::interval)::date AS date
        FROM generate_series(0, p_period_days) i
    ) ds
    LEFT JOIN public.advertiser_daily_stats ads
        ON ads.advertiser_id = p_advertiser_id AND ads.date = ds.date;

    -- 7. Deterministic Insights Generation (Minimum Sample Guard)
    IF v_views >= 5 THEN
        IF v_views_trend > 10.0 THEN
            v_insights := v_insights || jsonb_build_object(
                'id', 'trend_views_up',
                'type', 'positive',
                'title', 'Crescimento de Visualizações',
                'description', 'Seu perfil recebeu +' || v_views_trend || '% de visualizações em comparação ao período anterior.'
            );
        END IF;

        IF v_contacts > 0 AND v_whatsapp_count > (v_contacts * 0.6) THEN
            v_insights := v_insights || jsonb_build_object(
                'id', 'channel_whatsapp_dominant',
                'type', 'info',
                'title', 'Canal Preferido: WhatsApp',
                'description', 'O WhatsApp representa mais de 60% das intenções de contato no seu perfil.'
            );
        END IF;
    ELSE
        v_insights := v_insights || jsonb_build_object(
            'id', 'sample_gathering',
            'type', 'neutral',
            'title', 'Coletando Dados de Alcance',
            'description', 'Seu perfil está coletando dados. Insights estatísticos mais detalhados aparecerão conforme houver mais interações.'
        );
    END IF;

    -- 8. Objective Profile Quality Status
    v_quality := jsonb_build_object(
        'completeness_score', COALESCE(v_adv.completeness_score, 50),
        'has_verified_badge', (v_adv.verification_status = 'verified'),
        'has_authenticity_badge', COALESCE(v_adv.authenticity_verified, false),
        'has_audio_presentation', (v_adv.audio_presentation_url IS NOT NULL),
        'has_headline', (v_adv.headline IS NOT NULL AND length(v_adv.headline) > 5),
        'has_bio', (v_adv.bio IS NOT NULL AND length(v_adv.bio) > 10)
    );

    RETURN jsonb_build_object(
        'success', true,
        'period_days', p_period_days,
        'advertiser_id', p_advertiser_id,
        'funnel', jsonb_build_object(
            'impressions', v_impressions,
            'profile_views', v_views,
            'contact_clicks', v_contacts,
            'profile_open_rate', v_open_rate,
            'contact_conversion_rate', v_contact_rate,
            'overall_contact_rate', v_overall_rate
        ),
        'trends', jsonb_build_object(
            'impressions_trend_percent', v_impressions_trend,
            'views_trend_percent', v_views_trend,
            'contacts_trend_percent', v_contacts_trend
        ),
        'sources', jsonb_build_object(
            'organic', jsonb_build_object('impressions', v_organic_impr, 'views', v_views, 'contacts', v_contacts),
            'sponsored', jsonb_build_object('impressions', v_sponsored_impr, 'views', 0, 'contacts', 0),
            'direct', jsonb_build_object('impressions', 0, 'views', 0, 'contacts', 0)
        ),
        'channels', jsonb_build_object(
            'whatsapp', v_whatsapp_count,
            'telegram', v_telegram_count,
            'phone', v_phone_count,
            'website', v_website_count
        ),
        'time_series', COALESCE(v_time_series, '[]'::jsonb),
        'insights', v_insights,
        'quality', v_quality
    );
END;
$$;

-- 2. RPC: get_admin_platform_analytics (Platform-Wide Aggregated Funnel)
CREATE OR REPLACE FUNCTION public.get_admin_platform_analytics(
    p_period_days integer DEFAULT 7
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_start_date date;
    v_total_impressions integer := 0;
    v_total_views integer := 0;
    v_total_contacts integer := 0;
    v_organic_impr integer := 0;
    v_sponsored_impr integer := 0;
    v_active_advertisers integer := 0;
    v_active_campaigns integer := 0;
    v_slot_utilization numeric := 0.0;
BEGIN
    IF NOT public.is_staff() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de administração.';
    END IF;

    v_start_date := CURRENT_DATE - (p_period_days || ' days')::interval;

    -- Platform Totals
    SELECT
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(profile_views), 0),
        COALESCE(SUM(clicks), 0) + COALESCE(SUM(contact_clicks), 0)
    INTO v_total_impressions, v_total_views, v_total_contacts
    FROM public.advertiser_daily_stats
    WHERE date >= v_start_date;

    SELECT COUNT(*) INTO v_organic_impr
    FROM public.discovery_impression_events
    WHERE event_type = 'organic_impression' AND created_at >= v_start_date;

    SELECT COUNT(*) INTO v_sponsored_impr
    FROM public.discovery_impression_events
    WHERE event_type = 'sponsored_impression' AND created_at >= v_start_date;

    IF (v_organic_impr + v_sponsored_impr) > v_total_impressions THEN
        v_total_impressions := v_organic_impr + v_sponsored_impr;
    END IF;

    SELECT COUNT(*) INTO v_active_advertisers
    FROM public.advertiser_profiles
    WHERE profile_status = 'active' AND deleted_at IS NULL;

    SELECT COUNT(*) INTO v_active_campaigns
    FROM public.advertiser_campaigns
    WHERE status = 'active' AND starts_at <= now() AND ends_at >= now();

    RETURN jsonb_build_object(
        'success', true,
        'period_days', p_period_days,
        'funnel', jsonb_build_object(
            'impressions', v_total_impressions,
            'profile_views', v_total_views,
            'contact_clicks', v_total_contacts,
            'profile_open_rate', CASE WHEN v_total_impressions > 0 THEN ROUND((v_total_views::numeric / v_total_impressions::numeric) * 100.0, 1) ELSE 0.0 END,
            'contact_conversion_rate', CASE WHEN v_total_views > 0 THEN ROUND((v_total_contacts::numeric / v_total_views::numeric) * 100.0, 1) ELSE 0.0 END
        ),
        'distribution', jsonb_build_object(
            'organic_impressions', v_organic_impr,
            'sponsored_impressions', v_sponsored_impr,
            'sponsored_share_percent', CASE WHEN v_total_impressions > 0 THEN ROUND((v_sponsored_impr::numeric / v_total_impressions::numeric) * 100.0, 1) ELSE 0.0 END
        ),
        'operations', jsonb_build_object(
            'active_advertisers', v_active_advertisers,
            'active_campaigns', v_active_campaigns
        )
    );
END;
$$;
