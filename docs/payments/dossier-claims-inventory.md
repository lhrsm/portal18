# PORTAL18 — COMPLIANCE CLAIMS INVENTORY & GOVERNANCE RULES

> **Document Type**: Internal Compliance Audit & External Claims Classification
> **Platform**: Portal18 Tecnologia e Publicidade Digital Ltda.
> **Current Version**: Phase 28C.1
> **Classification Level**: Confidential / Risk & Compliance Team

---

## 1. Classification Categories

Every technical, architectural, operational, or legal claim presented to Payment Service Providers (PSPs), acquiring banks, or regulatory bodies must be strictly classified into one of the following 7 categories:

1. `ACTIVE_IN_PRODUCTION`: Implemented in code, deployed, actively handling traffic in production.
2. `IMPLEMENTED_BUT_PROVIDER_PENDING`: Fully coded and integrated in the local architecture, but waiting for an external third-party production provider credential/activation.
3. `SANDBOX_ONLY`: Validated strictly within simulated or test environments; not enabled for live production traffic.
4. `READY_NOT_ACTIVATED`: Fully engineered and ready for deployment, but deliberately held in a dormant/disabled state (e.g. protected behind a Kill Switch or feature flag).
5. `PLANNED`: In architectural design or backlog; not yet fully implemented or validated.
6. `UNVERIFIED`: Under investigation; lacks conclusive empirical verification.
7. `LEGAL_REVIEW_REQUIRED`: Contractual, regulatory, or policy item pending formal review and confirmation by accredited Brazilian legal counsel (OAB).

---

## 2. Platform Claims Inventory Matrix

| # | Platform Area / Claim | Current Evidence in Codebase | Classification Status | Allowed External Wording | Forbidden External Phrasing |
|---|---|---|---|---|---|
| 1 | **Visitor Age Assurance** | Interstitial modal with cryptographically signed cookie tokens and fail-closed Safe Mode. | `ACTIVE_IN_PRODUCTION` (Local Core) / `IMPLEMENTED_BUT_PROVIDER_PENDING` (External ID) | "Arquitetura de Age Assurance fail-closed com modo seguro e verificação de consentimento 18+; integração com provedor de identidade externo em homologação." | "Verificação biométrica de visitantes 100% ativa em produção com provedor governamental homologado." |
| 2 | **Advertiser KYC** | Identity provider interface (`IdentityVerificationProvider`) with Sumsub adapter & mock driver; manual admin gate. | `IMPLEMENTED_BUT_PROVIDER_PENDING` | "Fluxo de onboarding com verificação de documentos e aprovação por mesa de compliance; provedor automatizado de KYC em homologação." | "Documentoscopia biométrica com IA automatizada e ativa em produção para todos os anunciantes." |
| 3 | **Authenticity Video** | Dynamic in-app challenge gesture/code, ephemeral video recording, staff review, badge grant/revocation. | `ACTIVE_IN_PRODUCTION` | "Desafio dinâmico de vídeo gravado na plataforma com revisão pela equipe de Trust & Safety para validação de autenticidade." | "Reconhecimento facial biométrico automatizado via IA em tempo real." |
| 4 | **Minor Protection** | Onboarding gating, manual moderation queue, report escalation procedures, profile suspension. | `ACTIVE_IN_PRODUCTION` (Procedural) / `LEGAL_REVIEW_REQUIRED` (Escalation) | "Tolerância zero para menores de 18 anos, com moderação prévia, suspensão imediata de contas suspeitas e protocolo de escalonamento legal." | "Detecção e banimento automatizado de menores por IA em tempo real com denúncia automática à Polícia Federal." |
| 5 | **Card Security (PAN/CVV)** | Zero card data touches local servers; tokenization via PSP-hosted elements; 3DS readiness. | `READY_NOT_ACTIVATED` | "A plataforma não armazena PAN ou CVV. O fluxo é 100% tokenizado pelo PSP com suporte arquitetural a 3D Secure 2.0." | "Plataforma certificada PCI-DSS Nível 1." |
| 6 | **PIX Processing** | Dynamic QR code & copia e cola payload generation, webhook ingestion, HMAC validation. | `READY_NOT_ACTIVATED` / `SANDBOX_ONLY` | "Arquitetura multi-gateway preparada para geração de PIX Dinâmico e conciliação automatizada via webhooks." | "Portal18 processa e liquida milhões em PIX atualmente em produção." |
| 7 | **Recurring Billing** | Subscription lifecycle manager (7, 30, 90 days), grace period engine, entitlement state machine. | `READY_NOT_ACTIVATED` | "Motor de gerenciamento de assinaturas e ciclos com período de carência preparado para cobrança recorrente via PSP homologado." | "Cobrança recorrente ativa em produção debitando cartões automaticamente." |
| 8 | **Refund & Chargeback** | Database ledger (`payment_chargebacks`), dispute states (`received` $\rightarrow$ `won` / `lost`), programmatic refund endpoints. | `READY_NOT_ACTIVATED` | "Livro-razão de disputas e suporte programático a estornos totais e parciais preparados na arquitetura." | "Operação de chargebacks e estornos ao vivo com taxa garantida de 0%." |
| 9 | **Merchant Category Code (MCC)** | Research suggests MCC 7273 (Dating/Escort Services) or MCC 5967 (Digital Media/Classifieds). | `LEGAL_REVIEW_REQUIRED` / `UNVERIFIED` | "Classificação sugerida para análise de risco: MCC 7273 / MCC 5967. O enquadramento definitivo será atribuído pelo adquirente no underwriting." | "Portal18 está formalmente enquadrado no MCC 7273 pelo Banco Central." |
| 10 | **Payment Kill Switch** | Global environment flag `PORTAL18_PAYMENT_KILL_SWITCH=true` forcing all traffic to internal test driver. | `ACTIVE_IN_PRODUCTION` | "O Kill Switch de pagamentos está 100% ATIVO. Nenhuma transação financeira real é processada até a conclusão formal da homologação." | "Pagamentos reais habilitados e funcionando." |

---

## 3. Strict Forbidden Claims List

Under no circumstances should any communication, outreach letter, pitch deck, or compliance dossier assert the following until formal, documented proof exists:

1. ❌ **"PCI-DSS Certified"**: Portal18 complies with PCI-DSS data minimization principles (zero PAN/CVV storage), but has not undergone a formal QSA audit.
2. ❌ **"Biometric KYC active in production"**: Automated third-party KYC is implemented as an adapter and is currently in sandbox/homologation.
3. ❌ **"Automated AI Minor Detection"**: Protection of minors is enforced via strict onboarding gating, human review, and rapid takedown procedures, not autonomous AI moderation.
4. ❌ **"Automatic police reporting"**: Escalation of illegal activity follows formal legal and manual compliance protocols.
5. ❌ **"MCC 7273 confirmed"**: MCC assignment is the sole prerogative of the acquiring bank during commercial underwriting.
6. ❌ **"Production payments active"**: Real payments are explicitly deactivated behind the global Kill Switch.
