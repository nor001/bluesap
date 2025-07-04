import { ThemeProvider } from '@/components/ThemeProvider';
import type { Metadata, Viewport } from 'next';
import Sidebar from './components/Sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAP Gestion - Project Planning',
  description: 'Resource allocation and timeline management for SAP projects',
  keywords: 'SAP, project planning, resource allocation, timeline, management',
  authors: [{ name: 'SAP Gestion Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950" suppressHydrationWarning>
        <Sidebar />
        <main className="pt-16 min-h-screen">
          <ThemeProvider defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </main>
      </body>
    </html>
  );
}
