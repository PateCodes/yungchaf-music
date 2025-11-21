
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Yung Chaf Hub',
  description: 'Explore my creative world through music. Every track carries emotion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased", inter.variable, poppins.variable)} suppressHydrationWarning>
        <ThemeProvider>
          <FirebaseClientProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
