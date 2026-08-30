import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acessibilidade | Portal18',
  description: 'Declaração e compromisso de acessibilidade digital do Portal18. Alinhamento com as diretrizes WCAG 2.2 nível AA.',
  alternates: {
    canonical: '/accessibility',
  },
  openGraph: {
    title: 'Acessibilidade | Portal18',
    description: 'Declaração e canais de contato sobre acessibilidade digital e conformidade WCAG 2.2 AA no Portal18.',
    url: '/accessibility',
    type: 'website',
  },
};

export default function AccessibilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
