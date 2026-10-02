import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import PublicChrome from '@/components/layout/PublicChrome';
import './globals.css';

export const metadata: Metadata = {
  title: "D'Itaros Tours | Agencia de Viajes Premium",
  description:
    "D'Itaros Tours: tu agencia de viajes premium. Paquetes internacionales, hoteles nacionales, excursiones y más. Agencia de viajes y excursiones en República Dominicana.",
  keywords: 'agencia de viajes, paquetes turísticos, viajes internacionales, hoteles, excursiones, República Dominicana, turismo, D\'Itaros Tours',
  openGraph: {
    title: "D'Itaros Tours",
    description: 'Tu agencia de viajes y excursiones premium. Destinos soñados, experiencias únicas.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PublicChrome>{children}</PublicChrome>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color:      '#111827',
                border:     '1px solid #C41E2C',
                borderRadius: '12px',
              },
              success: {
                iconTheme: { primary: '#2E8B22', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
