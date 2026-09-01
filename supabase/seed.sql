-- ============================================================================
-- SEED DATA: Brazilian States & Initial Categories (Non-sensitive data)
-- ============================================================================

-- 1. Brazilian States (26 States + Federal District)
INSERT INTO public.brazil_states (code, name, slug) VALUES
    ('AC', 'Acre', 'acre'),
    ('AL', 'Alagoas', 'alagoas'),
    ('AP', 'Amapá', 'amapa'),
    ('AM', 'Amazonas', 'amazonas'),
    ('BA', 'Bahia', 'bahia'),
    ('CE', 'Ceará', 'ceara'),
    ('DF', 'Distrito Federal', 'distrito-federal'),
    ('ES', 'Espírito Santo', 'espirito-santo'),
    ('GO', 'Goiás', 'goias'),
    ('MA', 'Maranhão', 'maranhao'),
    ('MT', 'Mato Grosso', 'mato-grosso'),
    ('MS', 'Mato Grosso do Sul', 'mato-grosso-do-sul'),
    ('MG', 'Minas Gerais', 'minas-gerais'),
    ('PA', 'Pará', 'para'),
    ('PB', 'Paraíba', 'paraiba'),
    ('PR', 'Paraná', 'parana'),
    ('PE', 'Pernambuco', 'pernambuco'),
    ('PI', 'Piauí', 'piaui'),
    ('RJ', 'Rio de Janeiro', 'rio-de-janeiro'),
    ('RN', 'Rio Grande do Norte', 'rio-grande-do-norte'),
    ('RS', 'Rio Grande do Sul', 'rio-grande-do-sul'),
    ('RO', 'Rondônia', 'rondonia'),
    ('RR', 'Roraima', 'roraima'),
    ('SC', 'Santa Catarina', 'santa-catarina'),
    ('SP', 'São Paulo', 'sao-paulo'),
    ('SE', 'Sergipe', 'sergipe'),
    ('TO', 'Tocantins', 'tocantins')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- 2. Major Capital Cities (Sample for initial structure)
DO $$
DECLARE
    v_sp_id uuid;
    v_rj_id uuid;
    v_mg_id uuid;
    v_ba_id uuid;
    v_pr_id uuid;
    v_rs_id uuid;
    v_df_id uuid;
BEGIN
    SELECT id INTO v_sp_id FROM public.brazil_states WHERE code = 'SP';
    SELECT id INTO v_rj_id FROM public.brazil_states WHERE code = 'RJ';
    SELECT id INTO v_mg_id FROM public.brazil_states WHERE code = 'MG';
    SELECT id INTO v_ba_id FROM public.brazil_states WHERE code = 'BA';
    SELECT id INTO v_pr_id FROM public.brazil_states WHERE code = 'PR';
    SELECT id INTO v_rs_id FROM public.brazil_states WHERE code = 'RS';
    SELECT id INTO v_df_id FROM public.brazil_states WHERE code = 'DF';

    IF v_sp_id IS NOT NULL THEN
        INSERT INTO public.brazil_cities (state_id, ibge_code, name, slug)
        VALUES
            (v_sp_id, '3550308', 'São Paulo', 'sao-paulo'),
            (v_sp_id, '3509502', 'Campinas', 'campinas'),
            (v_sp_id, '3548500', 'Santos', 'santos'),
            (v_sp_id, '3549904', 'São José dos Campos', 'sao-jose-dos-campos'),
            (v_sp_id, '3543402', 'Ribeirão Preto', 'ribeirao-preto')
        ON CONFLICT (ibge_code) DO NOTHING;
    END IF;

    IF v_rj_id IS NOT NULL THEN
        INSERT INTO public.brazil_cities (state_id, ibge_code, name, slug)
        VALUES
            (v_rj_id, '3304557', 'Rio de Janeiro', 'rio-de-janeiro'),
            (v_rj_id, '3303302', 'Niterói', 'niteroi')
        ON CONFLICT (ibge_code) DO NOTHING;
    END IF;

    IF v_mg_id IS NOT NULL THEN
        INSERT INTO public.brazil_cities (state_id, ibge_code, name, slug)
        VALUES
            (v_mg_id, '3106200', 'Belo Horizonte', 'belo-horizonte')
        ON CONFLICT (ibge_code) DO NOTHING;
    END IF;

    IF v_ba_id IS NOT NULL THEN
        INSERT INTO public.brazil_cities (state_id, ibge_code, name, slug)
        VALUES
            (v_ba_id, '2927408', 'Salvador', 'salvador')
        ON CONFLICT (ibge_code) DO NOTHING;
    END IF;

    IF v_pr_id IS NOT NULL THEN
        INSERT INTO public.brazil_cities (state_id, ibge_code, name, slug)
        VALUES
            (v_pr_id, '4106902', 'Curitiba', 'curitiba')
        ON CONFLICT (ibge_code) DO NOTHING;
    END IF;

    IF v_rs_id IS NOT NULL THEN
        INSERT INTO public.brazil_cities (state_id, ibge_code, name, slug)
        VALUES
            (v_rs_id, '4314902', 'Porto Alegre', 'porto-alegre')
        ON CONFLICT (ibge_code) DO NOTHING;
    END IF;

    IF v_df_id IS NOT NULL THEN
        INSERT INTO public.brazil_cities (state_id, ibge_code, name, slug)
        VALUES
            (v_df_id, '5300108', 'Brasília', 'brasilia')
        ON CONFLICT (ibge_code) DO NOTHING;
    END IF;
END;
$$;

-- 3. Initial Portal Categories
INSERT INTO public.categories (name, slug, description, status, sort_order) VALUES
    ('Acompanhantes Femininas', 'acompanhantes-femininas', 'Perfis femininos verificados e independentes.', 'active', 1),
    ('Acompanhantes Masculinos', 'acompanhantes-masculinos', 'Perfis masculinos verificados e independentes.', 'active', 2),
    ('Trans & Travestis', 'trans-travestis', 'Perfis trans e travestis com verificação.', 'active', 3),
    ('Massagem Erótica & Tântrica', 'massagem-erotica-tantrica', 'Terapeutas e massagistas especializadas.', 'active', 4),
    ('Modelos & Fotografia', 'modelos-fotografia', 'Modelos para ensaios e produções adultas.', 'active', 5),
    ('Casais & Duplas', 'casais-duplas', 'Anúncios de casais e duplas para atendimento.', 'active', 6)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;
