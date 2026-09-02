# Portal18 — Event Taxonomy & Metrics Model

> [!IMPORTANT]
> **SERVER-AUTHORITATIVE | PRIVACY-FIRST | ZERO VISITOR PII | DEDUPLICATED TELEMETRY**

---

## 1. Canonical Discovery & Conversion Events

| Event Name | Source | Description | Deduplication Window |
|---|---|---|---|
| `organic_impression` | Discovery Search / City / Category | Card viewable in organic result set (>= 1s at 50% viewport). | 1 per advertiser per session |
| `sponsored_impression` | Sponsored Slots | Card viewable in designated sponsored slot. | 1 per advertiser per session |
| `profile_view` | Profile Page | Direct visit to advertiser profile page. | 1 per visitor per hour |
| `media_interaction` | Profile Gallery | Click or view of photo, video, or audio track. | 1 per asset per session |
| `contact_intent` | WhatsApp / Phone CTA | Click on WhatsApp redirection or phone reveal button. | 1 per channel per session |
| `favorite_added` | AdvertiserCard / Profile | Explicit bookmark added to user account. | Persistent ledger |
| `follow_added` | AdvertiserCard / Profile | Explicit following added to user account. | Persistent ledger |

---

## 2. Definitive Terminology

- **Intenção de Contato (Contact Intent)**: Disparo ativo de clique no botão de WhatsApp ou telefone. Nunca denominado "venda" ou "cliente adquirido", pois o Portal18 não intermedeia nem audita conversas privadas.
- **Taxa de Abertura (Open Rate)**: $\frac{\text{Profile Views}}{\text{Impressions}} \times 100$.
- **CTR de Contato (Contact CTR)**: $\frac{\text{Contact Intents}}{\text{Profile Views}} \times 100$.
