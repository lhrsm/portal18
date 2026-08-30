import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificação de Maioridade 18+ | Portal18',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AgeVerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
