import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AVIS Weather Risk Monitor',
  description:
    'Branch-level extreme weather warning dashboard for AVIS branch and risk teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
