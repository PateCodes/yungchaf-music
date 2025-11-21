
'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useMemo } from 'react';

interface Notification {
  id: string;
  content: string;
  link: string;
  read: boolean;
  timestamp: {
    seconds: number;
  } | null;
}

export function NotificationBell() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // --- SAFETY GATE ---
  // This ensures the query is not created until all dependencies are available.
  const queriesReady = !!firestore && !!user && !isUserLoading;

  const notificationsQuery = useMemoFirebase(
    () =>
      queriesReady
        ? query(
            collection(firestore, 'fans', user.uid, 'notifications'),
            orderBy('timestamp', 'desc'),
            limit(10)
          )
        : null,
    [queriesReady, firestore, user] // Dependency array now correctly uses the gate
  );

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const unreadCount = useMemo(() => notifications?.filter((n) => !n.read).length || 0, [notifications]);
  
  const markAllAsRead = async () => {
    if (!firestore || !user || !notifications || unreadCount === 0) return;
    
    const batch = writeBatch(firestore);
    notifications.forEach(notification => {
        if (!notification.read) {
            const notifRef = doc(firestore, 'fans', user.uid, 'notifications', notification.id);
            batch.update(notifRef, { read: true });
        }
    });
    
    await batch.commit();
  };

  // Do not render the component until user loading is complete and we have a user.
  if (isUserLoading || !user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>Mark all as read</Button>
            )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && !notifications ? (
            <p className="p-4 text-sm text-center text-muted-foreground">Loading...</p>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <DropdownMenuItem key={notif.id} asChild className="h-auto">
              <Link href={notif.link} className={`flex flex-col items-start gap-1 whitespace-normal ${!notif.read ? 'bg-muted/50' : ''}`}>
                <p className="text-sm">{notif.content}</p>
                <p className="text-xs text-muted-foreground">
                  {notif.timestamp ? formatDistanceToNow(new Date(notif.timestamp.seconds * 1000), { addSuffix: true }) : ''}
                </p>
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/notifications" className='justify-center'>View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
