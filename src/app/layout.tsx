import type { Metadata } from 'next';
import { Outfit, Sarabun } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GOLD INTEGRATE — PDI Management System',
  description: 'ระบบตรวจสภาพรถยนต์ก่อนส่งมอบ (PDI) และการบำรุงรักษาระยะยาวสำหรับ EV Dealer',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`h-full antialiased dark ${outfit.variable} ${sarabun.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
