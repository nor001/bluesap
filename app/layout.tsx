import type { Metadata, Viewport } from 'next';
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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
} 