import { NextResponse } from 'next/server';
import { getCanonicalBaseUrl } from '@/lib/seo/seoEngine';

export async function GET() {
  const baseUrl = getCanonicalBaseUrl();

  const content = `# Portal18

> Plataforma nacional 18+ para descoberta de anúncios e perfis profissionais independentes no Brasil.

## Sobre a Plataforma
O Portal18 é um portal de descoberta inclusivo e seguro para profissionais adultos independentes (mulheres, homens, travestis, pessoas trans e não-binárias) em diversas regiões do Brasil. A plataforma opera com estrita conformidade legal, verificação técnica de maioridade (18+) e salvaguarda absoluta de privacidade.

## Seções Públicas Principais
- Início: ${baseUrl}/
- Explorar Anúncios: ${baseUrl}/explorar
- Planos de Publicação: ${baseUrl}/plans
- Anuncie Conosco: ${baseUrl}/anunciar
- Anuncie em Salvador / BA: ${baseUrl}/anunciar/salvador
- Central de Ajuda & FAQ: ${baseUrl}/help

## Políticas de Segurança, Confiança e 18+ (Trust Center)
- Trust Center Oficial: ${baseUrl}/trust
- Verificação de Maioridade (ECA Digital): ${baseUrl}/trust/age-verification
- Proteção e Prevenção à Exploração de Menores: ${baseUrl}/trust/minors
- Moderação e Diretrizes de Conteúdo: ${baseUrl}/trust/moderation
- Remoção Imediata de Conteúdo Não Autorizado: ${baseUrl}/trust/content-removal
- Política de Privacidade & LGPD: ${baseUrl}/trust/lgpd
- Segurança Técnica e Infraestrutura: ${baseUrl}/trust/security

## Princípios Éticos e de Proteção de Dados
1. Maioridade Estrita (18+): Acesso a contatos diretos e galerias explícitas requer comprovação de maioridade.
2. Zero Biometria Armazenada: O Portal18 não armazena fotos de documentos, selfies ou biometria de visitantes.
3. Não-Discriminação: Plataforma aberta e inclusiva para todas as identidades de gênero e modalidades de atendimento legítimas.
4. Contato Direto: Os visitantes interagem diretamente com os anunciantes via canais oficiais verificados (WhatsApp/Telegram), sem intermediários.

## Sitemap Canônico
- Sitemap XML: ${baseUrl}/sitemap.xml
- Robots: ${baseUrl}/robots.txt
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
