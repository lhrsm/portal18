# Portal18 — Trust Signals & Revocation Lifecycle

> [!IMPORTANT]
> **SERVER-AUTHORITATIVE | INSTANT REVOCATION | AUDIT HISTORY | ZERO COMMERCIALLY INFLUENCED SEALS**

---

## 1. Catálogo de Sinais de Confiança Públicos

Apenas sinais com comprovação objetiva e server-authoritative são exibidos publicamente:

| Sinal | Requisito Objetivo | Rótulo em PT-BR |
|---|---|---|
| `authenticity_verified` | Vídeo de desafio dinâmico de 5s aprovado pela moderação humana. | **Perfil Autenticado** |
| `media_verified` | Galeria contendo >= 3 fotos moderadas e aprovadas, sem bloqueios ativos. | **Mídias Verificadas** |
| `age_verified` | Maioridade 18+ comprovada no onboarding obrigatório de anunciante. | **Maioridade 18+** |
| `profile_recently_updated` | Perfil editado/atualizado nos últimos 30 dias (`updated_at >= now() - 30d`). | **Atualizado recentemente** |
| `review_history` | Perfil possui pelo menos 3 avaliações públicas moderadas. | **Histórico de Avaliações** |
| `advertiser_responds_to_reviews` | Anunciante respondeu a pelo menos 1 avaliação aprovada. | **Responde avaliações** |

---

## 2. Ciclo de Vida & Revogação Instantânea

1. **Gatilho de Revogação**:
   - Quando uma mídia é bloqueada por violação de diretrizes, o status do sinal `media_verified` é alterado para `revoked` caso o número de mídias válidas caia abaixo de 3.
   - Quando um vídeo de autenticidade é contestado ou invalidado, o sinal `authenticity_verified` é marcado como `revoked`.
2. **Impacto Imediato na Interface**:
   - A função `get_public_advertiser_trust` filtra exclusivamente `status = 'active'`.
   - O selo desaparece imediatamente da página pública do anunciante e dos cards de busca.
3. **Auditoria Histórica**:
   - O registro permanece na tabela `advertiser_trust_signals` com `status = 'revoked'` e `revoked_at = now()`.

---

## 3. Isolamento de Sinais Privados de Risco

Os seguintes dados são **estritamente internos** e nunca compõem sinais públicos:
- Histórico de sanções e advertências;
- Notas internas de moderadores;
- Indicadores de risco / antifraude;
- Dados brutos de documentos KYC;
- Contas vinculadas por fingerprint.

