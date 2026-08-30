import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel do Anunciante | Portal18',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdvertiserRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
