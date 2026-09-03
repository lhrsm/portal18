# Portal18 — Advertiser Publication Gate & Verification Compliance

> [!IMPORTANT]
> **SERVER-SIDE ENFORCEMENT | ZERO CLIENT-SIDE BYPASS | FAIL-CLOSED DEFAULT**

---

## 1. Publication Eligibility Rules

An advertiser profile is published to public discovery only if:
1. `verification_status = 'verified'` (Identity & Majority verified by certified KYC provider or audited manual compliance review).
2. `moderation_status = 'approved'` (Profile content, photos, and descriptions approved by Moderation Team).
3. `is_active = true` (Account not suspended or deleted).

---

## 2. Server-Authoritative Database Guards

- **Database Triggers**: Attempting to update `profile_status = 'published'` while `verification_status != 'verified'` is rejected by PostgreSQL triggers.
- **Search Engine Discovery**: `search_profiles_discovery_v3` strictly includes only approved, verified, and active advertisers.
- **Client Flag Tampering Resilience**: Client requests modifying `is_verified` or `published` without server authority are rejected by Row Level Security (RLS) policies.
