# Portal18 — Reputation & Trust Signals Architecture

> [!IMPORTANT]
> **VERIFIABLE CLAIMS | ZERO OPAQUE SCORES | ZERO PAID TRUST | SERVER-AUTHORITATIVE**

---

## 1. Princípios Fundamentais de Reputação

A camada de reputação e sinais de confiança do Portal18 foi construída sob os seguintes pilares:

1. **Reivindicações Objetivas e Verificáveis**:
   - Selos públicos representam exclusivamente fatos auditáveis comprovados por processos server-side (desafio de vídeo dinâmico aprovado, galeria com pelo menos 3 fotos moderadas, maioridade comprovada).
   - O Portal18 **não utiliza scores opacos** de reputação pública (como "92/100 confiável", "100% seguro" ou "perfil garantido").
2. **Desacoplamento Total de Planos Comerciais**:
   - A contratação de planos VIP, patrocínios ou destaques visuais **não concede, não altera e não influencia** selos de autenticidade, mídias verificadas ou notas de avaliação.
   - O status de "Patrocinado" permanece estritamente isolado de sinais de confiança.
3. **Não Discriminação e Isenção**:
   - Gênero, identidade de gênero, orientação sexual, município ou categoria de atuação nunca são utilizados como fatores redutores de qualidade ou pontuação.
4. **Autoridade Server-Side & Revogação Imediata**:
   - O frontend nunca determina selos de confiança.
   - Qualquer sinal cuja evidência seja invalidada ou revogada é instantaneamente removido da apresentação pública.

---

## 2. Modelo de Dados

### 2.1 Tabela `advertiser_trust_signals`
Armazena as reivindicações ativas e histórico de revogações por anunciante:
- `id` (UUID): Identificador único do sinal.
- `advertiser_id` (UUID): Chave estrangeira para `advertiser_profiles`.
- `signal_type` (TEXT): Tipo do sinal (`authenticity_verified`, `identity_verified`, `age_verified`, `media_verified`, `phone_verified`, `email_verified`, `profile_complete`, `profile_recently_updated`, `review_history`, `advertiser_responds_to_reviews`).
- `status` (TEXT): `active`, `expired`, `revoked`.
- `source` (TEXT): Origem auditável da validação (`video_challenge_approved`, `media_moderation_approved`, etc.).
- `verified_at` (TIMESTAMPTZ): Data de concessão do sinal.
- `revoked_at` (TIMESTAMPTZ, nullable): Data de revogação caso aplicável.
- `metadata` (JSONB): Metadados sanitizados (ex: quantidade de fotos aprovadas, contagem de reviews).

### 2.2 Tabela `advertiser_reputation_snapshots`
Snapshots diários e imutáveis para analytics e auditoria:
- `id` (UUID)
- `advertiser_id` (UUID)
- `snapshot_date` (DATE)
- `approved_review_count` (INTEGER)
- `average_rating` (NUMERIC 3,2)
- `authenticity_status` (TEXT)
- `media_verified` (BOOLEAN)
- `profile_complete` (BOOLEAN)
- `freshness_status` (TEXT)

---

## 3. Atomic RPCs

- `compute_advertiser_trust_signals(p_advertiser_id)`: Recomputa sinais server-authoritative e persiste snapshot diário.
- `get_public_advertiser_trust(p_advertiser_id)`: Retorna payload público sanitizado contendo sinais ativos e agregado de avaliações, excluindo qualquer dado privado de risco.
- `respond_to_advertiser_review(p_review_id, p_advertiser_id, p_response)`: Registra resposta oficial do anunciante a uma avaliação aprovada.

