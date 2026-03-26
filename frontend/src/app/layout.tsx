import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'weightwAIse - AI Bariatric Surgery Consultant',
  description:
    'An AI-powered bariatric surgery consultant using multimodal RAG to provide evidence-based guidance for weight management and metabolic surgery decisions.',
  keywords: ['bariatric surgery', 'AI consultant', 'weight management', 'metabolic surgery'],
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
