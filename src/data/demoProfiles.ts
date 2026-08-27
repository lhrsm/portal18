/**
 * ============================================================================
 * REALISTIC SYNTHETIC DEMO DATASET (PHASE 23)
 * ============================================================================
 * Strictly fictitious data for visual validation, layout density, and UI testing.
 * Zero real personal data, zero competitor content, zero minors.
 */

import { PublicAdvertiser, Category, BrazilState, BrazilCity } from '@/types/app.types';

export const DEMO_STATES: BrazilState[] = [
  { id: 'state-ba', code: 'BA', name: 'Bahia', slug: 'bahia' },
  { id: 'state-sp', code: 'SP', name: 'São Paulo', slug: 'sao-paulo' },
  { id: 'state-rj', code: 'RJ', name: 'Rio de Janeiro', slug: 'rio-de-janeiro' },
  { id: 'state-mg', code: 'MG', name: 'Minas Gerais', slug: 'minas-gerais' },
  { id: 'state-df', code: 'DF', name: 'Distrito Federal', slug: 'distrito-federal' },
  { id: 'state-pe', code: 'PE', name: 'Pernambuco', slug: 'pernambuco' },
  { id: 'state-ce', code: 'CE', name: 'Ceará', slug: 'ceara' },
  { id: 'state-pr', code: 'PR', name: 'Paraná', slug: 'parana' },
];

export const DEMO_CITIES: BrazilCity[] = [
  { id: 'city-salvador', state_id: 'state-ba', name: 'Salvador', slug: 'salvador', ibge_code: '2927408', latitude: -12.9714, longitude: -38.5014, population: 2418005, capital: true, region: 'Nordeste' },
  { id: 'city-sao-paulo', state_id: 'state-sp', name: 'São Paulo', slug: 'sao-paulo', ibge_code: '3550308', latitude: -23.5505, longitude: -46.6333, population: 11451245, capital: true, region: 'Sudeste' },
  { id: 'city-rio-de-janeiro', state_id: 'state-rj', name: 'Rio de Janeiro', slug: 'rio-de-janeiro', ibge_code: '3304557', latitude: -22.9068, longitude: -43.1729, population: 6211423, capital: true, region: 'Sudeste' },
  { id: 'city-belo-horizonte', state_id: 'state-mg', name: 'Belo Horizonte', slug: 'belo-horizonte', ibge_code: '3106200', latitude: -19.9167, longitude: -43.9345, population: 2315560, capital: true, region: 'Sudeste' },
  { id: 'city-brasilia', state_id: 'state-df', name: 'Brasília', slug: 'brasilia', ibge_code: '5300108', latitude: -15.7975, longitude: -47.8919, population: 2817068, capital: true, region: 'Centro-Oeste' },
  { id: 'city-recife', state_id: 'state-pe', name: 'Recife', slug: 'recife', ibge_code: '2611606', latitude: -8.0476, longitude: -34.8770, population: 1488920, capital: true, region: 'Nordeste' },
  { id: 'city-fortaleza', state_id: 'state-ce', name: 'Fortaleza', slug: 'fortaleza', ibge_code: '2304400', latitude: -3.7172, longitude: -38.5433, population: 2428678, capital: true, region: 'Nordeste' },
  { id: 'city-curitiba', state_id: 'state-pr', name: 'Curitiba', slug: 'curitiba', ibge_code: '4106902', latitude: -25.4284, longitude: -49.2733, population: 1773733, capital: true, region: 'Sul' },
];

export const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-acompanhantes', name: 'Acompanhantes', slug: 'acompanhantes', description: 'Acompanhantes para jantares, eventos sociais e momentos a dois.', sort_order: 1, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-massagistas', name: 'Massagistas', slug: 'massagistas', description: 'Profissionais especializadas em massagens relaxantes e terapias corporais.', sort_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-executivas', name: 'Executivas VIP', slug: 'executivas-vip', description: 'Atendimento de alto padrão para viagens de negócios e compromissos executivos.', sort_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-hotel', name: 'Atendimento em Hotel', slug: 'atendimento-em-hotel', description: 'Profissionais disponíveis para atendimento privativo em hotéis e resorts.', sort_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-domicilio', name: 'Atendimento em Domicílio', slug: 'atendimento-em-domicilio', description: 'Deslocamento discreto para residências e condomínios fechados.', sort_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-gfe', name: 'Namoradinha / GFE', slug: 'namoradinha-gfe', description: 'Encontros carinhosos com clima descontraído e cumplicidade.', sort_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Curated safe royalty-free Unsplash portraits (tasteful, non-explicit, licensed for development)
const DEMO_PHOTO_URLS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
];

