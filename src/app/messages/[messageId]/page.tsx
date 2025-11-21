
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Smile, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Reply {
    senderId: string;
    senderName: string;
    senderPhotoUrl?: string;
    text: string;
    timestamp: any;
    senderType: 'admin' | 'fan';
}

interface Message {
  id: string;
  fanId?: string;
  name: string;
  email: string;
  message: string;
  submittedAt: { seconds: number };
  likes?: string[];
  reactions?: Record<string, string[]>;
  replies?: Reply[];
}

export default function MessageThreadPage() {
  const { messageId } = useParams();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const messageRef = useMemoFirebase(
    () => (firestore && typeof messageId === 'string' ? doc(firestore, 'messages', messageId) : null),
    [firestore, messageId]
  );

  const { data: message, isLoading, error } = useDoc<Message>(messageRef);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    // This effect handles authorization.
    // It waits until both user and message data are loaded.
    if (!isLoading && !isUserLoading) {
      if (!user) {
        // If the user isn't logged in at all, send them to the sign-in page.
        router.push('/sign-in');
        return;
      }
      if (message && message.fanId !== user.uid) {
        // If the message exists but doesn't belong to the current user, redirect them.
        // This is the key security check on the client-side.
        router.push('/');
      }
    }
  }, [isLoading, isUserLoading, message, user, router]);


  const handleLike = () => {
    if (!messageRef || !user) return;
    const currentLikes = message?.likes || [];
    const userHasLiked = currentLikes.includes(user.uid);
    const newLikes = userHasLiked 
      ? currentLikes.filter(uid => uid !== user.uid)
      : [...currentLikes, user.uid];
    
    updateDocumentNonBlocking(messageRef, { likes: newLikes });
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
    }
    
    updateDocumentNonBlocking(messageRef, { reactions: newReactions });
  };

  const handleReplySubmit = () => {
    if (!messageRef || !user || !replyText.trim()) return;

    const newReply: Omit<Reply, 'timestamp'> & { timestamp: Date } = {
        senderId: user.uid,
        senderName: user.displayName || 'Fan',
        senderPhotoUrl: user.photoURL || '',
        text: replyText.trim(),
        timestamp: new Date(),
        senderType: 'fan',
    };

    updateDocumentNonBlocking(messageRef, {
        replies: arrayUnion(newReply),
        lastRepliedAt: serverTimestamp()
    });

    setReplyText('');
  };

  // While waiting for auth and data, show a loading state.
  if (isLoading || isUserLoading || (message && user && message.fanId !== user.uid)) {
    return <div className="flex h-screen items-center justify-center">Loading conversation...</div>;
  }
  
  // If there's an error or the message doesn't exist after loading.
  if (error || !message) {
    return <div className="flex h-screen items-center justify-center">Could not load message. It may have been deleted or you may not have permission to view it.</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="shadow-2xl">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            Your message thread with the admin team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[50vh] space-y-6 pr-4">
            {/* Original Message */}
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={user.photoURL ?? undefined} />
                <AvatarFallback>{message.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{message.name} (You)</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.submittedAt.seconds * 1000), "PPP p")}
                </p>
              </div>
            </div>

            {/* Replies */}
            {message.replies && message.replies.length > 0 && (
              <div className="space-y-4 pt-4">
                {message.replies.map((reply, index) => (
                  <div key={index} className={cn("flex items-start gap-4", reply.senderType === 'fan' && 'justify-end')}>
                    {reply.senderType === 'admin' && (
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{reply.senderName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                     <div className={cn("p-3 rounded-lg max-w-[80%]", reply.senderType === 'admin' ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
                        <p className="font-semibold text-sm">{reply.senderName}</p>
                        <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                         <p className="text-xs mt-1 opacity-70 text-right">
                            {format(reply.timestamp.seconds ? new Date(reply.timestamp.seconds * 1000) : new Date(reply.timestamp), "p")}
                        </p>
                    </div>
                     {reply.senderType === 'fan' && (
                      <Avatar className="h-9 w-9">
                         <AvatarImage src={reply.senderPhotoUrl} />
                        <AvatarFallback>{reply.senderName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
            {/* Fan Reply Input */}
            <div className="space-y-2 w-full">
                <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReplySubmit();
                  }
                }}
                />
                <Button onClick={handleReplySubmit} disabled={!replyText.trim()}>
                <Send className="mr-2 h-4 w-4" /> Reply
                </Button>
            </div>

            <Separator className="my-2"/>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleLike}>
                    <Heart className={cn("h-5 w-5", message.likes?.includes(user?.uid || '') ? 'text-red-500 fill-red-500' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">{message.likes?.length || 0}</span>
                </Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
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
        </CardFooter>
      </Card>
    </div>
  );
}
