'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare } from 'lucide-react';

interface Fan {
  id: string;
  username?: string;
  photoURL?: string;
}

interface Like {
  fanId: string;
}

interface Comment {
  fanId: string;
}

interface TopFansListProps {
  fans: Fan[] | null;
  likes: Like[] | null;
  comments: Comment[] | null;
}

export function TopFansList({ fans, likes, comments }: TopFansListProps) {
  const topFans = useMemo(() => {
    if (!fans || (!likes && !comments)) return [];
    
    const fanStats = new Map<string, { likes: number, comments: number, total: number }>();

    likes?.forEach(like => {
      const stats = fanStats.get(like.fanId) || { likes: 0, comments: 0, total: 0 };
      stats.likes++;
      stats.total++;
      fanStats.set(like.fanId, stats);
    });
    
    comments?.forEach(comment => {
      const stats = fanStats.get(comment.fanId) || { likes: 0, comments: 0, total: 0 };
      stats.comments++;
      stats.total++;
      fanStats.set(comment.fanId, stats);
    });

    const fansMap = new Map(fans.map(f => [f.id, f]));

    return Array.from(fanStats.entries())
      .map(([fanId, stats]) => ({
        fanId,
        fan: fansMap.get(fanId),
        ...stats
      }))
      .filter(item => !!item.fan) // Ensure the fan exists
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Get top 10

  }, [fans, likes, comments]);

  if (topFans.length === 0) {
    return <div className="text-center text-sm text-muted-foreground py-10">No fan activity yet.</div>;
  }

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-4">
        {topFans.map((item, index) => (
          <div key={item.fanId} className="flex items-center gap-4">
             <div className="font-bold text-lg w-6 text-center">{index + 1}</div>
            <Avatar>
              <AvatarImage src={item.fan?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${item.fan?.username || item.fanId}`} />
              <AvatarFallback>{item.fan?.username?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold truncate">{item.fan?.username || 'Unknown Fan'}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Heart className="h-4 w-4" /> {item.likes}</div>
                <div className="flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {item.comments}</div>
              </div>
            </div>
            <div className="text-right">
                <div className="font-bold text-primary">{item.total}</div>
                <div className="text-xs text-muted-foreground">Activities</div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
