import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Central de Ajuda & FAQ | Portal18',
  description: 'Tire suas dúvidas sobre criação de anúncios, verificação de maioridade 18+, segurança, privacidade e suporte.',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Central de Ajuda & FAQ | Portal18',
    description: 'Central de suporte e respostas para dúvidas frequentes de anunciantes e visitantes no Portal18.',
    url: '/help',
    type: 'website',
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
