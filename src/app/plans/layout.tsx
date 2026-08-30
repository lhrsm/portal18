import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos e Assinaturas para Anunciantes | Portal18',
  description: 'Conheça nossos planos de destaque e visibilidade para anunciantes profissionais independentes. Planos mensais, trimestrais e semestrais.',
  alternates: {
    canonical: '/plans',
  },
  openGraph: {
    title: 'Planos e Assinaturas para Anunciantes | Portal18',
    description: 'Aumente o alcance dos seus anúncios com planos profissionais de visibilidade e destaque no Portal18.',
    url: '/plans',
    type: 'website',
  },
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
