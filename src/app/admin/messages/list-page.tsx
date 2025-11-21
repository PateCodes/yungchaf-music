
'use client';

import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { formatDistanceToNow, isAfter, subMinutes } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAdminData } from '@/context/AdminDataContext';

interface Reply {
  text: string;
  timestamp: any;
}

interface Message {
  id: string;
  name: string;
  message: string;
  submittedAt: { seconds: number };
  lastRepliedAt?: { seconds: number };
  replies?: Reply[];
  read: boolean;
  fanId?: string;
}

interface Fan {
  id: string;
  lastActive?: { seconds: number };
}

export default function MessagesListPage() {
  const pathname = usePathname();
  const { messages, fans } = useAdminData();
  
  const fansById = useMemo(() => {
    if (!fans) return new Map<string, Fan>();
    return new Map(fans.map(fan => [fan.id, fan as Fan]));
  }, [fans]);

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
      const timeA = a.lastRepliedAt?.seconds || a.submittedAt.seconds;
      const timeB = b.lastRepliedAt?.seconds || b.submittedAt.seconds;
      return timeB - timeA;
    });
  }, [messages]);
  
  const getLastMessage = (msg: Message) => {
    if (msg.replies && msg.replies.length > 0) {
      const lastReply = msg.replies[msg.replies.length - 1];
      const timestamp = lastReply.timestamp.seconds
        ? new Date(lastReply.timestamp.seconds * 1000)
        : new Date(lastReply.timestamp);
      return { text: lastReply.text, time: timestamp };
    }
    return { text: msg.message, time: new Date(msg.submittedAt.seconds * 1000) };
  };

  const getFanStatus = (fanId?: string) => {
    if (!fanId) return { isOnline: false, lastSeen: null };
    const fan = fansById.get(fanId);
    if (!fan?.lastActive) return { isOnline: false, lastSeen: null };
    
    const lastActiveDate = new Date(fan.lastActive.seconds * 1000);
    const fiveMinutesAgo = subMinutes(new Date(), 5);
    
    const isOnline = isAfter(lastActiveDate, fiveMinutesAgo);
    
    return { 
      isOnline, 
      lastSeen: isOnline ? 'online' : formatDistanceToNow(lastActiveDate, { addSuffix: true })
    };
  };
  
  if (!messages || !fans) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b"><h1 className="text-xl font-bold">Inbox</h1></div>
        <div className="flex-grow p-2 space-y-2">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-md">
                    <Avatar><AvatarFallback className="animate-pulse bg-muted"></AvatarFallback></Avatar>
                    <div className="flex-grow space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                        <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-none border-0 flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Inbox</h1>
      </div>
      <ScrollArea className="flex-grow">
        {sortedMessages && sortedMessages.length > 0 ? (
          sortedMessages.map(msg => {
            const lastMessage = getLastMessage(msg);
            const { isOnline, lastSeen } = getFanStatus(msg.fanId);
            const isActive = pathname === `/admin/messages/${msg.id}` || pathname === `/admin/messages/@conversation/${msg.id}`;
            return (
              <Link href={`/admin/messages/${msg.id}`} key={msg.id} className="block">
                <div className={cn(
                  "flex items-start gap-3 p-3 border-b hover:bg-muted/50 transition-colors",
                  isActive && "bg-muted"
                )}>
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{msg.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-baseline">
                        <p className="font-semibold">{msg.name}</p>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(lastMessage.time, { addSuffix: true })}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{lastMessage.text}</p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="p-4 text-center text-muted-foreground">No messages, not yet.</p>
        )}
      </ScrollArea>
    </Card>
  );
}
