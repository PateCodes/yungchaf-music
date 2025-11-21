
'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  LineChart,
  Settings,
  Music,
  MessageSquare,
  Shield,
  HandCoins,
  CreditCard,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminDataProvider } from '@/context/AdminDataContext';
import { Button } from '@/components/ui/button';

const AdminSidebar = () => {
  const pathname = usePathname();
  const { isSuperAdmin } = useUser();
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Music className="h-5 w-5 text-primary" />
          </Button>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-semibold tracking-tight">
              Yung Chaf
            </span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/admin" passHref>
              <SidebarMenuButton isActive={pathname === '/admin'}>
                <Home />
                Dashboard
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/admin/messages" passHref>
              <SidebarMenuButton isActive={pathname.startsWith('/admin/messages')}>
                <MessageSquare />
                Messages
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/admin/fans" passHref>
              <SidebarMenuButton isActive={pathname === '/admin/fans'}>
                <Users />
                Fans
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           <SidebarMenuItem>
              <Link href="/admin/contributions" passHref>
                <SidebarMenuButton isActive={pathname === '/admin/contributions'}>
                  <HandCoins />
                  Contributions
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/admin/analytics" passHref>
              <SidebarMenuButton isActive={pathname === '/admin/analytics'}>
                <LineChart />
                Analytics
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/admin/payments" passHref>
              <SidebarMenuButton isActive={pathname === '/admin/payments'}>
                <CreditCard />
                Payments
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           {isSuperAdmin && (
            <SidebarMenuItem>
              <Link href="/admin/users" passHref>
                <SidebarMenuButton isActive={pathname === '/admin/users'}>
                  <Shield />
                  Manage Admins
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <Link href="/admin/settings" passHref>
              <SidebarMenuButton isActive={pathname === '/admin/settings'}>
                <Settings />
                Settings
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is complete before checking auth state.
    if (!isUserLoading) {
      if (!user) {
        // If not logged in at all, redirect to sign-in page.
        router.push('/sign-in');
      } else if (!isAdmin) {
        // If logged in but not an admin, redirect to the homepage.
        router.push('/');
      }
    }
  }, [user, isUserLoading, router, isAdmin]);

  // While loading user state, or if the user is not logged in, or is not an admin, show loading.
  if (isUserLoading || !user || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2">
            <Music className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading Admin Panel...</span>
        </div>
      </div>
    );
  }

  // Once loading is complete and we've confirmed the user is an admin, render the layout.
  return (
    <AdminDataProvider>
        <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden"/>
            <div className="w-full flex-1">
                {/* Can add a search bar here */}
            </div>
            <ThemeToggle />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
            </main>
        </SidebarInset>
        </SidebarProvider>
    </AdminDataProvider>
  );
}
