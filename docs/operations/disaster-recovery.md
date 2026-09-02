# Portal18 — Disaster Recovery, Backup & Restore Policy

> [!IMPORTANT]
> **RPO TARGET: <= 1 HOUR | RTO TARGET: <= 2 HOURS | ZERO DATA FABRICATION**

---

## 1. Recovery Objectives

- **Target Recovery Point Objective (RPO)**: <= 1 hour (daily automated snapshots + point-in-time recovery WAL archives).
- **Target Recovery Time Objective (RTO)**: <= 2 hours (automated infrastructure re-provisioning + database restore drill).

---

## 2. Backup Mechanisms

1. **Daily Automated Snapshots**: Managed by Supabase backend daily at 03:00 UTC (retention: 30 days).
2. **Point-in-Time Recovery (PITR)**: Continuous Write-Ahead Log (WAL) streaming permitting restore to any second within retention window.
3. **Manual Export & Pre-Migration Backups**: Triggered before high-risk schema migrations via `pg_dump` CLI.

---

## 3. Controlled Restore Verification Drill Procedure

1. **Target Isolation**: Create isolated scratch database instance `portal18-homolog-restore-drill`.
2. **Snapshot Extraction**: Restore latest backup snapshot into scratch instance.
3. **Integrity Validation**:
   - Run `auditMigrations` to verify migration history parity.
   - Assert presence of critical tables (`advertiser_profiles`, `orders`, `discovery_impression_events`).
   - Validate RLS policies and database function execution.
4. **Clean Decommissioning**: Destroy scratch database instance after logging audit checksums.
