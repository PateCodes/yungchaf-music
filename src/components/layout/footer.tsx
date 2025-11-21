
'use client';

import Link from 'next/link';
import { Music2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { socialLinks } from '@/lib/constants';
import { useUser } from '@/firebase';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user, isAdmin } = useUser();

  const footerLinks = [
    { href: '/about', label: 'About' },
    { href: '/terms', label: 'Terms' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/contact', label: 'Contact' },
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.footer 
        className="border-t bg-card"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
    >
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center md:text-left">
          <motion.div variants={itemVariants} className="flex items-center space-x-2 justify-center md:justify-start">
             <Music2 className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Yung Chaf</span>
          </motion.div>
          <motion.nav variants={itemVariants} className="flex flex-wrap justify-center gap-4 md:gap-6 order-first md:order-none col-span-1 md:col-span-1">
            {footerLinks.map((link) => (
              (!link.href.startsWith('/') || user || ['/about', '/contact', '/terms', '/privacy'].includes(link.href)) ? (
                <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                  {link.label}
                </Link>
              ) : null
            ))}
             {isAdmin && (
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Shield className="h-4 w-4" /> Admin
                </Link>
             )}
          </motion.nav>
          <div className="md:col-start-3"></div>
        </div>
        <motion.div variants={itemVariants} className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p className='mb-2'>Empowering artists to share, connect, and grow together.</p>
          <p>&copy; {currentYear} Yung Chaf. All Rights Reserved.</p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
