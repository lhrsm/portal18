/**
 * ============================================================================
 * REALISTIC SYNTHETIC DEMO DATASET (PHASE 26C — INCLUSIVE TAXONOMY)
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
  { id: 'cat-massagistas', name: 'Massagistas', slug: 'massagistas', description: 'Profissionais especializados em massagens relaxantes e terapias corporais.', sort_order: 2, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-executivas', name: 'Executivas VIP', slug: 'executivas-vip', description: 'Atendimento de alto padrão para viagens de negócios e compromissos executivos.', sort_order: 3, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-hotel', name: 'Atendimento em Hotel', slug: 'atendimento-em-hotel', description: 'Profissionais disponíveis para atendimento privativo em hotéis e resorts.', sort_order: 4, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-domicilio', name: 'Atendimento em Domicílio', slug: 'atendimento-em-domicilio', description: 'Deslocamento discreto para residências e condomínios fechados.', sort_order: 5, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'cat-gfe', name: 'Namoradinha / GFE', slug: 'namoradinha-gfe', description: 'Encontros carinhosos com clima descontraído e cumplicidade.', sort_order: 6, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Curated safe royalty-free Unsplash portraits (tasteful, non-explicit, licensed for development)
const DEMO_PHOTO_URLS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', // Man
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', // Man
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', // Man
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80', // Man
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80', // Man
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=800&q=80',
];

interface DemoProfileSeedDef {
  stageName: string;
  age: number;
  gender: 'mulheres' | 'homens' | 'travestis_trans' | 'nao_binario_outros';
  citySlug: string;
  stateCode: string;
  neighborhood: string;
  headline: string;
  bio: string;
  targetAudience: string[];
  serviceModalities: string[];
  categorySlugs: string[];
  photoIndex: number;
  approvedMediaCount: number;
  completeness: 'high' | 'standard' | 'intermediate' | 'minimal';
}

const RAW_DEMO_DEFINITIONS: DemoProfileSeedDef[] = [
  // 1-24: SALVADOR / BA (24 profiles)
  { stageName: 'Marina Alves', age: 26, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Barra', headline: 'Atendimento sofisticado e discreto na orla da Barra', bio: 'Educada, comunicativa e bem-humorada. Adoro bons jantares, conversas agradáveis e momentos a dois com tranquilidade. Atendo em local próprio e hotéis.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'executivas-vip', 'atendimento-em-hotel'], photoIndex: 0, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Lara Monteiro', age: 24, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Pituba', headline: 'Massagem tântrica e relaxante com total discrição', bio: 'Terapeuta corporal especializada em técnicas de relaxamento muscular e alívio do estresse diário. Ambiente climatizado com som ambiente.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 1, approvedMediaCount: 5, completeness: 'high' },
  { stageName: 'Alex Mendes', age: 27, gender: 'homens', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Rio Vermelho', headline: 'Companhia masculina refinada para eventos e viagens', bio: 'Educado, praticante de esportes e com excelente conversa. Disponível para jantares, viagens e momentos descontraídos.', targetAudience: ['mulheres', 'homens', 'casais'], serviceModalities: ['hotel_motel', 'domicilio', 'viagem'], categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 2, approvedMediaCount: 7, completeness: 'high' },
  { stageName: 'Bianca Reis', age: 23, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Ondina', headline: 'Estilo namoradinha com muita cumplicidade e carinho', bio: 'Meiga, carinhosa e muito atenciosa. Gosto de criar um clima leve onde possamos conversar, rir e relaxar.', targetAudience: ['homens'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['namoradinha-gfe', 'atendimento-em-hotel'], photoIndex: 3, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Maya Torres', age: 25, gender: 'travestis_trans', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Itaigara', headline: 'Beleza marcante, elegância e postura impecável', bio: 'Mulher trans carinhosa, charmosa e muito educada. Atendimento VIP em flat privativo com total sigilo.', targetAudience: ['homens', 'casais', 'todos'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 5, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Isabela Martins', age: 25, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Graça', headline: 'Beleza natural e simpatia baiana no coração da Graça', bio: 'Universitária, espontânea e muito charmosa. Atendimento exclusivo que preza pelo respeito mútuo.', targetAudience: ['homens', 'mulheres'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'namoradinha-gfe'], photoIndex: 6, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Lucas Castro', age: 29, gender: 'homens', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Caminho das Árvores', headline: 'Massoterapeuta e acompanhante executivo', bio: 'Formado em educação física, atendo com massoterapia relaxante e acompanhamento para jantares.', targetAudience: ['todos'], serviceModalities: ['local_proprio', 'hotel_motel', 'domicilio'], categorySlugs: ['massagistas', 'acompanhantes'], photoIndex: 4, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Melissa Rocha', age: 22, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Vitória', headline: 'Doçura e elegância no Corredor da Vitória', bio: 'Apaixonada pela vida, com sorriso fácil e conversa inteligente. Momentos únicos com total discrição e higiene impecável.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 7, approvedMediaCount: 8, completeness: 'high' },
  { stageName: 'Carolina Prado', age: 31, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Stella Maris', headline: 'Massagens especiais e atendimento beira-mar', bio: 'Massoterapeuta experiente. Sessões relaxantes com óleos essenciais importados para renovar suas energias.', targetAudience: ['todos'], serviceModalities: ['local_proprio', 'domicilio'], categorySlugs: ['massagistas', 'atendimento-em-domicilio'], photoIndex: 8, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Sam Oliveira', age: 24, gender: 'nao_binario_outros', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Imbuí', headline: 'Companhia artística e encontros descontraídos', bio: 'Pessoa não-binária comunicativa e cheia de boas energias para eventos culturais, passeios e momentos especiais.', targetAudience: ['lgbtqia', 'todos'], serviceModalities: ['hotel_motel', 'domicilio'], categorySlugs: ['namoradinha-gfe'], photoIndex: 10, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Natália Vieira', age: 26, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Pituba', headline: 'Exclusividade para pessoas de bom gosto', bio: 'Morena iluminada, postura refinada. Atendimento sem correria, com foco na sua total satisfação.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 11, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Bruna Valença', age: 24, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Barra', headline: 'Pronta para te acompanhar em qualquer ocasião', bio: 'Simpática, pontual e muito educada. Atendo em hotéis e resorts em Salvador e Litoral Norte.', targetAudience: ['todos'], serviceModalities: ['hotel_motel', 'domicilio', 'viagem'], categorySlugs: ['atendimento-em-hotel', 'atendimento-em-domicilio'], photoIndex: 13, approvedMediaCount: 3, completeness: 'intermediate' },
  { stageName: 'Gabriela Lima', age: 30, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Rio Vermelho', headline: 'Massagem sensorial e terapêutica', bio: 'Ambiente aconchegante preparado especialmente para seu descanso e bem-estar.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 14, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Letícia Moraes', age: 23, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Ondina', headline: 'Jovem, linda e cheia de charme', bio: 'Gosto de pessoas sinceras e cavalheiras. Agendamentos com antecedência.', targetAudience: ['homens'], serviceModalities: ['local_proprio'], categorySlugs: ['acompanhantes'], photoIndex: 15, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Vanessa Andrade', age: 27, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Itaigara', headline: 'Atendimento VIP para quem valoriza qualidade', bio: 'Sofisticação e discrição garantidas. Local privativo com total sigilo.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip', 'acompanhantes'], photoIndex: 0, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Fernanda Silveira', age: 25, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Graça', headline: 'Encontros agradáveis e sem complicações', bio: 'Excelente ouvinte, alegre e carinhosa. Venha desfrutar de momentos prazerosos.', targetAudience: ['homens', 'mulheres'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['namoradinha-gfe'], photoIndex: 1, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Juliana Pires', age: 28, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Pituba', headline: 'Massagista qualificada para alívio de tensões', bio: 'Técnicas combinadas para o seu relaxamento profundo e restauração muscular.', targetAudience: ['todos'], serviceModalities: ['local_proprio', 'domicilio'], categorySlugs: ['massagistas', 'atendimento-em-domicilio'], photoIndex: 3, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Rafaela Borges', age: 22, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Barra', headline: 'Estilo romântica e atenciosa', bio: 'Se você busca alguém especial para conversar e se divertir, acabou de encontrar.', targetAudience: ['homens'], serviceModalities: ['local_proprio'], categorySlugs: ['namoradinha-gfe'], photoIndex: 6, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Priscila Ramos', age: 29, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Caminho das Árvores', headline: 'Atendimento refinado para executivos', bio: 'Discrição absoluta para seus momentos de lazer e descontração após o trabalho.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 8, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Débora Santana', age: 26, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Stella Maris', headline: 'Companhia perfeita para fins de semana de sol', bio: 'Adoro praias, viagens e boa gastronomia baiana. Vamos aproveitar Salvador juntos!', targetAudience: ['homens', 'casais'], serviceModalities: ['hotel_motel', 'viagem'], categorySlugs: ['acompanhantes'], photoIndex: 11, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Tatiane Neves', age: 32, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Vitória', headline: 'Mulher madura, elegante e cativante', bio: 'Experiência e bom gosto para pessoas que apreciam uma presença decidida e carinhosa.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 13, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Clara Fontes', age: 21, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Imbuí', headline: 'Doce, simpática e sempre bem disposta', bio: 'Gosto de encontros tranquilos e descontraídos. Atendimento pontual e discreto.', targetAudience: ['homens'], serviceModalities: ['local_proprio'], categorySlugs: ['namoradinha-gfe'], photoIndex: 14, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Renata Farias', age: 27, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Rio Vermelho', headline: 'Boemia, arte e momentos inesquecíveis', bio: 'Amo a noite soteropolitana. Perfeita para jantares e passeios a dois.', targetAudience: ['homens', 'mulheres', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'atendimento-em-hotel'], photoIndex: 0, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Elisa Vasconcelos', age: 24, gender: 'mulheres', citySlug: 'salvador', stateCode: 'BA', neighborhood: 'Ondina', headline: 'Massagens e companhia VIP', bio: 'Pronta para lhe proporcionar um atendimento completo com muita gentileza.', targetAudience: ['todos'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['massagistas', 'acompanhantes'], photoIndex: 1, approvedMediaCount: 4, completeness: 'intermediate' },

  // 25-34: SÃO PAULO / SP (10 profiles)
  { stageName: 'Helena Camargo', age: 27, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Jardins', headline: 'Sofisticação e alto padrão nos Jardins', bio: 'Companhia de elite para executivos e viagens internacionais. Discrição absoluta e elegância impecável.', targetAudience: ['homens', 'casais'], serviceModalities: ['hotel_motel', 'viagem'], categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 8, approvedMediaCount: 7, completeness: 'high' },
  { stageName: 'Gabriel Siqueira', age: 28, gender: 'homens', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Itaim Bibi', headline: 'Acompanhante executivo e personal companion em SP', bio: 'Elegância, discrição e ótima comunicação para compromissos sociais, jantares e viagens.', targetAudience: ['mulheres', 'homens', 'casais'], serviceModalities: ['hotel_motel', 'viagem'], categorySlugs: ['executivas-vip', 'acompanhantes'], photoIndex: 9, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Mirella Toledo', age: 23, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Moema', headline: 'Estilo namoradinha meiga em Moema', bio: 'Alegre, atenciosa e muito carinhosa para momentos sem pressa.', targetAudience: ['homens'], serviceModalities: ['local_proprio', 'domicilio'], categorySlugs: ['namoradinha-gfe', 'atendimento-em-domicilio'], photoIndex: 10, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Lorena Guimarães', age: 29, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Pinheiros', headline: 'Companhia cultural e gastronômica em Pinheiros', bio: 'Adoro bons restaurantes e conversas inteligentes sobre arte e negócios.', targetAudience: ['homens', 'mulheres', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 11, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Valentina Vogue', age: 26, gender: 'travestis_trans', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Vila Madalena', headline: 'Modelo trans, elegância e carisma na Vila Madalena', bio: 'Companhia vip com excelente gosto musical e estilo impecável. Atendimento com sigilo absoluto.', targetAudience: ['homens', 'casais', 'todos'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes'], photoIndex: 5, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Sofia Albuquerque', age: 24, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Bela Vista', headline: 'Atendimento privativo perto da Av. Paulista', bio: 'Local seguro e confortável para encontros rápidos ou estendidos.', targetAudience: ['homens'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'atendimento-em-hotel'], photoIndex: 13, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Carla Brandão', age: 31, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Morumbi', headline: 'Massoterapia de luxo e bem-estar no Morumbi', bio: 'Tratamentos corporais exclusivos para renovar corpo e mente.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 14, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Vivian Castilho', age: 28, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Jardins', headline: 'Executiva multilíngue para encontros especiais', bio: 'Atendo em hotéis 5 estrelas e residências com horário marcado.', targetAudience: ['homens', 'casais'], serviceModalities: ['hotel_motel', 'domicilio', 'viagem'], categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 15, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Diana Queiroz', age: 22, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Moema', headline: 'Jovem carinhosa e muito comunicativa', bio: 'Sempre com um sorriso no rosto para te fazer esquecer os problemas.', targetAudience: ['homens'], serviceModalities: ['local_proprio'], categorySlugs: ['namoradinha-gfe'], photoIndex: 0, approvedMediaCount: 3, completeness: 'minimal' },
  { stageName: 'Monique Ferraz', age: 25, gender: 'mulheres', citySlug: 'sao-paulo', stateCode: 'SP', neighborhood: 'Itaim Bibi', headline: 'Atendimento exclusivo e confidencial', bio: 'Beleza marcante e educação refinada para ocasiões especiais.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes'], photoIndex: 1, approvedMediaCount: 4, completeness: 'intermediate' },

  // 35-42: RIO DE JANEIRO / RJ (8 profiles)
  { stageName: 'Yasmin Drummond', age: 26, gender: 'mulheres', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Ipanema', headline: 'O charme carioca no coração de Ipanema', bio: 'Apaixonada pela praia e bons momentos. Atendimento em local próprio e hotéis na Zona Sul.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 2, approvedMediaCount: 7, completeness: 'high' },
  { stageName: 'Flávia Mendonça', age: 24, gender: 'mulheres', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Copacabana', headline: 'Companhia alegre e descontraída em Copacabana', bio: 'Gosto de passeios, jantares e criar um clima agradável a dois.', targetAudience: ['homens', 'mulheres'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['namoradinha-gfe', 'atendimento-em-hotel'], photoIndex: 3, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Talita Paes', age: 29, gender: 'mulheres', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Leblon', headline: 'Exclusividade e sofisticação no Leblon', bio: 'Elegante, discreta e com postura impecável.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 4, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Raquel Simões', age: 27, gender: 'mulheres', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Barra da Tijuca', headline: 'Massagem tântrica e relaxante na Barra', bio: 'Espaço climatizado com hidromassagem para seu relaxamento total.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 5, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Rodrigo Vianna', age: 30, gender: 'homens', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Botafogo', headline: 'Companhia masculina para passeios, jantares e viagens', bio: 'Carioca comunicativo, educado e atlético para momentos agradáveis e encontros tranquilos.', targetAudience: ['mulheres', 'homens', 'casais'], serviceModalities: ['hotel_motel', 'domicilio', 'viagem'], categorySlugs: ['acompanhantes'], photoIndex: 7, approvedMediaCount: 5, completeness: 'high' },
  { stageName: 'Sabrina Vianna', age: 25, gender: 'mulheres', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Ipanema', headline: 'Atendimento VIP na orla de Ipanema', bio: 'Perfeita para acompanhar em jantares e passeios de barco.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'executivas-vip'], photoIndex: 8, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Daniela Meireles', age: 30, gender: 'mulheres', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Copacabana', headline: 'Massoterapia e relaxamento no Posto 4', bio: 'Ambiente aconchegante para desestressar com segurança.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 10, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Alice Rezende', age: 22, gender: 'mulheres', citySlug: 'rio-de-janeiro', stateCode: 'RJ', neighborhood: 'Barra da Tijuca', headline: 'Beleza jovem e sorriso contagiante', bio: 'Pronta para momentos especiais e inesquecíveis.', targetAudience: ['homens'], serviceModalities: ['local_proprio'], categorySlugs: ['namoradinha-gfe'], photoIndex: 9, approvedMediaCount: 3, completeness: 'minimal' },

  // 43-47: BELO HORIZONTE / MG (5 profiles)
  { stageName: 'Bárbara Couto', age: 27, gender: 'mulheres', citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Savassi', headline: 'O melhor do charme mineiro na Savassi', bio: 'Carinhosa, simpática e muito educada. Atendimento em flat privativo ou hotéis.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'namoradinha-gfe'], photoIndex: 10, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Luciana Peixoto', age: 25, gender: 'mulheres', citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Lourdes', headline: 'Sofisticação e discrição em Lourdes', bio: 'Companhia elegante para jantares nos melhores restaurantes de BH.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 11, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Ingrid Barreto', age: 29, gender: 'mulheres', citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Funcionários', headline: 'Massagens terapêuticas e relaxantes', bio: 'Técnicas exclusivas para aliviar o cansaço do dia a dia.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 12, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Jéssica Dorneles', age: 24, gender: 'mulheres', citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Belvedere', headline: 'Atendimento VIP no Belvedere', bio: 'Postura impecável e simpatia contagiante para encontros memoráveis.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip'], photoIndex: 13, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Gisele Fonseca', age: 22, gender: 'mulheres', citySlug: 'belo-horizonte', stateCode: 'MG', neighborhood: 'Savassi', headline: 'Meiga e carinhosa para momentos leves', bio: 'Gosto de boas conversas e momentos a dois com tranquilidade.', targetAudience: ['homens'], serviceModalities: ['local_proprio'], categorySlugs: ['namoradinha-gfe'], photoIndex: 14, approvedMediaCount: 4, completeness: 'intermediate' },

  // 48-51: BRASÍLIA / DF (4 profiles)
  { stageName: 'Manuela Esteves', age: 28, gender: 'mulheres', citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Asa Sul', headline: 'Discrição e classe na Asa Sul', bio: 'Especial para pessoas que exigem sigilo absoluto e educação refinada.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip', 'atendimento-em-hotel'], photoIndex: 15, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Cíntia Valente', age: 26, gender: 'mulheres', citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Asa Norte', headline: 'Massagem relaxante na Asa Norte', bio: 'Atendimento com horário agendado em espaço higienizado e confortável.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 0, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Valéria Macedo', age: 25, gender: 'mulheres', citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Sudoeste', headline: 'Companhia agradável e atenciosa no Sudoeste', bio: 'Ótima conversa, sorriso sincero e carinho genuíno.', targetAudience: ['homens', 'mulheres'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['namoradinha-gfe', 'acompanhantes'], photoIndex: 1, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Lorena Aguiar', age: 30, gender: 'mulheres', citySlug: 'brasilia', stateCode: 'DF', neighborhood: 'Lago Sul', headline: 'Exclusividade e alto luxo no Lago Sul', bio: 'Presença impecável para viagens, eventos e recepções fechadas.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel', 'viagem'], categorySlugs: ['executivas-vip'], photoIndex: 2, approvedMediaCount: 6, completeness: 'high' },

  // 52-54: RECIFE / PE (3 profiles)
  { stageName: 'Kelly Medeiros', age: 25, gender: 'mulheres', citySlug: 'recife', stateCode: 'PE', neighborhood: 'Boa Viagem', headline: 'Beleza e alegria em Boa Viagem', bio: 'Carinhosa, cheia de energia e sempre pronta para proporcionar momentos agradáveis.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['acompanhantes', 'namoradinha-gfe'], photoIndex: 3, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Aline Cavalcanti', age: 27, gender: 'mulheres', citySlug: 'recife', stateCode: 'PE', neighborhood: 'Pina', headline: 'Massagem tântrica no Pina', bio: 'Terapia relaxante completa para renovação de energias.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 4, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Débora Arruda', age: 29, gender: 'mulheres', citySlug: 'recife', stateCode: 'PE', neighborhood: 'Parnamirim', headline: 'Elegância e discrição na Zona Norte', bio: 'Companhia refinada para jantares e eventos exclusivos.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip'], photoIndex: 5, approvedMediaCount: 5, completeness: 'standard' },

  // 55-57: FORTALEZA / CE (3 profiles)
  { stageName: 'Paloma Gouveia', age: 24, gender: 'mulheres', citySlug: 'fortaleza', stateCode: 'CE', neighborhood: 'Meireles', headline: 'O encanto do Ceará na Beira-Mar do Meireles', bio: 'Simpática e atenciosa. Atendo em hotéis e flats de luxo.', targetAudience: ['homens', 'casais'], serviceModalities: ['hotel_motel', 'viagem'], categorySlugs: ['acompanhantes', 'atendimento-em-hotel'], photoIndex: 6, approvedMediaCount: 5, completeness: 'standard' },
  { stageName: 'Karen Furtado', age: 26, gender: 'mulheres', citySlug: 'fortaleza', stateCode: 'CE', neighborhood: 'Aldeota', headline: 'Massagem relaxante e anti-stress na Aldeota', bio: 'Espaço privativo climatizado para seu descanso.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 7, approvedMediaCount: 4, completeness: 'intermediate' },
  { stageName: 'Miriam Bezerra', age: 28, gender: 'mulheres', citySlug: 'fortaleza', stateCode: 'CE', neighborhood: 'Praia de Iracema', headline: 'Companhia VIP para momentos especiais', bio: 'Elegante, comunicativa e discreta para passeios e jantares.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip'], photoIndex: 8, approvedMediaCount: 6, completeness: 'high' },

  // 58-60: CURITIBA / PR (3 profiles)
  { stageName: 'Evelyn Schmidt', age: 26, gender: 'mulheres', citySlug: 'curitiba', stateCode: 'PR', neighborhood: 'Batel', headline: 'Elegância e sofisticação no Batel', bio: 'Postura fina e muito educada. Atendimento de alto padrão com discrição.', targetAudience: ['homens', 'casais'], serviceModalities: ['local_proprio', 'hotel_motel'], categorySlugs: ['executivas-vip', 'acompanhantes'], photoIndex: 9, approvedMediaCount: 6, completeness: 'high' },
  { stageName: 'Joana Guiel', age: 24, gender: 'mulheres', citySlug: 'curitiba', stateCode: 'PR', neighborhood: 'Bigorrilho', headline: 'Massagem relaxante no Bigorrilho', bio: 'Ambiente aconchegante com toalhas aquecidas e óleos aromáticos.', targetAudience: ['todos'], serviceModalities: ['local_proprio'], categorySlugs: ['massagistas'], photoIndex: 10, approvedMediaCount: 4, completeness: 'standard' },
  { stageName: 'Sabrina Castanho', age: 25, gender: 'mulheres', citySlug: 'curitiba', stateCode: 'PR', neighborhood: 'Água Verde', headline: 'Companhia carinhosa no Água Verde', bio: 'Meiga, atenciosa e ótima companhia para momentos agradáveis.', targetAudience: ['homens'], serviceModalities: ['local_proprio'], categorySlugs: ['namoradinha-gfe'], photoIndex: 11, approvedMediaCount: 4, completeness: 'intermediate' },
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
    gender: def.gender,
    target_audience: def.targetAudience,
    service_modalities: def.serviceModalities,
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
