# Política Global de Limitação de Taxa (Rate Limiting)

## 1. Janelas de Limitação e Limites Padrão

| Endpoint / Ação | Janela de Tempo | Limite Máximo | Ação ao Exceder |
| :--- | :--- | :--- | :--- |
| **Login** (`/login`) | 1 minuto | 5 tentativas | HTTP 429 + Desafio de Segurança |
| **Cadastro** (`/register`) | 5 minutos | 3 cadastros | HTTP 429 + Retry-After |
| **Recuperação de Senha** | 1 hora | 3 pedidos | HTTP 429 + Resposta neutra |
| **MFA OTP Verification** | 10 minutos | 5 tentativas | HTTP 429 + Bloqueio temporário |
| **Upload de Mídia** | 1 minuto | 20 requisições | HTTP 429 + Rate Limit Header |
| **Criação de Denúncias** | 10 minutos | 10 denúncias | HTTP 429 + Risk Event |
| **Abertura de Tickets** | 10 minutos | 5 chamados | HTTP 429 + Retry-After |

## 2. Cabeçalhos HTTP Padronizados
- `X-RateLimit-Limit`: Número máximo de requisições permitidas na janela.
- `X-RateLimit-Remaining`: Requisições restantes antes do bloqueio.
- `X-RateLimit-Reset`: Segundos até o reinício da janela.
- `Retry-After`: Segundos que o cliente deve aguardar antes de tentar novamente.
