# Portal18 — Service Level Objectives (SLO) & Indicators (SLI)

> [!NOTE]
> **INTERNAL OPERATIONAL TARGETS (NOT CONTRACTUAL SLAs)**

---

## 1. Primary Service Level Indicators (SLIs) & Objectives (SLOs)

| Service Area | Indicator (SLI) | Target (SLO) | Measurement Window |
|---|---|---|---|
| **Public Discovery & Search** | % of successful search queries with latency < 500ms | **99.5%** | Rolling 30 Days |
| **Age Assurance Gate** | % of age verification evaluations completed in < 1500ms | **99.0%** | Rolling 30 Days |
| **Advertiser Dashboard** | % of analytics queries returning HTTP 200 in < 800ms | **99.0%** | Rolling 30 Days |
| **API Availability** | Total HTTP 5xx errors vs total API requests | **< 0.1% (99.9% Uptime)** | Rolling 30 Days |

---

## 2. Alert Thresholds

- **CRITICAL**: Error rate > 1% over 5-minute window or Age Assurance gate unavailable.
- **HIGH**: Database query latency p95 > 1000ms over 15-minute window.
- **WARNING**: Notification or webhook processing backlog > 500 queued items.
