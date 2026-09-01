# Portal18 — Appeals & Independent Four-Eyes Review

> [!IMPORTANT]
> **FOUR-EYES INDEPENDENT REVIEW: DECIDED_BY != APPLIED_BY**

---

## 1. Princípios do Fluxo de Recurso

1. **Direito à Defesa**: Usuários e anunciantes têm o direito garantido de submeter recursos estruturados contra advertências, despublicação de perfis ou suspensões.
2. **Revisão Independente (Four-Eyes)**:
   - A RPC `resolve_appeal` valida programaticamente que o operador deliberador (`decided_by`) **não pode ser o mesmo operador** que aplicou a sanção original (`applied_by`).
3. **Reversão e Falsos Positivos**:
   - Caso o recurso seja provido (`overturned`), a sanção é automaticamente revogada (`overturned_on_appeal`), a penalidade é suspensa e o histórico é preservado com o registro da correção.
