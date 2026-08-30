import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anunciar em Salvador / BA | Portal18',
  description: 'Publique seu perfil profissional em Salvador com total sigilo, segurança e contato direto no WhatsApp. Destaque-se nos principais bairros.',
  alternates: {
    canonical: '/anunciar/salvador',
  },
  openGraph: {
    title: 'Anunciar em Salvador / BA | Portal18',
    description: 'Anuncie seus serviços profissionais em Salvador com garantia de sigilo e maioridade verificada 18+.',
    url: '/anunciar/salvador',
    type: 'website',
  },
};

export default function SalvadorAnunciarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
