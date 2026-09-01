# Portal18 — Search & Recommendation Engine Architecture

> [!IMPORTANT]
> **PRIVACY-FIRST | TYPO-TOLERANT | MULTI-ENTITY AUTOCOMPLETE | ZERO COMMERCIAL MANIPULATION**

---

## 1. Search Pipeline Architecture

The Portal18 discovery and search subsystem follows a multi-stage deterministic pipeline:

```
[User Query / URL Params]
       │
       ▼
[1. Query Normalization & Typo Tolerance] (diacritics, lowercase, whitespace collapse)
       │
       ▼
[2. Intent Detection & Synonym Expansion] (states, cities, categories, synonyms)
       │
       ▼
[3. Eligibility Gate] (profile_status='active', visibility='public', deleted_at IS NULL)
       │
       ▼
[4. Hard User Constraints] (state, city, category, target audience, modalities, trust signals)
       │
       ▼
[5. Organic Base Ranking] (text relevance, freshness, authenticity, Bayesian smoothed CTR)
       │
       ▼
[6. Deduplication & Diversity Pass] (max 1 organic entry per advertiser, no consecutive clones)
       │
       ▼
[7. Sponsored Placement Insertion] (distinct inventory slots, clear "Patrocinado" badge)
       │
       ▼
[Final Sanitized Results]
```

---

## 2. Core RPCs & Database Tables

- **`search_synonyms`**: Versioned synonym mapping with draft/active/archived lifecycle.
- **`saved_searches`**: User-managed search criteria with configurable notification frequencies.
- **`user_discovery_preferences`**: 100% voluntary user preferences for favorite regions and categories.
- **`recommendation_feedback`**: User feedback for hiding irrelevant advertisers.
- **`search_query_aggregates`**: Anonymized metrics on search query volume and zero-results rates.
- **`search_profiles_discovery_v3`**: Canonical database search function executing the full filter matrix.
- **`autocomplete_search_v1`**: Multi-entity autocomplete returning matching cities, categories, and stage names.
