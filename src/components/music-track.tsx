'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  serverTimestamp,
  doc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { MessageCircle, Send, Trash2, Smile, Heart, Reply } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { LikeButton } from './LikeButton';
import { ShareMenu } from './ShareMenu';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
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
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Separator } from './ui/separator';


interface Music {
  id: string;
  title: string;
  youtubeUrl: string;
}

export interface CommentReply {
    id: string;
    senderId: string;
    senderName: string;
    senderPhotoUrl?: string;
    text: string;
    timestamp: { seconds: number; nanoseconds: number; } | any;
}

export interface Comment {
  id: string;
  fanId: string;
  username: string;
  photoURL?: string;
  content: string;
  musicId: string;
  commentDate: {
    seconds: number;
    nanoseconds: number;
  } | null;
  likes?: string[];
  reactions?: Record<string, string[]>;
  replies?: CommentReply[];
}

const getYouTubeVideoId = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    const videoId =
      urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
    if (videoId) return videoId;
  } catch (e) {
    console.error('Invalid YouTube URL:', e);
    return null;
  }
  return null;
};

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

const CommentForm = ({ musicId, onCommentAdded }: { musicId: string, onCommentAdded: (comment: Comment) => void }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [comment, setComment] = React.useState('');
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !comment.trim()) return;

    const commentsCol = collection(firestore, 'music', musicId, 'comments');
    const newCommentData = {
      fanId: user.uid,
      username: user.displayName || user.email || 'Anonymous',
      photoURL: user.photoURL || '',
      content: comment.trim(),
      commentDate: serverTimestamp(),
      musicId: musicId,
      likes: [],
      reactions: {},
      replies: [],
    };
    
    // Optimistically create the comment for the UI
    const optimisticComment: Comment = {
      ...newCommentData,
      id: 'T' + new Date().toISOString(), // Temporary ID
      commentDate: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
    };

    onCommentAdded(optimisticComment);
    
    addDocumentNonBlocking(commentsCol, newCommentData);
    setComment('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    const cursor = textareaRef.current?.selectionStart ?? comment.length;
    const newText =
      comment.slice(0, cursor) + emojiObject.emoji + comment.slice(cursor);
    setComment(newText);
  };

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        You must be signed in to comment.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start mt-4">
      <Avatar className="h-9 w-9">
        <AvatarImage src={user.photoURL ?? undefined} />
        <AvatarFallback>
          {user.displayName?.charAt(0) ?? user.email?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-grow">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full pr-10"
            rows={1}
          />
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 border-0 w-auto">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                emojiStyle={EmojiStyle.NATIVE}
                height={350}
                width={300}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          type="submit"
          size="sm"
          className="mt-2"
          disabled={!comment.trim()}
        >
          <Send className="mr-2 h-4 w-4" />
          Post Comment
        </Button>
      </div>
    </form>
  );
};

