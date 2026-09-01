# Portal18 — Search Ranking & Diversity Principles

> [!IMPORTANT]
> **DETERMINISTIC | FAIR-START | DECOUPLED FROM PAID TIERS | DIVERSE RESULTS**

---

## 1. Organic Base Ranking Signals

Organic ranking scores are computed deterministically based on objective profile quality factors:

1. **Text & Intent Relevance**: Direct matching on stage name, headline, biography, and city name.
2. **Profile Completeness & Quality**: Bio depth, verified gallery photos, active contact readiness.
3. **Authenticity & Verification**: Human-moderated dynamic challenge video (`authenticity_verified`).
4. **Freshness & Activity**: Profiles active within the last 24h/3d and updated within 30 days.
5. **Bayesian Smoothed Engagement**: Click-through and contact intent rates smoothed using platform priors to reward consistent positive engagement without volatility.
6. **Fair-Start for New Profiles**: New profiles receive a baseline discovery boost to prevent entrenched monopolies by legacy accounts.

---

## 2. Sponsored Placement Separation

- Sponsored results (`is_sponsored = true`) occupy designated inventory slots (e.g. position 1, 4, 7).
- Commercial plans (VIP / Premium) **never alter organic scores**.
- Deduplication prevents the same advertiser from appearing consecutively as both sponsored and organic in the same viewport.
