
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Link from 'next/link';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { updateDocumentNonBlocking, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Notification {
  id: string;
  content: string;
  link: string;
  read: boolean;
  timestamp: {
    seconds: number;
  } | null;
}

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isUserLoading, router]);

  const notificationsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(collection(firestore, 'fans', user.uid, 'notifications'), orderBy('timestamp', 'desc'))
        : null,
    [user, firestore]
  );

  const { data: notifications, isLoading, error } = useCollection<Notification>(notificationsQuery);

  const handleMarkAsRead = (notificationId: string) => {
    if (!firestore || !user) return;
    const notifRef = doc(firestore, 'fans', user.uid, 'notifications', notificationId);
    updateDocumentNonBlocking(notifRef, { read: true });
  };
  
   const handleMarkAllAsRead = async () => {
    if (!firestore || !user || !notifications) return;
    
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(firestore);
    const updatedData = { read: true };
    unreadNotifications.forEach(notification => {
        const notifRef = doc(firestore, 'fans', user.uid, 'notifications', notification.id);
        batch.update(notifRef, updatedData);
    });
    
    try {
        await batch.commit();
    } catch (serverError) {
        // This logic creates a detailed error if the entire batch operation fails.
        // It provides context on the first operation that would have been attempted.
        const firstNotif = unreadNotifications[0];
        const permissionError = new FirestorePermissionError({
            path: doc(firestore, 'fans', user.uid, 'notifications', firstNotif.id).path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }


  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            <CardTitle>Your Notifications</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={!notifications?.some(n => !n.read)}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading notifications...</p>}
          {error && <p className="text-destructive">Error loading notifications: {error.message}</p>}
          
          {!isLoading && notifications && notifications.length > 0 && (
            <ul className="space-y-4">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                    notif.read ? 'bg-card' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex-grow">
                    <p className="text-sm">{notif.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notif.timestamp ? format(new Date(notif.timestamp.seconds * 1000), 'PPP p') : ''}
                    </p>
                    <Link href={notif.link} className="text-sm text-primary hover:underline mt-2 inline-block">
                      View Context
                    </Link>
                  </div>
                  {!notif.read && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkAsRead(notif.id)} title="Mark as read">
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!isLoading && (!notifications || notifications.length === 0) && (
            <div className="text-center text-muted-foreground py-12">
              <Bell className="mx-auto h-12 w-12" />
              <p className="mt-4">You have no notifications yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
