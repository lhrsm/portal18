# REGISTRO DE SUBOPERADORES DE DADOS (SUBPROCESSORS)

**Plataforma:** Portal Nacional 18+
**Versão:** 1.0
**Data de Publicação:** 27 de Agosto de 2026
**Conformidade:** LGPD (Lei 13.709/2018) & Marco Civil da Internet (Lei 12.965/2014)

---

## 1. SUBOPERADORES DE DADOS HOMOLOGADOS

Abaixo estão listados os fornecedores terceirizados que realizam o tratamento de dados pessoais em nome da plataforma, estritamente limitados às finalidades operacionais contratadas:

| Suboperador | Finalidade do Tratamento | Categorias de Dados Tratados | Região de Hospedagem | Retenção / DPA |
| :--- | :--- | :--- | :--- | :--- |
| **Verifica ID (Provedor Homologado)** | Garantia de Maioridade 18+ de Visitantes (ECA Digital) e Reutilização de Credenciais | Sinal de maioridade (18+), hash opaco e referência de credencial (Zero armazenamento de biometria no Portal) | Brasil | DPA formalizado com estrita minimização de dados |
| **Sumsub (Sum and Substance Ltd)** | Verificação de identidade de anunciantes (KYC), Prova de Vida (Liveness) e Fallback de Idade | Documento de identificação com foto (RG/CNH/CIN), selfie biométrica, data de nascimento e CPF de anunciantes | União Europeia / EUA | Retenção conforme contrato de conformidade e DPA formal |
| **Supabase Inc.** | Banco de dados transacional, Autenticação de usuários e Armazenamento seguro de objetos | Identificadores de usuário, e-mail, credenciais criptografadas, metadados de perfil e logs | América do Sul / EUA | DPA formalizado com criptografia em repouso AES-256 |
| **Vercel Inc.** | Hospedagem da aplicação frontend e funções serverless / Edge | Logs de requisição, endereços IP (anonimizados para métricas) e dados de tráfego | Global Edge / Brasil | DPA formalizado |
| **Provedor de E-mail (Resend / SendGrid)** | Disparo de e-mails transacionais e de segurança (recuperação de senha, confirmações) | Endereço de e-mail e nome de exibição (assuntos e conteúdos estritamente neutros) | EUA / Global | DPA formalizado |

---

## 2. POLÍTICA DE EXCLUSÃO & MINIMIZAÇÃO DE DADOS

- Nenhum dado biométrico bruto ou cópia de documento de identidade é armazenado nos servidores locais do Portal.
- Quando um anunciante solicita a exclusão definitiva de sua conta nos termos da LGPD, uma notificação de deleção assíncrona é enviada ao provedor de KYC para expurgo ou retenção exclusiva sob prazos legais obrigatórios.
