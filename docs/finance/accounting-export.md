# Portal18 — Accounting Export & Ledger Sanitization

> [!NOTE]
> **LGPD & PCI-DSS COMPLIANCE IN SANITIZED EXPORTS**

---

## 1. Regras de Higienização de Dados em Exportações

Para garantir total conformidade com a Lei Geral de Proteção de Dados (LGPD) e o padrão PCI-DSS:

1. **Dados Estritamente Omitidos**:
   - Números de cartão (PAN) e códigos de segurança (CVV).
   - Tokens de cartão e segredos bancários de API.
   - Dados biométricos ou documentos de identidade coletados no fluxo de Age Assurance / KYC.
   - Senhas e hashes de autenticação.
2. **Campos Fornecidos no Extrato CSV**:
   - `ID`: Identificador canônico do pedido.
   - `Numero_Pedido`: Código de referência legível (`P18-...`).
   - `Produto`: Nome do plano ou item contratado.
   - `Valor_Bruto_BRL`: Valor total cobrado do cliente em BRL.
   - `Status_Pagamento`: Status da transação (`paid`, `refunded`, etc.).
   - `Metodo`: Método de pagamento utilizado (`PIX`, `credit_card`).
   - `Provedor`: Gateway ou driver responsável pela liquidação.
   - `Criado_Em`: Data e hora da transação em UTC.
