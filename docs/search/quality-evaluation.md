# Portal18 — Search Quality & Relevance Evaluation Runbook

> [!IMPORTANT]
> **REPRODUCIBLE TEST SUITE | ZERO SYNTHETIC PII | CONTINUOUS MONITORING**

---

## 1. Dataset de Avaliação de Relevância

Para validar o motor de busca sem violar a privacidade dos usuários, utilizamos um conjunto de consultas de teste sintéticas e objetivas:

| Consulta | Intenção Esperada | Filtros Aplicados | Critério de Sucesso |
|---|---|---|---|
| `"massagem salvador"` | Categoria: `massagem`, Cidade: `salvador` | Categoria `massagem`, Cidade Salvador, BA | Perfis de massagistas em Salvador ordenados por qualidade. |
| `"sao paulo"` (sem acento) | Cidade: `sao-paulo` | Cidade São Paulo, SP | Normalização mapeia corretamente para a capital paulista. |
| `"mulheres rio de janeiro"` | Identidade: `mulheres`, Cidade: `rio-de-janeiro` | Gênero `mulheres`, Cidade Rio de Janeiro, RJ | Exclusão de perfis não compatíveis com os filtros. |
| `"perfil com video"` | Filtro de mídia: `withVideo=true` | Mídia com vídeo aprovado | Apenas anúncios com vídeo de autenticidade/apresentação. |

---

## 2. Critérios de Avaliação de Qualidade

1. **Taxa de Zero-Resultados**: Deve permanecer abaixo de 3% para termos populares em capitais.
2. **Deduplicação**: Zero duplicações de anúncios no mesmo conjunto de resultados.
3. **Isolamento de Suspensos**: 100% de perfis suspensos ou excluídos são bloqueados pelo Eligibility Gate.
4. **Respeito a Bloqueios**: Perfis ocultados ou bloqueados pelo usuário autenticado nunca retornam nos resultados.
