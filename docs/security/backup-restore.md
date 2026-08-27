# Política de Backup, Recuperação e Desastres (DRP) — Forense & Produção

## 1. Estratégia de Banco de Dados (PostgreSQL)
- **Point-in-Time Recovery (PITR)**: Arquivamento contínuo de WAL (Write-Ahead Logs) no Supabase (planos Pro/Enterprise), permitindo restauração consistente para qualquer segundo dentro da janela de retenção (7 a 30 dias).
- **Daily Snapshots**: Utilizados como alternativa padrão quando PITR não está ativado, ou gerados por rotinas externas/customizadas de backup lógico (`pg_dump`).
- **Retenção Efetiva**: Conforme plano configurado na infraestrutura de produção.

## 2. Estratégia de Storage de Objetos (Supabase Storage)
- **Separação Técnica Crítica**: O backup do PostgreSQL contém exclusivamente os **metadados** (`storage.objects`, `storage.buckets`), NÃO incluindo os arquivos binários brutos.
- **Backup de Objetos**: Implementado via rotina externa automatizada (`storageBackupService`), com exportação criptografada, manifesto SHA-256 e replicação para bucket S3-compatível externo.
- **Isolamento de Privacidade no Restore**:
  - Objetos públicos (`uploads`) mantêm visibilidade pública.
  - Documentos sensíveis (`kyc-documents`, `exports`, `ticket-attachments`) são restaurados com políticas de acesso estritamente restritas.

## 3. Métricas de Resiliência (RPO / RTO)
- **RPO (Recovery Point Objective)**: < 5 minutos (com PITR contínuo ativo) ou 24 horas (com daily snapshots convencionais).
- **RTO (Recovery Time Objective)**: < 30 minutos para provisionamento de novo nó e restauração do estado do banco.

## 4. Teste Periódico de Restauração (Restore Drill)
- Execução periódica em ambiente isolado (staging) com verificação de integridade referencial, checksums de arquivos e revalidação de 100% das políticas de RLS.
