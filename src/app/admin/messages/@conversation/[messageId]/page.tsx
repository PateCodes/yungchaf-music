
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { format, formatDistanceToNow, isAfter, subMinutes } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Mail, MoreHorizontal, Trash2, Heart, Smile, Reply, Send, ArrowLeft } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";


interface Reply {
    senderId: string;
    senderName: string;
    senderPhotoUrl?: string;
    text: string;
    timestamp: any; // Can be client-side Date or server-side Timestamp
    senderType: 'admin' | 'fan';
}

interface Message {
  id: string;
  fanId?: string;
  name: string;
  email: string;
  message: string;
  submittedAt: {
    seconds: number;
    nanoseconds: number;
  } | null;
  read: boolean;
  likes?: string[];
  reactions?: Record<string, string[]>;
  replies?: Reply[];
}

interface Fan {
  id: string;
  lastActive?: { seconds: number };
}

const createNotification = (firestore: any, fanId: string, content: string, link: string) => {
    if (!firestore || !fanId) return;
    const notificationsCol = collection(firestore, 'fans', fanId, 'notifications');
    const newNotification = {
      content,
      link: link,
      read: false,
      timestamp: serverTimestamp(),
    };
    addDocumentNonBlocking(notificationsCol, newNotification);
};

export default function MessageConversationPage() {
  const { messageId } = useParams();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const [replyText, setReplyText] = useState('');

  const messageRef = useMemoFirebase(
      () => (firestore && typeof messageId === 'string' ? doc(firestore, 'messages', messageId) : null),
      [firestore, messageId]
  );
  
  const { data: message, isLoading, error } = useDoc<Message>(messageRef);
  
  const fanId = message?.fanId;
  const fanRef = useMemoFirebase(() => (fanId && firestore ? doc(firestore, 'fans', fanId) : null), [fanId, firestore]);
  const { data: fanData } = useDoc<Fan>(fanRef);

  const getFanStatus = () => {
    if (!fanData?.lastActive) return { isOnline: false, lastSeen: 'never' };
    
    const lastActiveDate = new Date(fanData.lastActive.seconds * 1000);
    const fiveMinutesAgo = subMinutes(new Date(), 5);
    
    const isOnline = isAfter(lastActiveDate, fiveMinutesAgo);
    
    return { 
      isOnline, 
      lastSeen: isOnline ? 'Online' : `Last seen ${formatDistanceToNow(lastActiveDate, { addSuffix: true })}`
    };
  };

  const fanStatus = getFanStatus();


  const handleDeleteThread = () => {
    if (!messageRef) return;
    deleteDocumentNonBlocking(messageRef);
    toast({
      variant: 'destructive',
      title: 'Message Deleted',
      description: 'The message has been permanently removed.',
    });
    router.push('/admin/messages');
  };

  const handleDeleteReply = (replyToDelete: Reply) => {
    if (!messageRef) return;
    updateDocumentNonBlocking(messageRef, {
      replies: arrayRemove(replyToDelete)
    });
    toast({
      variant: 'destructive',
      title: 'Reply Deleted',
      description: 'The selected reply has been removed from the conversation.',
    });
  }

  const handleDeleteOriginalMessage = () => {
     if (!messageRef) return;
      updateDocumentNonBlocking(messageRef, {
      message: '[This message has been deleted]'
    });
     toast({
      variant: 'destructive',
      title: 'Message Deleted',
      description: 'The original message has been deleted.',
    });
  }

  const handleLike = () => {
    if (!messageRef || !user || !message) return;
    const currentLikes = message.likes || [];
    const userHasLiked = currentLikes.includes(user.uid);
    const newLikes = userHasLiked 
      ? currentLikes.filter(uid => uid !== user.uid)
      : [...currentLikes, user.uid];
    
    updateDocumentNonBlocking(messageRef, { likes: newLikes });

    if (!userHasLiked && message.fanId) {
      const messageSnippet = message.message.substring(0, 30);
      createNotification(firestore, message.fanId, `An admin liked your message: "${messageSnippet}..."`, `/messages/${message.id}`);
    }
  };

  const handleEmojiReact = (emoji: string) => {
    if (!messageRef || !user || !message) return;
    const currentReactions = message.reactions || {};
    
    const newReactions = JSON.parse(JSON.stringify(currentReactions));

    if (!newReactions[emoji]) newReactions[emoji] = [];

    const userList = newReactions[emoji] as string[];
    const userHasReacted = userList.includes(user.uid);

    if (userHasReacted) {
        newReactions[emoji] = userList.filter(uid => uid !== user.uid);
        if (newReactions[emoji].length === 0) delete newReactions[emoji];
    } else {
        newReactions[emoji].push(user.uid);
        if (message.fanId) {
            const messageSnippet = message.message.substring(0, 30);
            createNotification(firestore, message.fanId, `An admin reacted with ${emoji} to your message: "${messageSnippet}..."`, `/messages/${message.id}`);
        }
    }
    
    updateDocumentNonBlocking(messageRef, { reactions: newReactions });
  };
  
  const handleReplySubmit = () => {
    if (!messageRef || !user || !replyText.trim() || !message) return;
    
    const newReply: Omit<Reply, 'timestamp'> & { timestamp: Date } = {
        senderId: user.uid,
        senderName: user.displayName || 'Admin',
        senderPhotoUrl: user.photoURL || '',
        text: replyText.trim(),
        timestamp: new Date(),
        senderType: 'admin',
    };

    updateDocumentNonBlocking(messageRef, {
        replies: arrayUnion(newReply),
        lastRepliedAt: serverTimestamp() 
    });

    if (message.fanId) {
        const messageSnippet = message.message.substring(0, 30);
        createNotification(firestore, message.fanId, `An admin replied to your message: "${messageSnippet}..."`, `/messages/${message.id}`);
    }

    setReplyText('');
  };

  if (isLoading) {
    return <div className="p-6 h-full flex items-center justify-center">Loading conversation...</div>;
  }

  if (error || !message) {
    return (
        <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center text-muted-foreground">
                <Mail className="mx-auto h-12 w-12" />
                <p className="mt-2">Select a message to view the conversation.</p>
                {error && <p className="text-destructive text-sm mt-2">{error.message}</p>}
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/admin/messages" className="md:hidden">
              <Button variant="ghost" size="icon">
                <ArrowLeft />
              </Button>
            </Link>
            <Avatar>
                <AvatarFallback>{message.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                <h2 className="font-bold text-lg">{message.name}</h2>
                <div className="flex items-center gap-1.5">
                    {fanStatus.isOnline && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                    <p className="text-xs text-muted-foreground">{fanStatus.lastSeen}</p>
                </div>
            </div>
          </div>
          <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                      <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this entire message thread.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteThread} className="bg-destructive hover:bg-destructive/90">
                          Delete Thread
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
         </AlertDialog>
      </header>

      <ScrollArea className="flex-grow p-4 space-y-4 bg-muted/30">
        {/* Original Message */}
        <div className="group flex justify-start">
            <div className="relative p-3 rounded-lg bg-background max-w-lg shadow-sm">
                <p className="text-sm font-semibold">{message.name}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.message}</p>
                <p className="text-xs text-muted-foreground mt-2 text-right">
                    {message.submittedAt ? format(new Date(message.submittedAt.seconds * 1000), "PPP p") : 'N/A'}
                </p>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Original Message?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will replace the original message content with '[This message has been deleted]'. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteOriginalMessage} className="bg-destructive hover:bg-destructive/90">Delete Message</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>

        {/* Replies */}
        {message.replies && message.replies.map((reply, index) => (
          <div key={index} className={cn("group flex items-end gap-2 my-2 relative", reply.senderType === 'admin' ? 'justify-end' : 'justify-start')}>
              {reply.senderType !== 'admin' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{reply.senderName ? reply.senderName.charAt(0) : 'F'}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn("p-3 rounded-lg max-w-lg shadow-sm", reply.senderType === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-background')}>
                  <p className="font-semibold text-sm">{reply.senderName || (reply.senderType === 'admin' ? 'Admin' : 'Fan')}</p>
                  <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                   {reply.timestamp && (
                      <p className="text-xs opacity-70 mt-1 text-right">
                          {format(
                              reply.timestamp.seconds 
                                  ? new Date(reply.timestamp.seconds * 1000) 
                                  : new Date(reply.timestamp), 
                              "p"
                          )}
                      </p>
                  )}
              </div>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Reply?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to permanently delete this reply? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteReply(reply)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              {reply.senderType === 'admin' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{reply.senderName ? reply.senderName.charAt(0) : 'A'}</AvatarFallback>
                </Avatar>
              )}
          </div>
        ))}
      </ScrollArea>
      
      <footer className="p-4 border-t bg-background">
          <div className="relative">
              <Textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="pr-24"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
              />
              <Button onClick={handleReplySubmit} disabled={!replyText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2" size="sm">
                <Send className="mr-2 h-4 w-4" /> Send
              </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="ghost" size="sm" className="flex items-center gap-1.5" onClick={handleLike}>
              <Heart className={cn("h-5 w-5", message.likes?.includes(user?.uid || '') ? 'text-red-500 fill-red-500' : 'text-muted-foreground')} />
              <span className="text-sm font-medium">{message.likes?.length || 0}</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5">
                      <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0">
                  <EmojiPicker onEmojiClick={(emojiData) => handleEmojiReact(emojiData.emoji)} emojiStyle={EmojiStyle.NATIVE} />
              </PopoverContent>
            </Popover>
          </div>
          {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(message.reactions).map(([emoji, uids]) => (
                      uids.length > 0 && (
                          <TooltipProvider key={emoji}>
                              <Tooltip>
                                  <TooltipTrigger asChild>
                                      <Badge 
                                          variant={uids.includes(user?.uid || '') ? 'default' : 'secondary'}
                                          className="cursor-pointer text-lg"
                                          onClick={() => handleEmojiReact(emoji)}
                                      >
                                          {emoji} <span className="text-xs ml-1.5">{uids.length}</span>
                                      </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                      <p>{uids.length} reaction{uids.length > 1 ? 's' : ''}</p>
                                  </TooltipContent>
                              </Tooltip>
                          </TooltipProvider>
                      )
                  ))}
              </div>
          )}
      </footer>
    </div>
  );
}
