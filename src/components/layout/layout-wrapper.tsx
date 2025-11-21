
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from './header';
import Footer from './footer';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Lock, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const publicPaths = ['/', '/about', '/terms', '/privacy'];
const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];
const adminRoutePrefix = '/admin';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isUserLoading) {
    // Show a global loading state
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Music className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAuthRoute = authRoutes.includes(pathname);
  const isAdminRoute = pathname.startsWith(adminRoutePrefix);
  const isPublicRoute = publicPaths.includes(pathname);

  // If user is not logged in and the route is not public or an auth route, show access denied
  if (!user && !isPublicRoute && !isAuthRoute) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-muted/40">
           <Card className="w-full max-w-md m-4 text-center shadow-2xl">
              <CardHeader>
                <div className='flex justify-center mb-4'>
                    <div className='p-4 bg-primary/10 rounded-full'>
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle>Access Restricted</CardTitle>
                <CardDescription>
                  This content is for registered fans only. Please sign in to continue or create an account to join the community.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                 <Button asChild className="bg-gradient-to-r from-primary to-accent">
                    <Link href="/sign-in">Sign In</Link>
                 </Button>
                 <Button variant="outline" asChild>
                    <Link href="/sign-up">Join Now</Link>
                 </Button>
              </CardContent>
           </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const showHeaderAndFooter = !isAdminRoute;

  return (
    <div className="flex min-h-screen flex-col">
      {showHeaderAndFooter && <Header />}
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      {showHeaderAndFooter && <Footer />}
    </div>
  );
}
