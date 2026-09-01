# Portal18 — Web Push & Lockscreen Privacy

> [!NOTE]
> **VAPID SPECIFICATION | DISCRETE LOCKSCREEN TEXT | CLEANUP ON REVOCATION**

---

## 1. Diretrizes de Privacidade para Push Notifications

1. **Payloads Discretos em Tela Bloqueada**:
   - Devido à natureza privada da plataforma 18+, notificações push nunca exibem detalhes explícitos, nomes de anunciantes ou informações financeiras na tela bloqueada do dispositivo.
   - Formato padrão: `"Portal18: Você tem uma nova atualização na sua conta."`
2. **Consentimento Explícito (Sem Popups Invasivos)**:
   - A permissão do navegador (`Notification.requestPermission`) só é solicitada após o usuário clicar em um botão explícito de ativação, nunca no carregamento inicial da página.
3. **Higienização de Assinaturas Inválidas**:
   - Respostas de erro `410 Gone` ou `404 Not Found` do servidor VAPID resultam na remoção automática do endpoint da tabela `push_subscriptions`.