export const CommentItem = ({ comment, musicId, onCommentDeleted, onCommentUpdated, isAdminContext = false }: { comment: Comment, musicId: string, onCommentDeleted: (commentId: string) => void, onCommentUpdated?: (updatedComment: Comment) => void, isAdminContext?: boolean }) => {
    const { user, isAdmin } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');

    const isOptimistic = comment.id.startsWith('T');
    const commentRef = useMemoFirebase(() => (firestore && musicId && comment.id && !isOptimistic) ? doc(firestore, 'music', musicId, 'comments', comment.id) : null, [firestore, musicId, comment.id, isOptimistic]);

    const handleDeleteComment = () => {
        if (!isOptimistic && commentRef) {
            deleteDocumentNonBlocking(commentRef);
        }
        onCommentDeleted(comment.id);
        toast({
        variant: 'destructive',
        title: 'Comment Deleted',
        description: 'The comment has been removed.',
        });
    };

    const handleLike = () => {
        if (!user) return;
        const hasLiked = comment.likes?.includes(user.uid);
        const newLikes = hasLiked
            ? (comment.likes || []).filter(uid => uid !== user.uid)
            : [...(comment.likes || []), user.uid];

        if (onCommentUpdated) {
            onCommentUpdated({ ...comment, likes: newLikes });
        }
        
        if (commentRef) {
            updateDocumentNonBlocking(commentRef, { likes: newLikes });
            if (!hasLiked && user.uid !== comment.fanId) {
                createNotification(firestore, comment.fanId, `Someone liked your comment on the track "${musicId}".`, `/music#${musicId}`);
            }
        }
    };

    const handleEmojiReact = (emoji: string) => {
        if (!user) return;
        const currentReactions = { ...(comment.reactions || {}) };
        
        if (!currentReactions[emoji]) currentReactions[emoji] = [];
        const userList = currentReactions[emoji] as string[];
        const userHasReacted = userList.includes(user.uid);

        if (userHasReacted) {
            currentReactions[emoji] = userList.filter(uid => uid !== user.uid);
            if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
        } else {
            currentReactions[emoji].push(user.uid);
        }
        
        if (onCommentUpdated) {
            onCommentUpdated({ ...comment, reactions: currentReactions });
        }

        if (commentRef) {
            updateDocumentNonBlocking(commentRef, { reactions: currentReactions });
            if (!userHasReacted && user.uid !== comment.fanId) {
                createNotification(firestore, comment.fanId, `Someone reacted with ${emoji} to your comment on "${musicId}".`, `/music#${musicId}`);
            }
        }
    };

    const handleReplySubmit = () => {
        if (!user || !replyText.trim() || !firestore) return;

        const newReply: CommentReply = {
            id: doc(collection(firestore, '_')).id,
            senderId: user.uid,
            senderName: user.displayName || 'Fan',
            senderPhotoUrl: user.photoURL || '',
            text: replyText.trim(),
            timestamp: new Date(),
        };

        const newReplies = [...(comment.replies || []), newReply];

        if(onCommentUpdated) {
            onCommentUpdated({ ...comment, replies: newReplies });
        }
        
        if (commentRef) {
            updateDocumentNonBlocking(commentRef, { replies: arrayUnion(newReply) });
            if (user.uid !== comment.fanId) {
                createNotification(firestore, comment.fanId, `Someone replied to your comment on "${musicId}".`, `/music#${musicId}`);
            }
        }
        
        setReplyText('');
        setIsReplying(false);
    }

    const canDelete = useMemo(() => {
        if (!user) return false;
        return user.uid === comment.fanId || isAdmin;
    }, [user, isAdmin, comment.fanId]);


    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3 group">
                <Avatar className="h-8 w-8">
                <AvatarImage
                    src={
                    comment.photoURL ||
                    `https://api.dicebear.com/8.x/initials/svg?seed=${comment.username}`
                    }
                    alt={comment.username}
                />
                <AvatarFallback>
                    {comment.username.charAt(0).toUpperCase()}
                </AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <p className="font-semibold text-sm">{comment.username}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {comment.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                         <Button variant="ghost" size="sm" className="h-auto p-1 flex items-center gap-1 text-muted-foreground" onClick={handleLike} disabled={isOptimistic && !isAdminContext}>
                            <Heart className={cn("h-4 w-4", comment.likes?.includes(user?.uid || '') ? 'text-red-500 fill-red-500' : '')} />
                            <span className="text-xs">{comment.likes?.length || 0}</span>
                        </Button>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-1 text-muted-foreground" disabled={isOptimistic && !isAdminContext}><Smile className="h-4 w-4" /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-0">
                                <EmojiPicker onEmojiClick={(emojiData) => handleEmojiReact(emojiData.emoji)} emojiStyle={EmojiStyle.NATIVE} />
                            </PopoverContent>
                        </Popover>
                         <Button variant="ghost" size="sm" className="h-auto p-1 flex items-center gap-1 text-muted-foreground" onClick={() => setIsReplying(!isReplying)} disabled={isOptimistic && !isAdminContext}>
                            <Reply className="h-4 w-4" />
                            <span className="text-xs">Reply</span>
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            {comment.commentDate ? formatDistanceToNow(new Date(comment.commentDate.seconds * 1000), { addSuffix: true }) : ''}
                        </p>
                    </div>
                     {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                            {Object.entries(comment.reactions).map(([emoji, uids]) => (
                                uids.length > 0 && (
                                    <TooltipProvider key={emoji}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge 
                                                    variant={uids.includes(user?.uid || '') ? 'default' : 'secondary'}
                                                    className="cursor-pointer"
                                                    onClick={() => handleEmojiReact(emoji)}
                                                >
                                                    {emoji} <span className="text-xs ml-1">{uids.length}</span>
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
                </div>
                {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the comment. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="pl-11 space-y-3">
                    {comment.replies.map(reply => (
                         <div key={reply.id} className="flex items-start gap-3 group">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={reply.senderPhotoUrl} alt={reply.senderName} />
                                <AvatarFallback>{reply.senderName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                             <div className="flex-grow">
                                <p className="font-semibold text-sm">{reply.senderName}</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{reply.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(reply.timestamp.seconds ? new Date(reply.timestamp.seconds * 1000) : new Date(reply.timestamp), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isReplying && (
                <div className="pl-11 flex gap-2 items-start mt-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL ?? undefined} />
                        <AvatarFallback>{user?.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <Textarea 
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={`Replying to ${comment.username}...`}
                            rows={1}
                            className="w-full"
                        />
                        <div className="flex gap-2 mt-2">
                             <Button size="sm" onClick={handleReplySubmit} disabled={!replyText.trim()}>Post Reply</Button>
                             <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}


const CommentsList = ({ comments, musicId, isLoading, onCommentDeleted, onCommentUpdated }: { comments: Comment[], musicId: string, isLoading: boolean, onCommentDeleted: (commentId: string) => void, onCommentUpdated: (updatedComment: Comment) => void }) => {
  if (isLoading && comments.length === 0) return <p>Loading comments...</p>;

  return (
    <div className="space-y-4">
      {comments && comments.length > 0 ? (
        comments.map((comment) => (
          <React.Fragment key={comment.id}>
            <Separator />
            <CommentItem comment={comment} musicId={musicId} onCommentDeleted={onCommentDeleted} onCommentUpdated={onCommentUpdated}/>
          </React.Fragment>
        ))
      ) : (
        <p className="text-sm text-center text-muted-foreground py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
};

export const MusicTrack = ({ track }: { track: Music }) => {
  const videoId = getYouTubeVideoId(track.youtubeUrl);
  const firestore = useFirestore();

  const commentsQuery = useMemoFirebase(
    () => (firestore && track?.id ? query(collection(firestore, 'music', track.id, 'comments'), orderBy('commentDate', 'desc')) : null),
    [firestore, track.id]
  );
  const { data: fetchedComments, isLoading: commentsLoading } = useCollection<Comment>(commentsQuery);
  
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (fetchedComments) {
        const commentMap = new Map<string, Comment>();
        
        // Add existing local comments that might still be optimistic
        localComments.forEach(c => {
            if (c.id.startsWith('T')) {
                commentMap.set(c.id, c);
            }
        });
        
        // Overwrite with fetched comments
        fetchedComments.forEach(c => {
            commentMap.set(c.id, c);
        });
        
        const sorted = Array.from(commentMap.values()).sort((a, b) => {
            const timeA = a.commentDate?.seconds ?? 0;
            const timeB = b.commentDate?.seconds ?? 0;
            return timeB - timeA;
        });
        setLocalComments(sorted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedComments]);

  const handleCommentAdded = (newComment: Comment) => {
    setLocalComments(prevComments => [newComment, ...prevComments]);
  };
  
  const handleCommentDeleted = (commentId: string) => {
    setLocalComments(prevComments => prevComments.filter(c => c.id !== commentId));
  };
  
  const handleCommentUpdated = (updatedComment: Comment) => {
    setLocalComments(prevComments => 
        prevComments.map(c => c.id === updatedComment.id ? updatedComment : c)
    );
  };

  return (
    <Card id={track.id} key={track.id} className="shadow-lg scroll-mt-20">
      <CardHeader>
        <CardTitle>{track.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {videoId ? (
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={track.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full rounded-md"
            ></iframe>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Could not load video for this track.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <div className="flex items-center gap-2 text-muted-foreground w-full">
          <LikeButton musicId={track.id} />
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{localComments?.length ?? 0}</span>
          </div>
          <div className="ml-auto">
            <ShareMenu
              url={`https://www.youtube.com/watch?v=${videoId}`}
              text={`Check out "${track.title}" by Yung Chaf!`}
            />
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <span className="text-sm">
                View Comments ({localComments?.length ?? 0})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <CommentForm musicId={track.id} onCommentAdded={handleCommentAdded} />
                <CommentsList 
                    musicId={track.id} 
                    comments={localComments} 
                    isLoading={commentsLoading} 
                    onCommentDeleted={handleCommentDeleted}
                    onCommentUpdated={handleCommentUpdated}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardFooter>
    </Card>
  );
};
