# Portal18 — Trust & Safety Central Risk Model

> [!NOTE]
> **EXPLAINABLE SIGNALS | ZERO OPAQUE AI SCORING | ZERO BIOMETRIC RETENTION**

---

## 1. Princípios do Modelo de Risco

1. **Sinais Discretos e Auditáveis**:
   - Cada sinal de risco possui identificador, tipo de sujeito (`user`, `advertiser`, `profile`, `referral`, `review`, `report`, `payment`, `session`, `device`), tipo de sinal, severidade (`info`, `low`, `medium`, `high`, `critical`), nível de confiança (`low`, `medium`, `high`) e metadados sanitizados.
   - O Portal18 **não utiliza fraud score opaco** de IA sem rastreabilidade.
2. **Severidade não é Culpa (Severity != Guilt)**:
   - Sinais de alta severidade disparam investigação manual (`triage`) ou retenção preventiva temporária, e não suspensão sumária.
3. **Não Discriminação e Equidade**:
   - Identidade de gênero, orientação sexual, município ou categoria de anúncio não podem ser utilizados como fatores de penalização de risco.
4. **Isolamento de Biometria e KYC**:
   - O motor de risco não tem acesso a vídeos brutos de autenticidade, imagens faciais ou dados documentais de verificação etária.
