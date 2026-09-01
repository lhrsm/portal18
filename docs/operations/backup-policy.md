# POLÍTICA DE BACKUP E RETENÇÃO DE DADOS

**Portal:** Portal Nacional de Entretenimento Adulto 18+
**Versão:** 1.0
**Data:** 27 de Agosto de 2026

---

## 1. ESCOPO & CLASSIFICAÇÃO DOS DADOS

| Categoria de Dados | Localização Primária | Política de Backup | Criptografia | Retenção |
| :--- | :--- | :--- | :--- | :--- |
| **Banco de Dados (Schema & Domínio)** | Supabase PostgreSQL | Snapshot Diário + Dump Lógico | TLS em trânsito + AES-256 no repouso | Diário (7d), Semanal (4sem), Mensal (6m) |
| **Mídia de Anunciantes (uploads)** | Supabase Storage (`uploads`) | Réplica Externa S3-Compatible | TLS + AES-256 | Alinhada à existência do perfil |
| **Documentos KYC (`kyc-documents`)** | Supabase Storage (`kyc-documents`) | Réplica Privada Criptografada | TLS + AES-256 com chaves restritas | Conforme marco civil / LGPD |
| **Anexos de Suporte (`ticket-attachments`)** | Supabase Storage (`ticket-attachments`)| Réplica Privada | TLS + AES-256 | 90 dias após encerramento do chamado |
| **Exportações de Dados (`exports`)** | Supabase Storage (`exports`) | Descartável (Regenerável sob demanda) | TLS + AES-256 | TTL estrito de 7 dias |

---

## 2. MATRIZ DE RETENÇÃO

- **Backups Diários:** Preservados por 7 dias.
- **Backups Semanais:** Preservados por 4 semanas (1 mês).
- **Backups Mensais:** Preservados por 6 meses.
- **Legal Hold:** Dados e backups vinculados a ordens judiciais ou investigações ativas possuem flag `hasLegalHold = true` e são **imunes** a qualquer rotina automática de expurgo.

---

## 3. INTEGRIDADE CRIPTOGRÁFICA & MANIFESTOS

- Cada rotina de backup gera um manifesto imutável assinado com checksum **SHA-256** para cada arquivo/objeto.
- Qualquer divergência detectada na comparação de checksums resulta imediatamente em status `FAILED`, acionando alerta operacional.
- O backup utiliza travas de concorrência (*concurrency locks*) para impedir execuções sobrepostas.

---

## 4. CONFORMIDADE LGPD & TOMBSTONES DE DELEÇÃO

Para garantir que a restauração de um backup antigo não recupere dados de usuários que já solicitaram a exclusão de suas contas nos termos da LGPD:
1. Um registro assíncrono de *Deletion Tombstones* armazena o hash criptográfico anônimo dos identificadores excluídos.
2. Em qualquer procedimento de restore, a lista de tombstones é processada automaticamente, removendo permanentemente qualquer registro restaurado indevidamente.
