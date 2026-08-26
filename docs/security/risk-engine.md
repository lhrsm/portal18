# Especificação Técnica do Motor de Risco e Antifraude (Risk Engine)

## 1. Funcionamento do Motor de Risco
O `RiskEngine` processa eventos comportamentais em tempo real, calculando uma pontuação de 0 a 100 pontos para cada conta de usuário ou anunciante:

$$Score = \min\left(100, \sum \Delta_{event} \times DecayFactor\right)$$

Onde o $DecayFactor$ reduz o impacto de eventos antigos em 10% por semana.

## 2. Níveis de Risco e Ações Adaptativas
- **Baixo (0 - 29)**: Fluxo normal de navegação e operações sem atrito.
- **Médio (30 - 59)**: Exigência adaptativa de CAPTCHA em ações sensíveis (ex: cadastro, denúncias).
- **Alto (60 - 84)**: Exigência obrigatória de reautenticação com MFA / TOTP para transações financeiras e alterações cadastrais.
- **Crítico (85 - 100)**: Envio automático para fila de revisão manual prioritária (`/admin/risk`) ou suspensão preventiva de publicação em caso de abuso confirmado de mídias.

## 3. Governança e Resolução Humana
- Apenas membros da equipe de moderação/compliance (`is_staff()`) podem auditar ou resolver eventos na fila administrativa.
- Classificações possíveis: `resolved` (resolvido), `false_positive` (falso positivo, cancelando a pontuação) e `confirmed` (abuso confirmado).
