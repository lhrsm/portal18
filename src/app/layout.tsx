import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AgeGateModal } from '@/components/layout/AgeGateModal';

export const metadata: Metadata = {
  title: 'Portal Nacional 18+ | Plataforma de Anúncios Independentes',
  description: 'Portal nacional de anúncios e descoberta de perfis de profissionais adultos independentes no Brasil. Acesso estritamente restrito a maiores de 18 anos.',
  keywords: ['portal adulto', 'anúncios independentes', '18+', 'brasil'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Portal Nacional 18+ | Anúncios Independentes',
    description: 'Plataforma segura de descoberta de perfis profissionais independentes.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <AuthProvider>
            <AgeGateModal />
            <Header />
            <main style={{ flex: 1, minHeight: 'calc(100vh - 160px)' }}>{children}</main>
            <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
