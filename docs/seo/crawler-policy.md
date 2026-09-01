# Portal18 — AI Crawler & Search Engine Policy

**Last Reviewed:** 2026-08-30
**Status:** Active
**Standard:** Robots Exclusion Protocol & RFC 9309

---

## 1. Executive Summary

Portal18 operates as a privacy-preserving 18+ platform for discovering verified independent professionals. Our robots.txt policy strictly differentiates between **Search Discovery** (allowing users to find legitimate public listings) and **AI Training / Content Scraping** (protecting advertiser content and sensitive contexts).

---

## 2. Crawler Classification Matrix

| Crawler User-Agent | Organization | Primary Purpose | Category | Policy / Directive | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Googlebot` | Google | Web Search Indexing | Search Discovery | **Allow `/`**, Disallow Private | Enables canonical indexation in Google Search. |
| `Bingbot` | Microsoft | Web Search Indexing | Search Discovery | **Allow `/`**, Disallow Private | Enables canonical indexation in Bing. |
| `OAI-SearchBot` | OpenAI | Real-Time Search Citations | Search Discovery | **Allow `/`**, Disallow Private | Enables AI search citations with direct canonical attribution without using data for model training. |
| `ChatGPT-User` | OpenAI | User-Initiated Direct Fetch | Search Discovery | **Allow `/`**, Disallow Private | Fetches specific links requested directly by an active user. |
| `PerplexityBot` | Perplexity AI | Real-Time Search Answers | Search Discovery | **Allow `/`**, Disallow Private | Supplies cited factual answers referencing official public URLs. |
| `GPTBot` | OpenAI | Large Model Training | AI Training | **Disallow `/`** | Prevents automated ingestion of public advertising media/profiles into general training corpora. |
| `ClaudeBot` | Anthropic | Large Model Training & Crawling | AI Training | **Disallow `/`** | Protects advertiser textual/visual data from unauthorized bulk AI extraction. |
| `Google-Extended` | Google | Gemini / Vertex AI Training | AI Training | **Disallow `/`** | Ensures public search indexing (`Googlebot`) is decoupled from generative model training. |
| `CCBot` | Common Crawl | Open Web Scrape | Web Scrape Archive | **Disallow `/`** | Avoids indiscriminate archiving of independent advertiser data in public dataset releases. |
| `Bytespider` | ByteDance | Data Scraping & Training | Web Scrape / AI | **Disallow `/`** | Blocks aggressive automated scrapers. |
| `*` (Default) | Generic | General User-Agents | Fallback | **Allow `/`**, Disallow Private | Allows general web browsers and approved crawlers to access public listings. |

---

## 3. Disallowed Technical & Private Paths (All Allowed Crawlers)

Regardless of the crawler identity, the following paths are **always strictly disallowed**:
- `/admin/` & `/admin` — Internal administration tools
- `/advertiser/` & `/advertiser` — Private advertiser dashboard & sensitive KYC workflows
- `/account/` & `/account` — User accounts, favorites, history, security
- `/auth/`, `/login`, `/register`, `/forgot-password`, `/reset-password` — Authentication endpoints
- `/api/` — Internal backend endpoints & webhooks
- `/age-verification/callback` — Token verification returns
- `/payment/` — Checkout returns and processing routes

---

## 4. Staging / Preview Environment Isolation

When running in Vercel Preview or non-production staging environments (`VERCEL_ENV === 'preview'`), Portal18 dynamically emits a blanket `Disallow: /` for all `*` user-agents with `noindex, nofollow` headers to eliminate duplicate content indexing.

---

## 5. Age Assurance & Anti-Cloaking Invariant

Crawlers are delivered the **exact same public data structure** as an unverified visitor in Safe Mode. There is zero User-Agent bypass, zero crawler-specific bypass of the ECA Digital gate, and zero cloaking.