interface DemoProfileSeedDef {
  stageName: string;
  age: number;
  citySlug: string;
  stateCode: string;
  neighborhood: string;
  headline: string;
  bio: string;
  categorySlugs: string[];
  photoIndex: number;
  approvedMediaCount: number;
  completeness: 'high' | 'standard' | 'intermediate' | 'minimal';
}

const RAW_DEMO_DEFINITIONS: DemoProfileSeedDef[] = [
  // 1-24: SALVADOR / BA (24 profiles)
  { stageName: 'Marina Alves', age: 26, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Barra', headline: 'Atendimento sofisticado e discreto na orla da Barra', bio: 'Olá, sou a Marina! Uma mulher educada, comunicativa e bem-humorada. Adoro bons jantares, conversas agradáveis e momentos a dois com tranquilidade. Atendo em local próprio e hotéis.', categorySlugs: ['acompanhantes', 'executivas-vip', 'atendimento-em-hotel'], photoIndex: 0, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Lara Monteiro', age: 24, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Pituba', headline: 'Massagem tântrica e relaxante com total discrição', bio: 'Terapeuta corporal especializada em técnicas de relaxamento muscular e alívio do estresse diário. Ambiente climatizado com som ambiente, toalhas higienizadas e ducha.', categorySlugs: ['massagistas'], photoIndex: 1, approvedMediaCount: 5, completeness: 'high' },
  { stageName: 'Camila Duarte', age: 28, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Rio Vermelho', headline: 'Companhia agradável para jantares e eventos culturais', bio: 'Formada em artes, adoro boa gastronomia e música ao vivo. Sou a companhia perfeita para quem busca elegância e simpatia sem pressa.', categorySlugs: ['acompanhantes', 'namoradinha-gfe'], photoIndex: 2, approvedMediaCount: 7, completeness: 'high' },
  { stageName: 'Bianca Reis', age: 23, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Ondina', headline: 'Estilo namoradinha com muita cumplicidade e carinho', bio: 'Meiga, carinhosa e muito atenciosa. Gosto de criar um clima leve onde possamos conversar, rir e relaxar.', categorySlugs: ['namoradinha-gfe', 'atendimento-em-hotel'], photoIndex: 3, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Júlia Menezes', age: 29, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Itaigara', headline: 'Executiva VIP para viagens e compromissos em Salvador', bio: 'Elegante, poliglota e discreta. Perfeita para homens de negócios que precisam de uma presença marcante em eventos corporativos e viagens.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 4, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Isabela Martins', age: 25, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Graça', headline: 'Beleza natural e simpatia baiana no coração da Graça', bio: 'Universitária, espontânea e muito charmosa. Atendimento exclusivo para cavalheiros exigentes que prezam pelo respeito mútuo.', categorySlugs: ['acompanhantes', 'namoradinha-gfe'], photoIndex: 5, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Amanda Costa', age: 27, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Caminho das Árvores', headline: 'Atendimento privativo em flat de alto padrão', bio: 'Discreta, carinhosa e atenciosa aos mínimos detalhes. Local próprio com segurança, estacionamento e fácil acesso.', categorySlugs: ['acompanhantes', 'atendimento-em-hotel'], photoIndex: 6, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Melissa Rocha', age: 22, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Vitória', headline: 'Doçura e elegância no Corredor da Vitória', bio: 'Apaixonada pela vida, com sorriso fácil e conversa inteligente. Momentos únicos com total discrição e higiene impecável.', categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 7, approvedMediaCount: 8, completeness: 'high' },
  { stageName: 'Carolina Prado', age: 31, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Stella Maris', headline: 'Massagens especiais e atendimento beira-mar', bio: 'Massoterapeuta experiente. Sessões relaxantes com óleos essenciais importados para renovar suas energias.', categorySlugs: ['massagistas', 'atendimento-em-domicilio'], photoIndex: 8, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Luana Freitas', age: 25, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Imbuí', headline: 'Companhia descontraída e cheia de energia', bio: 'Gosto de praia, passeios ao ar livre e bons drinks. Pronta para transformar seu dia em um momento memorável.', categorySlugs: ['namoradinha-gfe'], photoIndex: 9, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Natália Vieira', age: 26, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Pituba', headline: 'Exclusividade para cavalheiros de bom gosto', bio: 'Morena iluminada, corpo escultural e postura refinada. Atendimento sem correria, com foco na sua total satisfação.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 10, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Bruna Valença', age: 24, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Barra', headline: 'Pronta para te acompanhar em qualquer ocasião', bio: 'Simpática, pontual e muito educada. Atendo em hotéis e resorts em Salvador e Litoral Norte.', categorySlugs: ['atendimento-em-hotel', 'atendimento-em-domicilio'], photoIndex: 11, approvedMediaCount: 3, completeness: 'intermediate' },
  { stageName: 'Gabriela Lima', age: 30, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Rio Vermelho', headline: 'Massagem sensorial e terapêutica', bio: 'Ambiente aconchegante preparado especialmente para seu descanso e bem-estar.', categorySlugs: ['massagistas'], photoIndex: 12, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Letícia Moraes', age: 23, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Ondina', headline: 'Jovem, linda e cheia de charme', bio: 'Gosto de pessoas sinceras e cavalheiras. Agendamentos com antecedência.', categorySlugs: ['acompanhantes'], photoIndex: 13, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Vanessa Andrade', age: 27, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Itaigara', headline: 'Atendimento VIP para homens que valorizam qualidade', bio: 'Sofisticação e discrição garantidas. Local privativo com total sigilo.', categorySlugs: ['executivas-vip', 'acompanhantes'], photoIndex: 14, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Fernanda Silveira', age: 25, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Graça', headline: 'Encontros agradáveis e sem complicações', bio: 'Excelente ouvinte, alegre e carinhosa. Venha desfrutar de momentos prazerosos.', categorySlugs: ['namoradinha-gfe'], photoIndex: 15, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Juliana Pires', age: 28, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Pituba', headline: 'Massagista qualificada para alívio de tensões', bio: 'Técnicas orientais e ocidentais combinadas para o seu relaxamento profundo.', categorySlugs: ['massagistas', 'atendimento-em-domicilio'], photoIndex: 0, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Rafaela Borges', age: 22, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Barra', headline: 'Estilo romântica e atenciosa', bio: 'Se você busca alguém especial para conversar e se divertir, acabou de encontrar.', categorySlugs: ['namoradinha-gfe'], photoIndex: 1, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Priscila Ramos', age: 29, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Caminho das Árvores', headline: 'Atendimento refinado para executivos', bio: 'Discrição absoluta para seus momentos de lazer e descontração após o trabalho.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 2, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Débora Santana', age: 26, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Stella Maris', headline: 'Companhia perfeita para fins de semana de sol', bio: 'Adoro praias, viagens e boa gastronomia baiana. Vamos aproveitar Salvador juntos!', categorySlugs: ['acompanhantes'], photoIndex: 3, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Tatiane Neves', age: 32, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Vitória', headline: 'Mulher madura, elegante e cativante', bio: 'Experiência e bom gosto para homens que apreciam uma mulher decidida e carinhosa.', categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 4, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Clara Fontes', age: 21, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Imbuí', headline: 'Doce, simpática e sempre bem disposta', bio: 'Gosto de encontros tranquilos e descontraídos. Atendimento pontual e discreto.', categorySlugs: ['namoradinha-gfe'], photoIndex: 5, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Renata Farias', age: 27, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Rio Vermelho', headline: 'Boemia, arte e momentos inesquecíveis', bio: 'Amo a noite soteropolitana. Perfeita para jantares e passeios a dois.', categorySlugs: ['acompanhantes', 'atendimento-em-hotel'], photoIndex: 6, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Elisa Vasconcelos', age: 24, citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Ondina', headline: 'Massagens e companhia VIP', bio: 'Pronta para lhe proporcionar um atendimento completo com muita gentileza.', categorySlugs: ['massagistas', 'acompanhantes'], photoIndex: 7, approvedMediaCount: 4, completeness: 'intermediate' },

  // 25-34: SÃO PAULO / SP (10 profiles)
  { stageName: 'Helena Camargo', age: 27, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Jardins', headline: 'Sofisticação e alto padrão nos Jardins', bio: 'Companhia de elite para executivos e viagens internacionais. Discrição absoluta e elegância impecável.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 8, approvedMediaCount: 7, completeness: 'high' },
  { stageName: 'Beatriz Sampaio', age: 25, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Itaim Bibi', headline: 'Massagem relaxante e anti-stress no Itaim', bio: 'Espaço requintado para aliviar a correria de São Paulo com total privacidade.', categorySlugs: ['massagistas'], photoIndex: 9, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Mirella Toledo', age: 23, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Moema', headline: 'Estilo namoradinha meiga em Moema', bio: 'Alegre, atenciosa e muito carinhosa para momentos sem pressa.', categorySlugs: ['namoradinha-gfe', 'atendimento-em-domicilio'], photoIndex: 10, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Lorena Guimarães', age: 29, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Pinheiros', headline: 'Companhia cultural e gastronômica em Pinheiros', bio: 'Adoro bons restaurantes e conversas inteligentes sobre arte e negócios.', categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 11, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Patrícia Nogueira', age: 26, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Vila Madalena', headline: 'Charme e autenticidade na Vila Madalena', bio: 'Descontraída e estilosa para eventos e encontros leves.', categorySlugs: ['acompanhantes'], photoIndex: 12, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Sofia Albuquerque', age: 24, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Bela Vista', headline: 'Atendimento privativo perto da Av. Paulista', bio: 'Local seguro e confortável para encontros rápidos ou estendidos.', categorySlugs: ['acompanhantes', 'atendimento-em-hotel'], photoIndex: 13, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Carla Brandão', age: 31, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Morumbi', headline: 'Massoterapia de luxo e bem-estar no Morumbi', bio: 'Tratamentos corporais exclusivos para renovar corpo e mente.', categorySlugs: ['massagistas'], photoIndex: 14, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Vivian Castilho', age: 28, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Jardins', headline: 'Executiva multilíngue para encontros especiais', bio: 'Atendo em hotéis 5 estrelas e residências com horário marcado.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 15, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Diana Queiroz', age: 22, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Moema', headline: 'Jovem carinhosa e muito comunicativa', bio: 'Sempre com um sorriso no rosto para te fazer esquecer os problemas.', categorySlugs: ['namoradinha-gfe'], photoIndex: 0, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Monique Ferraz', age: 25, citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Itaim Bibi', headline: 'Atendimento exclusivo e confidencial', bio: 'Beleza marcante e educação refinada para ocasiões especiais.', categorySlugs: ['acompanhantes'], photoIndex: 1, approvedMediaCount: 4, completeness: 'intermediate' },

  // 35-42: RIO DE JANEIRO / RJ (8 profiles)
  { stageName: 'Yasmin Drummond', age: 26, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Ipanema', headline: 'O charme carioca no coração de Ipanema', bio: 'Morena dos olhos claros, apaixonada pela praia e bons momentos. Atendimento em local próprio e hotéis na Zona Sul.', categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 2, approvedMediaCount: 7, completeness: 'high' },
  { stageName: 'Flávia Mendonça', age: 24, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Copacabana', headline: 'Companhia alegre e descontraída em Copacabana', bio: 'Gosto de passeios, jantares e criar um clima agradável a dois.', categorySlugs: ['namoradinha-gfe', 'atendimento-em-hotel'], photoIndex: 3, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Talita Paes', age: 29, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Leblon', headline: 'Exclusividade e sofisticação no Leblon', bio: 'Elegante, discreta e com postura impecável para homens exigentes.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 4, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Raquel Simões', age: 27, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Barra da Tijuca', headline: 'Massagem tântrica e relaxante na Barra', bio: 'Espaço climatizado com hidromassagem para seu relaxamento total.', categorySlugs: ['massagistas'], photoIndex: 5, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Nicole Lacerda', age: 23, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Botafogo', headline: 'Carinho e cumplicidade em Botafogo', bio: 'Encontros tranquilos com muito respeito e simpatia.', categorySlugs: ['namoradinha-gfe'], photoIndex: 6, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Sabrina Vianna', age: 25, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Ipanema', headline: 'Atendimento VIP na orla de Ipanema', bio: 'Perfeita para acompanhar em jantares e passeios de barco.', categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 7, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Daniela Meireles', age: 30, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Copacabana', headline: 'Massoterapia e relaxamento no Posto 4', bio: 'Ambiente aconchegante para desestressar com segurança.', categorySlugs: ['massagistas'], photoIndex: 8, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Alice Rezende', age: 22, citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Barra da Tijuca', headline: 'Beleza jovem e sorriso contagiante', bio: 'Pronta para momentos especiais e inesquecíveis.', categorySlugs: ['namoradinha-gfe'], photoIndex: 9, approvedMediaCount: 3, completeness: 'minimal' },

  // 43-47: BELO HORIZONTE / MG (5 profiles)
  { stageName: 'Bárbara Couto', age: 27, citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Savassi', headline: 'O melhor do charme mineiro na Savassi', bio: 'Carinhosa, simpática e muito educada. Atendimento em flat privativo ou hotéis.', categorySlugs: ['acompanhantes', 'namoradinha-gfe'], photoIndex: 10, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Luciana Peixoto', age: 25, citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Lourdes', headline: 'Sofisticação e discrição em Lourdes', bio: 'Companhia elegante para jantares nos melhores restaurantes de BH.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 11, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Ingrid Barreto', age: 29, citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Funcionários', headline: 'Massagens terapêuticas e relaxantes', bio: 'Técnicas exclusivas para aliviar o cansaço do dia a dia.', categorySlugs: ['massagistas'], photoIndex: 12, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Jéssica Dorneles', age: 24, citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Belvedere', headline: 'Atendimento VIP no Belvedere', bio: 'Postura impecável e beleza estonteante para encontros memoráveis.', categorySlugs: ['executivas-vip'], photoIndex: 13, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Gisele Fonseca', age: 22, citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Savassi', headline: 'Meiga e carinhosa para momentos leves', bio: 'Gosto de boas conversas e momentos a dois com tranquilidade.', categorySlugs: ['namoradinha-gfe'], photoIndex: 14, approvedMediaCount: 4, completeness: 'intermediate' },

  // 48-51: BRASÍLIA / DF (4 profiles)
  { stageName: 'Manuela Esteves', age: 28, citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Asa Sul', headline: 'Discrição e classe na Asa Sul', bio: 'Especial para autoridades e empresários que exigem sigilo absoluto e educação refinada.', categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 15, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Cíntia Valente', age: 26, citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Asa Norte', headline: 'Massagem relaxante na Asa Norte', bio: 'Atendimento com horário agendado em espaço higienizado e confortável.', categorySlugs: ['massagistas'], photoIndex: 0, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Valéria Macedo', age: 25, citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Sudoeste', headline: 'Companhia agradável e atenciosa no Sudoeste', bio: 'Ótima conversa, sorriso sincero e carinho genuíno.', categorySlugs: ['namoradinha-gfe', 'acompanhantes'], photoIndex: 1, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Lorena Aguiar', age: 30, citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Lago Sul', headline: 'Exclusividade e alto luxo no Lago Sul', bio: 'Presença impecável para viagens, eventos e recepções fechadas.', categorySlugs: ['executivas-vip'], photoIndex: 2, approvedMediaCount: 6, completeness: 'high' },

  // 52-54: RECIFE / PE (3 profiles)
  { stageName: 'Kelly Medeiros', age: 25, citySlug: 'recife', stateCode: 'PE', neighborhood: 'Boa Viagem', headline: 'Beleza e alegria em Boa Viagem', bio: 'Carinhosa, cheia de energia e sempre pronta para proporcionar momentos agradáveis.', categorySlugs: ['acompanhantes', 'namoradinha-gfe'], photoIndex: 3, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Aline Cavalcanti', age: 27, citySlug: 'recife', stateCode: 'PE', neighborhood: 'Pina', headline: 'Massagem tântrica no Pina', bio: 'Terapia relaxante completa para renovação de energias.', categorySlugs: ['massagistas'], photoIndex: 4, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Débora Arruda', age: 29, citySlug: 'recife', stateCode: 'PE', neighborhood: 'Parnamirim', headline: 'Elegância e discrição na Zona Norte', bio: 'Companhia refinada para jantares e eventos exclusivos.', categorySlugs: ['executivas-vip'], photoIndex: 5, approvedMediaCount: 5, completeness: 'standard' },

  // 55-57: FORTALEZA / CE (3 profiles)
  { stageName: 'Paloma Gouveia', age: 24, citySlug: 'fortaleza', stateCode: 'CE', neighborhood: 'Meireles', headline: 'O encanto do Ceará na Beira-Mar do Meireles', bio: 'Simpática, morena e atenciosa. Atendo em hotéis e flats de luxo.', categorySlugs: ['acompanhantes', 'atendimento-em-hotel'], photoIndex: 6, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Karen Furtado', age: 26, citySlug: 'fortaleza', stateCode: 'CE', neighborhood: 'Aldeota', headline: 'Massagem relaxante e anti-stress na Aldeota', bio: 'Espaço privativo climatizado para seu descanso.', categorySlugs: ['massagistas'], photoIndex: 7, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Miriam Bezerra', age: 28, citySlug: 'fortaleza', stateCode: 'CE', neighborhood: 'Praia de Iracema', headline: 'Companhia VIP para momentos especiais', bio: 'Elegante, comunicativa e discreta para passeios e jantares.', categorySlugs: ['executivas-vip'], photoIndex: 8, approvedMediaCount: 6, completeness: 'high' },

  // 58-60: CURITIBA / PR (3 profiles)
  { stageName: 'Evelyn Schmidt', age: 26, citySlug: 'curitiba', stateCode: 'PR', neighborhood: 'Batel', headline: 'Elegância e sofisticação no Batel', bio: 'Loira, olhos claros, postura fina e muito educada. Atendimento de alto padrão para homens exigentes.', categorySlugs: ['executivas-vip', 'acompanhantes'], photoIndex: 9, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Joana Guiel', age: 24, citySlug: 'curitiba', stateCode: 'PR', neighborhood: 'Bigorrilho', headline: 'Massagem relaxante no Bigorrilho', bio: 'Ambiente aconchegante com toalhas aquecidas e óleos aromáticos.', categorySlugs: ['massagistas'], photoIndex: 10, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Sabrina Castanho', age: 25, citySlug: 'curitiba', stateCode: 'PR', neighborhood: 'Água Verde', headline: 'Companhia carinhosa no Água Verde', bio: 'Meiga, atenciosa e ótima companhia para esquecer a rotina fria de Curitiba.', categorySlugs: ['namoradinha-gfe'], photoIndex: 11, approvedMediaCount: 4, completeness: 'intermediate' },
];

/**
 * Generate full domain PublicAdvertiser models
 */
export const DEMO_PUBLIC_ADVERTISERS: PublicAdvertiser[] = RAW_DEMO_DEFINITIONS.map((def, idx) => {
  const city = DEMO_CITIES.find((c) => c.slug === def.citySlug) || DEMO_CITIES[0];
  const state = DEMO_STATES.find((s) => s.code === def.stateCode) || DEMO_STATES[0];
  const slug = `demo-${def.stageName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}-${def.citySlug}`;
  const advertiserId = `demo-adv-${String(idx + 1).padStart(4, '0')}`;
  const profileId = `demo-prof-${String(idx + 1).padStart(4, '0')}`;
  const primaryPhoto = DEMO_PHOTO_URLS[def.photoIndex % DEMO_PHOTO_URLS.length];
  
  const categoryIds = def.categorySlugs
    .map((slug) => DEMO_CATEGORIES.find((c) => c.slug === slug)?.id)
    .filter(Boolean) as string[];

  // Deterministic timestamp variation (within last 30 days)
  const daysAgo = (idx * 3) % 30;
  const createdAt = new Date(Date.now() - (daysAgo * 86400000 + idx * 3600000)).toISOString();
  const lastActiveAt = new Date(Date.now() - ((idx % 5) * 3600000 + 600000)).toISOString();

  return {
    advertiser_id: advertiserId,
    profile_id: profileId,
    stage_name: def.stageName,
    slug,
    age: def.age,
    gender: 'feminino',
    headline: def.headline,
    bio: def.bio,
    presentation: def.bio,
    neighborhood: def.neighborhood,
    city_id: city.id,
    city_name: city.name,
    city_slug: city.slug,
    state_id: state.id,
    state_code: state.code,
    state_name: state.name,
    state_slug: state.slug,
    verification_status: 'verified',
    profile_status: 'approved',
    visibility: 'public',
    primary_photo_url: primaryPhoto,
    approved_media_count: def.approvedMediaCount,
    category_ids: categoryIds,
    last_active_at: lastActiveAt,
    created_at: createdAt,
    updated_at: lastActiveAt,
  };
});
