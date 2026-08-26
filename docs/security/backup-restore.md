# Política de Backup, Recuperação e Desastres (DRP)

## 1. Estratégia de Backup
- **Point-in-Time Recovery (PITR)**: Habilitado no PostgreSQL com granularidade de até 1 segundo e retenção contínua de 7 a 30 dias.
- **Backups Físicos Diários**: Snapshots automatizados com replicação geográfica em zona de disponibilidade separada.
- **Storage Buckets**: Versionamento de arquivos e réplicas cross-region em storage seguro.

## 2. Métricas de Resiliência (RPO / RTO)
- **RPO (Recovery Point Objective)**: < 5 minutos (perda máxima aceitável de dados transacionais).
- **RTO (Recovery Time Objective)**: < 30 minutos (tempo máximo para restabelecimento total da plataforma).

## 3. Teste Periódico de Restauração (Restore Drill)
- Execução trimestral de restauração em ambiente isolado (staging).
- Validação automatizada de integridade referencial e verificação de integridade das chaves e triggers.
