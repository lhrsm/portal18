# COMPARATIVO TÉCNICO E REGULATÓRIO DE PROVEDORES DE AGE ASSURANCE (ECA DIGITAL & LGPD)

**Documento:** Análise de Viabilidade Técnica, Comercial e de Privacidade
**Plataforma:** Portal Nacional 18+
**Data:** 28 de Agosto de 2026
**Finalidade:** Seleção e homologação de provedor de Verificação de Maioridade para Visitantes

---

## 1. INTRODUÇÃO E REQUISITOS OBRIGATÓRIOS

Para conformidade com o Estatuto da Criança e do Adolescente (ECA Digital), Marco Civil da Internet (Lei 12.965/2014) e Lei Geral de Proteção de Dados (Lei 13.709/2018), o Portal18 exige uma solução de **Garantia de Idade (Age Assurance)** para visitantes, rigorosamente separada do fluxo de KYC de anunciantes.

### Requisitos Inegociáveis:
1. **Verificação de Maioridade (18+)**: Confirmação robusta através de estimativa facial por IA, validação documental e/ou bases oficiais.
2. **Reutilização de Credenciais (Reuse)**: Visitantes frequentes não devem repetir fotos ou biometria em cada acesso se o provedor possuir uma credencial válida.
3. **Privacidade por Design (Zero PII no Portal)**: O Portal18 **não armazena nem recebe** fotos de documentos, selfies, biometria facial, CPF ou dados bancários do visitante. Recebemos apenas um sinal criptográfico opaco (`18_plus`, data de emissão, expiração e hash de referência).
4. **Suporte ao Brasil e Documentação Nacional**: RG, CNH, CIN e Passaporte brasileiro.
5. **Aceitação Comercial Explícita do Setor Adulto**: O fornecedor deve suportar comercialmente portais de anúncios e marketplaces adultos sem risco de rescisão sumária.

---

## 2. ANÁLISE COMPARATIVA DE PROVEDORES

Abaixo detalhamos a investigação realizada sobre 7 provedores relevantes:

| Critério / Provedor | Verifica ID | Sumsub Age | Veriff | idwall | CAF | Yoti | Persona |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **País de Origem** | Brasil | Reino Unido / Global | Estônia / EUA | Brasil | Brasil | Reino Unido | EUA |
| **Foco em ECA Digital** | Nativo | Módulo de Idade | Global / ECA | KYC Geral | KYC Geral | Age Assurance | Identity Flow |
| **Métodos de Verificação** | Facial IA + Doc | Facial IA + Doc | Facial IA + Doc | Doc + Birôs | Doc + Biometria | Estimativa Facial IA | Doc + Selfie |
| **Reutilização de Credencial** | Nativa (Conta/Google) | Reusable Applicant | Reusable ID | MeuID (Limitado) | Em Homologação | Digital ID App | Inquiry Graph |
| **Suporte a Documentos BR** | RG, CNH, CIN | RG, CNH, CIN, Pass | RG, CNH, Pass | Todas as bases BR | Todas as bases BR | CNH, Pass | RG, CNH, CIN |
| **Minimização de Dados (Zero PII)** | Excelente (Sinal 18+) | Muito Bom (Custom) | Excelente (Token) | Regular (Full KYC) | Regular (Full KYC) | Excelente (Token) | Muito Bom |
| **Aceitação de Conteúdo Adulto** | Nativa / Explícita | Sob Aprovação | Sob Aprovação | Restrita | Restrita | Aprovada | Restrita |
| **Modelo de Integração** | Redirect / OIDC | WebSDK / REST | Redirect / WebSDK | REST / SDK | REST / SDK | Redirect / App | WebSDK / API |
| **Ambiente Sandbox** | Disponível | Disponível | Disponível | Disponível | Disponível | Disponível | Disponível |
| **Webhooks Assinados** | HMAC-SHA256 | HMAC-SHA256 | HMAC-SHA256 | HMAC-SHA256 | HMAC-SHA256 | RSA / HMAC | HMAC-SHA256 |
| **Precificação Pública** | Cotação Comercial | Cotação Comercial | A partir de $0.90 | Cotação / Mínimo | Cotação / Mínimo | Cotação Comercial | Cotação / Mínimo |

