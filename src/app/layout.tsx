import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AgeGateModal } from '@/components/layout/AgeGateModal';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { AccessibilityControlCenter } from '@/components/accessibility/AccessibilityControlCenter';
import { 
  getCanonicalBaseUrl, 
  SEO_CONFIG, 
  generateWebSiteSchema, 
  generateOrganizationSchema,
  getSiteVerificationMetadata
} from '@/lib/seo/seoEngine';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0c10',
};

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalBaseUrl()),
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: SEO_CONFIG.titleTemplate,
  },
  description: SEO_CONFIG.defaultDescription,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    siteName: SEO_CONFIG.siteName,
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    url: getCanonicalBaseUrl(),
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
  },
  alternates: {
    canonical: getCanonicalBaseUrl(),
  },
  verification: getSiteVerificationMetadata(),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = generateWebSiteSchema();
  const organizationJsonLd = generateOrganizationSchema();

  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          Avançar para o conteúdo principal
        </a>
        <AccessibilityProvider>
          <ToastProvider>
            <AuthProvider>
              <AgeGateModal />
              <Header />
              <main id="main-content" tabIndex={-1} style={{ flex: 1, minHeight: 'calc(100vh - 160px)', outline: 'none' }}>
                {children}
              </main>
              <Footer />
              <AccessibilityControlCenter />
            </AuthProvider>
          </ToastProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
