import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../components/ui/Toast';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'Omeglea — Random Video Chat & Social Discovery (18+)',
  description:
    'Meet new people, engage in spontaneous video conversations, and discover like-minded adults through interest-based video chat.',
  keywords: [
    'video chat',
    'random video chat',
    'omegle alternative',
    'adult social network',
    'social discovery',
    'interest matching',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B1020] text-[#F8FAFC] antialiased min-h-screen flex flex-col selection:bg-purple-500/30 selection:text-purple-200">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
