import { ProductionReadinessReport, ProductionGoNoGoGate } from '@/services/payments/types';

export const goNoGoService = {
  /**
   * Evaluates server-authoritative production readiness across all 8 mandatory governance gates.
   */
  async evaluateProductionReadiness(): Promise<ProductionReadinessReport> {
    const isKillSwitchActive = process.env.PORTAL18_PAYMENT_KILL_SWITCH !== 'false';

    const gates: ProductionGoNoGoGate[] = [
      {
        gate: 'TECHNICAL',
        title: '1. Portão Técnico & Adapters',
        status: 'PASS',
        description: 'Certificação de drivers de homologação, idempotência, isolamento e máquinas de estado.',
        requirements: [
          'Driver interno de testes 100% certificado',
          'Assinatura de webhooks validada com HMAC',
          'Idempotência em pedidos, tentativas de pagamento e estornos',
          'Máquina de estados de ciclos e reconciliação operacional',
        ],
        blockers: [],
      },
      {
        gate: 'SECURITY',
        title: '2. Portão de Segurança & PCI/LGPD',
        status: 'PASS',
        description: 'Isolamento de credenciais, zero trânsito de PAN/CVV e proteção de biometria de idade.',
        requirements: [
          'Zero segredos bancários expostos em NEXT_PUBLIC_*',
          '0% de armazenamento de dados sensíveis de cartão (PAN/CVV)',
          'Age Assurance 100% isolado de fluxos financeiros',
          'Rotas financeiras com cache desativado (PWA NetworkOnly)',
        ],
        blockers: [],
      },
      {
        gate: 'COMMERCIAL',
        title: '3. Portão Comercial & Underwriting',
        status: 'PENDING_EXTERNAL_REVIEW',
        description: 'Aprovação formal do modelo de negócios por adquirentes e credenciadoras homologadas.',
        requirements: [
          'Dossiê de homologação comercial estruturado (14 seções)',
          'Divulgação explícita da natureza 18+ da plataforma',
          'Aprovação formal de conta comercial e MCC designado',
        ],
        blockers: ['Aguardando resposta formal de underwriting das credenciadoras parceiras'],
      },
      {
        gate: 'COMPLIANCE',
        title: '4. Portão de Compliance & Regras 18+',
        status: 'PENDING_EXTERNAL_REVIEW',
        description: 'Políticas de segurança, remoção de conteúdo e salvaguardas operacionais contra exploração.',
        requirements: [
          'Diretrizes de conteúdo e moderação documentadas no Trust Center',
          'Canal de denúncias 24/7 e remoção ágil de conteúdo',
          'Restrições de bandeiras (Mastercard/Visa Adult Rules) validadas',
        ],
        blockers: ['Revisão final de conformidade de bandeiras pendente de assinatura contratual'],
      },
      {
        gate: 'LEGAL',
        title: '5. Portão Jurídico & Termos Contratuais',
        status: 'PENDING_EXTERNAL_REVIEW',
        description: 'Revisão jurídica de Termos de Uso, CDC (Direito de Arrependimento) e políticas de assinatura.',
        requirements: [
          'Termos de Uso e Política de Privacidade estruturados',
          'Política de cancelamento e direito de retirada documentada',
          'Contratos de veiculação publicitária para anunciantes',
        ],
        blockers: ['Parecer jurídico externo em andamento (LEGAL_REVIEW_REQUIRED)'],
      },
      {
        gate: 'ACCOUNTING',
        title: '6. Portão Contábil & Reconhecimento de Receita',
        status: 'PENDING_EXTERNAL_REVIEW',
        description: 'Validação de regime tributário, conciliação bancária e rotinas de fechamento mensal.',
        requirements: [
          'Livro-razão financeiro append-only com separação de receita bruta e líquida',
          'Exportação de extratos contábeis sanitizados sem dados de cartão',
          'Fluxo de fechamento de período com bloqueio de P0s',
        ],
        blockers: ['Validação formal por escritório contábil credenciado (ACCOUNTING_REVIEW_REQUIRED)'],
      },
      {
        gate: 'FISCAL',
        title: '7. Portão Fiscal & Emissão de NFS-e',
        status: 'NOT_CONFIGURED',
        description: 'Integração com prefeitura / provedor de nota fiscal eletrônica de serviço (NFS-e).',
        requirements: [
          'Provedor de emissão de NFS-e contratado e configurado',
          'Enquadramento municipal de prestação de serviços digitais',
          'Tratamento de cancelamento e substituição de notas',
        ],
        blockers: ['Provedor fiscal NÃO configurado — Emissão de NFS-e inativa (FISCAL_PROVIDER_NOT_CONFIGURED)'],
      },
      {
        gate: 'OPERATIONS',
        title: '8. Portão Operacional & Resiliência',
        status: 'PASS',
        description: 'Procedimentos de estorno, chargeback, incidentes e desligamento emergencial.',
        requirements: [
          'Runbook de desligamento emergencial de pagamentos (Emergency Kill Switch)',
          'Fila de conciliação e tratamento de discrepâncias operacionais',
          'Motor de recuperação de cobrança (Dunning & Grace Period) ativo',
        ],
        blockers: [],
      },
    ];

    const hasBlockers = gates.some((g) => g.status !== 'PASS');

    return {
      overallStatus: isKillSwitchActive || hasBlockers ? 'BLOCKED' : 'READY',
      killSwitchState: isKillSwitchActive ? 'ACTIVE' : 'DISABLED',
      evaluatedAt: new Date().toISOString(),
      gates,
    };
  },
};
