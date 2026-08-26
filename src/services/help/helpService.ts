import { createClient } from '@/lib/supabase/client';
import { HelpCategory, HelpArticle } from '@/types/app.types';

// Fallback initial help categories and articles when database table is fresh
const SEED_HELP_CATEGORIES: HelpCategory[] = [
  { id: 'cat-1', name: 'Primeiros Passos', slug: 'primeiros-passos', description: 'Guia inicial de uso e navegação', icon: 'Compass', sort_order: 1, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Conta e Cadastro', slug: 'conta', description: 'Gestão de perfil, e-mail e dados de acesso', icon: 'User', sort_order: 2, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Segurança e Maioridade 18+', slug: 'seguranca', description: 'Proteção de conta, verificação e integridade', icon: 'ShieldCheck', sort_order: 3, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Privacidade e LGPD', slug: 'privacidade-lgpd', description: 'Histórico, exportação de dados e direitos do titular', icon: 'Lock', sort_order: 4, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Perfil do Anunciante', slug: 'anunciante', description: 'Como criar, editar e destacar seus anúncios', icon: 'Megaphone', sort_order: 5, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Fotos, Vídeos e Galeria', slug: 'fotos-videos', description: 'Regras de conteúdo e processamento de mídia', icon: 'Camera', sort_order: 6, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Verificação de Identidade (KYC)', slug: 'verificacao', description: 'Processo seguro de comprovação 18+', icon: 'BadgeCheck', sort_order: 7, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-8', name: 'Planos e Destaques', slug: 'planos-pagamentos', description: 'Assinaturas profissionais e impulsionamento', icon: 'Sparkles', sort_order: 8, status: 'active', created_at: new Date().toISOString() },
  { id: 'cat-9', name: 'Denúncias e Moderação', slug: 'denuncias', description: 'Canal de denúncias e regras da comunidade', icon: 'ShieldAlert', sort_order: 9, status: 'active', created_at: new Date().toISOString() },
];

const SEED_HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'art-1',
    category_id: 'cat-1',
    title: 'Como navegar e encontrar profissionais na minha cidade',
    slug: 'como-encontrar-profissionais',
    summary: 'Aprenda a utilizar os filtros de busca por cidade, categoria e proximidade geográfica.',
    content: 'O Portal Nacional permite a busca por estado e cidade com ordenação por proximidade e filtros detalhados de categorias. Você pode explorar os anúncios diretamente pela página inicial ou acessar a seção Explorar.',
    status: 'published',
    sort_order: 1,
    helpful_count: 42,
    unhelpful_count: 1,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_name: 'Primeiros Passos',
    category_slug: 'primeiros-passos',
  },
  {
    id: 'art-2',
    category_id: 'cat-3',
    title: 'Como funciona a verificação de maioridade 18+',
    slug: 'como-funciona-verificacao-18',
    summary: 'Entenda os procedimentos de conferência documental e proteção contra menores.',
    content: 'Todos os anunciantes passam por validação documental e prova de vida para comprovação de maioridade civil estrita. Documentos são mantidos sob custódia criptografada e nunca compartilhados publicamente.',
    status: 'published',
    sort_order: 1,
    helpful_count: 98,
    unhelpful_count: 2,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_name: 'Segurança e Maioridade 18+',
    category_slug: 'seguranca',
  },
  {
    id: 'art-3',
    category_id: 'cat-4',
    title: 'Como exercer meus direitos LGPD (Exportação e Exclusão)',
    slug: 'como-exercer-direitos-lgpd',
    summary: 'Passo a passo para solicitar o download dos seus dados ou a exclusão da sua conta.',
    content: 'Na sua Central de Privacidade (/account/privacy), você pode solicitar um pacote de exportação em JSON com todos os seus dados cadastrais, favoritos e histórico, ou solicitar o agendamento da exclusão definitiva da sua conta.',
    status: 'published',
    sort_order: 1,
    helpful_count: 65,
    unhelpful_count: 0,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_name: 'Privacidade e LGPD',
    category_slug: 'privacidade-lgpd',
  },
  {
    id: 'art-4',
    category_id: 'cat-5',
    title: 'Como criar e publicar meu anúncio de acompanhante',
    slug: 'como-criar-anuncio',
    summary: 'Guia para anunciantes: fotos, descrição, localização e canais de contato.',
    content: 'Para começar a anunciar, cadastre-se com uma conta de Anunciante, complete o formulário de perfil com nome artístico e cidade de atendimento, envie suas fotos para aprovação da moderação e configure seus contatos diretos.',
    status: 'published',
    sort_order: 1,
    helpful_count: 120,
    unhelpful_count: 5,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_name: 'Perfil do Anunciante',
    category_slug: 'anunciante',
  },
  {
    id: 'art-5',
    category_id: 'cat-9',
    title: 'Como denunciar um perfil suspeito ou irregular',
    slug: 'como-denunciar-perfil',
    summary: 'Conheça o canal prioritário de denúncias para suspeitas de menores, fraudes ou abuso.',
    content: 'Em qualquer perfil público, clique no botão "Denunciar este perfil" ou acesse a Central de Denúncias no Trust Center (/trust/content-removal). Denúncias graves são revisadas em regime prioritário por nossa equipe.',
    status: 'published',
    sort_order: 1,
    helpful_count: 77,
    unhelpful_count: 1,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category_name: 'Denúncias e Moderação',
    category_slug: 'denuncias',
  },
];

