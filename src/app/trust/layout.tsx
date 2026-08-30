import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trust Center & Segurança 18+ | Portal18',
  description: 'Central de segurança, conformidade legal, verificação técnica de maioridade 18+ e proteção integral de dados no Portal18.',
  alternates: {
    canonical: '/trust',
  },
  openGraph: {
    title: 'Trust Center & Segurança 18+ | Portal18',
    description: 'Políticas de segurança, privacidade, LGPD e proteção a menores do Portal18.',
    url: '/trust',
    type: 'website',
  },
};

export default function TrustLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