---

## 3. MATRIZ DE PONTUAÇÃO PONDERADA

Pesos definidos com base nas prioridades estratégicas da plataforma:
- **Brasil Fit & Docs Locais:** 20%
- **Reutilização e Baixo Atrito:** 20%
- **Privacidade & Minimização de Dados:** 15%
- **Integração Técnica & SDK/Webhooks:** 15%
- **Aceitação Comercial do Setor Adulto:** 15%
- **Custo e Escalabilidade:** 10%
- **Suporte, SLA & DPA:** 5%

| Provedor | Brasil (20%) | Reuse (20%) | Privacidade (15%) | Técnico (15%) | Comercial Adult (15%) | Custo (10%) | Suporte (5%) | **NOTA FINAL (100%)** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Verifica ID** | 9.5 (1.90) | 9.0 (1.80) | 9.5 (1.425) | 8.5 (1.275) | 10.0 (1.50) | 8.5 (0.85) | 8.0 (0.40) | **9.15 / 10** |
| **2. Sumsub Age** | 9.0 (1.80) | 8.0 (1.60) | 8.5 (1.275) | 9.5 (1.425) | 8.5 (1.275) | 8.0 (0.80) | 9.5 (0.475) | **8.65 / 10** |
| **3. Yoti** | 7.0 (1.40) | 9.0 (1.80) | 10.0 (1.50) | 8.5 (1.275) | 9.5 (1.425) | 8.0 (0.80) | 9.0 (0.45) | **8.65 / 10** |
| **4. Veriff** | 8.0 (1.60) | 8.0 (1.60) | 9.0 (1.35) | 9.0 (1.35) | 8.5 (1.275) | 8.0 (0.80) | 9.0 (0.45) | **8.42 / 10** |
| **5. Persona** | 8.0 (1.60) | 7.5 (1.50) | 8.5 (1.275) | 9.0 (1.35) | 6.5 (0.975) | 6.5 (0.65) | 9.0 (0.45) | **7.80 / 10** |
| **6. CAF** | 9.5 (1.90) | 6.5 (1.30) | 7.5 (1.125) | 8.0 (1.20) | 5.5 (0.825) | 6.5 (0.65) | 8.5 (0.425) | **7.42 / 10** |
| **7. idwall** | 9.5 (1.90) | 6.5 (1.30) | 7.5 (1.125) | 8.0 (1.20) | 5.0 (0.75) | 6.0 (0.60) | 8.5 (0.425) | **7.30 / 10** |

---

## 4. DECISÃO FINAL & PROVEDORES SELECIONADOS

1. **Provedor Primário Selecionado:** **Verifica ID**
   - **Justificativa:** Especializado no mercado brasileiro de entretenimento adulto e conformidade com o ECA Digital. Possui fluxo de reutilização com autenticação federada (e.g. Google no provedor), dispensando captura biométrica em acessos recorrentes válidos, e opera em modelo de privacidade com entrega estrita do sinal 18+.
2. **Provedor Secundário / Fallback:** **Sumsub Age Verification**
   - **Justificativa:** Infraestrutura global já integrada e homologada no Portal18 para KYC de anunciantes, com alta precisão de estimativa facial e excelente SLA de API.

---

## 5. LIMITAÇÕES E STATUS COMERCIAL

> [!IMPORTANT]
> A contratação de produção exige a assinatura formal do DPA (Data Processing Agreement), aprovação comercial de underwriting para o segmento de anúncios e alinhamento de custos por verificação e por reutilização. O código permanece em **Sandbox Homologado**, com enforcement em produção ativável via feature flag após emissão das credenciais oficiais.
