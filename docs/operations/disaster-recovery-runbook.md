# RUNBOOK OPERACIONAL — PLANO DE RECUPERAÇÃO DE DESASTRES (DISASTER RECOVERY & RESTORE)

**Release:** Portal Nacional 18+
**Versão do Documento:** 1.0
**Classificação:** Confidencial / Operações & Infraestrutura

---

## 1. OBJETIVOS E CLASSIFICAÇÃO (RPO / RTO)

| Métrica | Meta Operacional (Target) | Descrição |
| :--- | :--- | :--- |
| **Database RPO** | 24 Horas (Daily) / 5 Minutos (PITR) | Perda máxima aceitável de dados transacionais. |
| **Storage RPO** | 24 Horas | Perda máxima aceitável de uploads e mídias. |
| **Target RTO** | < 2 Horas | Tempo total para restauração e restabelecimento de tráfego. |
| **Garantia SLA** | Planejada / Não-Contratual | Dependente do plano e provedor de réplica externa ativo. |

---

## 2. PROCEDIMENTO PASSO A PASSO DE RESTORE

### FASE 1: DECLARAÇÃO DE INCIDENTE & CONGELAMENTO DE ESCRITA
1. Confirmar estado de desastre crítico pelo comitê técnico/DPO.
2. Ativar página de manutenção / modo de emergência na CDN/Edge (Cloudflare / Vercel Edge).
3. Congelar imediatamente conexões de escrita ao banco e filas de background jobs.

### FASE 2: IDENTIFICAÇÃO DO PONTO DE RECUPERAÇÃO (RECOVERY POINT)
1. Localizar o último backup íntegro no storage de réplica ou snapshot diário Supabase.
2. Inspecionar o `StorageBackupManifest` correspondente (`manifestVersion`, `status = success`, `checksumAlgorithm = sha256`).
3. Verificar ausência de corrupção ou falha parcial no manifesto.

### FASE 3: RESTAURAÇÃO DO BANCO DE DADOS & PARIDADE DE MIGRATIONS
1. **Proteção de Produção:** Nunca executar restore diretamente sobre a instância de produção sem homologação em ambiente isolado.
2. Provisionar novo banco de dados limpo ou restaurar snapshot controlado.
3. Executar o pipeline sequencial de migrations canônicas:
   ```bash
   npx supabase db push
   ```
4. Confirmar que a migration head alcança estritamente:
   `20260827000017_remove_legacy_verification_webhook.sql`
5. Aplicar o dump lógico dos dados de domínio preservando chaves primárias e integridade referencial.

### FASE 4: REAPLICAÇÃO DE DELEÇÕES LGPD (TOMBSTONES)
1. Carregar a tabela de `DeletionTombstones` mais recente para evitar a ressuscitação indevida de dados de usuários que exerceram o direito de exclusão após o snapshot.
2. Executar o script de expurgo de tombstones garantindo conformidade legal.

### FASE 5: RESTAURAÇÃO DO SUPABASE STORAGE
1. Recriar/validar os 4 buckets canônicos:
   - `uploads` (Público com políticas de visualização para aprovados)
   - `kyc-documents` (Privado / Criptografado)
   - `exports` (Privado com TTL de 7 dias)
   - `ticket-attachments` (Privado por ticket)
2. Restaurar os binários a partir do manifesto conferindo o checksum SHA-256 de cada objeto.
3. Descartar signed URLs antigas (devem ser geradas novas sob demanda).

### FASE 6: VALIDAÇÃO DE SEGURANÇA, AUTH & RLS (SMOKE TEST)
1. Validar que as políticas de RLS estão 100% ativas em todas as tabelas.
2. Testar acesso cruzado:
   - Usuário A acessa seus dados: **ALLOWED**
   - Usuário B tenta ler dados de A: **DENIED**
   - Anônimo tenta acessar storage privado: **DENIED**
3. Executar suite de verificação automatizada:
   ```bash
   npm run type-check
   npx tsx scripts/verify-backup.ts
   npx tsx scripts/verify-supabase-runtime.ts
   ```

### FASE 7: RESTABELECIMENTO DE TRÁFEGO
1. Desativar modo de manutenção na CDN.
2. Monitorar logs estruturados e métricas de erro 5xx nos primeiros 60 minutos.
