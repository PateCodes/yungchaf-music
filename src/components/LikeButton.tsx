
'use client';

import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  where,
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

interface LikeButtonProps {
  musicId: string;
}

export const LikeButton = ({ musicId }: LikeButtonProps) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const likesCollectionRef = useMemoFirebase(
    () => (firestore && musicId ? collection(firestore, 'music', musicId, 'likes') : null),
    [firestore, musicId]
  );
  const { data: likes, isLoading: likesLoading } =
    useCollection(likesCollectionRef);

  const userLikeQuery = useMemoFirebase(
    () =>
      firestore &&
      user &&
      musicId ?
      query(
        collection(firestore, 'music', musicId, 'likes'),
        where('fanId', '==', user.uid)
      ) : null,
    [firestore, user, musicId]
  );

  const { data: userLikes, isLoading: userLikesLoading } =
    useCollection(userLikeQuery);
    
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState<number>(0);

  const hasLiked = userLikes ? userLikes.length > 0 : false;
  const likeId = hasLiked && userLikes ? userLikes[0].id : null;
  
  useEffect(() => {
    if (!likesLoading) {
      setOptimisticLikeCount(likes?.length ?? 0);
      if(!userLikesLoading) {
        setOptimisticLiked(hasLiked);
      }
    }
  }, [likes, hasLiked, likesLoading, userLikesLoading]);

  const handleLike = () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Not signed in',
        description: 'You must be signed in to like a track.',
      });
      return;
    }

    if (!likesCollectionRef) return;

    if (optimisticLiked) {
      // Unlike
      setOptimisticLiked(false);
      setOptimisticLikeCount(prev => prev - 1);
      if(likeId) {
        const likeDocRef = doc(firestore, 'music', musicId, 'likes', likeId);
        deleteDocumentNonBlocking(likeDocRef);
      }
    } else {
      // Like
      setOptimisticLiked(true);
      setOptimisticLikeCount(prev => prev + 1);
      const newLike = {
        fanId: user.uid,
        likeDate: serverTimestamp(),
        musicId: musicId,
      };
      addDocumentNonBlocking(likesCollectionRef, newLike);
    }
  };

  const isLoading = likesLoading || userLikesLoading;
  const displayLiked = optimisticLiked;


  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-2"
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all duration-200',
          displayLiked ? 'text-red-500 fill-red-500 scale-110' : 'text-muted-foreground'
        )}
      />
      <span className="text-sm font-medium tabular-nums">
        {optimisticLikeCount}
      </span>
    </Button>
  );
};
