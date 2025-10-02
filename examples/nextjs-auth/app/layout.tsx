import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'v-lawyer - GLIN Auth Demo',
  description: 'Example of Sign in with GLIN authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