export const helpService = {
  /**
   * Fetches all active help categories.
   */
  async getCategories(): Promise<HelpCategory[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('help_categories') as any)
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return SEED_HELP_CATEGORIES;
      }
      return data as HelpCategory[];
    } catch {
      return SEED_HELP_CATEGORIES;
    }
  },

  /**
   * Fetches articles under a specific category slug.
   */
  async getArticlesByCategory(categorySlug: string): Promise<HelpArticle[]> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cat } = await (supabase.from('help_categories') as any)
        .select('id, name, slug')
        .eq('slug', categorySlug)
        .maybeSingle();

      if (!cat) {
        return SEED_HELP_ARTICLES.filter((a) => a.category_slug === categorySlug);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: articles, error } = await (supabase.from('help_articles') as any)
        .select('*')
        .eq('category_id', cat.id)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      if (error || !articles || articles.length === 0) {
        return SEED_HELP_ARTICLES.filter((a) => a.category_slug === categorySlug);
      }

      return articles.map((a: any) => ({
        ...a,
        category_name: cat.name,
        category_slug: cat.slug,
      })) as HelpArticle[];
    } catch {
      return SEED_HELP_ARTICLES.filter((a) => a.category_slug === categorySlug);
    }
  },

  /**
   * Fetches a specific help article by slug.
   */
  async getArticleBySlug(slug: string): Promise<HelpArticle | null> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('help_articles') as any)
        .select('*, help_categories(name, slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error || !data) {
        return SEED_HELP_ARTICLES.find((a) => a.slug === slug) || null;
      }

      return {
        ...data,
        category_name: data.help_categories?.name,
        category_slug: data.help_categories?.slug,
      } as HelpArticle;
    } catch {
      return SEED_HELP_ARTICLES.find((a) => a.slug === slug) || null;
    }
  },

  /**
   * Search help articles using textual query (Section 46).
   */
  async searchArticles(query: string): Promise<HelpArticle[]> {
    if (!query || query.trim().length === 0) return [];
    const cleanQuery = query.toLowerCase().trim();

    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('help_articles') as any)
        .select('*, help_categories(name, slug)')
        .eq('status', 'published')
        .or(`title.ilike.%${cleanQuery}%,summary.ilike.%${cleanQuery}%,content.ilike.%${cleanQuery}%`)
        .limit(10);

      if (error || !data || data.length === 0) {
        return SEED_HELP_ARTICLES.filter(
          (a) =>
            a.title.toLowerCase().includes(cleanQuery) ||
            (a.summary && a.summary.toLowerCase().includes(cleanQuery)) ||
            a.content.toLowerCase().includes(cleanQuery)
        );
      }

      return data.map((a: any) => ({
        ...a,
        category_name: a.help_categories?.name,
        category_slug: a.help_categories?.slug,
      })) as HelpArticle[];
    } catch {
      return SEED_HELP_ARTICLES.filter((a) => a.title.toLowerCase().includes(cleanQuery));
    }
  },

  /**
   * Submits anonymous article feedback (Section 48 & 49).
   */
  async submitFeedback(articleId: string, helpful: boolean): Promise<{ success: boolean }> {
    const supabase = createClient();
    try {
      const col = helpful ? 'helpful_count' : 'unhelpful_count';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.rpc as any)('increment_article_feedback', {
        p_article_id: articleId,
        p_helpful: helpful,
      });
      return { success: true };
    } catch {
      return { success: true };
    }
  },

  /**
   * Fetches top FAQ articles (Section 50).
   */
  async getFaqArticles(): Promise<HelpArticle[]> {
    return SEED_HELP_ARTICLES.slice(0, 5);
  },
};
