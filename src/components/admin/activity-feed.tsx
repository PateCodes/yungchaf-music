'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentItem } from '@/components/music-track';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useMemo, useState, useEffect } from 'react';

interface CommentReply {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: any;
}

interface Comment {
  id: string;
  fanId: string;
  musicId: string;
  content: string;
  username: string;
  photoURL?: string;
  commentDate: {
    seconds: number;
    nanoseconds: number;
  } | null;
  likes?: string[];
  reactions?: Record<string, string[]>;
  replies?: CommentReply[];
}

interface Message {
  id: string;
  name: string;
  message: string;
  submittedAt: { seconds: number };
  lastRepliedAt?: { seconds: number };
}

interface Fan {
    id: string;
    username?: string;
    email?: string;
}

interface ActivityFeedProps {
  comments: Comment[] | null;
  messages: Message[] | null;
  fans: Fan[] | null;
  isLoading: boolean;
}

export function ActivityFeed({ comments, messages, fans, isLoading }: ActivityFeedProps) {
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (comments) {
      setLocalComments(comments);
    }
  }, [comments]);

  const fansMap = useMemo(() => {
    if (!fans) return new Map<string, string>();
    return new Map(fans.map(fan => [fan.id, fan.username || 'Unnamed Fan']));
  }, [fans]);

  const sortedComments = useMemo(() => {
    if (!localComments) return [];
    return [...localComments].sort((a, b) => {
        const timeA = a.commentDate?.seconds || 0;
        const timeB = b.commentDate?.seconds || 0;
        return timeB - timeA;
    });
  }, [localComments]);
  
  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
        const timeA = a.lastRepliedAt?.seconds || a.submittedAt.seconds;
        const timeB = b.lastRepliedAt?.seconds || b.submittedAt.seconds;
        return timeB - timeA;
    });
  }, [messages]);

  const handleCommentUpdate = (updatedComment: Comment) => {
    setLocalComments(prevComments => 
        prevComments.map(c => c.id === updatedComment.id ? updatedComment : c)
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setLocalComments(prevComments => prevComments.filter(c => c.id !== commentId));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Feed</CardTitle>
        <CardDescription>A live feed of the latest fan interactions. Respond directly from here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comments">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="comments" className="m-0 space-y-4">
                {isLoading ? (
                    <div className="space-y-4 p-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
                ) : sortedComments && sortedComments.length > 0 ? (
                    sortedComments.map(comment => (
                        <div key={comment.id} className="p-4 border rounded-md">
                           <p className='text-xs text-muted-foreground mb-2'>
                                Fan <span className='font-bold text-primary'>{comment.username}</span> commented on track <span className='font-mono'>{comment.musicId}</span>
                           </p>
                           <CommentItem 
                             comment={comment} 
                             musicId={comment.musicId} 
                             onCommentDeleted={handleCommentDeleted}
                             onCommentUpdated={handleCommentUpdate}
                             isAdminContext={true}
                           />
                        </div>
                    ))
                ) : (
                    <p className='text-sm text-center text-muted-foreground py-10'>No comments yet.</p>
                )}
            </TabsContent>
            <TabsContent value="messages" className="m-0 space-y-2">
                {isLoading ? (
                     <div className="space-y-2 p-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                ) : sortedMessages && sortedMessages.length > 0 ? (
                    sortedMessages.map(msg => (
                         <Link href={`/admin/messages/${msg.id}`} key={msg.id} className="block">
                            <div className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors">
                            <Avatar>
                                <AvatarFallback>{msg.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-semibold">{msg.name}</p>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date((msg.lastRepliedAt || msg.submittedAt).seconds * 1000), { addSuffix: true })}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                            </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <p className='text-sm text-center text-muted-foreground py-10'>No messages yet.</p>
                )}
            </TabsContent>
           </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
