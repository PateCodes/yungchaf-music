
'use client';

import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, Gift, Heart, MessageSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { contactInfo } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminData } from '@/context/AdminDataContext';

interface Fan {
  id: string;
  username?: string;
  email?: string;
  photoURL?: string;
  joinDate?: { seconds: number };
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const createThankYouMessage = (firestore: any, fan: Fan) => {
    if (!firestore || !fan) return;
    const messagesCol = collection(firestore, 'messages');
    const messageContent = 'Thank you for your incredible support! It means the world to me.';
    
    // This creates the message document
    const messagePromise = addDocumentNonBlocking(messagesCol, {
      name: 'Yung Chaf', // Senders name
      email: contactInfo.artist.email, // Senders email
      message: messageContent,
      submittedAt: serverTimestamp(),
      fanId: fan.id, // The recipient
      read: false,
      likes: [],
      reactions: {},
      replies: [],
    });

    // Once the message is created, create a notification that links to it
    messagePromise.then(messageRef => {
        if(messageRef) {
            const notificationsCol = collection(firestore, 'fans', fan.id, 'notifications');
            addDocumentNonBlocking(notificationsCol, {
                content: `The artist sent you a message: "${messageContent.substring(0, 50)}..."`,
                link: `/messages/${messageRef.id}`, // Link to the created message
                read: false,
                timestamp: serverTimestamp()
            });
        }
    });
};


export default function AdminFansPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { fans, contributions, likes, comments } = useAdminData();

  const sortedFans = useMemo(() => {
    if (!fans) return [];
    return [...fans].sort((a, b) => (b.joinDate?.seconds ?? 0) - (a.joinDate?.seconds ?? 0));
  }, [fans]);

  const processedFans = useMemo(() => {
    if (!sortedFans || !contributions || !likes || !comments) return [];
    
    return sortedFans.map((fan) => {
      // Calculate contributions
      const fanContributions = contributions.filter((c) => c.fanId === fan.id && c.status === 'completed');
      const totalContributed = fanContributions.reduce(
        (totals, c) => {
          totals[c.currency] = (totals[c.currency] || 0) + c.amount;
          return totals;
        },
        {} as Record<string, number>
      );
      
      // Calculate likes and comments
      const fanLikes = likes.filter(like => like.fanId === fan.id).length;
      const fanComments = comments.filter(comment => comment.fanId === fan.id).length;

      return {
        ...fan,
        contributionCount: fanContributions.length,
        totalContributed,
        totalLikes: fanLikes,
        totalComments: fanComments,
      };
    });
  }, [sortedFans, contributions, likes, comments]);

  const handleDeleteFan = (fanId: string) => {
    if (!firestore || !fanId) return;
    const fanRef = doc(firestore, 'fans', fanId);
    deleteDocumentNonBlocking(fanRef);
    toast({
      variant: 'destructive',
      title: 'Fan Deleted',
      description: 'The user has been removed from the fan database.',
    });
  };

  const handleSendThanks = (fan: Fan) => {
     createThankYouMessage(firestore, fan);
     toast({
        title: 'Thank You Sent!',
        description: `A thank you message has been sent to ${fan.username || 'this fan'}.`
     });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Fan Database</CardTitle>
          <CardDescription>
            A complete list of all registered users, their engagement, and their contributions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Fan</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="text-center">Likes</TableHead>
                  <TableHead className="text-center">Comments</TableHead>
                  <TableHead className="text-center">Contrib.</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!processedFans || !contributions ? (
                  [...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : processedFans &&
                  processedFans.length > 0 ? (
                  processedFans.map((fan) => (
                    <TableRow key={fan.id} className='align-middle'>
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage
                                src={
                                    fan.photoURL ||
                                    `https://api.dicebear.com/8.x/initials/svg?seed=${
                                    fan.username || fan.email
                                    }`
                                }
                                alt={fan.username}
                                />
                                <AvatarFallback>
                                {fan.username
                                    ? fan.username.charAt(0).toUpperCase()
                                    : '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">
                                <p className="truncate max-w-xs">{fan.username || 'Unnamed Fan'}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-xs">{fan.email}</p>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {fan.joinDate ? format(new Date(fan.joinDate.seconds * 1000), 'PPP') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                            <div className="flex items-center justify-center gap-1.5">
                                <Heart className="h-4 w-4 text-muted-foreground"/>
                                {fan.totalLikes}
                            </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                           <div className="flex items-center justify-center gap-1.5">
                                <MessageSquare className="h-4 w-4 text-muted-foreground"/>
                                {fan.totalComments}
                            </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                            {fan.contributionCount}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-primary">
                            <div className="flex flex-col items-end">
                                {Object.entries(fan.totalContributed).length > 0 ? (
                                    Object.entries(fan.totalContributed).map(([currency, total]) => (
                                        <span key={currency}>{formatCurrency(total, currency)}</span>
                                    ))
                                ) : (
                                    <span>{formatCurrency(0, 'USD')}</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className='text-primary'>
                                    <Gift className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Send a "Thank You"?</AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogDescription>
                                      This will send a message to {fan.username || 'this fan'} to thank them for their support. They will be able to reply.
                                  </AlertDialogDescription>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleSendThanks(fan)}>
                                      Send Message
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className='text-destructive'>
                                  <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this fan's account data. It will not delete their authentication record.
                                  </AlertDialogDescription>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteFan(fan.id)} className="bg-destructive hover:bg-destructive/90">
                                      Delete Fan
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No fans found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
