import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minha Conta | Portal18',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AccountRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
