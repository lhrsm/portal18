import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explorar Anúncios e Perfis 18+ | Portal18',
  description: 'Explore anúncios de acompanhantes e profissionais independentes em todo o Brasil. Filtre por proximidade, cidade, categoria e modalidade.',
  alternates: {
    canonical: '/explorar',
  },
  openGraph: {
    title: 'Explorar Anúncios e Perfis 18+ | Portal18',
    description: 'Busca nacional de anúncios de profissionais independentes com fotos moderadas e maioridade verificada.',
    url: '/explorar',
    type: 'website',
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
