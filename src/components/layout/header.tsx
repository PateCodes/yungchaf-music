'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Music2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { navLinks } from '@/lib/constants';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { NotificationBell } from '../notifications/NotificationBell';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const { user, isAdmin, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/music', label: 'Music' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    })
    router.push('/sign-in');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <Music2 className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline">Yung Chaf</span>
          </Link>
        </div>

        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          {mainNavLinks.map((link) => (
             !link.href.startsWith('/') || user || ['/', '/about', '/contact'].includes(link.href) ? (
                <Link
                key={link.href}
                href={link.href}
                className={cn(
                    'transition-colors hover:text-primary flex items-center gap-2',
                    pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
                )}
                >
                {link.label}
                </Link>
            ) : null
          ))}
           {isAdmin && (
              <Link href="/admin" className={cn(
                    'transition-colors hover:text-primary flex items-center gap-2',
                    pathname.startsWith('/admin') ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  <Shield className="h-4 w-4" />
                  Admin
              </Link>
            )}
        </nav>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 pt-4">
                  {navLinks.map((link) => (
                    (!link.href.startsWith('/') || user || ['/', '/about', '/contact'].includes(link.href)) ? (
                        <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                            'text-lg transition-colors hover:text-primary flex items-center gap-2',
                            pathname === link.href ? 'text-primary' : 'text-foreground'
                        )}
                        >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.label}
                        </Link>
                    ) : null
                  ))}
                   {isAdmin && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className={cn(
                            'text-lg transition-colors hover:text-primary flex items-center gap-2',
                            pathname.startsWith('/admin') ? 'text-primary' : 'text-foreground'
                        )}>
                          <Shield className="h-4 w-4" />
                          Admin
                      </Link>
                   )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2">
             {!isUserLoading && (
              <>
                {user ? (
                  <>
                     <NotificationBell />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                           <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${user.displayName || user.email}`} alt={user.displayName || user.email || 'User'} />
                            <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Admin Dashboard</Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/my-contributions">My Contributions</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/support">Support</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                        <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/sign-up">Join Now</Link>
                    </Button>
                  </>
                )}
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
